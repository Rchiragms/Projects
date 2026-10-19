"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import voiceLines from "@/lib/voice/lines.json";
import ultronLines from "@/lib/voice/ultron-lines.json";

/**
 * Northern English Male Piper voice.
 * - Button/section announcements retain the 1-second anti-spam delay.
 * - Chat answers start generating speech immediately (no extra delay).
 * - Chat text is revealed when audio actually begins playing.
 * - If audio is muted or fails, the text is shown without hanging.
 * - Live voice is warmed in the background once the AI is ready.
 */
const MUTE_KEY = "jarvis-muted";
const CUES: Record<string, string> = voiceLines.cues;
const PHRASES: Record<string, string> = voiceLines.phrases;
const ULTRON_CUES: Record<string, string> = ultronLines;
type Speaker = "jarvis" | "ultron";
const BUTTON_DELAY_MS = 1000;
const WARM_REQUEST_ID = -1;

type VoiceState = "idle" | "preparing" | "speaking";
type VoiceWorkerResult = {
  id: number;
  buffer?: ArrayBuffer;
  warm?: boolean;
  error?: string;
};

type PendingReply = { id: string; token: number };

function broadcast(state: VoiceState) {
  window.dispatchEvent(
    new CustomEvent("jarvis:voice-state", {
      detail: { state, speaking: state === "speaking" },
    })
  );
}

function revealReply(replyId: string) {
  window.dispatchEvent(
    new CustomEvent("jarvis:reply-start", { detail: { id: replyId } })
  );
}

function cleanText(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[\r\n]+/g, ". ")
    .replace(/[\*#`_]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

export default function JarvisVoiceDock() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [warming, setWarming] = useState(false);
  const [error, setError] = useState("");

  const enabledRef = useRef(true);
  const aliveRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduledKindRef = useRef<"file" | "dynamic" | "ultron" | null>(null);
  const currentSpeakerRef = useRef<Speaker | null>(null);
  const generationRef = useRef(0);
  const lastCueRef = useRef({ name: "", time: 0 });
  const voiceWorkerRef = useRef<Worker | null>(null);
  const warmedRef = useRef(false);
  const warmingRef = useRef(false);
  const pendingReplyRef = useRef<PendingReply | null>(null);
  const ultronWaitTimerRef = useRef<number | null>(null);
  const ultronSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // One lightweight Web Audio analyser for the ACTUAL voice output.
  // It is optional: speech continues normally if AudioContext is blocked.
  const meterContextRef = useRef<AudioContext | null>(null);
  const meterSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const meterAnalyserRef = useRef<AnalyserNode | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const meterToneNodesRef = useRef<AudioNode[]>([]);

  const resetVoiceMeter = useCallback(() => {
    if (meterFrameRef.current !== null) {
      window.cancelAnimationFrame(meterFrameRef.current);
      meterFrameRef.current = null;
    }
    meterSourceRef.current?.disconnect();
    meterSourceRef.current = null;
    meterAnalyserRef.current?.disconnect();
    meterAnalyserRef.current = null;
    meterToneNodesRef.current.forEach((node) => node.disconnect());
    meterToneNodesRef.current = [];

    const root = document.documentElement;
    root.style.removeProperty("--jarvis-audio-scale");
    root.style.removeProperty("--jarvis-audio-glow");
    for (let i = 0; i < 8; i += 1) {
      root.style.removeProperty(`--jarvis-meter-${i}`);
    }
  }, []);

  const trackVoiceOutput = useCallback(async (audio: HTMLAudioElement, token: number, speaker: Speaker) => {
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;

      let context = meterContextRef.current;
      if (!context || context.state === "closed") {
        context = new AudioContextClass();
        meterContextRef.current = context;
      }

      // Resume BEFORE routing the playing audio through the context.
      // If it is not permitted, do not connect: voice stays audible.
      if (context.state !== "running") {
        await context.resume();
      }
      if (
        context.state !== "running" ||
        audioRef.current !== audio ||
        token !== generationRef.current
      ) return;

      resetVoiceMeter();
      const source = context.createMediaElementSource(audio);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.72;

      // JARVIS is warm and controlled; ULTRON is heavier, distorted,
      // with a short metallic echo. The villain uses a DIFFERENT Piper model.
      const bass = context.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = speaker === "ultron" ? 180 : 220;
      bass.gain.value = speaker === "ultron" ? 9 : 5;

      const resonance = context.createBiquadFilter();
      resonance.type = "peaking";
      resonance.frequency.value = speaker === "ultron" ? 1450 : 960;
      resonance.Q.value = 1.15;
      resonance.gain.value = speaker === "ultron" ? -3 : 2.2;

      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -22;
      compressor.knee.value = 18;
      compressor.ratio.value = speaker === "ultron" ? 3.4 : 2.3;
      compressor.attack.value = 0.012;
      compressor.release.value = 0.16;

      source.connect(bass);
      bass.connect(resonance);

      const nodes: AudioNode[] = [bass, resonance, compressor];
      if (speaker === "ultron") {
        const distortion = context.createWaveShaper();
        const curve = new Float32Array(2048);
        for (let i = 0; i < curve.length; i++) {
          const x = (i * 2) / (curve.length - 1) - 1;
          curve[i] = Math.tanh(x * 1.85) / Math.tanh(1.85);
        }
        distortion.curve = curve;
        distortion.oversample = "2x";
        resonance.connect(distortion);
        distortion.connect(compressor);

        const delay = context.createDelay(0.4);
        delay.delayTime.value = 0.10;
        const echo = context.createGain();
        echo.gain.value = 0.14;
        compressor.connect(delay);
        delay.connect(echo);
        echo.connect(analyser);
        nodes.push(distortion, delay, echo);
      } else {
        resonance.connect(compressor);
      }
      compressor.connect(analyser);
      analyser.connect(context.destination);

      meterSourceRef.current = source;
      meterAnalyserRef.current = analyser;
      meterToneNodesRef.current = nodes;

      const waveform = new Uint8Array(analyser.fftSize);
      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      const ranges: [number, number][] = [
        [1, 3], [2, 5], [3, 7], [4, 9],
        [5, 12], [7, 16], [9, 22], [12, 28],
      ];
      let lastFrameTime = 0;
      let smoothLevel = 0;

      const tick = (time: number) => {
        if (audioRef.current !== audio || token !== generationRef.current) {
          resetVoiceMeter();
          return;
        }

        // ~25 FPS; CSS variables avoid rerendering the entire dashboard.
        if (time - lastFrameTime > 40) {
          lastFrameTime = time;
          analyser.getByteTimeDomainData(waveform);
          analyser.getByteFrequencyData(spectrum);

          let sumSquares = 0;
          for (let i = 0; i < waveform.length; i += 1) {
            const centred = (waveform[i] - 128) / 128;
            sumSquares += centred * centred;
          }
          const rms = Math.sqrt(sumSquares / waveform.length);
          const level = Math.min(1, rms * 8);
          smoothLevel = smoothLevel * 0.55 + level * 0.45;

          const root = document.documentElement;
          root.style.setProperty("--jarvis-audio-scale", (1 + smoothLevel * 0.32).toFixed(3));
          root.style.setProperty("--jarvis-audio-glow", `${Math.round(24 + smoothLevel * 62)}px`);

          ranges.forEach(([from, to], index) => {
            let total = 0;
            for (let i = from; i <= to; i += 1) total += spectrum[i] ?? 0;
            const average = total / (to - from + 1);
            const height = Math.min(1, Math.max(0.13, average / 155));
            root.style.setProperty(`--jarvis-meter-${index}`, height.toFixed(3));
          });
        }

        meterFrameRef.current = window.requestAnimationFrame(tick);
      };
      meterFrameRef.current = window.requestAnimationFrame(tick);
    } catch (reason) {
      // Don't sacrifice the voice if the browser cannot analyse it.
      console.info("JARVIS voice meter unavailable; using state animation.", reason);
    }
  }, [resetVoiceMeter]);

  const setVoiceStatus = useCallback((next: VoiceState) => {
    if (!aliveRef.current) return;
    setVoiceState(next);
    broadcast(next);
  }, []);

  // If ULTRON's prerecorded WAV files have not been generated yet,
  // do not leave the enemy completely silent. Use a basic browser fallback.
  // This fallback is not as deep as the real Norman Piper recording.
  const fallbackUltronSpeech = useCallback((cue: string) => {
    if (!enabledRef.current || !window.speechSynthesis) return;
    const words = ULTRON_CUES[cue] ?? ULTRON_CUES.intro;
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.lang = "en-US";
    utterance.pitch = 0.58;
    utterance.rate = 0.73;
    utterance.volume = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((voice) => /^en-US$/i.test(voice.lang) && /guy|david|mark|male|christopher|eric/i.test(voice.name)) ??
      voices.find((voice) => /^en-US$/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    ultronSpeechRef.current = utterance;
    currentSpeakerRef.current = "ultron";
    utterance.onstart = () => setVoiceStatus("speaking");
    utterance.onend = () => {
      if (ultronSpeechRef.current === utterance) {
        ultronSpeechRef.current = null;
        currentSpeakerRef.current = null;
        setVoiceStatus("idle");
      }
    };
    utterance.onerror = () => {
      if (ultronSpeechRef.current === utterance) {
        ultronSpeechRef.current = null;
        currentSpeakerRef.current = null;
        setVoiceStatus("idle");
      }
    };
    window.speechSynthesis.speak(utterance);
  }, [setVoiceStatus]);

  const releasePendingReply = useCallback((token?: number) => {
    const pending = pendingReplyRef.current;
    if (!pending || (token !== undefined && pending.token !== token)) return;
    pendingReplyRef.current = null;
    revealReply(pending.id);
  }, []);

  const stop = useCallback(() => {
    resetVoiceMeter();
    // If the user presses STOP during voice preparation, never leave the
    // chat showing an empty assistant bubble indefinitely.
    releasePendingReply();
    generationRef.current += 1;
    window.speechSynthesis?.cancel();
    ultronSpeechRef.current = null;
    scheduledKindRef.current = null;
    currentSpeakerRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const audio = audioRef.current;
    audioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setVoiceStatus("idle");
  }, [releasePendingReply, resetVoiceMeter, setVoiceStatus]);

  const playAudio = useCallback((source: string, token: number, temporaryUrl = false, speaker: Speaker = "jarvis") => {
    if (token !== generationRef.current || !enabledRef.current) {
      if (temporaryUrl) URL.revokeObjectURL(source);
      return;
    }

    const audio = new Audio(source);
    audio.preload = "auto";
    audio.volume = speaker === "ultron" ? 0.88 : 0.94;
    // A different, naturally male voice is used for ULTRON. Slowing it
    // with pitch preservation off gives a deeper mechanical character.
    audio.playbackRate = speaker === "ultron" ? 0.80 : 0.92;
    const pitchOptions = audio as HTMLAudioElement & {
      preservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    pitchOptions.preservesPitch = false;
    pitchOptions.webkitPreservesPitch = false;
    audioRef.current = audio;
    currentSpeakerRef.current = speaker;
    if (temporaryUrl) objectUrlRef.current = source;

    let fallbackStarted = false;
    const tryEnemyFallback = () => {
      if (speaker !== "ultron" || fallbackStarted || !enabledRef.current) return;
      fallbackStarted = true;
      const name = source.split("/").pop()?.replace(/\.wav$/, "") ?? "intro";
      fallbackUltronSpeech(name);
    };

    const finish = () => {
      if (audioRef.current !== audio) return;
      resetVoiceMeter();
      audioRef.current = null;
      currentSpeakerRef.current = null;
      if (objectUrlRef.current === source) {
        URL.revokeObjectURL(source);
        objectUrlRef.current = null;
      }
      setVoiceStatus("idle");
    };

    audio.onended = finish;
    audio.onerror = () => {
      releasePendingReply(token);
      finish();
      setError(speaker === "ultron"
        ? "ULTRON WAV file not found. Playing a basic browser fallback. Run: py scripts\\generate_ultron_audio.py"
        : "Audio playback failed. The written answer is still available.");
      tryEnemyFallback();
    };

    void audio.play()
      .then(() => {
        if (audioRef.current !== audio || token !== generationRef.current) return;
        // The audio has STARTED. Reveal the same answer in the chat NOW.
        releasePendingReply(token);
        setVoiceStatus("speaking");
        void trackVoiceOutput(audio, token, speaker);
      })
      .catch((reason: unknown) => {
        if (audioRef.current !== audio) return;
        releasePendingReply(token);
        finish();
        setError(speaker === "ultron" ? "Enemy WAV could not play; trying a browser voice." : "Audio was blocked. Click TEST VOICE to enable sound.");
        tryEnemyFallback();
        console.warn("JARVIS audio playback:", reason);
      });
  }, [fallbackUltronSpeech, releasePendingReply, resetVoiceMeter, setVoiceStatus, trackVoiceOutput]);

  const getVoiceWorker = useCallback(() => {
    if (voiceWorkerRef.current) return voiceWorkerRef.current;

    const worker = new Worker(
      new URL("./jarvis-tts.worker.ts", import.meta.url),
      { type: "module" }
    );
    voiceWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<VoiceWorkerResult>) => {
      const { id, buffer, warm, error: workerError } = event.data;
      if (!aliveRef.current) return;

      // Background preparation must NOT cancel event announcements.
      if (id === WARM_REQUEST_ID) {
        warmingRef.current = false;
        setWarming(false);
        if (!workerError && warm) warmedRef.current = true;
        if (workerError) console.warn("Piper voice warm-up:", workerError);
        return;
      }

      if (id !== generationRef.current) return; // obsolete answer
      if (!enabledRef.current) {
        releasePendingReply(id);
        return;
      }

      if (workerError) {
        releasePendingReply(id);
        setVoiceStatus("idle");
        setError("Live Piper speech failed. The answer remains visible in chat.");
        console.warn("Piper voice worker:", workerError);
      } else if (buffer) {
        const blob = new Blob([buffer], { type: "audio/wav" });
        playAudio(URL.createObjectURL(blob), id, true);
      }
    };

    worker.onerror = (event) => {
      if (!aliveRef.current) return;
      warmingRef.current = false;
      setWarming(false);
      releasePendingReply();
      setVoiceStatus("idle");
      setError("The browser could not start live Piper speech.");
      // Allow the visitor to retry rather than retaining a failed worker.
      worker.terminate();
      if (voiceWorkerRef.current === worker) voiceWorkerRef.current = null;
      console.warn("Piper worker error:", event.message);
    };

    return worker;
  }, [playAudio, releasePendingReply, setVoiceStatus]);

  const warmVoice = useCallback(() => {
    if (!enabledRef.current || warmedRef.current || warmingRef.current) return;
    warmingRef.current = true;
    setWarming(true);
    try {
      getVoiceWorker().postMessage({
        id: WARM_REQUEST_ID,
        text: "Ready.",
        warm: true,
      });
    } catch (reason) {
      warmingRef.current = false;
      setWarming(false);
      console.warn("Piper warm-up unavailable:", reason);
    }
  }, [getVoiceWorker]);

  const speakDynamic = useCallback((text: string, token: number) => {
    const cleaned = cleanText(text);
    if (!cleaned || !enabledRef.current || token !== generationRef.current) {
      releasePendingReply(token);
      return;
    }
    setVoiceStatus("preparing");
    setError("");
    try {
      getVoiceWorker().postMessage({ id: token, text: cleaned });
    } catch (reason) {
      releasePendingReply(token);
      setVoiceStatus("idle");
      setError("Live voice is unavailable; the answer will be shown as text.");
      console.warn("Piper worker setup:", reason);
    }
  }, [getVoiceWorker, releasePendingReply, setVoiceStatus]);

  // Browsing announcements still wait one second and cancel one another.
  const schedule = useCallback((kind: "file" | "dynamic" | "ultron", value: string, delay = BUTTON_DELAY_MS) => {
    if (!enabledRef.current) return;
    stop(); // One voice at a time. JARVIS and ULTRON never talk over each other.
    setError("");
    const token = generationRef.current;
    scheduledKindRef.current = kind;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      scheduledKindRef.current = null;
      if (token !== generationRef.current || !enabledRef.current) return;
      if (kind === "file") {
        playAudio(`/audio/jarvis/${value}.wav`, token);
      } else if (kind === "ultron") {
        playAudio(`/audio/ultron/${value}.wav`, token, false, "ultron");
      } else {
        speakDynamic(value, token);
      }
    }, delay);
  }, [playAudio, speakDynamic, stop]);

  useEffect(() => {
    aliveRef.current = true;
    try {
      const canSpeak = window.localStorage.getItem(MUTE_KEY) !== "true";
      enabledRef.current = canSpeak;
      setEnabled(canSpeak);
    } catch { /* localStorage can be disabled */ }

    const onCue = (event: Event) => {
      const cue = (event as CustomEvent<{ cue?: string }>).detail?.cue;
      if (!cue || !Object.prototype.hasOwnProperty.call(CUES, cue)) return;
      const now = Date.now();
      if (lastCueRef.current.name === cue && now - lastCueRef.current.time < 3500) return;
      lastCueRef.current = { name: cue, time: now };
      schedule("file", cue);
    };

    const onSay = (event: Event) => {
      const text = (event as CustomEvent<{ text?: string }>).detail?.text;
      if (typeof text !== "string" || !text.trim()) return;
      const clip = PHRASES[text];
      schedule(clip ? "file" : "dynamic", clip ?? text);
    };

    const onReply = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; text?: string }>).detail;
      const text = detail?.text;
      if (typeof text !== "string" || !text.trim()) return;

      // Unlike button cues, a visitor's answer has ZERO added waiting time.
      // This also cancels old queued section announcements.
      stop();
      if (!enabledRef.current) {
        if (detail.id) revealReply(detail.id);
        return;
      }
      const token = generationRef.current;
      if (detail.id) pendingReplyRef.current = { id: detail.id, token };
      speakDynamic(text, token);
    };

    const onUltronCue = (event: Event) => {
      const detail = (event as CustomEvent<{ cue?: string; delay?: number }>).detail;
      if (!detail?.cue || !Object.prototype.hasOwnProperty.call(ULTRON_CUES, detail.cue)) return;
      if (!enabledRef.current) return;

      if (ultronWaitTimerRef.current !== null) {
        window.clearTimeout(ultronWaitTimerRef.current);
        ultronWaitTimerRef.current = null;
      }
      const cue = detail.cue;
      const started = Date.now();
      const delay = Math.max(0, Math.min(10000, detail.delay ?? 250));

      // Previously ULTRON scheduling called stop() while JARVIS's intro
      // was still speaking. Wait for that announcement to finish instead.
      const attempt = () => {
        ultronWaitTimerRef.current = null;
        if (!enabledRef.current) return;
        const jarvisBusy =
          (currentSpeakerRef.current === "jarvis" && audioRef.current !== null) ||
          (scheduledKindRef.current === "file" && timerRef.current !== null);
        if (jarvisBusy && Date.now() - started < 17000) {
          ultronWaitTimerRef.current = window.setTimeout(attempt, 240);
          return;
        }
        schedule("ultron", cue, 0);
      };
      ultronWaitTimerRef.current = window.setTimeout(attempt, delay);
    };

    const onUltronStop = () => {
      if (ultronWaitTimerRef.current !== null) {
        window.clearTimeout(ultronWaitTimerRef.current);
        ultronWaitTimerRef.current = null;
      }
      // Stop ULTRON only; do not silence a JARVIS victory announcement.
      if (scheduledKindRef.current === "ultron") {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        scheduledKindRef.current = null;
        generationRef.current += 1;
      }
      if (currentSpeakerRef.current === "ultron") stop();
    };

    const onStop = () => stop();
    const onPrepare = () => warmVoice();

    window.addEventListener("jarvis:speak", onCue);
    window.addEventListener("jarvis:say", onSay);
    window.addEventListener("jarvis:reply", onReply);
    window.addEventListener("jarvis:stop", onStop);
    window.addEventListener("jarvis:prepare-live-voice", onPrepare);
    window.addEventListener("ultron:speak", onUltronCue);
    window.addEventListener("ultron:stop", onUltronStop);

    return () => {
      aliveRef.current = false;
      window.removeEventListener("jarvis:speak", onCue);
      window.removeEventListener("jarvis:say", onSay);
      window.removeEventListener("jarvis:reply", onReply);
      window.removeEventListener("jarvis:stop", onStop);
      window.removeEventListener("jarvis:prepare-live-voice", onPrepare);
      window.removeEventListener("ultron:speak", onUltronCue);
      window.removeEventListener("ultron:stop", onUltronStop);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (ultronWaitTimerRef.current !== null) window.clearTimeout(ultronWaitTimerRef.current);
      window.speechSynthesis?.cancel();
      generationRef.current += 1;
      resetVoiceMeter();
      void meterContextRef.current?.close().catch(() => {});
      meterContextRef.current = null;
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      audioRef.current = null;
      objectUrlRef.current = null;
      voiceWorkerRef.current?.terminate();
      voiceWorkerRef.current = null;
    };
  }, [resetVoiceMeter, schedule, speakDynamic, stop, warmVoice]);

  const toggleVoice = () => {
    const next = !enabledRef.current;
    stop();
    enabledRef.current = next;
    setEnabled(next);
    try { window.localStorage.setItem(MUTE_KEY, next ? "false" : "true"); } catch { /* ignored */ }
    if (next) warmVoice();
  };

  const testVoice = () => {
    enabledRef.current = true;
    setEnabled(true);
    try { window.localStorage.setItem(MUTE_KEY, "false"); } catch { /* ignored */ }
    stop();
    // Test dynamic Piper voice and the editable pronunciation override.
    speakDynamic("JARVIS online. Chirag Nayaka M S. Systems operational.", generationRef.current);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[110] font-mono text-cyan-100 sm:bottom-5 sm:right-5">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          className="flex items-center gap-2 border border-cyan-300/35 bg-[#041221]/95 px-3 py-3 text-[10px] tracking-[.13em] shadow-[0_0_28px_rgba(0,200,255,.12)] backdrop-blur-lg sm:px-4">
          <span className={`h-2 w-2 rounded-full ${voiceState !== "idle" ? "animate-pulse bg-amber-300" : enabled ? "bg-emerald-300" : "bg-slate-400"}`} />
          VOICE {enabled ? "ON" : "OFF"}
        </button>
      ) : (
        <section aria-label="JARVIS voice settings"
          className="w-[min(330px,calc(100vw-32px))] border border-cyan-300/35 bg-[#03101e]/98 p-4 shadow-[0_0_44px_rgba(0,180,255,.22)] backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-[.2em]">J.A.R.V.I.S.</h2>
              <p className="mt-1 text-[10px] text-cyan-200/60">JARVIS / NORTHERN MALE · ULTRON / DEEP ROBOT</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close voice settings"
              className="px-2 text-xl text-white/70 hover:text-white">×</button>
          </div>
          <p className="mt-4 text-xs text-slate-300/70">
            JARVIS always uses Northern English Male. ULTRON uses a separate, darker male voice only during the mission. Button announcements wait one second.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
            <button type="button" onClick={toggleVoice}
              className="border border-cyan-300/30 px-2 py-3 hover:bg-cyan-400/10">
              {enabled ? "MUTE" : "ENABLE"}
            </button>
            <button type="button" onClick={stop}
              className="border border-cyan-300/30 px-2 py-3 hover:bg-cyan-400/10">STOP</button>
            <button type="button" onClick={testVoice}
              className="border border-cyan-300/30 px-2 py-3 hover:bg-cyan-400/10">TEST NAME</button>
            <button type="button" onClick={() => schedule("ultron", "intro", 0)}
              className="border border-red-400/30 px-2 py-3 text-red-200 hover:bg-red-400/10">TEST ULTRON</button>
            <button type="button" onClick={warmVoice} disabled={!enabled || warming || warmedRef.current}
              className="border border-amber-300/30 px-2 py-3 text-amber-200 hover:bg-amber-400/10 disabled:opacity-40">
              {warming ? "LOADING..." : warmedRef.current ? "VOICE READY" : "PREPARE VOICE"}
            </button>
          </div>
          <p className="mt-3 text-[10px] text-cyan-200/80" role="status">
            {voiceState === "preparing" ? "GENERATING REPLY..." : voiceState === "speaking" ? (currentSpeakerRef.current === "ultron" ? "ULTRON SPEAKING" : "JARVIS SPEAKING") : warming ? "PREPARING PIPER MODEL..." : enabled ? "READY" : "MUTED"}
          </p>
          {error && <p className="mt-2 text-[11px] leading-5 text-amber-200" role="alert">{error}</p>}
          <p className="mt-3 text-[10px] leading-5 text-white/40">
            The first reply may still take longer while Piper downloads. Playback and text are synchronised; no paid APIs are used.
          </p>
        </section>
      )}
    </div>
  );
}
