"use client";

import { useMemo, type ReactNode } from "react";

type OrbState = "idle" | "loading" | "listening" | "thinking" | "speaking";

function goldenLattice() {
  // Original vector interpretation of a gold holographic AI sphere.
  // Stable coordinates: no random values, image downloads or WebGL overhead.
  const pieces: ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = (i * Math.PI) / 18;
    const distance = 36 + (i % 3) * 6;
    const x1 = 64 + Math.cos(angle) * distance;
    const y1 = 64 + Math.sin(angle) * distance;
    const x2 = 64 - Math.cos(angle) * distance;
    const y2 = 64 - Math.sin(angle) * distance;
    pieces.push(
      <line key={`radial-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#ffc15a" strokeWidth={i % 4 === 0 ? 0.9 : 0.45}
        strokeOpacity={i % 3 === 0 ? 0.65 : 0.25} />
    );
  }
  for (let i = 0; i < 13; i++) {
    const a = (i * Math.PI * 2) / 13;
    const r = 26 + (i % 4) * 7;
    pieces.push(
      <g key={`detail-${i}`} transform={`rotate(${i * 27.7} 64 64)`}>
        <path d={`M ${64 + r} ${64 - 7} h 7 v 8 h -4`} fill="none"
          stroke="#ffd875" strokeWidth="0.95" strokeOpacity="0.7" />
        <circle cx={64 + r} cy={64 - 7} r="1.35" fill="#ffdf85" />
        <circle cx={64 + Math.cos(a) * 45} cy={64 + Math.sin(a) * 45}
          r="0.7" fill="#fff0b3" />
      </g>
    );
  }
  return pieces;
}

export default function JarvisHologram({
  state,
  open,
  onClick,
}: {
  state: OrbState;
  open: boolean;
  onClick: () => void;
}) {
  const lattice = useMemo(() => goldenLattice(), []);
  const pulse = state === "speaking" || state === "listening";

  return (
    <button type="button" onClick={onClick}
      aria-label={open ? "Close JARVIS chat" : "Open JARVIS chat"}
      aria-expanded={open}
      title={open ? "Close JARVIS" : "Talk to JARVIS"}
      className={`jarvis-orb-trigger group relative flex flex-col items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200 ${pulse ? "jarvis-orb-reactive" : ""} jarvis-orb-${state}`}>
      <svg viewBox="0 0 128 128" width="112" height="112" role="img"
        aria-label="Floating golden holographic JARVIS orb" className="h-[96px] w-[96px] sm:h-[112px] sm:w-[112px]">
        <defs>
          <radialGradient id="jarvis-gold-heart">
            <stop offset="0" stopColor="#fff1b2" stopOpacity="0.97" />
            <stop offset=".13" stopColor="#ffd46c" stopOpacity="0.85" />
            <stop offset=".34" stopColor="#c66e16" stopOpacity="0.22" />
            <stop offset="1" stopColor="#c66e16" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="jarvis-orb-dark">
            <stop offset="0" stopColor="#4d2504" stopOpacity="0.22" />
            <stop offset=".75" stopColor="#070b10" stopOpacity="0.52" />
            <stop offset="1" stopColor="#05090d" stopOpacity="0" />
          </radialGradient>
          <filter id="jarvis-orb-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Dark centre makes the gold vector lines readable on any background. */}
        <circle cx="64" cy="64" r="53" fill="url(#jarvis-orb-dark)" />
        <circle cx="64" cy="64" r="34" fill="url(#jarvis-gold-heart)" className="jarvis-orb-heart" />
        <circle cx="64" cy="64" r="47" fill="none" stroke="#ffab35" strokeWidth="1"
          strokeDasharray="2 3 8 2 1 6" strokeOpacity=".72" className="jarvis-orb-spin" />
        <circle cx="64" cy="64" r="39" fill="none" stroke="#ffd268" strokeWidth=".65"
          strokeDasharray="1 5" strokeOpacity=".72" className="jarvis-orb-counter" />
        <circle cx="64" cy="64" r="30" fill="none" stroke="#ffbd52" strokeWidth="1"
          strokeDasharray="16 5 2 4 4 5" strokeOpacity=".83" />

        {/* Globe meridians and latitudes, like the golden AI sphere in the reference. */}
        <g className="jarvis-orb-spin" stroke="#ffc05e" fill="none" strokeWidth=".65" opacity=".68">
          <ellipse cx="64" cy="64" rx="47" ry="20" />
          <ellipse cx="64" cy="64" rx="21" ry="47" />
          <ellipse cx="64" cy="64" rx="42" ry="30" transform="rotate(48 64 64)" />
          <ellipse cx="64" cy="64" rx="42" ry="30" transform="rotate(-48 64 64)" />
          <ellipse cx="64" cy="64" rx="49" ry="10" transform="rotate(-28 64 64)" />
        </g>

        <g opacity=".95">{lattice}</g>

        {/* Three orbital tracks give a 3D impression without an expensive canvas. */}
        <g className="jarvis-orb-orbits" fill="none" strokeLinecap="round">
          <ellipse cx="64" cy="64" rx="60" ry="22" transform="rotate(-31 64 64)"
            stroke="#ffd36c" strokeWidth="1.2" strokeDasharray="118 20 18 100" opacity=".92" />
          <ellipse cx="64" cy="64" rx="59" ry="25" transform="rotate(51 64 64)"
            stroke="#ff981e" strokeWidth=".8" strokeDasharray="95 16 22 110" opacity=".74" />
          <ellipse cx="64" cy="64" rx="53" ry="44" transform="rotate(-20 64 64)"
            stroke="#ffc966" strokeWidth=".65" strokeDasharray="20 8 7 21 4 9" opacity=".7" />
        </g>
        <circle cx="64" cy="64" r="14" fill="#ffb62f" opacity=".55" filter="url(#jarvis-orb-glow)" />
        <circle cx="64" cy="64" r="8" fill="url(#jarvis-gold-heart)" />
        <path d="M 64 51 L 77 64 L 64 77 L 51 64 Z" fill="none"
          stroke="#ffe3a4" strokeWidth="1.1" strokeDasharray="7 3" opacity=".87" />
        <circle cx="64" cy="64" r="2" fill="#fff3cb" />
      </svg>
      <span className="absolute bottom-[4px] rounded border border-amber-300/30 bg-[#091018]/85 px-2 py-[3px] text-[9px] font-semibold tracking-[.28em] text-amber-200 shadow-[0_0_12px_rgba(255,179,48,.3)]">
        JARVIS
      </span>
      {/* Meter bars follow the real Piper playback envelope when possible.
          During listening / thinking they are activity indicators. */}
      <span className="jarvis-orb-meter" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <i key={index} className={`jarvis-orb-bar jarvis-orb-bar-${index}`} />
        ))}
      </span>
      <span className="sr-only">Status: {state}</span>
      <style>{`
        .jarvis-orb-trigger {
          width: 112px;
          height: 124px;
          border: 0;
          background: transparent;
          cursor: pointer;
          filter: drop-shadow(0 0 10px rgba(255,153,27,.30));
          animation: jarvisHover 4.3s ease-in-out infinite;
        }
        .jarvis-orb-spin, .jarvis-orb-counter, .jarvis-orb-orbits {
          transform-origin: 64px 64px;
        }
        .jarvis-orb-spin { animation: jarvisSpin 24s linear infinite; }
        .jarvis-orb-counter { animation: jarvisSpinReverse 18s linear infinite; }
        .jarvis-orb-orbits { animation: jarvisSpinReverse 34s linear infinite; }
        .jarvis-orb-heart { transform-origin: 64px 64px; animation: jarvisHeartbeat 2.8s ease-in-out infinite; }
        .jarvis-orb-reactive { filter: drop-shadow(0 0 18px rgba(255,202,93,.8)); }
        .jarvis-orb-reactive .jarvis-orb-heart { animation-duration: .48s; }
        .jarvis-orb-speaking .jarvis-orb-heart {
          animation: none;
          transform: scale(var(--jarvis-audio-scale, 1.12));
          transition: transform 75ms linear;
        }
        .jarvis-orb-meter {
          position: absolute;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 3px;
          width: 62px;
          height: 20px;
          top: 81px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .jarvis-orb-bar {
          width: 3px;
          height: 16px;
          border-radius: 3px;
          transform-origin: center;
          background: #ffca64;
          box-shadow: 0 0 7px rgba(255,195,76,.55);
          transform: scaleY(.15);
          opacity: .24;
          transition: transform 75ms linear, opacity 150ms ease;
        }
        .jarvis-orb-speaking .jarvis-orb-bar { opacity: 1; transform: scaleY(var(--jarvis-meter-0,.25)); }
        .jarvis-orb-speaking .jarvis-orb-bar-1 { transform: scaleY(var(--jarvis-meter-1,.35)); }
        .jarvis-orb-speaking .jarvis-orb-bar-2 { transform: scaleY(var(--jarvis-meter-2,.55)); }
        .jarvis-orb-speaking .jarvis-orb-bar-3 { transform: scaleY(var(--jarvis-meter-3,.75)); }
        .jarvis-orb-speaking .jarvis-orb-bar-4 { transform: scaleY(var(--jarvis-meter-4,.75)); }
        .jarvis-orb-speaking .jarvis-orb-bar-5 { transform: scaleY(var(--jarvis-meter-5,.55)); }
        .jarvis-orb-speaking .jarvis-orb-bar-6 { transform: scaleY(var(--jarvis-meter-6,.35)); }
        .jarvis-orb-speaking .jarvis-orb-bar-7 { transform: scaleY(var(--jarvis-meter-7,.25)); }
        .jarvis-orb-listening .jarvis-orb-bar,
        .jarvis-orb-thinking .jarvis-orb-bar,
        .jarvis-orb-loading .jarvis-orb-bar {
          opacity: .75;
          animation: jarvisOrbBar 900ms ease-in-out infinite alternate;
        }
        .jarvis-orb-listening .jarvis-orb-bar { animation-duration: 510ms; }
        .jarvis-orb-bar-1 { animation-delay: -160ms !important; }
        .jarvis-orb-bar-2 { animation-delay: -300ms !important; }
        .jarvis-orb-bar-3 { animation-delay: -440ms !important; }
        .jarvis-orb-bar-4 { animation-delay: -280ms !important; }
        .jarvis-orb-bar-5 { animation-delay: -520ms !important; }
        .jarvis-orb-bar-6 { animation-delay: -340ms !important; }
        .jarvis-orb-bar-7 { animation-delay: -200ms !important; }
        @keyframes jarvisOrbBar { from { transform: scaleY(.18); } to { transform: scaleY(.95); } }
        .jarvis-orb-trigger:hover { filter: drop-shadow(0 0 21px rgba(255,193,65,.8)); }
        @keyframes jarvisSpin { to { transform: rotate(360deg); } }
        @keyframes jarvisSpinReverse { to { transform: rotate(-360deg); } }
        @keyframes jarvisHeartbeat { 50% { opacity: .58; transform: scale(1.24); } }
        @keyframes jarvisHover { 50% { transform: translateY(-8px); } }
        @media (prefers-reduced-motion: reduce) {
          .jarvis-orb-trigger, .jarvis-orb-spin, .jarvis-orb-counter,
          .jarvis-orb-orbits, .jarvis-orb-heart, .jarvis-orb-bar { animation: none !important; }
          .jarvis-orb-speaking .jarvis-orb-heart { transform: none !important; }
          .jarvis-orb-speaking .jarvis-orb-bar { transform: scaleY(.45) !important; }
        }
      `}</style>
    </button>
  );
}
