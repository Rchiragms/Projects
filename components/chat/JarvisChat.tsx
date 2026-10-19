"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { WebWorkerMLCEngine } from "@mlc-ai/web-llm";
import { createPortal } from "react-dom";
import JarvisHologram from "@/components/chat/JarvisHologram";
import { JARVIS_SYSTEM_PROMPT } from "@/lib/ai/jarvisFacts";
import { worldGuideAnswer, worldGuideContext } from "@/lib/world/worldGuide";

type ModelState = "idle" | "loading" | "ready" | "error";
type OrbState = "idle" | "loading" | "listening" | "thinking" | "speaking";
type ChatMessage = { id: string; role: "assistant" | "user"; content: string };
type PendingAnswer = { text: string; timer: number };
type Section = "overview" | "about" | "skills" | "projects" | "research" | "contact";

type RecognitionResult = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResult) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
const INTRO: ChatMessage = {
  id: "intro",
  role: "assistant",
  content: "Hello. I'm JARVIS. Ask about Chirag, or talk to me about anything.",
};
const SECTIONS: Array<[Section, RegExp]> = [
  ["projects", /\bprojects?\b/i],
  ["skills", /\bskills?\b|\babilities\b/i],
  ["research", /\bresearch\b/i],
  ["contact", /\bcontact\b|\bemail\b/i],
  ["about", /\babout\b|\bidentity\b/i],
  ["overview", /\boverview\b|\bcommand centre\b/i],
];

function navigateWhenAsked(question: string) {
  // Do not navigate merely because AI mentions one of these topics.
  if (!/\b(show|open|display|navigate|go to|take me to|bring up)\b/i.test(question)) return;
  const target = SECTIONS.find(([, pattern]) => pattern.test(question))?.[0];
  if (!target) return;
  const element = document.getElementById(target);
  if (!element) return;
  element.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "start",
  });
  // No extra cue here: JARVIS will read his single conversational answer.
}

function conciseAnswer(raw: string): string {
  // Defensive length cap. The system prompt also asks for concise answers.
  const answer = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^JARVIS\s*:\s*/i, "")
    .trim();
  const sentences = answer.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [answer];
  const two = sentences.slice(0, 2).join(" ").trim();
  const words = two.split(/\s+/).filter(Boolean);
  if (words.length <= 44) return two || "Could you say that another way?";
  return `${words.slice(0, 44).join(" ").replace(/[,:;]+$/, "")}…`;
}

/** UK local time, including automatic GMT/BST daylight-saving changes. */
function ukNow() {
  const date = new Date();
  const timeZone = "Europe/London";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  const dateText = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return { time, dateText, greeting };
}

function ukGreetingAligned(answer: string, question: string) {
  // Don't change the words if the user is literally ASKING ABOUT the phrase.
  if (/\b(translate|define|meaning|spell|phrase|pronounce)\b/i.test(question) &&
      /\bgood (morning|afternoon|evening)\b/i.test(question)) return answer;
  const greeting = ukNow().greeting;
  return answer.replace(/^good (morning|afternoon|evening)\b/i, `Good ${greeting}`);
}

function shortLocalAnswer(question: string): string | null {
  const input = question.toLowerCase().trim();
  const uk = ukNow();
  if (/^(hi|hello|hey|hiya|yo|good (morning|afternoon|evening))[!?.\s]*$/.test(input)) {
    return `Good ${uk.greeting}. How can I help?`;
  }
  if (/\b(what(?:'s| is) the time|what time is it|current (?:uk )?time|time in (?:the )?(?:uk|britain|london))\b/.test(input) &&
      !/\b(tokyo|new york|india|delhi|sydney|paris|dubai|los angeles)\b/.test(input)) {
    return `It's ${uk.time} in the UK.`;
  }
  return null;
}

function voiceStop() {
  window.dispatchEvent(new Event("jarvis:stop"));
}

export default function JarvisChat({ active }: { active: boolean }) {
  const [chatMount, setChatMount] = useState<HTMLElement | null>(null);
  const [status, setStatus] = useState<ModelState>("idle");
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "preparing" | "speaking">("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);

  const workerRef = useRef<Worker | null>(null);
  const engineRef = useRef<WebWorkerMLCEngine | null>(null);
  const loadingRef = useRef(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([INTRO]);
  const sendingRef = useRef(false);
  const aliveRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activateRef = useRef<HTMLButtonElement | null>(null);
  const pendingAnswersRef = useRef(new Map<string, PendingAnswer>());
  const [waitingForVoice, setWaitingForVoice] = useState(false);

  const commit = useCallback((items: ChatMessage[]) => {
    messagesRef.current = items;
    setMessages(items);
  }, []);

  const revealPendingAnswer = useCallback((id: string) => {
    const pending = pendingAnswersRef.current.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingAnswersRef.current.delete(id);
    commit(messagesRef.current.map((item) =>
      item.id === id ? { ...item, content: pending.text } : item
    ));
    setWaitingForVoice(pendingAnswersRef.current.size > 0);
  }, [commit]);

  const queueSpokenAnswer = useCallback((id: string, text: string) => {
    // Show text at the same moment the audio actually begins, not 1-10s earlier.
    // A 12-second safety limit ensures visitors see an answer even if Piper
    // cannot start (e.g. a slow download or unsupported browser).
    const timer = window.setTimeout(() => {
      revealPendingAnswer(id);
      voiceStop(); // Do not let a very late speech clip surprise the visitor.
    }, 12000);
    pendingAnswersRef.current.set(id, { text, timer });
    setWaitingForVoice(true);
    window.dispatchEvent(new CustomEvent("jarvis:reply", {
      detail: { id, text },
    }));
  }, [revealPendingAnswer]);

  useEffect(() => {
    aliveRef.current = true;
    const onVoice = (event: Event) => {
      const next = (event as CustomEvent<{ state?: "idle" | "preparing" | "speaking" }>).detail?.state;
      if (next) setVoiceState(next);
    };
    const onReplyStart = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (typeof id === "string") revealPendingAnswer(id);
    };
    window.addEventListener("jarvis:voice-state", onVoice);
    window.addEventListener("jarvis:reply-start", onReplyStart);
    return () => {
      aliveRef.current = false;
      window.removeEventListener("jarvis:voice-state", onVoice);
      window.removeEventListener("jarvis:reply-start", onReplyStart);
      for (const item of pendingAnswersRef.current.values()) clearTimeout(item.timer);
      pendingAnswersRef.current.clear();
      recognitionRef.current?.stop();
      workerRef.current?.terminate();
      workerRef.current = null;
      engineRef.current = null;
    };
  }, [revealPendingAnswer]);

  // Mount the conversation inside the former terminal's dashboard slot.
  // Keep this component in app/page.tsx: that preserves ONE AI model and
  // conversation history, instead of mounting a second floating chatbot.
  useEffect(() => {
    if (!active) {
      setChatMount(null);
      return;
    }
    setChatMount(document.getElementById("jarvis-chat-slot"));
  }, [active]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }, [messages, chatMount]);

  const focusConversation = useCallback(() => {
    const panel = document.getElementById("jarvis-chat-slot");
    if (!panel) return;
    panel.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
    // Don't play a redundant voice greeting each time the orb is clicked.
    window.setTimeout(() => {
      if (inputRef.current && !inputRef.current.disabled) {
        inputRef.current.focus({ preventScroll: true });
      } else {
        activateRef.current?.focus({ preventScroll: true });
      }
    }, 350);
  }, []);

  // The large holographic Neural Core also focuses the same chat panel.
  useEffect(() => {
    if (!active) return;
    window.addEventListener("jarvis:open-chat", focusConversation);
    return () => window.removeEventListener("jarvis:open-chat", focusConversation);
  }, [active, focusConversation]);

  const loadAI = useCallback(async () => {
    if (loadingRef.current || engineRef.current) return;
    loadingRef.current = true;
    setStatus("loading");
    setProgress("Checking WebGPU support...");
    try {
      const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
      if (!gpu || !(await gpu.requestAdapter())) {
        throw new Error("WebGPU is unavailable. Use recent Chrome or Edge on compatible hardware.");
      }
      const worker = new Worker(new URL("./jarvis.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      const engine = await CreateWebWorkerMLCEngine(worker, MODEL, {
        initProgressCallback: (info) => {
          if (aliveRef.current) setProgress(info.text.slice(0, 160));
        },
      });
      if (!aliveRef.current) {
        worker.terminate();
        return;
      }
      engineRef.current = engine;
      setStatus("ready");
      setProgress("JARVIS ready.");
      // Prepare the Northern Male Piper voice in advance, without speaking.
      // The first real reply then usually has a much shorter synthesis wait.
      window.dispatchEvent(new Event("jarvis:prepare-live-voice"));
    } catch (reason) {
      workerRef.current?.terminate();
      workerRef.current = null;
      if (aliveRef.current) {
        setStatus("error");
        setProgress(reason instanceof Error ? reason.message : String(reason));
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const sendMessage = useCallback(async (inputText: string) => {
    const question = inputText.trim().slice(0, 600);
    const engine = engineRef.current;
    if (!question || !engine || sendingRef.current) return;

    voiceStop(); // Do not speak over a new question.
    recognitionRef.current?.stop();
    sendingRef.current = true;
    setBusy(true);
    setInput("");
    setNotice("");

    const id = crypto.randomUUID();
    const answerId = crypto.randomUUID();
    const userMessage: ChatMessage = { id, role: "user", content: question };
    const history = [...messagesRef.current.filter((item) => item.id !== "intro"), userMessage];
    commit([...messagesRef.current, userMessage, { id: answerId, role: "assistant", content: "" }]);
    navigateWhenAsked(question);

    try {
      // Deterministic local time and simple greetings. The language model
      // cannot guess a time zone and should never tell UK visitors "good morning"
      // when it is actually 23:00 in London.
      let answer = worldGuideAnswer(question) ?? shortLocalAnswer(question);

      if (!answer) {
        const london = ukNow();
        const context = `${JARVIS_SYSTEM_PROMPT}\n\n${worldGuideContext()}\n\nCURRENT VERIFIED UK CLOCK:\n` +
          `Today is ${london.dateText}; local time is ${london.time} in Europe/London. ` +
          `Use Good ${london.greeting} for any greeting right now. ` +
          `This clock automatically observes British Summer Time and GMT. ` +
          `Never guess a different UK time or start with a mismatched greeting.`;
        const stream = await engine.chat.completions.create({
          messages: [
            { role: "system", content: context },
            ...history.slice(-8).map(({ role, content }) => ({ role, content })),
          ],
          temperature: 0.55,
          top_p: 0.86,
          max_tokens: 90,
          stream: true,
        });
        let generated = "";
        for await (const chunk of stream) {
          generated += chunk.choices[0]?.delta?.content ?? "";
          if (!aliveRef.current) return;
          // Keep the UI on "Thinking..." while generating. Once audio has
          // been prepared, show the final text and begin speech together.
        }
        answer = ukGreetingAligned(conciseAnswer(generated), question);
      }

      if (!aliveRef.current) return;
      queueSpokenAnswer(answerId, answer);
    } catch (reason) {
      if (!aliveRef.current) return;
      const message = reason instanceof Error ? reason.message : String(reason);
      commit(messagesRef.current.map((item) => item.id === answerId ? {
        ...item, content: `I can't answer right now. ${message}`,
      } : item));
    } finally {
      sendingRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  }, [commit, queueSpokenAnswer]);

  const startMic = useCallback(() => {
    if (busy || status !== "ready") return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const browser = window as SpeechWindow;
    const Recognizer = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognizer) {
      setNotice("Microphone dictation is unavailable here. Please type instead.");
      return;
    }
    voiceStop();
    const recognition = new Recognizer();
    recognitionRef.current = recognition;
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const words = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").trim();
      if (words) void sendMessage(words);
    };
    recognition.onerror = () => {
      setListening(false);
      setNotice("Microphone access failed. You can still type.");
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [busy, listening, sendMessage, status]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const orbState: OrbState = listening ? "listening" : busy ? "thinking" : voiceState === "speaking" ? "speaking" : status === "loading" || voiceState === "preparing" ? "loading" : "idle";

  // Broadcast real assistant activity to the large holographic Neural Core.
  // This effect is intentionally before the early return (Rules of Hooks).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("jarvis:assistant-state", { detail: { state: orbState } }));
  }, [orbState]);

  if (!active) return null;

  const chatPanel = (
    <section
      aria-label="JARVIS AI chat"
      className="jarvis-inline-chat flex h-[390px] min-w-0 flex-col overflow-hidden bg-[#050e19]/95 font-mono text-[#e2f8ff] sm:h-[440px] xl:h-[460px]"
    >
      <header className="flex items-center justify-between border-b border-amber-300/20 px-4 py-3">
        <div>
          <p className="text-sm font-semibold tracking-[.2em] text-amber-100">J.A.R.V.I.S. / LIVE CHAT</p>
          <p className="mt-1 text-[9px] tracking-wider text-amber-200/60">
            ASK ABOUT CHIRAG OR ANYTHING ELSE
          </p>
        </div>
        <span className="shrink-0 rounded border border-amber-300/25 px-2 py-1 text-[9px] tracking-wider text-amber-200/75">
          {voiceState === "speaking" ? "SPEAKING" : busy ? "THINKING" : "ONLINE"}
        </span>
      </header>

      <div className="flex items-center gap-2 border-b border-amber-300/15 px-4 py-2 text-[10px]">
        <span className={`h-2 w-2 rounded-full ${status === "ready" ? "bg-emerald-300" : status === "loading" ? "animate-pulse bg-amber-300" : "bg-slate-500"}`} />
        <span className="min-w-0 flex-1 text-amber-100/75">
          {status === "ready" ? "NEURAL ENGINE READY" : status === "loading" ? "LOADING AI..." : "NEURAL ENGINE OFFLINE"}
        </span>
        {(status === "idle" || status === "error") && (
          <button
            ref={activateRef}
            type="button"
            onClick={() => void loadAI()}
            className="shrink-0 rounded border border-amber-300/35 px-3 py-2 text-amber-100 hover:bg-amber-300/10"
          >
            {status === "error" ? "RETRY AI" : "ACTIVATE AI"}
          </button>
        )}
      </div>

      {status !== "ready" && (
        <p role="status" className="border-b border-white/10 px-4 py-2 text-[10px] leading-5 text-slate-300/70">
          {status === "idle"
            ? "Activate once to download the free browser AI model. Requires WebGPU."
            : progress}
        </p>
      )}

      <div
        ref={scrollRef}
        role="log"
        aria-label="JARVIS conversation"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {messages.map((item) => (
          <div key={item.id} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[94%] rounded-md border px-3 py-2 text-[12px] leading-[1.65] whitespace-pre-wrap break-words ${item.role === "user" ? "border-cyan-300/25 bg-cyan-400/10 text-white" : "border-amber-300/15 bg-amber-200/5 text-slate-200"}`}
            >
              <p className={`mb-1 text-[9px] tracking-widest ${item.role === "user" ? "text-cyan-200/65" : "text-amber-200/65"}`}>
                {item.role === "user" ? "VISITOR" : "JARVIS"}
              </p>
              {item.content || <span className="animate-pulse text-amber-200">{waitingForVoice ? "Preparing voice..." : "Thinking..."}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-amber-300/20 px-3 py-3">
        {notice && <p role="status" className="mb-2 text-[10px] text-amber-200">{notice}</p>}
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={status !== "ready" || busy}
            maxLength={600}
            placeholder={status === "ready" ? "Ask JARVIS anything..." : "Activate AI to chat..."}
            aria-label="Ask JARVIS a question"
            className="min-w-0 flex-1 rounded border border-white/20 bg-[#091829] px-3 py-3 text-xs text-white outline-none placeholder:text-white/30 focus:border-amber-300/65 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={startMic}
            disabled={status !== "ready" || busy}
            aria-label={listening ? "Stop microphone" : "Ask using microphone"}
            title="Speech recognition availability depends on browser; recognition may use an online service"
            className="shrink-0 rounded border border-white/20 px-3 py-3 text-xs hover:border-amber-300/70 disabled:opacity-40"
          >
            {listening ? "◉" : "MIC"}
          </button>
          <button
            type="submit"
            disabled={status !== "ready" || busy || !input.trim()}
            className="shrink-0 rounded border border-amber-300/40 bg-amber-400/10 px-3 py-3 text-xs hover:bg-amber-400/20 disabled:opacity-40"
          >
            SEND
          </button>
        </form>
        <p className="mt-2 text-[10px] leading-5 text-slate-400/75">
          {waitingForVoice || voiceState === "preparing"
            ? "Synchronising Northern Male voice and reply..."
            : busy
              ? "Generating a short answer..."
              : "Short answers · UK time · Voice and text together"}
        </p>
      </div>
    </section>
  );

  return (
    <>
      {chatMount && createPortal(chatPanel, chatMount)}
      <div className="fixed bottom-3 left-2 z-[100] font-mono text-[#e2f8ff] sm:bottom-4 sm:left-4">
        <JarvisHologram state={orbState} open={false} onClick={focusConversation} />
      </div>
    </>
  );
}
