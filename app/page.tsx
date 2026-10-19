"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Experience from "@/components/3d/Experience";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import JarvisVoiceDock from "@/components/voice/JarvisVoiceDock";
import JarvisChat from "@/components/chat/JarvisChat";
import JourneyIntro from "@/components/world/JourneyIntro";
import AdvancedTour from "@/components/world/AdvancedTour";
import { playReactorEntrySound } from "@/lib/audio/reactorSound";
import type { WorldSector } from "@/lib/world/worldGuide";

const RealisticReactorWorld = dynamic(() => import("@/components/world/RealisticReactorWorld"), {
  ssr: false,
  loading: () => <div className="intro-world-loading">PREPARING PHYSICAL WORLDSPACE…</div>,
});
type Section=WorldSector|"overview";
type Phase="intro"|"transition"|"world"|"dashboard";
const INTRO_DURATION_MS=15_000;
const PORTAL_DURATION_MS=1_800;

export default function Home(){
  const [phase,setPhase]=useState<Phase>("intro");
  const [elapsed,setElapsed]=useState(0);
  const [section,setSection]=useState<Section>("overview");

  useEffect(()=>{
    if(phase!=="intro")return;
    const started=performance.now();
    const update=window.setInterval(()=>setElapsed(Math.min(INTRO_DURATION_MS,performance.now()-started)),90);
    const timeout=window.setTimeout(()=>{setElapsed(INTRO_DURATION_MS);setPhase("transition");},INTRO_DURATION_MS);
    return ()=>{window.clearInterval(update);window.clearTimeout(timeout);};
  },[phase]);

  useEffect(()=>{
    if(phase!=="transition")return;
    // Browsers can block sound until the visitor clicks; visual entry never depends on sound.
    void playReactorEntrySound().catch(()=>{});
    const timeout=window.setTimeout(()=>{
      setPhase("world");
      window.dispatchEvent(new CustomEvent("jarvis:speak",{detail:{cue:"enter"}}));
    },PORTAL_DURATION_MS);
    return ()=>clearTimeout(timeout);
  },[phase]);

  useEffect(()=>{
    if(phase!=="dashboard")return;
    const t=setTimeout(()=>{
      document.getElementById(section)?.scrollIntoView({behavior:"smooth",block:"start"});
    },420);
    return ()=>clearTimeout(t);
  },[phase,section]);

  function openDashboard(next:Section){setSection(next);setPhase("dashboard");}
  function returnToWorld(){setPhase("world");window.scrollTo(0,0);}
  function replay(){setElapsed(0);setPhase("intro");window.scrollTo(0,0);}

  return <main className="jarvis-experience" style={{background:"#02060b",minHeight:"100svh"}}>
    {(phase==="intro"||phase==="transition")&&<section className={`entry-sequence ${phase==="transition"?"entry-transition":""}`}>
      <div className="entry-reactor"><Experience entering={phase==="transition"}/></div>
      <JourneyIntro elapsedMs={phase==="intro"?elapsed:INTRO_DURATION_MS} durationMs={INTRO_DURATION_MS} exiting={phase==="transition"}/>
      {phase==="transition"&&<div className="entry-portal-label">REACTOR SYNCHRONISED // ENTERING WORLDSPACE</div>}
    </section>}
    {phase==="world"&&<AdvancedTour onDashboard={openDashboard} onReplay={replay} />}
    {phase==="dashboard"&&<section className="classic-dashboard"><nav className="return-world"><button onClick={returnToWorld}>← RETURN TO 3D WORLD</button><button onClick={replay}>REPLAY INTRO</button></nav><PortfolioDashboard onExit={returnToWorld}/></section>}
    <JarvisVoiceDock />
    <JarvisChat active={phase==="world"||phase==="dashboard"}/>
    <style>{`
      .entry-sequence{position:relative;width:100%;height:100svh;min-height:500px;overflow:hidden;background:#01050a}.entry-reactor{position:absolute;inset:0;filter:brightness(.75) saturate(1.15);transition:transform 1.8s cubic-bezier(.14,.72,.13,1),filter 1.8s}.entry-transition .entry-reactor{transform:scale(2.8);filter:brightness(1.9) saturate(1.8)}.entry-sequence:after{content:'';position:absolute;z-index:6;inset:0;background:#aaf5ff;opacity:0;pointer-events:none}.entry-transition:after{animation:entryflash 1.8s ease-in-out both}.entry-portal-label{position:absolute;z-index:7;left:50%;top:52%;transform:translate(-50%,-50%);font:700 12px system-ui;letter-spacing:.25em;color:#e6fcff;text-align:center;text-shadow:0 0 24px #4ccaff;pointer-events:none}.classic-dashboard{min-height:100vh}.return-world{position:sticky;top:0;z-index:95;padding:12px 20px;display:flex;gap:10px;background:#061728f4;border-bottom:1px solid #3c95b677}.return-world button{cursor:pointer;border:1px solid #3e9cbe;background:#082a3e;color:#c1f0ff;padding:10px 18px;font-size:12px;letter-spacing:.09em}.return-world button:hover{background:#175071}.intro-world-loading{height:100svh;display:grid;place-items:center;background:#02080e;color:#95dff0;letter-spacing:.25em;font-size:13px}@keyframes entryflash{0%,25%{opacity:0}66%{opacity:.15}82%{opacity:.58}100%{opacity:0}}@media(prefers-reduced-motion:reduce){.entry-reactor{transition:none}.entry-transition:after{animation:none}}
    `}</style>
  </main>;
}
