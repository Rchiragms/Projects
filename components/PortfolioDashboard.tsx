"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import NemesisEncounter from "@/components/mission/NemesisEncounter";
import { playMissionSound } from "@/lib/audio/missionSound";

type Section =
  | "overview"
  | "about"
  | "skills"
  | "projects"
  | "mission"
  | "research"
  | "contact";

type CoreMode = "CORE" | "NETWORK" | "SIGNAL";
type AssistantState = "idle" | "loading" | "listening" | "thinking" | "speaking";


const sections: {
  id: Section;
  number: string;
  label: string;
}[] = [
  {
    id: "overview",
    number: "00",
    label: "COMMAND",
  },
  {
    id: "about",
    number: "01",
    label: "IDENTITY",
  },
  {
    id: "skills",
    number: "02",
    label: "ABILITIES",
  },
  {
    id: "projects",
    number: "03",
    label: "PROJECTS",
  },
  {
    id: "mission",
    number: "04",
    label: "MISSION",
  },
  {
    id: "research",
    number: "05",
    label: "RESEARCH",
  },
  {
    id: "contact",
    number: "06",
    label: "CONTACT",
  },
];

const skills: Record<string, string[]> = {
  PROGRAMMING: [
    "Python",
    "SQL",
    "JavaScript",
    "React",
    "HTML / CSS",
  ],

  INTELLIGENCE: [
    "Machine Learning",
    "Data Science",
    "Statistical Analysis",
    "Data Visualisation",
    "Predictive Modelling",
  ],

  ENGINEERING: [
    "Digital Twins",
    "IoT & Sensors",
    "System Health Management",
    "Simulation",
    "Anomaly Detection",
  ],

  INTERFACES: [
    "Three.js",
    "Interactive Web",
    "Dashboard Design",
    "Git",
    "Technical Documentation",
  ],
};

const research = [
  {
    code: "R.01",
    name: "DIGITAL TWINS",
    description:
      "Connecting virtual models to real-world data, simulation, and intelligent system monitoring.",
    tags: "SIMULATION / LIVE DATA / MODELLING",
  },
  {
    code: "R.02",
    name: "SYSTEM HEALTH MANAGEMENT",
    description:
      "Exploring anomaly detection, predictive maintenance, and explainable condition monitoring.",
    tags: "SHM / DIAGNOSTICS / PREDICTION",
  },
  {
    code: "R.03",
    name: "NEUROSCIENCE × AI",
    description:
      "Investigating neuroplasticity and ways to make complex science understandable through interactive data experiences.",
    tags: "NEUROSCIENCE / DATA / INTERACTION",
  },
];

const modeCopy: Record<
  CoreMode,
  {
    title: string;
    sub: string;
    output: string;
  }
> = {
  CORE: {
    title: "NEURAL CORE",
    sub: "HOLOGRAPHIC PROCESSOR",
    output: "CORE STABLE / INTERFACE READY",
  },

  NETWORK: {
    title: "SYSTEM MAP",
    sub: "CONNECTED KNOWLEDGE",
    output: "6 PORTFOLIO MODULES LINKED",
  },

  SIGNAL: {
    title: "SIGNAL ENGINE",
    sub: "SYNTHETIC VISUALISATION",
    output: "GENERATED SIGNAL / DEMO MODE",
  },
};

/* ==========================================
   FREE BROWSER JARVIS VOICE EVENTS
   The persistent JarvisVoiceDock in app/page.tsx
   listens for these events. No paid API calls.
   ========================================== */

function announceJarvisCue(cue: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("jarvis:speak", { detail: { cue } })
  );
}

function announceJarvisText(text: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("jarvis:say", { detail: { text } })
  );
}

/* ==========================================
   REUSABLE INTERFACE ELEMENTS
   ========================================== */

function Label({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="j-label">
      {children}
    </span>
  );
}

function Heading({
  number,
  kicker,
  children,
}: {
  number: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <div className="j-reveal">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-cyan-300">
          {number}
        </span>

        <span className="h-px w-9 bg-cyan-300/40" />

        <Label>{kicker}</Label>
      </div>

      <h2 className="mt-5 text-3xl font-medium leading-[1.12] tracking-tight sm:text-5xl">
        {children}
      </h2>
    </div>
  );
}

/* ==========================================
   INTERACTIVE HOLOGRAPHIC OPERATIONS CORE
   ========================================== */

function HoloCore({
  mode,
  scanning,
  assistantState,
  onScan,
  onNavigate,
  onOpenAssistant,
}: {
  mode: CoreMode;
  scanning: boolean;
  assistantState: AssistantState;
  onScan: () => void;
  onNavigate: (id: Section) => void;
  onOpenAssistant: () => void;
}) {
  return (
    <div
      className={`
        j-core
        j-mode-${mode.toLowerCase()}
        ${scanning ? "j-scanning" : ""}
        ${assistantState === "speaking" || assistantState === "listening" ? "j-jarvis-reacting" : ""}
        j-assistant-${assistantState}
      `}
    >
      <div className="j-core-haze" />

      {/* OUTER MECHANICAL STRUCTURE */}

      <div className="j-core-ring j-ring-outer" />

      <div className="j-core-ring j-ring-ticks" />

      <div className="j-core-ring j-ring-orbit" />

      <div className="j-core-ring j-ring-mid" />

      <div className="j-core-ring j-ring-inner" />

      {/* CENTRAL HOLOGRAPHIC SPHERE */}

      <button type="button" className="j-core-sphere" onClick={onOpenAssistant}
        title="Open JARVIS AI chat" aria-label="Open JARVIS AI chat">
        <div className="j-core-sphere-grid" />
        <div className="j-core-energy" />
        <div className="j-core-reticle" />
      </button>

      {/* ROTATING SCANNER */}

      <div className="j-core-scan" />

      {/* LIVE INTERFACE LABEL */}

      <div
        className="j-core-readout"
        aria-live="polite"
      >
        <span>CNMS // {mode}</span>

        <strong>
          {modeCopy[mode].title}
        </strong>

        <small>
          {scanning
            ? "SCANNING MODULES..."
            : modeCopy[mode].sub}
        </small>
        <small className="j-jarvis-readout">
          JARVIS / {assistantState.toUpperCase()}
        </small>
        <div className="j-core-voice-monitor" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} className={`j-core-meter-bar j-core-meter-${index}`} />
          ))}
        </div>
        <small className="j-core-activity-label">
          {assistantState === "speaking"
            ? "VOICE OUTPUT // LIVE"
            : assistantState === "listening"
              ? "MICROPHONE // LISTENING"
              : assistantState === "thinking"
                ? "GENERATING RESPONSE"
                : assistantState === "loading"
                  ? "NEURAL ENGINE // LOADING"
                  : "ASSISTANT // STANDBY"}
        </small>
      </div>

      {/* INTERACTIVE HOLOGRAPHIC NODES */}

      <button
        className="j-node j-node-one"
        onClick={() => onNavigate("skills")}
        type="button"
      >
        <span>01</span> AI SYSTEMS
      </button>

      <button
        className="j-node j-node-two"
        onClick={() => onNavigate("projects")}
        type="button"
      >
        <span>02</span> PROJECTS
      </button>

      <button
        className="j-node j-node-three"
        onClick={() => onNavigate("research")}
        type="button"
      >
        <span>03</span> RESEARCH
      </button>

      <button
        className="j-node j-node-four"
        onClick={() => onNavigate("contact")}
        type="button"
      >
        <span>04</span> CONNECT
      </button>

      {/* DIAGNOSTIC CONTROL */}

      <button
        className="j-core-trigger"
        type="button"
        onClick={onScan}
        disabled={scanning}
      >
        {scanning
          ? "SCANNING"
          : "RUN DIAGNOSTIC"}

        <span aria-hidden="true"> ↗</span>
      </button>
    </div>
  );
}

/* ==========================================
   ANIMATED SIGNAL VISUALISATION
   ========================================== */

function SignalPanel({
  mode,
}: {
  mode: CoreMode;
}) {
  const corePath =
    "M0 67 L80 67 L95 57 L115 75 " +
    "L145 67 L213 67 L226 34 L244 106 " +
    "L263 48 L281 67 L365 67 L380 54 " +
    "L402 80 L430 67 L495 67 L513 22 " +
    "L533 115 L553 44 L574 67 L700 67";

  const networkPath =
    "M0 85 L40 50 L75 80 L110 28 " +
    "L158 99 L210 63 L265 84 L320 25 " +
    "L365 63 L427 39 L480 80 L529 26 " +
    "L600 90 L650 46 L700 68";

  const signalPath =
    "M0 65 Q20 2 42 65 " +
    "T84 65 T126 65 T168 65 " +
    "T210 65 T252 65 T294 65 " +
    "T336 65 T378 65 T420 65 " +
    "T462 65 T504 65 T546 65 " +
    "T588 65 T630 65 T672 65 T714 65";

  const activePath =
    mode === "NETWORK"
      ? networkPath
      : mode === "SIGNAL"
        ? signalPath
        : corePath;

  return (
    <div
      className="j-signal"
      aria-label="Animated decorative data visualisation"
    >
      <div className="j-signal-grid" />

      <svg
        viewBox="0 0 700 130"
        preserveAspectRatio="none"
        role="img"
        aria-label="Synthetic signal pattern"
      >
        <defs>
          <linearGradient
            id="jSignalGradient"
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="#008ddf"
              stopOpacity="0"
            />

            <stop
              offset="35%"
              stopColor="#19c7ff"
            />

            <stop
              offset="65%"
              stopColor="#adf9ff"
            />

            <stop
              offset="100%"
              stopColor="#008ddf"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        <path
          className="j-signal-dim"
          d={corePath}
        />

        <path
          key={mode}
          className="j-signal-main"
          d={activePath}
        />
      </svg>

      <span className="j-signal-scanner" />
    </div>
  );
}

/* ==========================================
   MAIN JARVIS DASHBOARD
   ========================================== */

export default function PortfolioDashboard({
  onExit,
}: {
  onExit: () => void;
}) {
  const [active, setActive] =
    useState<Section>("overview");

  const [mode, setMode] =
    useState<CoreMode>("CORE");

  const [assistantState, setAssistantState] = useState<AssistantState>("idle");

  // Unlocks are stored in the visitor's browser only. No account or backend.
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionCleared, setMissionCleared] = useState(false);
  const [evolved, setEvolved] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    try {
      setMissionCleared(localStorage.getItem("cnms:nemesis-cleared:v1") === "true");
      const unlocked = localStorage.getItem("cnms:aegis-unlocked:v1") === "true";
      setEvolved(unlocked);
      setBestScore(Number(localStorage.getItem("cnms:nemesis-best:v1")) || 0);
    } catch {
      // Private browsing may prevent localStorage access. The game still works.
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("jarvis-aegis-mode", evolved);
    return () => document.documentElement.classList.remove("jarvis-aegis-mode");
  }, [evolved]);

  const completeMission = useCallback((score: number) => {
    setMissionCleared(true);
    setBestScore((previous) => {
      const next = Math.max(previous, score);
      try { localStorage.setItem("cnms:nemesis-best:v1", String(next)); } catch {}
      return next;
    });
    try { localStorage.setItem("cnms:nemesis-cleared:v1", "true"); } catch {}
    announceJarvisCue("victory");
  }, []);

  const activateEvolution = useCallback(() => {
    setEvolved(true);
    setMissionOpen(false);
    try { localStorage.setItem("cnms:aegis-unlocked:v1", "true"); } catch {}
    announceJarvisCue("evolutionComplete");
  }, []);

  useEffect(() => {
    const update = (event: Event) => {
      const next = (event as CustomEvent<{ state?: AssistantState }>).detail?.state;
      if (next) setAssistantState(next);
    };
    window.addEventListener("jarvis:assistant-state", update);
    return () => window.removeEventListener("jarvis:assistant-state", update);
  }, []);

  const [category, setCategory] =
    useState("PROGRAMMING");

  const [scanning, setScanning] =
    useState(false);

  const [scanMessage, setScanMessage] =
    useState("INTERFACE READY");

  const [progress, setProgress] =
    useState(0);

  const [paletteOpen, setPaletteOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const paletteInput =
    useRef<HTMLInputElement>(null);

  const scanTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* ========================================
     SECTION NAVIGATION
  ======================================== */

  const navigate = useCallback(
    (id: Section, announce = true) => {
      setPaletteOpen(false);
      setActive(id);

      // Only announce intentional navigation, never scroll detection.
      // Hologram mode commands can navigate without talking twice.
      if (announce && id !== "mission") announceJarvisCue(id);

      document.getElementById(id)?.scrollIntoView({
        behavior: window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    },
    []
  );

  // All holographic mode changes use a single handler.
  const changeCoreMode = useCallback((nextMode: CoreMode) => {
    setMode(nextMode);
    announceJarvisCue(nextMode.toLowerCase());
  }, []);

  const changeSkillCategory = useCallback((name: string) => {
    setCategory(name);
    announceJarvisText(
      `Opening the ${name.toLowerCase()} capability database.`
    );
  }, []);

  const openCommandPalette = useCallback(() => {
    setQuery("");
    setPaletteOpen(true);
    announceJarvisText(
      "Command interface ready. Select a module or enter a command."
    );
  }, []);

  /* ========================================
     DIAGNOSTIC SCAN
  ======================================== */

  const runScan = useCallback(() => {
    if (scanning) return;

    announceJarvisCue("diagnostic");
    setScanning(true);

    setScanMessage(
      "SCANNING INTERFACE MODULES"
    );

    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
    }

    scanTimer.current = setTimeout(() => {
      setScanning(false);

      setScanMessage(
        "6 INTERFACE MODULES READY"
      );

      announceJarvisCue("diagnosticComplete");
    }, 1700);
  }, [scanning]);

  /* ========================================
     COMMAND PALETTE FOCUS
  ======================================== */

  useEffect(() => {
    if (paletteOpen) {
      requestAnimationFrame(() => {
        paletteInput.current?.focus();
      });
    }
  }, [paletteOpen]);

  /* ========================================
     KEYBOARD SHORTCUTS
  ======================================== */

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        setPaletteOpen(
          (value) => !value
        );
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      key
    );

    return () => {
      window.removeEventListener(
        "keydown",
        key
      );
    };
  }, []);

  /* ========================================
     DOCUMENT SCROLL PROGRESS
  ======================================== */

  useEffect(() => {
    const update = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight -
          window.innerHeight
      );

      setProgress(
        Math.min(
          100,
          Math.max(
            0,
            (window.scrollY / max) * 100
          )
        )
      );
    };

    window.addEventListener(
      "scroll",
      update,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      update
    );

    update();

    return () => {
      window.removeEventListener(
        "scroll",
        update
      );

      window.removeEventListener(
        "resize",
        update
      );
    };
  }, []);

  /* ========================================
     ACTIVE SECTION DETECTION
  ======================================== */

  useEffect(() => {
    const observer =
      new IntersectionObserver(
        (entries) => {
          const candidates = entries
            .filter(
              (entry) =>
                entry.isIntersecting
            )
            .sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio
            );

          if (candidates[0]) {
            setActive(
              candidates[0].target
                .id as Section
            );
          }
        },
        {
          rootMargin:
            "-20% 0px -52% 0px",

          threshold: [
            0,
            0.1,
            0.3,
            0.5,
          ],
        }
      );

    sections.forEach(({ id }) => {
      const element =
        document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  /* ========================================
     SCROLL REVEAL OBSERVER
  ======================================== */

  useEffect(() => {
    const elements =
      document.querySelectorAll(
        ".j-reveal"
      );

    if (
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
    ) {
      elements.forEach((el) => {
        el.classList.add("j-visible");
      });

      return;
    }

    const observer =
      new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting
            ) {
              entry.target.classList.add(
                "j-visible"
              );

              obs.unobserve(
                entry.target
              );
            }
          });
        },
        {
          threshold: 0.07,
        }
      );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  /* ========================================
     TIMER CLEANUP
  ======================================== */

  useEffect(() => {
    return () => {
      if (scanTimer.current) {
        clearTimeout(
          scanTimer.current
        );
      }
    };
  }, []);

  const paletteResults =
    sections.filter((item) =>
      `${item.label} ${item.id}`
        .toLowerCase()
        .includes(
          query.toLowerCase()
        )
    );

  return (
    <div className={`j-dashboard min-h-screen text-[#e8faff] ${evolved ? "j-evolved" : ""}`}>

      {/* BACKGROUND */}

      <div
        className="j-global-grid pointer-events-none fixed inset-0"
        aria-hidden="true"
      />

      {/* SCROLL PROGRESS */}

      <div className="fixed left-0 right-0 top-0 z-[90] h-[2px]">
        <div
          style={{
            width: `${progress}%`,
          }}
          className="h-full bg-cyan-300 shadow-[0_0_16px_#4ddcff]"
        />
      </div>

      {/* ====================================
          TOP OPERATING SYSTEM BAR
      ==================================== */}

      <header className="j-topbar sticky top-0 z-50 flex h-[76px] items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">

        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={onExit}
          aria-label="Return to holographic introduction"
        >
          <span className="j-logo">
            C
          </span>

          <span>
            <strong className="block text-sm tracking-[.23em]">
              CNMS
              <span className="text-cyan-300">
                .
              </span>
            </strong>

            <small className="mt-1 block text-[9px] tracking-[.2em] text-cyan-200/45">
              J.A.R.V.I.S. / PERSONAL OS
            </small>
          </span>
        </button>

        <span className="j-label hidden items-center gap-3 md:flex">
          <span className="j-led" />

          {evolved ? "AEGIS / EVOLVED SYSTEM" : "ALL SYSTEMS NOMINAL"}

          <span className="text-white/20">
            //
          </span>

          UI DEMO
        </span>

        <button
          type="button"
          onClick={openCommandPalette}
          className="j-command-shortcut"
        >
          <span>⌕</span>

          COMMAND CENTRE

          <kbd>CTRL K</kbd>
        </button>
      </header>

      {/* ====================================
          SIDEBAR + MAIN CONTENT
      ==================================== */}

      <div className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[210px_minmax(0,1fr)]">

        {/* NAVIGATION SIDEBAR */}

        <aside className="j-sidebar border-r border-cyan-200/10 px-4 sm:px-8 lg:sticky lg:top-[76px] lg:h-[calc(100vh-76px)] lg:self-start lg:px-5 lg:py-9">

          <div className="mb-8 hidden lg:block">
            <Label>
              ACCESS LEVEL 01
            </Label>

            <p className="mt-2 text-sm text-white/75">
              PRIMARY INTERFACE
            </p>
          </div>

          <nav
            aria-label="JARVIS modules"
            className="j-horizontal-scroll flex gap-1 overflow-x-auto py-3 lg:flex-col lg:py-0"
          >
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={
                  active === item.id
                    ? "location"
                    : undefined
                }
                onClick={() =>
                  navigate(item.id)
                }
                className={`
                  j-nav-item
                  ${
                    active === item.id
                      ? "j-nav-active"
                      : ""
                  }
                `}
              >
                <span className="mr-3 text-[10px] text-cyan-300/55">
                  {item.number}
                </span>

                {item.label}

                <span className="j-nav-arrow">
                  ↗
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-12 hidden border-t border-cyan-200/10 pt-6 lg:block">

            <Label>
              INTERFACE STATUS
            </Label>

            <div
              className="j-sidebar-bars mt-5"
              aria-hidden="true"
            >
              {Array.from(
                { length: 28 },
                (_, i) => (
                  <i
                    key={i}
                    style={{
                      animationDelay: `${
                        i * 47
                      }ms`,

                      height: `${
                        12 +
                        (Math.sin(i * 1.9) +
                          1) *
                          12
                      }px`,
                    }}
                  />
                )
              )}
            </div>

            <p className="mt-5 font-mono text-[10px] leading-6 text-cyan-100/40">
              SYNTHETIC SIGNAL
              <br />
              VISUAL DEMONSTRATION
            </p>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="j-return mt-12 hidden text-[10px] tracking-[.2em] text-cyan-200/60 hover:text-cyan-100 lg:flex"
          >
            ← RETURN TO INTRO
          </button>
        </aside>

        {/* MAIN CONTENT */}

        <div className="min-w-0 px-5 pb-24 sm:px-9 lg:px-12">

          {/* ====================================
              00 / COMMAND OVERVIEW
          ==================================== */}

          <section
            id="overview"
            className="j-section pt-14 sm:pt-20"
          >
            <div className="flex items-center gap-3">
              <span className="j-led" />

              <Label>
                AUTHENTICATION COMPLETE /
                WELCOME BACK
              </Label>
            </div>

            <div className="mt-10 grid items-center gap-9 xl:grid-cols-[.77fr_1.23fr] xl:gap-12">

              {/* INTRODUCTION */}

              <div className="j-reveal">
                <p className="mb-5 text-[11px] tracking-[.34em] text-cyan-300">
                  COMMAND INTERFACE // 001
                </p>

                <h1 className="text-[clamp(3.3rem,5.7vw,6.4rem)] font-medium leading-[1.02] tracking-[-.055em]">
                  Hello,
                  <br />

                  <span className="j-gradient">
                    I&apos;m Chirag.
                  </span>
                </h1>

                <p className="mt-7 max-w-lg text-base leading-8 text-slate-400">
                  Welcome to my digital command
                  centre. Explore intelligent
                  engineering, data science,
                  digital twins, and the systems
                  I&apos;m building.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">

                  <button
                    className="j-primary"
                    type="button"
                    onClick={() =>
                      navigate("projects")
                    }
                  >
                    ACCESS PROJECTS

                    <span>↗</span>
                  </button>

                  <button
                    className="j-outline"
                    type="button"
                    onClick={() => navigate("mission")}
                  >
                    ULTRON MISSION
                    <span>⚡</span>
                  </button>

                  <button
                    className="j-outline"
                    type="button"
                    onClick={openCommandPalette}
                  >
                    ISSUE A COMMAND

                    <span>⌘</span>
                  </button>
                </div>

                <p className="mt-8 font-mono text-[10px] tracking-[.13em] text-white/35">
                  TIP: PRESS{" "}
                  <kbd className="text-cyan-300">
                    CTRL + K
                  </kbd>{" "}
                  OR TALK TO JARVIS BELOW ↓
                </p>
              </div>

              {/* INTERACTIVE OPERATIONS CORE */}

              <div className="j-panel j-holo-panel j-reveal">

                <div className="j-panel-top flex items-center justify-between gap-3">

                  <Label>
                    HOLOGRAPHIC OPERATIONS CORE
                  </Label>

                  <span className="font-mono text-[10px] tracking-[.15em] text-cyan-300/70">
                    ONLINE

                    <span className="j-led ml-1" />
                  </span>
                </div>

                {/* DISPLAY MODES */}

                <div
                  className="j-mode-switch flex flex-wrap gap-2 px-5 pt-4"
                  role="group"
                  aria-label="Hologram display mode"
                >
                  {(
                    [
                      "CORE",
                      "NETWORK",
                      "SIGNAL",
                    ] as CoreMode[]
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        changeCoreMode(item)
                      }
                      aria-pressed={
                        mode === item
                      }
                      className={
                        mode === item
                          ? "is-selected"
                          : ""
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <HoloCore
                  mode={mode}
                  scanning={scanning}
                  assistantState={assistantState}
                  onScan={runScan}
                  onNavigate={navigate}
                  onOpenAssistant={() => window.dispatchEvent(new Event("jarvis:open-chat"))}
                />

                <div className="j-core-footer flex flex-wrap items-center justify-between gap-3 px-5 pb-5">

                  <span className="font-mono text-[9px] tracking-[.14em] text-cyan-200/45">
                    {scanMessage}
                  </span>

                  <span className="font-mono text-[9px] text-cyan-200/45">
                    {modeCopy[mode].output}
                  </span>
                </div>
              </div>
            </div>

            {/* AI CHAT AND SIGNAL DISPLAY */}

            <div className="j-reveal mt-9 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">

              {/*
                JARVIS AI CHAT replaces the old command terminal.
                The already-mounted JarvisChat (in app/page.tsx)
                portals its interactive chat into this slot.
                This avoids loading a second AI model and keeps
                the conversation intact while navigating sections.
              */}

              <div
                id="jarvis-chat-slot"
                className="j-panel min-w-0 min-h-[390px] overflow-hidden"
                aria-label="JARVIS AI conversation"
              />

              {/* ANIMATED SIGNAL */}

              <div className="j-panel p-5 sm:p-6">

                <div className="flex justify-between">
                  <Label>
                    REAL-TIME GRAPHIC / DEMO
                  </Label>

                  <span className="j-led" />
                </div>

                <SignalPanel mode={mode} />

                <div className="flex justify-between font-mono text-[9px] tracking-[.15em] text-cyan-100/40">

                  <span>
                    STREAM: {mode}
                  </span>

                  <span>
                    VISUAL DATA ONLY
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() =>
                  navigate("about")
                }
                className="text-[10px] tracking-[.28em] text-cyan-200/55 hover:text-cyan-200"
              >
                SCROLL TO EXPLORE{" "}

                <span className="j-down-arrow inline-block">
                  ↓
                </span>
              </button>
            </div>
          </section>

          {/* ====================================
              01 / ABOUT
          ==================================== */}

          <section
            id="about"
            className="j-section"
          >
            <Heading
              number="01"
              kicker="IDENTITY / HUMAN PROFILE"
            >
              The mind behind{" "}

              <span className="j-gradient">
                the machine.
              </span>
            </Heading>

            <div className="mt-9 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">

              <div className="j-panel j-reveal p-7 sm:p-10">

                <Label>
                  PROFILE // VERIFIED
                </Label>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  I&apos;m pursuing an MSc in
                  Applied Data Science in
                  Engineering at Glasgow
                  Caledonian University.
                  I enjoy connecting real-world
                  problems with intelligent
                  software, machine learning,
                  simulations and interactive
                  technology.
                </p>

                <p className="mt-5 leading-8 text-slate-400">
                  My aim is to build systems
                  that do more than display
                  information: systems that
                  detect patterns, explain
                  change, and help people
                  make better decisions.
                </p>
              </div>

              <div className="j-reveal grid gap-5">

                <div className="j-panel p-6">
                  <Label>
                    2026 / CURRENT
                  </Label>

                  <h3 className="mt-4 text-lg">
                    MSc Applied Data Science
                    in Engineering
                  </h3>

                  <p className="mt-2 text-sm text-cyan-200/55">
                    Glasgow Caledonian
                    University
                  </p>
                </div>

                <div className="j-panel p-6">
                  <Label>
                    2025 / FOUNDATION
                  </Label>

                  <h3 className="mt-4 text-lg">
                    BE Computer Science
                    &amp; Engineering
                  </h3>

                  <p className="mt-2 text-sm text-cyan-200/55">
                    Undergraduate degree
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ====================================
              02 / SKILLS
          ==================================== */}

          <section
            id="skills"
            className="j-section"
          >
            <Heading
              number="02"
              kicker="CAPABILITY DATABASE / FILTERABLE"
            >
              Tools for{" "}

              <span className="j-gradient">
                intelligent systems.
              </span>
            </Heading>

            <div className="j-panel j-reveal mt-9 p-5 sm:p-8">

              <div
                className="flex flex-wrap gap-2 border-b border-cyan-200/10 pb-6"
                role="group"
                aria-label="Skill category"
              >
                {Object.keys(skills).map(
                  (name) => (
                    <button
                      type="button"
                      key={name}
                      aria-pressed={
                        name === category
                      }
                      onClick={() =>
                        changeSkillCategory(name)
                      }
                      className={`
                        j-tab
                        ${
                          name === category
                            ? "j-tab-active"
                            : ""
                        }
                      `}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>

              <div
                key={category}
                className="j-skill-list mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {skills[category].map(
                  (item, index) => (
                    <div
                      className="j-skill"
                      key={item}
                      style={{
                        animationDelay: `${
                          index * 65
                        }ms`,
                      }}
                    >
                      <span>
                        {String(
                          index + 1
                        ).padStart(2, "0")}
                      </span>

                      {item}

                      <span className="ml-auto">
                        ↗
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-7 flex items-center justify-between">

                <Label>
                  {category} /{" "}
                  {
                    skills[category]
                      .length
                  }{" "}
                  ENTRIES
                </Label>

                <span className="j-led" />
              </div>
            </div>
          </section>

          {/* ====================================
              03 / PROJECTS
          ==================================== */}

          <section
            id="projects"
            className="j-section"
          >
            <Heading
              number="03"
              kicker="PROJECT ARCHIVE / RESERVED"
            >
              Select a{" "}

              <span className="j-gradient">
                mission.
              </span>
            </Heading>

            <div className="j-panel j-project-empty j-reveal mt-9 p-10 text-center">

              <div
                className="j-project-glyph"
                aria-hidden="true"
              >
                +
              </div>

              <Label>
                PROJECT DATABASE // READY
              </Label>

              <h3 className="mt-5 text-2xl font-medium sm:text-3xl">
                Your work belongs here.
              </h3>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-400">
                The archive is prepared for your
                selected projects. Each can
                later open an interactive
                case study with architecture,
                code, results and a live
                demonstration.
              </p>

              <button
                type="button"
                className="j-outline mt-8"
                onClick={() =>
                  navigate("contact")
                }
              >
                CONTACT THE DEVELOPER ↗
              </button>
            </div>
          </section>

          {/* ====================================
              04 / ULTRON MISSION
          ==================================== */}

          <section id="mission" className="j-section">
            <Heading number="04" kicker="INTERACTIVE EXPERIENCE / ORIGINAL SCI-FI GAME">
              Contain the <span className="j-gradient">rogue intelligence.</span>
            </Heading>

            <div className="j-mission-card j-reveal mt-9">
              <div className="j-mission-info">
                <p className="j-mission-kicker">
                  <span className="j-mission-blink" />
                  {evolved ? "AEGIS SYSTEM // ONLINE" : missionCleared ? "THREAT NEUTRALISED // EVOLUTION AVAILABLE" : "ALERT 001 // HOSTILE SIGNAL"}
                </p>
                <h3>PROJECT <span>ULTRON</span></h3>
                <p className="j-mission-description">
                  A rogue intelligence has seized the reactor network. Route secure signals, break encrypted codes and synchronise the containment core before the counterattacks overwhelm your defences.
                </p>
                <div className="j-mission-tags"><span>03 TACTICAL PROTOCOLS</span><span>180 SECOND LIMIT</span><span>AEGIS UNLOCK</span></div>
                <div className="j-mission-actions">
                  <button className="j-mission-launch" type="button" onClick={() => { playMissionSound("portal"); setMissionOpen(true); }}>
                    {missionCleared ? "REPLAY ENCOUNTER" : "LAUNCH ENCOUNTER"} <span>↗</span>
                  </button>
                  {missionCleared && !evolved && (
                    <button className="j-mission-evolve" type="button" onClick={activateEvolution}>
                      ACTIVATE AEGIS ↗
                    </button>
                  )}
                  {evolved && <span className="j-mission-unlocked">◆ EVOLVED INTERFACE ACTIVE</span>}
                </div>
                {bestScore > 0 && <p className="j-mission-best">PERSONAL BEST // {bestScore.toLocaleString("en-GB")}</p>}
                <p className="j-mission-note">Fictional mini-game. No real security or hardware systems are involved.</p>
              </div>
              <div className="j-mission-visual" aria-hidden="true">
                <div className="j-mission-orbit j-mission-orbit-one" />
                <div className="j-mission-orbit j-mission-orbit-two" />
                <div className="j-mission-orbit j-mission-orbit-three" />
                <div className="j-mission-threat"><span>{evolved ? "◆" : "⌬"}</span><small>{evolved ? "AEGIS" : "ULTRON"}</small></div>
                <div className="j-mission-ticker">{evolved ? "THREAT // CONTAINED" : "THREAT LEVEL // CRITICAL"}</div>
              </div>
            </div>
          </section>

          {/* ====================================
              05 / RESEARCH
          ==================================== */}

          <section
            id="research"
            className="j-section"
          >
            <Heading
              number="05"
              kicker="EXPLORATION / OPEN QUESTIONS"
            >
              Curiosity is{" "}

              <span className="j-gradient">
                the engine.
              </span>
            </Heading>

            <div className="mt-9 grid gap-5 lg:grid-cols-3">

              {research.map((item) => (
                <details
                  key={item.code}
                  className="j-panel j-research j-reveal group"
                  onToggle={(event) => {
                    if (event.currentTarget.open) {
                      announceJarvisText(
                        `Opening ${item.name.toLowerCase()}. ${item.description}`
                      );
                    }
                  }}
                >
                  <summary className="cursor-pointer list-none p-6 sm:p-7">

                    <div className="flex items-center justify-between">

                      <Label>
                        {item.code} / ACTIVE AREA
                      </Label>

                      <span className="j-research-plus">
                        +
                      </span>
                    </div>

                    <h3 className="mt-12 text-xl font-medium leading-snug">
                      {item.name}
                    </h3>

                    <p className="mt-4 font-mono text-[10px] tracking-wide text-cyan-200/40">
                      CLICK TO EXPAND ↓
                    </p>
                  </summary>

                  <div className="px-6 pb-7 sm:px-7">

                    <div className="mb-5 h-px bg-cyan-200/15" />

                    <p className="text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>

                    <p className="mt-6 font-mono text-[10px] tracking-[.13em] text-cyan-200/50">
                      {item.tags}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* ====================================
              06 / CONTACT
          ==================================== */}

          <section
            id="contact"
            className="j-section !border-b-0"
          >
            <div className="j-panel j-contact j-reveal p-8 sm:p-14">

              <div className="relative z-10">

                <div className="flex items-center gap-3">
                  <span className="j-led" />

                  <Label>
                    COMMUNICATION CHANNEL /
                    AVAILABLE
                  </Label>
                </div>

                <h2 className="mt-7 text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
                  Initiate a{" "}

                  <span className="j-gradient">
                    connection.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl leading-8 text-slate-400">
                  Have a project, collaboration,
                  or interesting technical
                  challenge? I&apos;m always
                  interested in meaningful work.
                </p>

                <a
                  className="j-primary mt-8 inline-flex"
                  href="mailto:chiragnayakams@gmail.com?subject=Portfolio%20Enquiry"
                  onClick={() =>
                    announceJarvisText("Opening the communication channel.")
                  }
                >
                  OPEN SECURE CHANNEL

                  <span>↗</span>
                </a>

                <p className="mt-6 break-all font-mono text-xs text-cyan-100/60">
                  chiragnayakams@gmail.com
                </p>
              </div>

              <div
                className="j-contact-radar"
                aria-hidden="true"
              />
            </div>
          </section>

          {/* ====================================
              FOOTER
          ==================================== */}

          <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-cyan-200/10 py-7">

            <Label>
              © {new Date().getFullYear()}{" "}
              CHIRAG NAYAKA M S
            </Label>

            <button
              type="button"
              className="j-return"
              onClick={onExit}
            >
              ← RETURN TO JARVIS INTRO
            </button>
          </footer>
        </div>
      </div>

      {/* ====================================
          CTRL + K COMMAND PALETTE
      ==================================== */}

      {paletteOpen && (
        <div
          className="j-palette-backdrop fixed inset-0 z-[100] grid place-items-start px-4 pt-[15vh] sm:place-items-center sm:pt-0"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPaletteOpen(false);
            }
          }}
        >
          <div
            className="j-palette w-full max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-label="JARVIS command palette"
          >
            <div className="flex items-center gap-3 border-b border-cyan-200/15 px-5 py-5">

              <span className="text-2xl text-cyan-200">
                ⌕
              </span>

              <input
                ref={paletteInput}
                className="min-w-0 w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
                placeholder="Search modules..."
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  setPaletteOpen(false)
                }
                className="border border-cyan-200/25 px-2 py-1 text-[10px] text-cyan-200/70"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-3">

              {paletteResults.length ? (
                paletteResults.map(
                  (item) => (
                    <button
                      className="j-palette-option"
                      type="button"
                      key={item.id}
                      onClick={() =>
                        navigate(
                          item.id
                        )
                      }
                    >
                      <span className="text-cyan-200/40">
                        {item.number}
                      </span>

                      <span>
                        {item.label}
                      </span>

                      <span className="ml-auto text-cyan-200/50">
                        ↗
                      </span>
                    </button>
                  )
                )
              ) : (
                <p className="p-5 text-sm text-white/50">
                  No matching modules.
                </p>
              )}
            </div>

            <p className="border-t border-cyan-200/10 px-5 py-3 text-[10px] tracking-[.2em] text-cyan-200/35">
              CNMS / SYSTEM NAVIGATION
            </p>
          </div>
        </div>
      )}

      {/* ULTRON is mounted only when requested; no game loop in the background. */}
      {missionOpen && (
        <NemesisEncounter
          cleared={missionCleared}
          evolved={evolved}
          onClose={() => setMissionOpen(false)}
          onStart={() => announceJarvisCue("battle")}
          onComplete={completeMission}
          onEvolve={activateEvolution}
        />
      )}

      {/* ====================================
          JARVIS INTERFACE STYLING
      ==================================== */}

      <style>{`

        /* ULTRON ENCOUNTER TEASER + PERSISTENT AEGIS REWARD */
        .j-mission-card{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(230px,.85fr);background:linear-gradient(115deg,#071422 3%,#071019 54%,#180b18);border:1px solid rgba(247,83,108,.27);box-shadow:0 0 65px rgba(234,45,76,.05)}
        .j-mission-info{position:relative;z-index:2;padding:clamp(26px,4vw,44px)}
        .j-mission-kicker{font:600 10px/1.5 ui-monospace,Consolas,monospace;letter-spacing:.16em;color:#ff899a;display:flex;align-items:center;gap:11px}
        .j-mission-blink{width:7px;height:7px;background:#ff5e79;border-radius:50%;box-shadow:0 0 12px #ff647d;animation:j-mission-pulse 2s ease-in-out infinite}
        .j-mission-info h3{font:700 clamp(34px,5vw,65px)/1.06 system-ui,sans-serif;letter-spacing:-.04em;margin:17px 0 0}.j-mission-info h3 span{color:#ff6a84}
        .j-mission-description{color:#a9bdc8;font-size:14px;line-height:1.85;max-width:550px;margin-top:20px}
        .j-mission-tags{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 26px}.j-mission-tags span{font:500 9px/1.5 ui-monospace,Consolas,monospace;letter-spacing:.1em;border:1px solid rgba(234,119,132,.26);color:#df9ba7;padding:8px 10px}
        .j-mission-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.j-mission-launch{background:linear-gradient(100deg,#8c1e39,#cf395b);border:1px solid rgba(255,119,147,.8);color:#fff0f2;padding:14px 20px;min-height:46px;font:700 11px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.11em;cursor:pointer}.j-mission-launch:hover{filter:brightness(1.22)}.j-mission-launch span{margin-left:12px}
        .j-mission-evolve{border:1px solid #e7bb68;color:#ffe4a1;padding:14px 17px;font:700 10px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.06em;min-height:46px;cursor:pointer}.j-mission-evolve:hover{background:rgba(239,186,98,.15)}.j-mission-unlocked{font:700 10px/1.5 ui-monospace,Consolas,monospace;color:#ffd28a;letter-spacing:.12em}
        .j-mission-best{font-size:10px;color:#edc886;margin-top:20px;letter-spacing:.12em}.j-mission-note{font-size:11px;color:#647b8b;margin-top:18px}
        .j-mission-visual{position:relative;min-height:320px;background:radial-gradient(circle at 50% 48%,rgba(245,53,85,.18),transparent 31%),repeating-linear-gradient(0deg,transparent 0 27px,rgba(231,73,112,.035) 28px 29px),repeating-linear-gradient(90deg,transparent 0 27px,rgba(231,73,112,.035) 28px 29px)}
        .j-mission-orbit{position:absolute;left:50%;top:50%;border:1px solid rgba(241,74,108,.38);border-radius:50%;transform:translate(-50%,-50%);aspect-ratio:1}.j-mission-orbit-one{width:71%;border-style:dashed;animation:j-mission-orbit 20s linear infinite}.j-mission-orbit-two{width:57%;border-color:rgba(255,151,167,.23)}.j-mission-orbit-three{width:42%;border-style:dotted;animation:j-mission-orbit 13s linear infinite reverse}.j-mission-threat{position:absolute;left:50%;top:50%;width:128px;height:128px;border-radius:50%;transform:translate(-50%,-50%);display:grid;place-content:center;text-align:center;background:radial-gradient(circle,#611c38,#1d1220 61%,#100b15);box-shadow:0 0 42px rgba(249,52,93,.32),inset 0 0 28px rgba(244,68,97,.21);border:1px solid #b94b67}.j-mission-threat span{font-size:45px;line-height:1;color:#ff8fa0}.j-mission-threat small{font:700 11px ui-monospace,Consolas,monospace;letter-spacing:.1em;color:#ffc5cb;margin-top:8px}.j-mission-ticker{position:absolute;bottom:20px;left:20px;font:600 9px ui-monospace,Consolas,monospace;letter-spacing:.14em;color:#eb8195}
        @keyframes j-mission-orbit{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes j-mission-pulse{50%{opacity:.4}}
        .j-dashboard.j-evolved .j-topbar{border-bottom-color:rgba(255,210,110,.46);box-shadow:0 1px 34px rgba(255,189,76,.12)}
        .j-dashboard.j-evolved .j-gradient{background:linear-gradient(100deg,#f7ffff,#afe8ff 45%,#ffe7a5 75%,#e9a945);background-clip:text;-webkit-background-clip:text;color:transparent}
        .j-dashboard.j-evolved .j-holo-panel{border-color:rgba(252,213,120,.42);box-shadow:0 0 55px rgba(255,194,68,.09)}
        .j-dashboard.j-evolved .j-core-energy{filter:drop-shadow(0 0 22px rgba(255,198,69,.8)) hue-rotate(-25deg)}
        .j-dashboard.j-evolved .j-logo{border-color:rgba(255,214,135,.9);box-shadow:inset 0 0 22px rgba(255,179,48,.17);color:#ffe4af}
        .j-dashboard.j-evolved .j-led{background:#ffcb80;box-shadow:0 0 12px #f0bc55}
        .j-dashboard.j-evolved .j-mission-card{border-color:rgba(242,207,123,.5)}
        .j-dashboard.j-evolved .j-mission-threat{background:radial-gradient(circle,#73511e,#241a16 70%,#101319);border-color:#f8d17c;box-shadow:0 0 55px rgba(255,192,76,.28)}
        .j-dashboard.j-evolved .j-mission-threat span,.j-dashboard.j-evolved .j-mission-info h3 span,.j-dashboard.j-evolved .j-mission-ticker{color:#ffdc89}
        @media(max-width:900px){.j-mission-card{grid-template-columns:1fr}.j-mission-visual{min-height:290px}}
        @media(prefers-reduced-motion:reduce){.j-mission-card *{animation:none!important}}

        .j-dashboard {
          background: #020915;
          position: relative;
          isolation: isolate;
          overflow: visible;
          font-family: inherit;
        }

        .j-global-grid {
          z-index: -1;

          background:
            radial-gradient(
              ellipse 40% 27% at 72% 6%,
              rgba(0,130,230,.15),
              transparent 85%
            ),
            radial-gradient(
              ellipse 48% 33% at 12% 57%,
              rgba(0,67,138,.08),
              transparent 85%
            ),
            linear-gradient(
              130deg,
              #020713,
              #04101f 65%,
              #020713
            );
        }

        .j-global-grid::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .24;

          background-image:
            linear-gradient(
              rgba(64,180,250,.07) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(64,180,250,.07) 1px,
              transparent 1px
            );

          background-size: 76px 76px;

          mask-image:
            linear-gradient(
              180deg,
              black,
              transparent 95%
            );
        }

        .j-label {
          font:
            500 10px/1.5
            ui-monospace,
            Consolas,
            monospace;

          letter-spacing: .2em;

          color:
            rgba(121,214,255,.66);
        }

        /* STATUS LIGHT */

        .j-led {
          display: inline-block;
          vertical-align: middle;

          width: 6px;
          height: 6px;

          flex-shrink: 0;

          border-radius: 100%;

          background: #6af7ec;

          box-shadow:
            0 0 10px #35e8ea;

          animation:
            j-led-pulse
            2.5s ease-in-out infinite;
        }

        @keyframes j-led-pulse {
          50% {
            opacity: .42;

            box-shadow:
              0 0 3px #3bd9e3;
          }
        }

        /* TOP NAVIGATION */

        .j-topbar {
          background:
            rgba(2,10,22,.88);

          border-bottom:
            1px solid
            rgba(106,218,255,.15);

          backdrop-filter:
            blur(22px);
        }

        .j-logo {
          display: grid;
          place-items: center;

          width: 39px;
          height: 39px;

          font:
            600 22px
            ui-monospace,
            monospace;

          color: #c9faff;

          border:
            1px solid
            rgba(123,230,255,.65);

          box-shadow:
            inset 0 0 22px
            rgba(0,201,255,.13);
        }

        .j-command-shortcut {
          border:
            1px solid
            rgba(120,217,255,.25);

          background:
            rgba(25,132,188,.07);

          padding: 11px 13px;

          color: #b6edff;

          font:
            500 10px
            ui-monospace,
            monospace;

          letter-spacing: .12em;

          display: flex;
          align-items: center;
          gap: 12px;

          transition: all .2s;
          cursor: pointer;
        }

        .j-command-shortcut:hover {
          border-color:
            rgba(120,217,255,.8);

          background:
            rgba(25,132,188,.16);
        }

        .j-command-shortcut > span {
          font-size: 19px;
          line-height: 9px;
        }

        .j-command-shortcut kbd {
          font-size: 9px;
          padding: 4px 6px;

          background:
            rgba(130,218,255,.09);

          color:
            rgba(220,250,255,.65);
        }

        /* SIDEBAR */

        .j-sidebar {
          background:
            rgba(1,10,22,.36);
        }

        .j-horizontal-scroll {
          scrollbar-width: none;
        }

        .j-horizontal-scroll::-webkit-scrollbar {
          display: none;
        }

        .j-nav-item {
          display: flex;
          flex-shrink: 0;
          align-items: center;

          width: auto;
          min-height: 43px;

          padding: 0 12px;

          background: transparent;

          color:
            rgba(195,228,244,.48);

          font:
            500 10px
            ui-monospace,
            Consolas,
            monospace;

          letter-spacing: .13em;
          text-align: left;

          border:
            1px solid transparent;

          cursor: pointer;
          transition: all .2s;
        }

        .j-nav-item:hover {
          color: #d5f5ff;

          background:
            rgba(50,196,255,.06);
        }

        .j-nav-active {
          color: #d9f9ff;

          background:
            rgba(37,184,252,.1);

          border-color:
            rgba(58,197,251,.25);
        }

        .j-nav-arrow {
          margin-left: auto;

          color:
            rgba(84,214,255,.4);

          padding-left: 12px;

          opacity: 0;
          transition: opacity .2s;
        }

        .j-nav-active .j-nav-arrow,
        .j-nav-item:hover .j-nav-arrow {
          opacity: 1;
        }

        /* SIDEBAR SIGNAL BARS */

        .j-sidebar-bars {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 44px;
        }

        .j-sidebar-bars i {
          display: block;
          width: 3px;

          background: #25b7e9;
          opacity: .46;

          animation:
            j-bars 1.4s
            ease-in-out infinite alternate;
        }

        @keyframes j-bars {
          to {
            transform: scaleY(.4);
            opacity: .8;
          }
        }

        .j-return {
          font:
            500 10px
            ui-monospace,
            monospace;

          letter-spacing: .15em;

          color:
            rgba(124,219,255,.67);

          cursor: pointer;
        }

        .j-return:hover {
          color: #d9faff;
        }

        /* SECTION LAYOUT */

        .j-section {
          border-bottom:
            1px solid
            rgba(133,226,255,.11);

          padding-bottom: 92px;
          padding-top: 90px;

          scroll-margin-top: 85px;

          min-width: 0;
        }

        #overview.j-section {
          padding-top: 58px;
        }

        .j-gradient {
          background:
            linear-gradient(
              105deg,
              #e7fcff,
              #87e2ff 58%,
              #2a95e5
            );

          background-clip: text;
          -webkit-background-clip: text;

          color: transparent;
        }

        /* MAIN BUTTONS */

        .j-primary,
        .j-outline {
          display: inline-flex;
          justify-content: space-between;
          align-items: center;

          gap: 25px;

          min-height: 50px;
          padding: 13px 20px;

          font:
            600 10px
            ui-monospace,
            monospace;

          letter-spacing: .15em;

          transition: all .25s;
          cursor: pointer;
        }

        .j-primary {
          background:
            rgba(45,193,252,.17);

          color: #d3f9ff;

          border:
            1px solid
            rgba(116,226,255,.64);
        }

        .j-outline {
          background:
            rgba(5,21,38,.6);

          color: #abd8eb;

          border:
            1px solid
            rgba(116,226,255,.22);
        }

        .j-primary:hover,
        .j-outline:hover {
          transform: translateY(-2px);

          border-color: #aaf6ff;

          box-shadow:
            0 0 28px
            rgba(30,190,255,.15);
        }

        /* HOLOGRAPHIC PANELS */

        .j-panel {
          position: relative;

          background:
            rgba(5,20,36,.75);

          border:
            1px solid
            rgba(101,211,255,.18);

          box-shadow:
            inset 0 0 30px
            rgba(16,122,177,.025);

          backdrop-filter:
            blur(14px);
        }

        .j-panel::before,
        .j-panel::after {
          content: "";

          position: absolute;
          pointer-events: none;

          width: 11px;
          height: 11px;

          border-color:
            rgba(147,236,255,.74);

          border-style: solid;
        }

        .j-panel::before {
          top: -1px;
          left: -1px;

          border-width:
            2px 0 0 2px;
        }

        .j-panel::after {
          bottom: -1px;
          right: -1px;

          border-width:
            0 2px 2px 0;
        }

        /* HOLOGRAM MODE CONTROLS */

        .j-panel-top {
          padding: 20px 20px 0;
        }

        .j-mode-switch button {
          font:
            500 10px
            ui-monospace,
            monospace;

          letter-spacing: .13em;

          color:
            rgba(193,231,251,.4);

          border:
            1px solid
            rgba(97,211,255,.13);

          padding: 8px 14px;

          cursor: pointer;
          transition: all .2s;
        }

        .j-mode-switch button:hover,
        .j-mode-switch button.is-selected {
          background:
            rgba(44,197,249,.1);

          border-color:
            rgba(97,211,255,.62);

          color: #d3f8ff;
        }

        /* ==================================
           MAIN HOLOGRAPHIC CORE
        ================================== */

        .j-core {
          height: 415px;

          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .j-core-haze {
          position: absolute;
          inset: 6% 9%;

          background:
            radial-gradient(
              circle,
              rgba(14,166,235,.25),
              rgba(5,72,128,.09) 38%,
              transparent 65%
            );

          filter: blur(15px);
        }

        .j-core-ring,
        .j-core-sphere,
        .j-core-scan,
        .j-core-readout {
          position: absolute;

          left: 50%;
          top: 46%;

          transform:
            translate(-50%,-50%);
        }

        .j-core-ring {
          width: 310px;
          aspect-ratio: 1;

          border-radius: 50%;

          pointer-events: none;
        }

        /* OUTERMOST RING */

        .j-ring-outer {
          width: 368px;

          border:
            1px solid
            rgba(46,180,252,.28);

          border-left-color: transparent;

          border-bottom-color:
            rgba(46,180,252,.7);

          box-shadow:
            0 0 18px
            rgba(27,149,233,.1);

          animation:
            j-spin 31s linear infinite;
        }

        /* RADIAL MICRO TICKS */

        .j-ring-ticks {
          width: 340px;

          background:
            repeating-conic-gradient(
              from 0deg,
              #4acbff 0deg 1deg,
              transparent 1deg 5deg
            );

          mask:
            radial-gradient(
              transparent 66.5%,
              black 67.5% 70%,
              transparent 71%
            );

          opacity: .8;

          animation:
            j-spin 20s
            linear reverse infinite;
        }

        /* ROTATING ORBIT */

        .j-ring-orbit {
          width: 305px;

          border:
            2px dashed
            rgba(86,208,255,.36);

          border-top-color: #9cf0ff;
          border-right-color: transparent;

          animation:
            j-spin 18s linear infinite;
        }

        /* INNER SEGMENTED RING */

        .j-ring-mid {
          width: 255px;

          background:
            repeating-conic-gradient(
              from 40deg,
              #8eeeff 0deg 1.7deg,
              transparent 2deg 13deg
            );

          mask:
            radial-gradient(
              transparent 81%,
              black 82% 89%,
              transparent 90%
            );

          opacity: .73;

          animation:
            j-spin 13s
            linear reverse infinite;
        }

        /* ENERGY CONTAINMENT RING */

        .j-ring-inner {
          width: 210px;

          border:
            1px solid
            rgba(98,235,255,.64);

          border-top-color: transparent;
          border-right-color: transparent;

          box-shadow:
            0 0 19px
            rgba(0,186,255,.32),

            inset 0 0 22px
            rgba(0,190,255,.14);

          animation:
            j-spin 8s linear infinite;
        }

        /* CENTRAL SPHERE */

        .j-core-sphere {
          cursor: pointer;
          padding: 0;
          z-index: 1;
          width: 171px;
          height: 171px;

          border-radius: 100%;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 34% 25%,
              rgba(127,238,255,.25),
              rgba(9,80,154,.18) 34%,
              rgba(2,11,28,.88) 70%
            );

          border:
            1px solid
            rgba(115,229,255,.63);

          box-shadow:
            0 0 31px
            rgba(15,189,255,.42),

            inset -13px -8px 32px
            rgba(4,132,255,.22);

          animation:
            j-orb-breathe
            4s ease-in-out infinite;
        }

        .j-core-sphere:focus-visible {
          outline: 2px solid #fcd34d;
          outline-offset: 6px;
        }
        .j-jarvis-reacting .j-core-sphere {
          box-shadow: 0 0 60px rgba(255,192,70,.6), inset 0 0 30px rgba(40,210,255,.48);
          animation-duration: .6s;
        }
        .j-jarvis-readout {
          margin-top: 9px;
          color: #fcd34d !important;
          letter-spacing: .1em !important;
        }

        /* The Neural Core is now a live JARVIS activity display.
           Speaking bars follow analysed output audio when Web Audio
           is permitted; listening/thinking are honest state indicators. */
        .j-core-voice-monitor {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 30px;
          margin: 4px auto 0;
        }
        .j-core-meter-bar {
          display: block;
          width: 3px;
          height: 23px;
          border-radius: 3px;
          transform-origin: center;
          transform: scaleY(.18);
          background: linear-gradient(180deg, #fff1ad 0%, #ffb74d 52%, #34dfff 100%);
          box-shadow: 0 0 7px rgba(255,199,80,.32);
          opacity: .42;
          transition: transform 75ms linear, opacity 200ms ease;
        }
        .j-core-activity-label {
          color: rgba(255,220,140,.68) !important;
          font-size: 7px !important;
          letter-spacing: .08em !important;
        }
        .j-assistant-speaking .j-core-meter-bar {
          opacity: 1;
          transform: scaleY(var(--jarvis-meter-0,.3));
        }
        .j-assistant-speaking .j-core-meter-1 { transform: scaleY(var(--jarvis-meter-1,.4)); }
        .j-assistant-speaking .j-core-meter-2 { transform: scaleY(var(--jarvis-meter-2,.5)); }
        .j-assistant-speaking .j-core-meter-3 { transform: scaleY(var(--jarvis-meter-3,.8)); }
        .j-assistant-speaking .j-core-meter-4 { transform: scaleY(var(--jarvis-meter-4,.8)); }
        .j-assistant-speaking .j-core-meter-5 { transform: scaleY(var(--jarvis-meter-5,.5)); }
        .j-assistant-speaking .j-core-meter-6 { transform: scaleY(var(--jarvis-meter-6,.4)); }
        .j-assistant-speaking .j-core-meter-7 { transform: scaleY(var(--jarvis-meter-7,.3)); }
        .j-assistant-speaking .j-core-sphere {
          box-shadow:
            0 0 var(--jarvis-audio-glow, 30px) rgba(255,190,71,.68),
            inset 0 0 25px rgba(35,210,255,.6);
        }
        .j-assistant-listening .j-core-meter-bar,
        .j-assistant-thinking .j-core-meter-bar,
        .j-assistant-loading .j-core-meter-bar {
          opacity: .82;
          animation: j-assistant-monitor 1.0s ease-in-out infinite alternate;
        }
        .j-assistant-listening .j-core-meter-bar { animation-duration: .55s; }
        .j-assistant-thinking .j-core-meter-bar { animation-duration: .9s; }
        .j-core-meter-1 { animation-delay: -0.14s !important; }
        .j-core-meter-2 { animation-delay: -0.31s !important; }
        .j-core-meter-3 { animation-delay: -0.43s !important; }
        .j-core-meter-4 { animation-delay: -0.22s !important; }
        .j-core-meter-5 { animation-delay: -0.51s !important; }
        .j-core-meter-6 { animation-delay: -0.35s !important; }
        .j-core-meter-7 { animation-delay: -0.17s !important; }
        @keyframes j-assistant-monitor {
          from { transform: scaleY(.16); }
          to { transform: scaleY(.82); }
        }
        @media (prefers-reduced-motion: reduce) {
          .j-assistant-listening .j-core-meter-bar,
          .j-assistant-thinking .j-core-meter-bar,
          .j-assistant-loading .j-core-meter-bar,
          .j-assistant-speaking .j-core-meter-bar {
            animation: none !important;
            transform: scaleY(.45) !important;
          }
        }

        .j-core-sphere-grid {
          position: absolute;
          inset: -10%;

          border-radius: 50%;

          background:
            repeating-linear-gradient(
              0deg,
              transparent 0 14px,
              rgba(114,225,255,.24) 15px,
              transparent 16px
            ),

            repeating-linear-gradient(
              90deg,
              transparent 0 17px,
              rgba(114,225,255,.16) 18px,
              transparent 19px
            );

          transform:
            rotate(-18deg) scale(1.2);

          animation:
            j-globe-turn
            12s linear infinite;
        }

        /* INTERNAL ENERGY */

        .j-core-energy {
          position: absolute;
          inset: 20%;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              #e1feff 0 3%,
              #67ebff 4% 8%,
              rgba(18,188,255,.8) 9% 13%,
              rgba(38,145,255,.26) 21%,
              transparent 65%
            );

          filter:
            drop-shadow(
              0 0 11px #24d8ff
            );

          animation:
            j-spin-local
            6s linear infinite;
        }

        .j-core-energy::after {
          content: "";
          position: absolute;
          inset: 9%;

          border:
            1px solid
            rgba(169,244,255,.8);

          border-left-color:
            transparent;

          border-radius: 50%;
        }

        .j-core-reticle {
          position: absolute;
          inset: 24%;

          border:
            1px dashed
            rgba(192,249,255,.6);

          border-radius: 50%;

          animation:
            j-spin-local
            4s linear reverse infinite;
        }

        /* SCANNER BEAM */

        .j-core-scan {
          width: 372px;
          height: 372px;

          border-radius: 50%;

          background:
            conic-gradient(
              from 0deg,
              transparent 0deg 294deg,
              rgba(68,227,255,.11) 335deg,
              rgba(97,234,255,.18) 350deg,
              transparent 360deg
            );

          animation:
            j-spin 5s linear infinite;

          pointer-events: none;
        }

        .j-scanning .j-core-scan {
          animation-duration: .6s;

          background:
            conic-gradient(
              transparent 0deg 250deg,
              rgba(121,242,255,.4) 357deg,
              transparent 360deg
            );
        }

        /* DIFFERENT HOLOGRAM MODES */

        .j-mode-network .j-ring-outer {
          border-radius: 18%;

          transform:
            translate(-50%,-50%)
            rotate(45deg);

          animation:
            j-rotate-square
            24s linear infinite;
        }

        .j-mode-network .j-core-sphere {
          border-radius: 28%;

          transform:
            translate(-50%,-50%)
            rotate(45deg);
        }

        .j-mode-signal .j-ring-orbit {
          border-style: dotted;
          animation-duration: 4s;
        }

        .j-mode-signal .j-core-energy {
          animation-duration: 1.7s;
        }

        /* CENTRAL HUD LABEL */

        .j-core-readout {
          text-align: center;

          z-index: 2;
          pointer-events: none;

          width: 200px;
          margin-top: 3px;
        }

        .j-core-readout span,
        .j-core-readout small {
          display: block;

          color:
            rgba(200,244,255,.65);

          font:
            500 8px
            ui-monospace,
            monospace;

          letter-spacing: .16em;
        }

        .j-core-readout strong {
          display: block;
          margin: 7px 0;

          font:
            600 13px
            ui-monospace,
            monospace;

          letter-spacing: .19em;

          text-shadow:
            0 0 9px #35ccff;
        }

        .j-core-readout small {
          font-size: 7px;
        }

        /* CLICKABLE HOLOGRAPHIC NODES */

        .j-node {
          position: absolute;

          background:
            rgba(1,16,33,.74);

          border-left:
            1px solid
            rgba(75,212,255,.35);

          color: #a2e8ff;

          padding: 6px 10px;

          text-align: left;

          font:
            500 9px
            ui-monospace,
            monospace;

          letter-spacing: .08em;

          cursor: pointer;

          transition:
            background .2s,
            color .2s;

          white-space: nowrap;

          z-index: 4;
        }

        .j-node:hover {
          background:
            rgba(25,151,210,.22);

          color: white;
        }

        .j-node span {
          color:
            rgba(114,210,255,.5);

          margin-right: 5px;
        }

        .j-node-one {
          top: 13%;
          left: 5%;
        }

        .j-node-two {
          top: 18%;
          right: 5%;
        }

        .j-node-three {
          bottom: 23%;
          left: 5%;
        }

        .j-node-four {
          bottom: 28%;
          right: 5%;
        }

        /* SCAN BUTTON */

        .j-core-trigger {
          position: absolute;

          bottom: 6px;
          left: 50%;

          transform:
            translateX(-50%);

          white-space: nowrap;

          border:
            1px solid
            rgba(121,228,255,.4);

          background:
            rgba(9,98,143,.18);

          color: #c8f7ff;

          font:
            600 10px
            ui-monospace,
            monospace;

          letter-spacing: .16em;

          padding: 12px 19px;

          cursor: pointer;

          transition:
            background .2s;
        }

        .j-core-trigger:hover {
          background:
            rgba(20,175,231,.29);
        }

        .j-core-trigger:disabled {
          opacity: .6;
          cursor: wait;
        }

        .j-core-footer {
          flex-wrap: wrap;
        }

        .j-core-footer span:last-child {
          text-align: right;
        }

        /* CORE ANIMATIONS */

        @keyframes j-spin {
          to {
            transform:
              translate(-50%,-50%)
              rotate(360deg);
          }
        }

        @keyframes j-spin-local {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes j-rotate-square {
          to {
            transform:
              translate(-50%,-50%)
              rotate(405deg);
          }
        }

        @keyframes j-globe-turn {
          to {
            transform:
              rotate(342deg)
              scale(1.2);
          }
        }

        @keyframes j-orb-breathe {
          50% {
            box-shadow:
              0 0 48px
              rgba(30,209,255,.65),

              inset -13px -8px 32px
              rgba(4,132,255,.33);
          }
        }

        /* ==================================
           SIGNAL DISPLAY
        ================================== */

        .j-signal {
          height: 157px;

          position: relative;
          overflow: hidden;
        }

        .j-signal-grid {
          position: absolute;
          inset: 0;

          background:
            repeating-linear-gradient(
              0deg,
              transparent 0 25px,
              rgba(58,178,245,.07) 26px
            ),

            repeating-linear-gradient(
              90deg,
              transparent 0 50px,
              rgba(58,178,245,.05) 51px
            );
        }

        .j-signal svg {
          position: absolute;
          inset: 0;

          width: 100%;
          height: 100%;
        }

        .j-signal-dim,
        .j-signal-main {
          fill: none;
          stroke-width: 2;
        }

        .j-signal-dim {
          stroke: #174b69;

          opacity: .6;

          stroke-width: 5;

          filter: blur(3px);
        }

        .j-signal-main {
          stroke:
            url(#jSignalGradient);

          stroke-dasharray: 1250;
          stroke-dashoffset: 1250;

          animation:
            j-draw 2s ease forwards;
        }

        .j-signal-scanner {
          position: absolute;
          top: 0;
          bottom: 0;

          width: 1px;

          background: #8cf0ff;

          box-shadow:
            0 0 14px #37cfff;

          animation:
            j-scan 7s linear infinite;
        }

        @keyframes j-draw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes j-scan {
          from {
            left: 0;
          }

          to {
            left: 100%;
          }
        }

        .j-down-arrow {
          animation:
            j-down
            1.5s ease-in-out infinite;
        }

        @keyframes j-down {
          50% {
            transform:
              translateY(6px);
          }
        }

        /* ==================================
           SKILLS INTERACTIONS
        ================================== */

        .j-tab {
          border:
            1px solid
            rgba(92,213,255,.16);

          padding: 12px 15px;

          color:
            rgba(198,235,253,.57);

          font:
            500 10px
            ui-monospace,
            monospace;

          letter-spacing: .13em;

          cursor: pointer;

          transition: all .2s;
        }

        .j-tab:hover,
        .j-tab-active {
          color: #d7faff;

          border-color:
            rgba(114,226,255,.7);

          background:
            rgba(63,187,238,.13);
        }

        .j-skill {
          padding: 18px;

          display: flex;
          gap: 12px;
          align-items: center;

          background:
            rgba(19,91,128,.08);

          border:
            1px solid
            rgba(124,214,252,.12);

          font-size: 13px;

          opacity: 0;

          animation:
            j-item-in .42s ease forwards;
        }

        .j-skill:hover {
          border-color:
            rgba(124,214,252,.5);

          background:
            rgba(19,91,128,.18);
        }

        .j-skill span {
          font:
            500 10px
            ui-monospace,
            monospace;

          color:
            rgba(117,219,255,.5);
        }

        @keyframes j-item-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: none;
          }
        }

        /* ==================================
           PROJECT ARCHIVE
        ================================== */

        .j-project-empty {
          min-height: 330px;
        }

        .j-project-glyph {
          width: 70px;
          height: 70px;

          border:
            1px solid
            rgba(112,226,255,.5);

          margin: 0 auto 24px;

          display: grid;
          place-items: center;

          border-radius: 100%;

          font:
            200 35px sans-serif;

          color: #8ef4ff;

          box-shadow:
            0 0 34px
            rgba(27,181,242,.1);

          animation:
            j-led-pulse 3s infinite;
        }

        /* ==================================
           RESEARCH PANELS
        ================================== */

        .j-research {
          transition: background .2s;
        }

        .j-research:hover {
          background:
            rgba(22,64,99,.52);
        }

        .j-research summary::-webkit-details-marker {
          display: none;
        }

        .j-research-plus {
          font-size: 24px;
          color: #8ae6ff;

          transition:
            transform .2s;
        }

        .j-research[open] .j-research-plus {
          transform: rotate(45deg);
        }

        /* ==================================
           CONTACT
        ================================== */

        .j-contact {
          overflow: hidden;
        }

        .j-contact-radar {
          position: absolute;

          width: 420px;
          aspect-ratio: 1;

          right: -160px;
          top: 50%;

          transform:
            translateY(-50%);

          border-radius: 50%;

          border:
            1px solid
            rgba(68,192,255,.22);

          box-shadow:
            0 0 75px
            rgba(5,153,233,.1);

          pointer-events: none;
        }

        .j-contact-radar::after,
        .j-contact-radar::before {
          content: "";
          position: absolute;

          border-radius: 50%;
          inset: 16%;

          border:
            1px dashed
            rgba(83,207,255,.2);
        }

        .j-contact-radar::after {
          inset: 30%;
        }

        /* ==================================
           COMMAND PALETTE
        ================================== */

        .j-palette-backdrop {
          background:
            rgba(0,3,9,.8);

          backdrop-filter:
            blur(10px);
        }

        .j-palette {
          background: #071625;

          border:
            1px solid
            rgba(113,225,255,.48);

          box-shadow:
            0 15px 95px
            rgba(0,0,0,.7),

            0 0 65px
            rgba(23,171,243,.09);
        }

        .j-palette-option {
          display: flex;
          align-items: center;

          gap: 16px;

          width: 100%;
          padding: 15px 14px;

          font:
            500 12px
            ui-monospace,
            monospace;

          letter-spacing: .16em;

          color: #bcecf9;

          text-align: left;
          cursor: pointer;
        }

        .j-palette-option:hover {
          background:
            rgba(58,190,240,.12);
        }

        /* ==================================
           SCROLL-TRIGGERED REVEAL
        ================================== */

        .j-reveal {
          opacity: 0;

          transform:
            translateY(25px);

          filter: blur(4px);

          transition:
            opacity .8s
            cubic-bezier(.16,1,.3,1),

            transform .8s
            cubic-bezier(.16,1,.3,1),

            filter .8s
            cubic-bezier(.16,1,.3,1);
        }

        .j-reveal.j-visible {
          opacity: 1;
          transform: translateY(0);
          filter: none;
        }

        /* KEYBOARD ACCESSIBILITY */

        .j-dashboard button:focus-visible,
        .j-dashboard a:focus-visible,
        .j-dashboard input:focus-visible {
          outline: 2px solid #8eecff;
          outline-offset: 3px;
        }

        /* ==================================
           TABLET
        ================================== */

        @media (max-width: 1023px) {
          .j-sidebar {
            background:
              rgba(3,21,37,.6);
          }

          .j-section {
            padding-block: 72px;
          }

          .j-node {
            font-size: 8px;
          }
        }

        /* ==================================
           MOBILE
        ================================== */

        @media (max-width: 600px) {
          .j-core {
            height: 365px;
          }

          .j-core-ring {
            scale: .72;
          }

          .j-core-sphere {
            scale: .81;
          }

          .j-core-scan {
            scale: .72;
          }

          .j-node {
            font-size: 8px;
            padding: 4px 6px;
          }

          .j-node-one,
          .j-node-three {
            left: 2%;
          }

          .j-node-two,
          .j-node-four {
            right: 2%;
          }

          .j-core-readout {
            scale: .82;
          }

          .j-command-shortcut {
            font-size: 0;
            gap: 7px;
          }

          .j-command-shortcut kbd {
            font-size: 9px;
          }

          .j-command-shortcut span {
            font-size: 19px;
          }

          .j-node-one {
            top: 9%;
          }

          .j-node-two {
            top: 16%;
          }

          .j-node-three {
            bottom: 25%;
          }

          .j-node-four {
            bottom: 33%;
          }
        }

        /* ==================================
           REDUCED MOTION
        ================================== */

        @media (prefers-reduced-motion: reduce) {

          .j-dashboard *,
          .j-dashboard *::before,
          .j-dashboard *::after {
            animation-duration:
              .01ms !important;

            animation-iteration-count:
              1 !important;

            scroll-behavior:
              auto !important;
          }

          .j-reveal {
            opacity: 1;
            transform: none;
            filter: none;
            transition: none;
          }

          .j-skill {
            opacity: 1;
          }

          .j-signal-main {
            stroke-dashoffset: 0;
          }
        }

      `}</style>
    </div>
  );
}