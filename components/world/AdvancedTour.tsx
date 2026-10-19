/*
  AdvancedTour.tsx – New cinematic tour component.
  It builds on the existing RealisticReactorWorld but adds:
  • Catmull‑Rom spline camera paths for each sector (shuttle/chamber).
  • A simple state machine (AUTO, PAUSE, FREE_ROAM).
  • UI hooks for button‑driven navigation.
  • Emits custom events (jarvis:tour:*) so the chat and voice system stay in sync.

  The implementation keeps the original controls (WASD, mouse look) as a fallback
  when the user switches to FREE_ROAM.
*/

"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3, Quaternion } from "three";
import { SECTORS, WorldSector } from "@/lib/world/worldGuide";
import ControlsOverlay from "./ControlsOverlay";
import FacilityScene from "./FacilityScene"; // Re‑use existing scene geometry
import { startFacilityAmbience, playFacilityCue } from "@/lib/audio/worldAudio";

// ---------------------------------------------------------------------------
// Helper – generate a simple spline for each sector based on its polar angle.
// The facility is a circular atrium; each sector lies on the circumference.
// ---------------------------------------------------------------------------
function makeSectorPath(sectorId: WorldSector): CatmullRomCurve3 {
  const sector = SECTORS.find(s => s.id === sectorId)!;
  const radius = 34.5; // same as fastTravel in RealisticReactorWorld
  const angle = sector.angle;
  // Define three points: start (center), mid (corridor), end (room entrance)
  const start = new Vector3(0, 2, 12); // initial camera height
  const mid = new Vector3(Math.sin(angle) * radius * 0.5, 2, Math.cos(angle) * radius * 0.5);
  const end = new Vector3(Math.sin(angle) * radius, 2, Math.cos(angle) * radius);
  // Add a slight lift for cinematic feel
  mid.y += 0.8;
  end.y += 1.2;
  return new CatmullRomCurve3([start, mid, end]);
}

// ---------------------------------------------------------------------------
// Tour state machine.
// ---------------------------------------------------------------------------
type TourMode = "AUTO" | "PAUSE" | "FREE_ROAM";

export default function AdvancedTour({onDashboard, onReplay}: {onDashboard: (s: any) => void; onReplay: () => void;}) {
  const {camera, gl} = useThree();
  const [mode, setMode] = useState<TourMode>("AUTO");
  const [targetSector, setTargetSector] = useState<WorldSector | null>(null);
  const [progress, setProgress] = useState(0); // 0‑1 along current spline
  const pathRef = useRef<CatmullRomCurve3 | null>(null);
  const lastTimestamp = useRef<number>(0);

  // -----------------------------------------------------------------------
  // Start a travel to a sector (called by UI buttons)
  // -----------------------------------------------------------------------
  const startTravel = useCallback((sectorId: WorldSector) => {
    setTargetSector(sectorId);
    setMode("AUTO");
    setProgress(0);
    pathRef.current = makeSectorPath(sectorId);
    // Notify JARVIS
    window.dispatchEvent(new CustomEvent("jarvis:speak", {detail: {cue: sectorId}}));
    // Play a subtle portal sound
    playFacilityCue("portal");
  }, []);

  // -----------------------------------------------------------------------
  // Frame loop – move camera along the spline while in AUTO mode.
  // -----------------------------------------------------------------------
  useFrame((_, delta) => {
    if (mode !== "AUTO" || !pathRef.current) return;
    const speed = 0.12; // controls cinematic pacing (units per second)
    const newProg = Math.min(1, progress + speed * delta);
    setProgress(newProg);
    const pos = pathRef.current!.getPointAt(newProg);
    const tang = pathRef.current!.getTangentAt(newProg);
    // Position camera
    camera.position.copy(pos);
    // Orient camera to look forward along the path
    const lookAt = pos.clone().add(tang);
    camera.lookAt(lookAt);
    // On arrival, pause briefly then open the sector terminal
    if (newProg >= 1) {
      setMode("PAUSE");
      // Emit event for UI overlay to display the terminal
      window.dispatchEvent(new CustomEvent("jarvis:sector-arrived", {detail: {sector: targetSector}}));
      // Auto‑open the room after a short delay
      setTimeout(() => {
        // Trigger same logic as RealisticReactorWorld.openRoom
        const event = new CustomEvent("jarvis:open-room", {detail: {sector: targetSector}});
        window.dispatchEvent(event);
        setMode("FREE_ROAM"); // allow user to explore after arriving
      }, 1500);
    }
  });

  // -----------------------------------------------------------------------
  // UI callbacks – expose to ControlsOverlay via context (simplified here).
  // -----------------------------------------------------------------------
  const pause = () => setMode("PAUSE");
  const resume = () => setMode("FREE_ROAM");
  const freeRoam = () => setMode("FREE_ROAM");

  // -----------------------------------------------------------------------
  // Effect – start ambient sound when entering FREE_ROAM.
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (mode === "FREE_ROAM") startFacilityAmbience();
  }, [mode]);

  // -----------------------------------------------------------------------
  // Render – the 3D scene + on‑screen button panel.
  // -----------------------------------------------------------------------
  return (
    <>
      {/* The 3D facility geometry – reuse existing scene with active flag */}
      <FacilityScene active={mode !== "AUTO"} />

      {/* Simple overlay UI for sector navigation */}
      <div className="tour-controls" style={styles.controls}>
        {SECTORS.map(s => (
          <button key={s.id} onClick={() => startTravel(s.id as WorldSector)} style={styles.button}>
            {s.name}
          </button>
        ))}
        <button onClick={pause} style={styles.button}>Pause</button>
        <button onClick={resume} style={styles.button}>Resume</button>
        <button onClick={freeRoam} style={styles.button}>Free‑Roam</button>
        <button onClick={onReplay} style={styles.button}>Replay Intro</button>
        <button onClick={() => onDashboard("overview")} style={styles.button}>Full Portfolio ↗</button>
      </div>

      {/* Re‑use the existing ControlsOverlay for help, map, chat etc. */}
      <ControlsOverlay open={mode !== "AUTO"} first={true} onClose={() => setMode("PAUSE")} onDashboard={() => onDashboard("overview")} />
    </>
  );
}

const styles = {
  controls: {
    position: "absolute" as const,
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    background: "rgba(0,0,0,0.5)",
    padding: "8px 12px",
    borderRadius: "4px",
    zIndex: 100,
  },
  button: {
    background: "#082a3e",
    color: "#c1f0ff",
    border: "1px solid #3e9cbe",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
};
