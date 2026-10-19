"use client";

export default function HeroOverlay({
  onEnter,
  leaving = false,
}: {
  onEnter: () => void;
  leaving?: boolean;
}) {
  return (
    <div
      className={`
        hero-overlay
        pointer-events-none
        absolute inset-0 z-10
        text-white
        ${leaving ? "hero-leaving" : ""}
      `}
    >
      {/* BACKGROUND GRADIENT */}

      <div
        className="
          absolute inset-0
          bg-gradient-to-r
          from-[#02050c]/90
          via-[#02050c]/25
          to-transparent
        "
      />

      {/* =====================================
          TOP SYSTEM STATUS
      ===================================== */}

      <header
        className="
          hero-status
          absolute left-6 right-6 top-7
          flex items-center justify-between
          gap-4
          text-[9px] font-medium
          tracking-[0.3em]
          text-cyan-100/70
          sm:left-11 sm:right-11
        "
      >
        <span className="flex items-center gap-3">
          <span className="system-indicator" />

          SYSTEM ONLINE
        </span>

        <span className="hidden sm:inline">
          CNMS // PORTFOLIO SYSTEM
        </span>
      </header>

      {/* =====================================
          MAIN INTRODUCTION
      ===================================== */}

      <div
        className="
          absolute bottom-[12%] left-6
          max-w-[900px] pr-6
          sm:bottom-[17%] sm:left-11
          lg:left-[5.5%]
        "
      >
        {/* SPECIALIZATION */}

        <div className="hero-specialization">
          <span className="specialization-marker" />

          <p
            className="
              text-[10px] font-medium
              tracking-[0.27em]
              text-cyan-300
              sm:text-xs
            "
          >
            DATA SCIENCE · AI · DIGITAL TWINS
          </p>
        </div>

        {/* =====================================
            ANIMATED NAME
        ===================================== */}

        <h1
          className="
            hero-name
            mt-6
            flex flex-wrap
            gap-x-[0.22em]
            gap-y-1
            text-[clamp(2.15rem,4vw,4.4rem)]
            font-medium
            leading-[1.06]
            tracking-[0.025em]
          "
          aria-label="Chirag Nayaka M S"
        >
          <span className="name-mask">
            <span className="name-word name-first">
              CHIRAG
            </span>
          </span>

          <span className="name-mask">
            <span className="name-word name-second">
              NAYAKA
            </span>
          </span>

          <span className="name-mask">
            <span className="name-word name-third">
              M S
            </span>
          </span>
        </h1>

        {/* =====================================
            ANIMATED CYAN DIVIDER
        ===================================== */}

        <div className="hero-divider">
          <div className="hero-divider-line" />

          <div className="hero-divider-point" />
        </div>

        {/* =====================================
            ANIMATED TAGLINE
        ===================================== */}

        <div className="hero-tagline">
          <p className="tagline-first">
            I don&apos;t just analyse data.
          </p>

          <p className="tagline-second">
            I build systems that understand it.
          </p>
        </div>

        {/* =====================================
            ANIMATED ENTER SYSTEM BUTTON
        ===================================== */}

        <div className="hero-button-container">
          <button
            type="button"
            onClick={onEnter}
            disabled={leaving}
            className="enter-system-button pointer-events-auto"
          >
            <span className="button-corner corner-tl" />
            <span className="button-corner corner-tr" />
            <span className="button-corner corner-bl" />
            <span className="button-corner corner-br" />

            <span className="button-scan" />

            <span className="relative z-10">
              ENTER SYSTEM
            </span>

            <span
              className="button-arrow relative z-10"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        </div>
      </div>

      {/* =====================================
          BOTTOM SYSTEM INFORMATION
      ===================================== */}

      <div
        className="
          hero-bottom-left
          absolute bottom-7 left-6
          text-[9px]
          tracking-[0.25em]
          text-cyan-100/40
          sm:left-11
        "
      >
        AI INTERFACE / BUILD 01
      </div>

      <div
        className="
          hero-bottom-right
          absolute bottom-7 right-6
          hidden
          text-[9px]
          tracking-[0.22em]
          text-cyan-100/40
          sm:right-11 sm:block
        "
      >
        CORE STATUS // ACTIVE
      </div>

      {/* =====================================
          CINEMATIC INTRO ANIMATIONS
      ===================================== */}

      <style>{`

        /* ==================================
           GLOBAL INTRO SETTINGS
        ================================== */

        .hero-overlay {
          opacity: 1;
          transition:
            opacity 650ms cubic-bezier(.22,1,.36,1);
        }

        .hero-overlay.hero-leaving {
          opacity: 0;
        }

        /* ==================================
           SYSTEM ONLINE
        ================================== */

        .hero-status {
          opacity: 0;
          transform: translateY(-15px);

          animation:
            status-reveal
            850ms
            cubic-bezier(.16,1,.3,1)
            300ms
            forwards;
        }

        @keyframes status-reveal {
          0% {
            opacity: 0;
            transform: translateY(-15px);
            filter: blur(6px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .system-indicator {
          display: inline-block;

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #83eaff;

          box-shadow:
            0 0 8px #57deff,
            0 0 20px rgba(32,200,255,.55);

          animation:
            indicator-pulse
            2.5s
            ease-in-out
            3s
            infinite;
        }

        @keyframes indicator-pulse {
          0%, 100% {
            opacity: 1;
            box-shadow:
              0 0 8px #57deff,
              0 0 18px rgba(32,200,255,.45);
          }

          50% {
            opacity: .45;
            box-shadow:
              0 0 3px #57deff;
          }
        }

        /* ==================================
           SPECIALIZATION INTRO
        ================================== */

        .hero-specialization {
          display: flex;
          align-items: center;
          gap: 13px;

          opacity: 0;
          transform: translateX(-25px);

          animation:
            specialization-reveal
            900ms
            cubic-bezier(.16,1,.3,1)
            700ms
            forwards;
        }

        .specialization-marker {
          width: 24px;
          height: 1px;

          flex-shrink: 0;

          background: #61dfff;

          box-shadow:
            0 0 12px rgba(44,217,255,.85);
        }

        @keyframes specialization-reveal {
          0% {
            opacity: 0;
            transform: translateX(-25px);
            filter: blur(8px);
          }

          100% {
            opacity: 1;
            transform: translateX(0);
            filter: blur(0);
          }
        }

        /* ==================================
           NAME REVEAL
        ================================== */

        .name-mask {
          display: inline-block;
          overflow: hidden;

          padding-bottom: .13em;
          margin-bottom: -.13em;
        }

        .name-word {
          display: inline-block;

          opacity: 0;

          transform:
            translate3d(0, 115%, 0);

          filter: blur(12px);

          will-change:
            transform,
            opacity,
            filter;

          animation:
            name-reveal
            1150ms
            cubic-bezier(.16,1,.3,1)
            forwards;
        }

        .name-first {
          animation-delay: 1000ms;
        }

        .name-second {
          animation-delay: 1220ms;
        }

        .name-third {
          animation-delay: 1440ms;
        }

        @keyframes name-reveal {
          0% {
            opacity: 0;

            transform:
              translate3d(0,115%,0);

            filter: blur(12px);
          }

          45% {
            opacity: 1;
          }

          100% {
            opacity: 1;

            transform:
              translate3d(0,0,0);

            filter: blur(0);
          }
        }

        /* ==================================
           DIVIDER DRAW ANIMATION
        ================================== */

        .hero-divider {
          position: relative;

          width: min(100%, 360px);
          height: 1px;

          margin-top: 28px;
        }

        .hero-divider-line {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              90deg,
              #8feaff 0%,
              #2da8e0 50%,
              transparent 100%
            );

          box-shadow:
            0 0 12px rgba(39,206,255,.35);

          transform: scaleX(0);
          transform-origin: left center;

          animation:
            divider-draw
            950ms
            cubic-bezier(.16,1,.3,1)
            1700ms
            forwards;
        }

        @keyframes divider-draw {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        .hero-divider-point {
          position: absolute;

          top: -3px;
          left: 0;

          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #a6f5ff;

          box-shadow:
            0 0 12px #4ddfff,
            0 0 25px rgba(32,194,255,.7);

          opacity: 0;

          animation:
            divider-point
            950ms
            cubic-bezier(.16,1,.3,1)
            1700ms
            forwards;
        }

        @keyframes divider-point {
          0% {
            opacity: 0;
            left: 0;
          }

          15% {
            opacity: 1;
          }

          90% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            left: 95%;
          }
        }

        /* ==================================
           TAGLINE ANIMATION
        ================================== */

        .hero-tagline {
          margin-top: 27px;

          font-size: clamp(14px, 1.4vw, 18px);
          line-height: 1.8;

          letter-spacing: .015em;
        }

        .tagline-first,
        .tagline-second {
          opacity: 0;
          transform: translateY(20px);
          filter: blur(7px);

          animation:
            tagline-reveal
            950ms
            cubic-bezier(.16,1,.3,1)
            forwards;
        }

        .tagline-first {
          color: rgba(255,255,255,.62);
          animation-delay: 1900ms;
        }

        .tagline-second {
          color: rgba(255,255,255,.92);
          animation-delay: 2110ms;
        }

        @keyframes tagline-reveal {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(7px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        /* ==================================
           ENTER SYSTEM BUTTON ENTRANCE
        ================================== */

        .hero-button-container {
          margin-top: 32px;

          opacity: 0;

          transform:
            translateY(22px)
            scale(.97);

          filter: blur(8px);

          animation:
            button-materialize
            950ms
            cubic-bezier(.16,1,.3,1)
            2500ms
            forwards;
        }

        @keyframes button-materialize {
          0% {
            opacity: 0;

            transform:
              translateY(22px)
              scale(.97);

            filter: blur(8px);
          }

          60% {
            opacity: 1;
          }

          100% {
            opacity: 1;

            transform:
              translateY(0)
              scale(1);

            filter: blur(0);
          }
        }

        /* ==================================
           ENTER SYSTEM BUTTON DESIGN
        ================================== */

        .enter-system-button {
          position: relative;

          display: inline-flex;
          justify-content: space-between;
          align-items: center;

          gap: 30px;

          min-height: 54px;
          padding: 15px 26px;

          overflow: hidden;

          background:
            rgba(3,16,31,.74);

          border:
            1px solid rgba(91,221,255,.43);

          color: #dcfaff;

          font-family: inherit;
          font-size: 12px;
          font-weight: 600;

          letter-spacing: .25em;

          backdrop-filter: blur(12px);

          cursor: pointer;

          transition:
            background 350ms ease,
            border-color 350ms ease,
            box-shadow 350ms ease,
            transform 350ms
              cubic-bezier(.16,1,.3,1);
        }

        .enter-system-button:hover {
          background: rgba(24,114,157,.17);

          border-color:
            rgba(151,239,255,.9);

          box-shadow:
            0 0 28px rgba(22,184,245,.17),
            inset 0 0 20px
              rgba(22,184,245,.055);

          transform: translateY(-3px);
        }

        .enter-system-button:active {
          transform: translateY(0) scale(.98);
        }

        .enter-system-button:focus-visible {
          outline: 2px solid #89edff;
          outline-offset: 5px;
        }

        .enter-system-button:disabled {
          cursor: default;
        }

        .button-arrow {
          font-size: 21px;
          line-height: 1;

          color: #70ddff;

          transition:
            transform 350ms ease,
            color 350ms ease;
        }

        .enter-system-button:hover .button-arrow {
          transform: translateX(6px);
          color: white;
        }

        /* Animated scanning light */

        .button-scan {
          position: absolute;

          top: 0;
          bottom: 0;
          left: -55%;

          width: 40%;

          transform: skewX(-22deg);

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(107,226,255,.14),
              transparent
            );

          animation:
            button-sweep
            5s
            ease-in-out
            3.5s
            infinite;
        }

        @keyframes button-sweep {
          0%, 72% {
            left: -55%;
          }

          100% {
            left: 150%;
          }
        }

        /* Small HUD corners */

        .button-corner {
          position: absolute;

          width: 9px;
          height: 9px;

          border-color:
            rgba(145,239,255,.9);

          border-style: solid;

          transition:
            width 300ms ease,
            height 300ms ease;
        }

        .corner-tl {
          top: -1px;
          left: -1px;

          border-width: 2px 0 0 2px;
        }

        .corner-tr {
          top: -1px;
          right: -1px;

          border-width: 2px 2px 0 0;
        }

        .corner-bl {
          bottom: -1px;
          left: -1px;

          border-width: 0 0 2px 2px;
        }

        .corner-br {
          bottom: -1px;
          right: -1px;

          border-width: 0 2px 2px 0;
        }

        .enter-system-button:hover .button-corner {
          width: 16px;
          height: 16px;
        }

        /* ==================================
           BOTTOM STATUS ENTRANCE
        ================================== */

        .hero-bottom-left,
        .hero-bottom-right {
          opacity: 0;

          animation:
            bottom-reveal
            700ms
            ease-out
            2700ms
            forwards;
        }

        @keyframes bottom-reveal {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        /* ==================================
           ACCESSIBILITY
        ================================== */

        @media (
          prefers-reduced-motion: reduce
        ) {
          .hero-status,
          .hero-specialization,
          .name-word,
          .hero-divider-line,
          .hero-divider-point,
          .tagline-first,
          .tagline-second,
          .hero-button-container,
          .hero-bottom-left,
          .hero-bottom-right {
            animation: none !important;

            opacity: 1 !important;
            filter: none !important;

            transform: none !important;
          }

          .hero-divider-point {
            display: none;
          }

          .system-indicator,
          .button-scan {
            animation: none !important;
          }

          .hero-overlay {
            transition: none;
          }
        }

        /* ==================================
           MOBILE ADJUSTMENTS
        ================================== */

        @media (max-width: 640px) {
          .hero-name {
            max-width: 95vw;
            letter-spacing: .008em;
          }

          .hero-divider {
            width: 240px;
          }

          .hero-tagline {
            font-size: 14px;
            line-height: 1.75;
          }

          .enter-system-button {
            min-height: 50px;
            padding: 13px 19px;

            font-size: 10px;

            letter-spacing: .19em;
          }
        }

      `}</style>
    </div>
  );
}