/**
 * Original synthetic reactor / HUD sounds for PROJECT ULTRON.
 * Sound starts in response to a user click. No downloads or paid services.
 */
export type MissionSound =
  | "portal" | "activate" | "correct" | "wrong" | "breach"
  | "lock" | "attack" | "shield" | "scan" | "repair" | "victory";

let sharedContext: AudioContext | null = null;

function usableContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  try {
    if (!sharedContext || sharedContext.state === "closed") {
      sharedContext = new window.AudioContext();
    }
    if (sharedContext.state === "suspended") void sharedContext.resume().catch(() => {});
    return sharedContext;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  output: AudioNode,
  at: number,
  hz: number,
  duration: number,
  level: number,
  kind: OscillatorType,
  endHz: number = hz
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = kind;
  osc.frequency.setValueAtTime(Math.max(10, hz), at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(10, endHz), at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + Math.min(0.04, duration / 4));
  gain.gain.setValueAtTime(level, at + duration * 0.52);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(output);
  osc.start(at);
  osc.stop(at + duration + 0.005);
}

function whoosh(ctx: AudioContext, output: AudioNode, at: number, duration: number, strength: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.5;
  filter.frequency.setValueAtTime(190, at);
  filter.frequency.exponentialRampToValueAtTime(2550, at + duration * 0.62);
  filter.frequency.exponentialRampToValueAtTime(360, at + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(strength, at + duration * 0.58);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  noise.connect(filter).connect(gain).connect(output);
  noise.start(at);
  noise.stop(at + duration);
}

export function playMissionSound(type: MissionSound): void {
  const ctx = usableContext();
  if (!ctx) return;
  try {
    // Master cap: SFX should remain below narration volume.
    const master = ctx.createGain();
    master.gain.value = 0.12;
    master.connect(ctx.destination);
    const at = ctx.currentTime + 0.012;

    switch (type) {
      case "portal":
        // Portal opens: deep reactor spool-up, scanning beeps, then an energy whoosh.
        tone(ctx, master, at, 42, 1.65, 0.37, "sawtooth", 112);
        tone(ctx, master, at + 0.16, 130, 1.42, 0.25, "sine", 740);
        whoosh(ctx, master, at + 0.18, 1.46, 0.46);
        [0.13, 0.38, 0.71].forEach((t, i) => tone(ctx, master, at + t, 560 + i * 170, 0.12, 0.13, "sine"));
        break;
      case "activate":
        tone(ctx, master, at, 58, 0.9, 0.4, "sawtooth", 148);
        tone(ctx, master, at + 0.21, 310, 0.56, 0.25, "sine", 950);
        whoosh(ctx, master, at + 0.22, 0.68, 0.19);
        break;
      case "correct":
        tone(ctx, master, at, 470, 0.15, 0.28, "sine", 660);
        tone(ctx, master, at + 0.12, 780, 0.22, 0.22, "sine", 920);
        break;
      case "wrong":
        tone(ctx, master, at, 185, 0.36, 0.34, "triangle", 80);
        break;
      case "breach":
        tone(ctx, master, at, 74, 0.84, 0.4, "sawtooth", 280);
        tone(ctx, master, at + 0.13, 520, 0.6, 0.27, "sine", 1040);
        whoosh(ctx, master, at + 0.14, 0.76, 0.26);
        break;
      case "lock":
        tone(ctx, master, at, 320, 0.24, 0.21, "sine", 480);
        tone(ctx, master, at + 0.11, 700, 0.22, 0.18, "sine", 780);
        break;
      case "attack":
        tone(ctx, master, at, 115, 0.54, 0.32, "sawtooth", 66);
        whoosh(ctx, master, at, 0.5, 0.14);
        break;
      case "shield":
        tone(ctx, master, at, 200, 0.42, 0.26, "sine", 540);
        tone(ctx, master, at + 0.14, 680, 0.25, 0.23, "sine", 580);
        break;
      case "scan":
        [390, 620, 930].forEach((hz, i) => tone(ctx, master, at + 0.1 * i, hz, 0.19, 0.2, "sine"));
        break;
      case "repair":
        [290, 360, 500, 740].forEach((hz, i) => tone(ctx, master, at + 0.095 * i, hz, 0.22, 0.19, "sine"));
        break;
      case "victory":
        [240, 360, 480, 720, 960].forEach((hz, i) => tone(ctx, master, at + 0.14 * i, hz, 0.42, 0.26, "sine"));
        break;
    }
  } catch (error) {
    console.info("Mission sound not available:", error);
  }
}
