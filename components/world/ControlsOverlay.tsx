"use client";
import { useEffect, useState } from 'react';

type Props={open:boolean;first:boolean;onClose:()=>void;onDashboard:()=>void;};
export default function ControlsOverlay({open,first,onClose,onDashboard}:Props){
 const [remaining,setRemaining]=useState(22);
 useEffect(()=>{
   if(!open||!first)return;
   const start=Date.now();setRemaining(22);
   const interval=window.setInterval(()=>setRemaining(Math.max(0,22-Math.floor((Date.now()-start)/1000))),300);
   const timer=window.setTimeout(onClose,22000);
   return ()=>{clearInterval(interval);clearTimeout(timer);};
 },[open,first,onClose]);
 if(!open)return null;
 return <div className="rw-modal-backdrop" role="presentation"><section className="rw-training" role="dialog" aria-modal="true" aria-label="How to explore JARVIS world">
  <div className="rw-kicker">J.A.R.V.I.S. // HOLOGRAPHIC NAVIGATION TRAINING</div>
  <h2>YOU ARE INSIDE THE SYSTEM.</h2>
  <p>Welcome to Chirag's immersive portfolio. Explore six real rooms, interact with their terminals, then return to the central Arc Reactor Core to finish your journey.</p>
  <div className="rw-control-grid">
   {[["W A S D","WALK / STRAFE"],["MOUSE","LOOK AROUND"],["SHIFT","SPRINT"],["E","ACCESS TERMINAL"],["M","MAP / FAST TRAVEL"],["J","OPEN JARVIS"],["H / F1","REOPEN THIS GUIDE"],["ESC","RELEASE MOUSE / HELP"]].map(([key,desc])=><div key={key}><kbd>{key}</kbd><span>{desc}</span></div>)}
  </div>
  <p className="rw-note">Desktop: click the world to capture your mouse, or drag to look. Mobile: use the virtual movement controls and drag the view. Sound begins after your first interaction due to browser restrictions.</p>
  {first&&<div className="rw-countdown">AUTO-DISMISS IN <b>{remaining}</b> SECONDS</div>}
  <div className="rw-training-actions"><button className="rw-primary" onClick={onClose}>START EXPLORING <span>→</span></button><button onClick={onDashboard}>OPEN CLASSIC PORTFOLIO</button></div>
 </section></div>;
}
