"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { playMissionSound, type MissionSound } from "@/lib/audio/missionSound";
import ultronLines from "@/lib/voice/ultron-lines.json";

type GamePhase = "briefing" | "playing" | "paused" | "won" | "lost";
type Stage = 0 | 1 | 2;
type UltronCue = keyof typeof ultronLines;

type RouteNode = {
  id: string;
  encrypted: boolean;
  parity: "EVEN" | "ODD";
  latency: number;
  integrity: number;
  frequency: number;
};

type RoutePuzzle = { rule: string; reason: string; answer: string; nodes: RouteNode[] };

const ROUTES: RoutePuzzle[] = [
  {
    rule: "Choose an ENCRYPTED node with EVEN parity. Of those, select the LOWEST latency.",
    reason: "B is encrypted, has even parity, and a lower latency than D.",
    answer: "B",
    nodes: [
      { id: "A", encrypted: true, parity: "ODD", latency: 13, integrity: 96, frequency: 202 },
      { id: "B", encrypted: true, parity: "EVEN", latency: 22, integrity: 88, frequency: 234 },
      { id: "C", encrypted: false, parity: "EVEN", latency: 9, integrity: 91, frequency: 218 },
      { id: "D", encrypted: true, parity: "EVEN", latency: 38, integrity: 97, frequency: 245 },
    ],
  },
  {
    rule: "Find an ENCRYPTED node with ODD parity. Choose the HIGHEST integrity.",
    reason: "C has the highest integrity among encrypted odd-parity nodes.",
    answer: "C",
    nodes: [
      { id: "A", encrypted: true, parity: "ODD", latency: 27, integrity: 72, frequency: 181 },
      { id: "B", encrypted: true, parity: "EVEN", latency: 10, integrity: 99, frequency: 250 },
      { id: "C", encrypted: true, parity: "ODD", latency: 35, integrity: 94, frequency: 211 },
      { id: "D", encrypted: false, parity: "ODD", latency: 21, integrity: 98, frequency: 204 },
    ],
  },
  {
    rule: "Encrypted + EVEN parity. Select the frequency CLOSEST to 240 Hz.",
    reason: "D is encrypted with even parity and is only 2 Hz from 240 Hz.",
    answer: "D",
    nodes: [
      { id: "A", encrypted: true, parity: "EVEN", latency: 14, integrity: 98, frequency: 226 },
      { id: "B", encrypted: false, parity: "EVEN", latency: 11, integrity: 89, frequency: 240 },
      { id: "C", encrypted: true, parity: "ODD", latency: 18, integrity: 86, frequency: 239 },
      { id: "D", encrypted: true, parity: "EVEN", latency: 30, integrity: 90, frequency: 238 },
    ],
  },
];

type CipherPuzzle = {
  left: number;
  right: number;
  options: number[];
  hint: string;
};
const CIPHERS: CipherPuzzle[] = [
  { left: 0x3a, right: 0x0f, options: [0x35, 0x3f, 0x33, 0x45], hint: "3 XOR 0 = 3; A XOR F = 5. Result: 35 in hexadecimal." },
  { left: 0xc2, right: 0x3c, options: [0x96, 0xff, 0xfe, 0xce], hint: "C XOR 3 = F, and 2 XOR C = E. Result: FE." },
  { left: 0x51, right: 0xa7, options: [0xf6, 0xe6, 0xb6, 0xff], hint: "5 XOR A = F, and 1 XOR 7 = 6. Result: F6." },
];

const PHASE_TARGETS = [32, 66, 86];
const PHASE_TOLERANCE = [9, 7, 6];
const STAGE_TITLES = ["01 / SIGNAL ROUTING", "02 / CIPHER DECRYPTION", "03 / REACTOR SYNC"] as const;
const ROUND_SECONDS = 180;
const MAX_INTEGRITY = 100;
const WARNING_SECONDS = [19, 16, 14];

function hex(value: number) {
  return `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
}
function clamp(value: number) { return Math.max(0, Math.min(100, value)); }
function progressWidth(value: number) { return `${clamp(value)}%`; }
function sendCue(cue: UltronCue, delay = 0) {
  window.dispatchEvent(new CustomEvent("ultron:speak", { detail: { cue, delay } }));
}

export default function NemesisEncounter({
  cleared,
  evolved,
  onClose,
  onStart,
  onComplete,
  onEvolve,
}: {
  cleared: boolean;
  evolved: boolean;
  onClose: () => void;
  onStart: () => void;
  onComplete: (score: number) => void;
  onEvolve: () => void;
}) {
  const [phase, setPhase] = useState<GamePhase>("briefing");
  const [stage, setStage] = useState<Stage>(0);
  const [step, setStep] = useState(0);
  const [integrity, setIntegrity] = useState(100);
  const [seconds, setSeconds] = useState(ROUND_SECONDS);
  const [attackIn, setAttackIn] = useState(WARNING_SECONDS[0]);
  const [shieldPrimed, setShieldPrimed] = useState(false);
  const [shieldCells, setShieldCells] = useState(3);
  const [repairCells, setRepairCells] = useState(2);
  const [scanCells, setScanCells] = useState(2);
  const [score, setScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedback, setFeedback] = useState("Analyse the protocols before starting.");
  const [hint, setHint] = useState("");
  const [threatLine, setThreatLine] = useState("");
  const [sweep, setSweep] = useState(0);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const sweepRef = useRef(0);
  const sweepDirRef = useRef(1);
  const slowedUntilRef = useRef(0);
  const lastTauntRef = useRef(0);
  const pendingThreatRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const effect = useCallback((name: MissionSound) => {
    if (soundEnabled) playMissionSound(name);
  }, [soundEnabled]);

  const stopVillain = useCallback(() => {
    pendingThreatRef.current.forEach((id) => window.clearTimeout(id));
    pendingThreatRef.current = [];
    window.dispatchEvent(new Event("ultron:stop"));
  }, []);

  const ultron = useCallback((cue: UltronCue, delay = 200, priority = false) => {
    const now = Date.now();
    if (!priority && now - lastTauntRef.current < 10000) return;
    lastTauntRef.current = now;
    const id = window.setTimeout(() => {
      pendingThreatRef.current = pendingThreatRef.current.filter((x) => x !== id);
      setThreatLine(ultronLines[cue]);
      sendCue(cue, 0);
    }, delay);
    pendingThreatRef.current.push(id);
  }, []);

  const start = useCallback(() => {
    stopVillain();
    completedRef.current = false;
    lastTauntRef.current = 0;
    sweepRef.current = 0;
    sweepDirRef.current = 1;
    setSweep(0);
    setStage(0);
    setStep(0);
    setPhase("playing");
    setIntegrity(100);
    setSeconds(ROUND_SECONDS);
    setAttackIn(WARNING_SECONDS[0]);
    setShieldPrimed(false);
    setShieldCells(3);
    setRepairCells(2);
    setScanCells(2);
    setScore(0);
    setHint("");
    setFeedback("Route 1/3: identify the valid node using the rule.");
    setThreatLine("");
    effect("activate");
    onStart();
    // The shared voice player waits for JARVIS's opening line to finish.
    ultron("intro", 1800, true);
  }, [effect, onStart, stopVillain, ultron]);

  const damage = useCallback((reason: string, loss: number) => {
    effect("wrong");
    setFeedback(reason);
    setIntegrity((previous) => clamp(previous - loss));
    setScore((previous) => Math.max(0, previous - 60));
    ultron("wrong", 450);
  }, [effect, ultron]);

  const advanceStage = useCallback((finalLockBonus = 0) => {
    effect("breach");
    setHint("");
    if (stage === 2) {
      if (completedRef.current) return;
      completedRef.current = true;
      stopVillain();
      setPhase("won");
      setFeedback("CONTAINMENT SUCCESSFUL. JARVIS AEGIS unlocked.");
      effect("victory");
      const timeAndIntegrityBonus = integrity * 5 + seconds * 4;
      const finalScore = score + finalLockBonus + 300 + timeAndIntegrityBonus;
      setScore((previous) => previous + 300 + timeAndIntegrityBonus);
      onComplete(finalScore);
      return;
    }
    setScore((previous) => previous + 300);
    const nextStage = (stage + 1) as Stage;
    setStage(nextStage);
    setStep(0);
    setAttackIn(WARNING_SECONDS[nextStage]);
    setShieldPrimed(false);
    setFeedback(nextStage === 1
      ? "Routing stable. Decrypt three XOR security packets."
      : "Cipher cracked. Synchronise the reactor within three phase windows.");
    ultron(nextStage === 1 ? "layer2" : "layer3", 650, true);
  }, [effect, integrity, onComplete, score, seconds, stage, stopVillain, ultron]);

  const selectRoute = useCallback((id: string) => {
    if (phase !== "playing" || stage !== 0) return;
    const puzzle = ROUTES[step];
    if (!puzzle) return;
    if (id !== puzzle.answer) {
      damage("Incorrect route. Analyse encryption, parity and the required measurement.", 9);
      return;
    }
    effect("correct");
    setScore((previous) => previous + 180);
    setHint("");
    if (step === 2) advanceStage();
    else {
      setStep(step + 1);
      setFeedback(puzzle.reason + " Route secured. Continue.");
    }
  }, [advanceStage, damage, effect, phase, stage, step]);

  const selectCipher = useCallback((value: number) => {
    if (phase !== "playing" || stage !== 1) return;
    const puzzle = CIPHERS[step];
    if (!puzzle) return;
    if (value !== (puzzle.left ^ puzzle.right)) {
      damage("Incorrect XOR. Only differing binary bits produce a 1.", 10);
      return;
    }
    effect("correct");
    setScore((previous) => previous + 220);
    setHint("");
    if (step === 2) advanceStage();
    else {
      setStep(step + 1);
      setFeedback(`${hex(value)} verified. Cipher packet ${step + 2} awaiting decryption.`);
    }
  }, [advanceStage, damage, effect, phase, stage, step]);

  const lockPhase = useCallback(() => {
    if (phase !== "playing" || stage !== 2) return;
    const position = sweepRef.current;
    const target = PHASE_TARGETS[step];
    const tolerance = PHASE_TOLERANCE[step];
    if (target === undefined || tolerance === undefined) return;
    if (Math.abs(position - target) > tolerance) {
      damage(`PHASE DRIFT: ${Math.round(position)}%. Lock within ${target - tolerance}–${target + tolerance}%.`, 7);
      return;
    }
    effect("lock");
    const lockBonus = 275 + Math.round(tolerance - Math.abs(position - target)) * 8;
    setScore((previous) => previous + lockBonus);
    setHint("");
    if (step === 2) advanceStage(lockBonus);
    else {
      setStep(step + 1);
      setFeedback(`Phase ${step + 1} locked at ${Math.round(position)}%. Synchronise channel ${step + 2}.`);
    }
  }, [advanceStage, damage, effect, phase, stage, step]);

  const doScan = useCallback(() => {
    if (phase !== "playing" || scanCells === 0) return;
    setScanCells((x) => x - 1);
    setScore((x) => Math.max(0, x - 100));
    effect("scan");
    if (stage === 0) setHint(`JARVIS SCAN: Use node ${ROUTES[step].answer}. ${ROUTES[step].reason}`);
    if (stage === 1) setHint(`JARVIS SCAN: ${CIPHERS[step].hint}`);
    if (stage === 2) {
      slowedUntilRef.current = performance.now() + 8000;
      setHint(`JARVIS SCAN: Sweep slowed for 8 seconds. Target ${PHASE_TARGETS[step]}% ±${PHASE_TOLERANCE[step]}%.`);
    }
    setFeedback("Assistance uploaded. Scan charge consumed; score penalty applied.");
  }, [effect, phase, scanCells, stage, step]);

  const doRepair = useCallback(() => {
    if (phase !== "playing" || repairCells === 0 || integrity >= 100) return;
    setRepairCells((x) => x - 1);
    setIntegrity((x) => clamp(x + 22));
    setSeconds((x) => Math.max(0, x - 4));
    setScore((x) => Math.max(0, x - 80));
    effect("repair");
    setFeedback("Capacitor repaired +22 integrity. Cost: 4 seconds, 80 points.");
  }, [effect, integrity, phase, repairCells]);

  const deployShield = useCallback(() => {
    if (phase !== "playing" || shieldCells <= 0 || shieldPrimed) return;
    if (attackIn > 5) {
      setFeedback(`Too early. The defence window opens 5 seconds before impact.`);
      return;
    }
    setShieldCells((x) => x - 1);
    setShieldPrimed(true);
    effect("shield");
    setFeedback("SHIELD ARMED. Incoming counterattack will be intercepted.");
  }, [attackIn, effect, phase, shieldCells, shieldPrimed]);

  // A ticking threat forces decisions, not just rapid clicking.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setSeconds((x) => Math.max(0, x - 1));
      setAttackIn((x) => Math.max(0, x - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" || attackIn !== 0) return;
    if (shieldPrimed) {
      effect("shield");
      setScore((x) => x + 120);
      setFeedback("Counterattack intercepted. Shield held. +120 points.");
    } else {
      effect("attack");
      setIntegrity((x) => clamp(x - (stage === 2 ? 13 : 10)));
      setFeedback("ULTRON counterattack hit the command centre. Deploy shields during the warning window.");
      ultron("counter", 350);
    }
    setShieldPrimed(false);
    setAttackIn(WARNING_SECONDS[stage]);
  }, [attackIn, effect, phase, shieldPrimed, stage, ultron]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (seconds > 0 && integrity > 0) return;
    setPhase("lost");
    setFeedback(seconds === 0 ? "Time exhausted. Containment failed." : "System integrity lost. Containment failed.");
    ultron("defeat", 350, true);
    effect("attack");
  }, [effect, integrity, phase, seconds, ultron]);

  // Only stage 3 uses the faster cursor; the other stages render at 1 Hz.
  useEffect(() => {
    if (phase !== "playing" || stage !== 2) return;
    const id = window.setInterval(() => {
      const slow = performance.now() < slowedUntilRef.current;
      const stepSize = slow ? 0.55 : 1.85;
      let next = sweepRef.current + sweepDirRef.current * stepSize;
      if (next >= 100) { next = 100; sweepDirRef.current = -1; }
      if (next <= 0) { next = 0; sweepDirRef.current = 1; }
      sweepRef.current = next;
      setSweep(next);
    }, 45);
    return () => window.clearInterval(id);
  }, [phase, stage]);

  // Voice diagnostics (missing files and a previously muted JARVIS setting).
  useEffect(() => {
    try { setVoiceMuted(window.localStorage.getItem("jarvis-muted") === "true"); } catch { /* storage optional */ }
    let active = true;
    void fetch("/audio/ultron/intro.wav", { method: "HEAD", cache: "no-store" })
      .then((response) => { if (active) setVoiceMissing(!response.ok); })
      .catch(() => { if (active) setVoiceMissing(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    closeRef.current?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const visibility = () => {
      if (document.hidden) setPhase((old) => old === "playing" ? "paused" : old);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopVillain();
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [stopVillain]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Tab" && dialogRef.current) {
        const buttons = Array.from(dialogRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault(); buttons[buttons.length - 1]?.focus();
        } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
          event.preventDefault(); buttons[0]?.focus();
        }
        return;
      }
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      if (event.key.toLowerCase() === "p" && (phase === "playing" || phase === "paused")) {
        event.preventDefault(); setPhase(phase === "playing" ? "paused" : "playing");
      }
      if (phase !== "playing") return;
      if (event.key.toLowerCase() === "h") doScan();
      if (event.key.toLowerCase() === "r") doRepair();
      if (event.key.toLowerCase() === "d") deployShield();
      if (event.code === "Space" && stage === 2 && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault(); lockPhase();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deployShield, doRepair, doScan, lockPhase, onClose, phase, stage]);

  const target = PHASE_TARGETS[step] ?? 50;
  const tolerance = PHASE_TOLERANCE[step] ?? 7;
  const correctBandLeft = target - tolerance;
  const correctBandWidth = tolerance * 2;
  const attackWarning = attackIn <= 5 && phase === "playing";
  const subtitle = threatLine || "No hostile transmission";
  const hasWonBefore = cleared || evolved;

  return createPortal(
    <div className="ulx-overlay">
      <section className="ulx-shell" role="dialog" aria-modal="true" aria-labelledby="ulx-title" ref={dialogRef}>
        <header className="ulx-header">
          <div className="ulx-brand"><span className="ulx-led" /> C.N.M.S. <em>// REACTOR DEFENCE PROGRAMME</em></div>
          <div className="ulx-head-controls">
            <span className="ulx-simulation">SIMULATION / ULTRON</span>
            <button className="ulx-utility" type="button" aria-pressed={!soundEnabled} onClick={() => setSoundEnabled((x) => !x)}>{soundEnabled ? "SFX ON" : "SFX OFF"}</button>
            <button className="ulx-utility ulx-close" type="button" ref={closeRef} onClick={onClose} aria-label="Close mission">✕</button>
          </div>
        </header>

        <div className="ulx-content">
          <aside className="ulx-side">
            <p className="ulx-kicker">TACTICAL SIMULATION // 001</p>
            <h2 id="ulx-title">PROJECT <span>ULTRON</span></h2>
            <p className="ulx-summary">Three different puzzles. One adaptive opponent. Use logic, cryptography and reactor timing to regain control.</p>
            <div className="ulx-info"><span>DEFENCE SYSTEM</span><strong>{phase === "won" ? "CONTAINED" : phase === "lost" ? "COMPROMISED" : phase === "paused" ? "PAUSED" : phase === "playing" ? "ACTIVE" : "STANDBY"}</strong></div>
            <div className="ulx-info"><span>LEVEL</span><strong>{stage + 1} / 3</strong></div>
            <div className="ulx-meter-label"><span>SYSTEM INTEGRITY</span><b>{integrity}%</b></div>
            <div className="ulx-track"><div className="ulx-fill ulx-cyan" style={{ width: progressWidth(integrity) }} /></div>
            <div className="ulx-meter-label ulx-gap"><span>MISSION TIME</span><b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</b></div>
            <div className="ulx-track"><div className="ulx-fill ulx-gold" style={{ width: progressWidth(seconds / ROUND_SECONDS * 100) }} /></div>
            <div className="ulx-resources">
              <div><span>SHIELDS</span><strong>{shieldCells}</strong></div>
              <div><span>REPAIRS</span><strong>{repairCells}</strong></div>
              <div><span>SCANS</span><strong>{scanCells}</strong></div>
            </div>
            <div className="ulx-mission-list">
              {STAGE_TITLES.map((name, index) => (
                <div key={name} className={`ulx-mission-item ${stage === index ? "ulx-current" : ""} ${stage > index || phase === "won" ? "ulx-complete" : ""}`}>
                  <span>{stage > index || phase === "won" ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <p>{name}</p>
                </div>
              ))}
            </div>
            <p className="ulx-note">Fictional cybersecurity puzzle game. No actual intrusion or device diagnostic is performed.</p>
          </aside>

          <div className="ulx-game">
            <div className="ulx-game-top">
              <div><span className="ulx-kicker">ENEMY INTELLIGENCE</span><div className="ulx-hostile">◉ ULTRON <small>HOSTILE LINK DETECTED</small></div></div>
              <div className="ulx-score"><small>MISSION SCORE</small><strong>{score.toLocaleString("en-GB")}</strong></div>
            </div>

            <div className="ulx-stage">
              <div className="ulx-reaction-reactor" aria-hidden="true"><i /><i /><i /><b>✦</b></div>
              {phase === "briefing" && (
                <div className="ulx-intro">
                  <p className="ulx-kicker">INCOMING THREAT // REACTOR LINK ONLINE</p>
                  <h3>THINK. DECODE. <span>SYNCHRONISE.</span></h3>
                  <p>Stage 1: select signal routes using data constraints. Stage 2: decode XOR packets. Stage 3: lock three moving reactor phases. ULTRON will counterattack throughout the mission.</p>
                  <p>Three shield cells let you block an attack during its final five seconds. Two scans give hints. Two repairs restore integrity at a time cost.</p>
                  {hasWonBefore && <p className="ulx-green">Previous containment recorded. Replay to improve your score.</p>}
                  {voiceMuted && <p className="ulx-voice-warning">JARVIS VOICE IS MUTED. Close the mission and select ENABLE in the JARVIS voice dock to hear both characters.</p>}
                  {voiceMissing && <p className="ulx-voice-warning">ULTRON WAV files are missing. A browser-voice fallback will be attempted. Run the voice generator for the intended deep robotic voice.</p>}
                  <div className="ulx-intro-actions">
                    <button type="button" className="ulx-primary" onClick={start}>INITIATE DEFENCE <span>↗</span></button>
                    <button type="button" className="ulx-secondary" onClick={() => sendCue("intro", 0)}>TEST ULTRON VOICE</button>
                  </div>
                </div>
              )}

              {(phase === "playing" || phase === "paused") && (
                <div className="ulx-challenge">
                  <div className="ulx-challenge-heading"><span>STAGE {stage + 1}/3 • TASK {step + 1}/3</span><strong>{STAGE_TITLES[stage].split(" / ")[1]}</strong></div>
                  {stage === 0 && (
                    <>
                      <p className="ulx-rule">{ROUTES[step].rule}</p>
                      <div className="ulx-nodes">
                        {ROUTES[step].nodes.map((node) => (
                          <button className="ulx-node" type="button" key={node.id} disabled={phase !== "playing"} onClick={() => selectRoute(node.id)}>
                            <span className="ulx-node-top"><b>NODE {node.id}</b><small>{node.encrypted ? "◆ ENCRYPTED" : "◇ OPEN"}</small></span>
                            <span><small>PARITY</small><strong>{node.parity}</strong></span>
                            <span><small>LATENCY</small><strong>{node.latency} ms</strong></span>
                            <span><small>INTEGRITY</small><strong>{node.integrity}%</strong></span>
                            <span><small>FREQUENCY</small><strong>{node.frequency} Hz</strong></span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {stage === 1 && (
                    <>
                      <p className="ulx-rule">Decrypt the payload with a bitwise XOR. A bit becomes 1 only when the two input bits differ.</p>
                      <div className="ulx-cipher">
                        <div><small>ENCRYPTED A</small><strong>{hex(CIPHERS[step].left)}</strong><span>{CIPHERS[step].left.toString(2).padStart(8, "0")}</span></div>
                        <b>⊕</b>
                        <div><small>KEY B</small><strong>{hex(CIPHERS[step].right)}</strong><span>{CIPHERS[step].right.toString(2).padStart(8, "0")}</span></div>
                        <b>=</b>
                        <div className="ulx-cipher-answer"><small>RESULT</small><strong>0x??</strong></div>
                      </div>
                      <div className="ulx-options">
                        {CIPHERS[step].options.map((option) => <button type="button" key={option} disabled={phase !== "playing"} onClick={() => selectCipher(option)}>{hex(option)}</button>)}
                      </div>
                      <p className="ulx-helper">Hint: 0 ⊕ 0 = 0 · 1 ⊕ 1 = 0 · 0 ⊕ 1 = 1 · 1 ⊕ 0 = 1</p>
                    </>
                  )}
                  {stage === 2 && (
                    <>
                      <p className="ulx-rule">Synchronise channel {step + 1}. Watch the moving phase cursor and LOCK it inside the highlighted target window.</p>
                      <div className="ulx-sync-readout"><span>LIVE PHASE</span><strong>{Math.round(sweep)}<small>%</small></strong><span>TARGET {target}% ±{tolerance}%</span></div>
                      <div className="ulx-phase-track">
                        <div className="ulx-phase-window" style={{ left: `${correctBandLeft}%`, width: `${correctBandWidth}%` }} />
                        <div className="ulx-phase-marker" style={{ left: `${sweep}%` }} />
                      </div>
                      <div className="ulx-phase-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
                      <button type="button" disabled={phase !== "playing"} className="ulx-lock" onClick={lockPhase}>⌖ LOCK PHASE <small>(SPACE)</small></button>
                      <p className="ulx-helper">Press SPACE or tap LOCK PHASE. Each channel has a narrower safe range. SCAN slows the cursor for 8 seconds.</p>
                    </>
                  )}
                  <div className="ulx-challenge-progress">{[0, 1, 2].map((index) => <i key={index} className={index < step ? "done" : index === step ? "live" : ""} />)}</div>
                  {hint && <div className="ulx-hint" role="status">◈ {hint}</div>}
                </div>
              )}

              {phase === "paused" && <div className="ulx-state-layer"><h3>MISSION PAUSED</h3><p>The clock and enemy systems are halted.</p><button type="button" className="ulx-primary" onClick={() => setPhase("playing")}>RESUME MISSION</button></div>}
              {(phase === "won" || phase === "lost") && (
                <div className="ulx-state-layer ulx-final">
                  <p className="ulx-kicker">{phase === "won" ? "THREAT CONTAINED // SYSTEM RESTORED" : "MISSION FAILURE // ULTRON CONTROL"}</p>
                  <h3>{phase === "won" ? "AEGIS UNLOCKED" : "ULTRON PREVAILS"}</h3>
                  <p>{phase === "won" ? "All three protocols completed. Reactor containment confirmed." : "Review the rules, defend against counterattacks, and try again."}</p>
                  <div className="ulx-final-score">FINAL SCORE <strong>{score.toLocaleString("en-GB")}</strong></div>
                  <div className="ulx-intro-actions"><button type="button" className="ulx-primary" onClick={start}>REPLAY MISSION</button>{phase === "won" && !evolved && <button type="button" className="ulx-primary ulx-gold-button" onClick={onEvolve}>ACTIVATE AEGIS EVOLUTION</button>}</div>
                </div>
              )}
            </div>

            <div className="ulx-threat" aria-live="polite"><span>ULTRON //</span><p>{subtitle}</p></div>
            {phase === "playing" && (
              <div className={`ulx-defence ${attackWarning ? "ulx-danger" : ""}`}>
                <div className="ulx-threat-clock"><small>COUNTERATTACK IN</small><strong>{attackIn}s</strong>{attackWarning && <span>⚠ SHIELD WINDOW OPEN</span>}</div>
                <div className="ulx-tactical-actions">
                  <button type="button" disabled={shieldCells === 0 || shieldPrimed} onClick={deployShield} className="ulx-action-shield">{shieldPrimed ? "✓ SHIELD ARMED" : `DEPLOY SHIELD (${shieldCells})`}</button>
                  <button type="button" disabled={repairCells === 0 || integrity === 100} onClick={doRepair}>REPAIR +22 ({repairCells})</button>
                  <button type="button" disabled={scanCells === 0} onClick={doScan}>JARVIS SCAN ({scanCells})</button>
                </div>
              </div>
            )}
            <footer className="ulx-footer"><p role="status">{feedback}</p><div>{phase === "playing" && <button type="button" onClick={() => setPhase("paused")}>Ⅱ PAUSE (P)</button>}<span>H = SCAN · R = REPAIR · D = SHIELD</span></div></footer>
          </div>
        </div>
      </section>
      <style>{`
        .ulx-overlay{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:12px;background:rgba(0,2,8,.92);backdrop-filter:blur(16px);color:#e8f7ff;font-family:ui-monospace,Consolas,monospace}
        .ulx-shell{animation:ulx-shell-enter .82s cubic-bezier(.18,.8,.28,1) both;display:flex;flex-direction:column;width:min(1250px,100%);max-height:calc(100dvh - 24px);overflow:hidden;border:1px solid rgba(104,203,244,.35);background:#030c18;box-shadow:0 0 100px rgba(2,183,240,.13),inset 0 0 65px rgba(18,116,179,.03)}
        .ulx-header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(114,204,240,.18);padding:15px 20px;background:rgba(9,26,44,.85)}
        .ulx-brand{font-size:11px;letter-spacing:.2em;color:#c6f4ff;font-weight:800}.ulx-brand em{font-size:10px;font-style:normal;color:#68a8c5}.ulx-led{display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#43f3d5;box-shadow:0 0 12px #19eee7;animation:ulx-blink 2s infinite}.ulx-head-controls{display:flex;gap:10px;align-items:center}.ulx-simulation{font-size:9px;letter-spacing:.13em;color:#d5798a}.ulx-utility{border:1px solid rgba(132,220,255,.26);padding:10px;min-width:48px;min-height:40px;font-size:10px;color:#cee8f6}.ulx-close{font-size:16px}
        .ulx-content{display:grid;grid-template-columns:minmax(235px,295px) minmax(0,1fr);min-height:0;overflow:auto}.ulx-side{padding:27px 23px;border-right:1px solid rgba(94,176,214,.17);background:linear-gradient(160deg,#061322,#07101b 75%)}.ulx-kicker{font-size:9px;font-weight:700;letter-spacing:.21em;color:#78c6df}.ulx-side h2{font:800 clamp(25px,2.5vw,40px)/1.1 system-ui,sans-serif;letter-spacing:-.045em;margin:16px 0 10px}.ulx-side h2 span{color:#ff657e}.ulx-summary{font:400 12px/1.7 system-ui,sans-serif;color:#91aebf;margin-bottom:28px}.ulx-info{display:flex;justify-content:space-between;gap:10px;margin:12px 0;font-size:10px;color:#6b95a9}.ulx-info strong{font-size:11px;color:#d2effb}.ulx-meter-label{display:flex;justify-content:space-between;margin:22px 0 9px;font-size:10px;color:#a4d8ef}.ulx-meter-label b{color:#fff;font-size:13px}.ulx-gap{margin-top:20px}.ulx-track{height:5px;background:#102b3e;overflow:hidden}.ulx-fill{height:100%;transition:width .3s}.ulx-cyan{background:#4acdec;box-shadow:0 0 14px #51dfff}.ulx-gold{background:#ffc06a}.ulx-resources{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:27px 0}.ulx-resources div{border:1px solid rgba(93,191,238,.18);padding:11px 8px;text-align:center}.ulx-resources span{display:block;font-size:8px;color:#6e9fb4}.ulx-resources strong{font-size:23px;color:#eefaff}.ulx-mission-list{border-top:1px solid rgba(91,176,216,.17);padding-top:17px}.ulx-mission-item{display:flex;align-items:center;gap:9px;padding:12px 7px;font-size:10px;color:#547b92;letter-spacing:.06em}.ulx-mission-item span{font-weight:800;color:#5d8fa7}.ulx-mission-item p{margin:0}.ulx-mission-item.ulx-current{background:#0b2237;color:#a5e6ff}.ulx-mission-item.ulx-complete{color:#91e7c8}.ulx-note{margin:22px 0 0;color:#59768a;font:400 10px/1.6 system-ui,sans-serif}
        .ulx-game{min-width:0;display:flex;flex-direction:column;padding:22px clamp(15px,3vw,32px);gap:13px}.ulx-game-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.ulx-hostile{font-size:17px;font-weight:800;color:#f56f89;margin-top:5px;letter-spacing:.15em}.ulx-hostile small{font-size:8px;color:#7f8299;margin-left:9px;font-weight:500}.ulx-score{text-align:right}.ulx-score small{display:block;color:#6a9bb4;font-size:9px;letter-spacing:.1em}.ulx-score strong{font-size:24px;color:#fff}.ulx-stage{position:relative;isolation:isolate;min-height:390px;border:1px solid rgba(116,211,255,.2);background:radial-gradient(circle at 51% 42%,rgba(4,84,128,.21),transparent 43%),repeating-linear-gradient(0deg,transparent 0 31px,rgba(96,179,227,.035) 32px),repeating-linear-gradient(90deg,transparent 0 31px,rgba(96,179,227,.035) 32px),#030c18;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:19px}.ulx-reaction-reactor{position:absolute;left:50%;top:45%;width:230px;height:230px;transform:translate(-50%,-50%);z-index:-1;opacity:.3;pointer-events:none}.ulx-reaction-reactor i{position:absolute;inset:0;border-radius:50%;border:1px solid rgba(68,214,249,.4);animation:ulx-reactor-spin 24s linear infinite}.ulx-reaction-reactor i:nth-child(2){inset:16px;border-style:dashed;animation-duration:13s;animation-direction:reverse}.ulx-reaction-reactor i:nth-child(3){inset:52px;border-color:#b7f7ff;box-shadow:0 0 38px rgba(68,212,255,.48)}.ulx-reaction-reactor b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:55px;color:#78dfff}.ulx-intro,.ulx-challenge{position:relative;z-index:1;width:100%;max-width:750px}.ulx-intro{max-width:590px;text-align:center;padding:12px 0}.ulx-intro h3{font:800 clamp(25px,4vw,44px)/1.06 system-ui,sans-serif;letter-spacing:-.05em;margin:19px 0}.ulx-intro h3 span{color:#76ddff}.ulx-intro p:not(.ulx-kicker){color:#acc2d2;font:400 13px/1.75 system-ui,sans-serif;margin-bottom:12px}.ulx-intro .ulx-green{color:#86eac9!important}.ulx-intro .ulx-voice-warning{color:#f7c585!important;border:1px solid rgba(237,182,101,.3);padding:9px}.ulx-intro-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:23px}.ulx-primary{background:linear-gradient(100deg,#037ea2,#17b6dc);border:1px solid #76e7ff;color:white;min-height:47px;padding:12px 21px;font-weight:800;font-size:11px;letter-spacing:.08em;cursor:pointer}.ulx-primary span{margin-left:14px}.ulx-secondary{border:1px solid rgba(110,217,252,.33);color:#d7f6ff;padding:12px;font-size:10px;min-height:47px}.ulx-gold-button{background:linear-gradient(100deg,#94651f,#c89140);border-color:#fbe4a8}.ulx-challenge-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:17px}.ulx-challenge-heading span{color:#75bbd9;font-size:10px;letter-spacing:.12em}.ulx-challenge-heading strong{color:#dff8ff;font-size:15px}.ulx-rule{padding:13px;border-left:3px solid #4bd2f8;background:rgba(9,50,72,.7);color:#dbfaff;font:500 12px/1.55 system-ui,sans-serif;min-height:54px}.ulx-nodes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.ulx-node{min-width:0;border:1px solid rgba(99,189,233,.24);background:linear-gradient(160deg,rgba(6,32,52,.96),rgba(3,16,29,.96));padding:13px 12px;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}.ulx-node:hover:not(:disabled){border-color:#89e5ff;background:#10334a}.ulx-node:focus-visible{outline:2px solid #d1fdff;outline-offset:2px}.ulx-node:disabled{opacity:.5}.ulx-node>span{display:flex;justify-content:space-between;gap:5px;margin-top:8px}.ulx-node span small{color:#75a4b8;font-size:9px}.ulx-node span strong{font-size:10px;color:#ddf6ff}.ulx-node .ulx-node-top{display:block;border-bottom:1px solid #1b4960;padding-bottom:10px;margin:0 0 9px}.ulx-node-top b{display:block;color:#7cdbf4;font-size:16px}.ulx-node-top small{font-size:8px!important;white-space:nowrap}.ulx-cipher{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:22px auto;max-width:630px}.ulx-cipher>div{flex:1;min-width:0;text-align:center;border:1px solid rgba(115,207,248,.27);padding:17px 5px;background:#081d2f}.ulx-cipher small{display:block;font-size:9px;color:#7db1cb}.ulx-cipher strong{display:block;font-size:clamp(21px,3vw,36px);color:#e0f8ff;margin:8px 0}.ulx-cipher span{font-size:11px;color:#5fc7f0;letter-spacing:.12em}.ulx-cipher>b{font-size:27px;color:#73e3ff}.ulx-cipher .ulx-cipher-answer{border-color:#b28c47}.ulx-options{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;max-width:630px;margin:auto}.ulx-options button{background:#0c2d42;border:1px solid rgba(108,216,253,.27);padding:13px 8px;min-height:52px;color:#cff7ff;font-size:17px;font-weight:800;cursor:pointer}.ulx-options button:hover:not(:disabled){background:#135575;border-color:#9eedff}.ulx-helper{font:400 11px/1.6 system-ui,sans-serif;color:#87a6b8;margin-top:15px;text-align:center}.ulx-sync-readout{display:flex;justify-content:space-between;align-items:center;margin:35px 0 16px;color:#a4cfe0;font-size:11px}.ulx-sync-readout strong{font-size:42px;color:#e7faff}.ulx-sync-readout strong small{font-size:17px}.ulx-phase-track{position:relative;height:28px;border:1px solid #295b73;background:repeating-linear-gradient(90deg,#0d2a42 0 1px,#081e33 1px 3%);border-radius:8px;margin-top:30px}.ulx-phase-window{position:absolute;top:0;bottom:0;background:rgba(63,247,188,.35);border:1px solid #63ffc8;box-shadow:0 0 18px #42e9bc}.ulx-phase-marker{position:absolute;top:-13px;bottom:-13px;width:4px;border-radius:3px;background:#fff4ca;box-shadow:0 0 18px #ffbc66;transform:translateX(-50%)}.ulx-phase-scale{display:flex;justify-content:space-between;font-size:10px;color:#6291aa;margin:14px 0 27px}.ulx-lock{display:block;margin:0 auto;background:linear-gradient(120deg,#ad6527,#e3a03f);color:#1c0e03;min-height:50px;padding:12px 40px;font-weight:900;letter-spacing:.16em;border:1px solid #ffc876}.ulx-lock small{font-size:10px}.ulx-challenge-progress{display:flex;gap:8px;margin-top:25px}.ulx-challenge-progress i{height:5px;background:#1a4456;flex:1}.ulx-challenge-progress i.done{background:#43e4af}.ulx-challenge-progress i.live{background:#71cffa;box-shadow:0 0 9px #51cef6}.ulx-hint{margin-top:12px;border:1px solid rgba(231,184,91,.5);background:#242012;padding:10px;color:#f7d6a1;font:500 11px/1.6 system-ui,sans-serif}
        .ulx-state-layer{position:absolute;inset:0;z-index:4;display:flex;justify-content:center;align-items:center;flex-direction:column;background:rgba(2,12,23,.94);padding:20px;text-align:center}.ulx-state-layer h3{font:800 clamp(23px,4vw,44px)/1.1 system-ui,sans-serif;color:#b8f0ff;margin:10px}.ulx-state-layer p{color:#98bacd;font:400 13px/1.6 system-ui,sans-serif;max-width:440px}.ulx-state-layer button{margin-top:18px}.ulx-final .ulx-final-score{display:flex;gap:16px;align-items:center;color:#87a6bc;font-size:11px;margin-top:15px}.ulx-final-score strong{color:#fff;font-size:24px}.ulx-threat{display:flex;gap:12px;align-items:center;border:1px solid rgba(227,76,110,.23);padding:11px 13px;background:rgba(84,14,33,.14);min-height:47px}.ulx-threat span{color:#ff7190;font-size:10px;white-space:nowrap;font-weight:800}.ulx-threat p{color:#ffc1ce;font:400 12px/1.45 system-ui,sans-serif}.ulx-defence{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:12px;border:1px solid rgba(91,173,203,.2);background:rgba(4,30,51,.58)}.ulx-defence.ulx-danger{border-color:rgba(255,112,133,.7);box-shadow:inset 0 0 20px rgba(255,70,105,.1);animation:ulx-warning .6s ease-in-out infinite alternate}.ulx-threat-clock{display:flex;align-items:center;gap:12px}.ulx-threat-clock small{font-size:9px;color:#89bbce}.ulx-threat-clock strong{color:#ffd8a4;font-size:23px}.ulx-threat-clock span{color:#ff839c;font-size:9px;font-weight:800}.ulx-tactical-actions{display:flex;flex-wrap:wrap;gap:7px}.ulx-tactical-actions button{border:1px solid rgba(116,214,245,.32);padding:11px;color:#c5e7f6;font-size:10px;min-height:40px}.ulx-tactical-actions button:disabled{opacity:.35;cursor:default}.ulx-tactical-actions .ulx-action-shield{border-color:rgba(112,236,186,.5);color:#9fffe0}.ulx-footer{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:10px 0;border-top:1px solid rgba(123,214,255,.12)}.ulx-footer p{color:#b7d7e3;font:400 11px/1.6 system-ui,sans-serif;max-width:500px}.ulx-footer div{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ulx-footer button{border:1px solid #315571;padding:8px;color:#d7f7ff;font-size:10px;white-space:nowrap}.ulx-footer span{color:#628ca6;font-size:9px;white-space:nowrap}
        button:disabled{cursor:default} .ulx-overlay button:focus-visible{outline:2px solid #f4cc7f;outline-offset:3px}.ulx-overlay button:not(:disabled){transition:filter .15s}.ulx-overlay button:hover:not(:disabled){filter:brightness(1.15)}
        @keyframes ulx-shell-enter{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}@keyframes ulx-portal-flash{0%{transform:scale(.12);opacity:.2}38%{transform:scale(.6);opacity:.8}100%{transform:scale(2);opacity:0}}@keyframes ulx-reactor-spin{to{transform:rotate(360deg)}}@keyframes ulx-blink{50%{opacity:.35}}@keyframes ulx-warning{to{background:rgba(85,19,29,.35)}}
        @media(max-width:980px){.ulx-content{grid-template-columns:1fr}.ulx-side{border-right:0;border-bottom:1px solid rgba(95,180,217,.2);padding:17px}.ulx-side h2{font-size:29px;margin:7px 0}.ulx-summary{margin-bottom:12px}.ulx-info{display:inline-flex;margin-right:18px}.ulx-meter-label{margin-top:11px}.ulx-resources{max-width:380px;margin:13px 0}.ulx-mission-list{display:flex;justify-content:space-between;gap:4px}.ulx-mission-item{font-size:9px}.ulx-note{display:none}}
        @media(max-width:640px){.ulx-shell{max-height:calc(100dvh - 14px)}.ulx-overlay{padding:7px}.ulx-header{padding:10px}.ulx-brand em,.ulx-simulation{display:none}.ulx-content{overflow-y:auto}.ulx-side{padding:13px}.ulx-summary{font-size:11px}.ulx-mission-list{display:none}.ulx-game{padding:14px 12px;gap:10px}.ulx-stage{min-height:405px;padding:11px}.ulx-nodes{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ulx-node{padding:8px}.ulx-node span{margin-top:4px}.ulx-node .ulx-node-top{margin-bottom:6px;padding-bottom:6px}.ulx-node-top b{font-size:12px}.ulx-node-top small{font-size:7px!important}.ulx-node span strong,.ulx-node span small{font-size:9px}.ulx-rule{font-size:11px;padding:9px}.ulx-challenge-heading{margin-bottom:8px}.ulx-challenge-heading strong{font-size:12px}.ulx-cipher{gap:4px;margin:14px auto}.ulx-cipher>div{padding:11px 2px}.ulx-cipher strong{font-size:20px}.ulx-cipher span{font-size:8px;letter-spacing:0}.ulx-cipher>b{font-size:17px}.ulx-options{gap:6px}.ulx-options button{font-size:14px}.ulx-threat-clock{flex-wrap:wrap;gap:7px}.ulx-threat-clock span{width:100%}.ulx-footer span{display:none}.ulx-intro h3{font-size:30px}.ulx-game-top .ulx-hostile small{display:none}}
        @media(prefers-reduced-motion:reduce){.ulx-overlay *, .ulx-overlay *::before,.ulx-overlay *::after{animation:none!important;transition:none!important}}
      `}</style>
    </div>,
    document.body
  );
}
