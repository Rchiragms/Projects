"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useProgress } from "@react-three/drei";
import { SECTORS, WORLD_SECTORS, visitedWorldSectors, markWorldVisited, type WorldSector } from "@/lib/world/worldGuide";
import { playFacilityCue, startFacilityAmbience, stopFacilityAmbience, setFacilityMuted, isFacilityMuted } from "@/lib/audio/worldAudio";
import ControlsOverlay from "./ControlsOverlay";
import type { ControlHandles } from "./FacilityScene";
import "./world.css";

const FacilityScene=dynamic(()=>import("./FacilityScene"),{ssr:false});
type Section=WorldSector | "overview";
type Props={onDashboard:(section:Section)=>void;onReplay:()=>void};
const clamp=(x:number,min:number,max:number)=>Math.max(min,Math.min(max,x));

function Loading3D(){
  const {progress,active}=useProgress();
  return active?<div className="rw-load" role="status"><div className="rw-loader-spinner"/><strong>ASSEMBLING REACTOR FACILITY</strong><span>{Math.floor(progress)}% · OPTIMISING PHYSICAL ENVIRONMENT</span></div>:null;
}

export default function RealisticReactorWorld({onDashboard,onReplay}:Props){
  const keys=useRef(new Set<string>());
  const mouse=useRef({yaw:0,pitch:0});
  const touch=useRef({forward:0,strafe:0});
  const player=useRef({x:0,z:12,yaw:0,pitch:0});
  const handles:ControlHandles={keys,mouse,touch,player};
  const [guide,setGuide]=useState(true);
  const [firstGuide,setFirstGuide]=useState(true);
  const [map,setMap]=useState(false);
  const [room,setRoom]=useState<WorldSector|null>(null);
  const [near,setNear]=useState<WorldSector|null>(null);
  const [nearCore,setNearCore]=useState(false);
  const [coreOpen,setCoreOpen]=useState(false);
  const [completed,setCompleted]=useState(false);
  const [visited,setVisited]=useState<WorldSector[]>([]);
  const [sound,setSound]=useState(true);
  const [quality,setQuality]=useState<"high"|"low">("high");
  const [mobile,setMobile]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  const [pointerLocked,setPointerLocked]=useState(false);
  const [position,setPosition]=useState("00.0 / 12.0");
  const drag=useRef<{id:number;x:number;y:number}|null>(null);
  const statusRef=useRef({near:null as WorldSector|null, nearCore:false,guide:true,map:false,room:null as WorldSector|null,coreOpen:false});
  statusRef.current={near,nearCore,guide,map,room,coreOpen};

  useEffect(()=>{
    setVisited(visitedWorldSectors());
    setFacilityMuted(false);
    setMobile(window.matchMedia('(max-width:760px)').matches);
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // On weak devices, disable costly postprocessing by default.
    if(window.matchMedia('(max-width:760px)').matches)setQuality('low');
    const t=setInterval(()=>setPosition(`${player.current.x.toFixed(1)} / ${player.current.z.toFixed(1)}`),700);
    return ()=>clearInterval(t);
  },[]);

  const closeGuide=useCallback(()=>{
    setGuide(false);setFirstGuide(false);keys.current.clear();
    if(!isFacilityMuted()){startFacilityAmbience();playFacilityCue('activate');}
  },[]);
  const openGuide=useCallback(()=>{document.exitPointerLock?.();setGuide(true);setFirstGuide(false);keys.current.clear();},[]);
  const location=useCallback((sector:WorldSector|null,core:boolean)=>{setNear(sector);setNearCore(core);},[]);

  function openRoom(id:WorldSector){
    if(!isFacilityMuted())playFacilityCue(id==='mission'?'warning':'terminal');
    const next=markWorldVisited(id);setVisited(next);setRoom(id);setGuide(false);setMap(false);
    document.exitPointerLock?.();
    window.dispatchEvent(new CustomEvent('jarvis:speak',{detail:{cue:id}}));
  }
  function activateCore(){
    document.exitPointerLock?.();setCoreOpen(true);setMap(false);
    if(visited.length===WORLD_SECTORS.length){
      setCompleted(true);playFacilityCue('final');
      window.dispatchEvent(new CustomEvent('jarvis:speak',{detail:{cue:'evolutionComplete'}}));
    } else playFacilityCue('error');
  }
  function fastTravel(id:WorldSector){
    const s=SECTORS.find(d=>d.id===id)!;
    player.current.x=Math.sin(s.angle)*34.5;
    player.current.z=Math.cos(s.angle)*34.5;
    mouse.current.yaw=Math.PI-s.angle;mouse.current.pitch=0;
    setMap(false);setRoom(null);setCoreOpen(false);keys.current.clear();
    if(sound)playFacilityCue('portal');
  }
  function returnCore(){player.current.x=0;player.current.z=12;mouse.current.yaw=0;mouse.current.pitch=0;setMap(false);setRoom(null);setCoreOpen(false);}

  useEffect(()=>{
    function down(e:KeyboardEvent){
      const target=e.target;
      if(target instanceof HTMLElement&&(target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target.tagName)))return;
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
      if(['KeyM','KeyH','KeyJ','F1','Escape','KeyE'].includes(e.code)&&e.repeat)return;
      if(e.code==='F1')e.preventDefault();
      if(e.code==='Escape'){
        if(document.pointerLockElement){void document.exitPointerLock();return;}
        if(statusRef.current.room)setRoom(null);
        else if(statusRef.current.coreOpen)setCoreOpen(false);
        else if(statusRef.current.map)setMap(false);
        else if(statusRef.current.guide)closeGuide();
        else openGuide();
        return;
      }
      if(e.code==='KeyH'||e.code==='F1'){statusRef.current.guide?closeGuide():openGuide();return;}
      if(e.code==='KeyM'){setMap(v=>!v);setRoom(null);setCoreOpen(false);void document.exitPointerLock?.();return;}
      if(e.code==='KeyJ'){window.dispatchEvent(new Event('jarvis:open-chat'));void document.exitPointerLock?.();return;}
      if(e.code==='KeyE'&&!statusRef.current.guide&&!statusRef.current.map){
        if(statusRef.current.near)openRoom(statusRef.current.near);
        else if(statusRef.current.nearCore)activateCore();
        return;
      }
      if(!statusRef.current.guide&&!statusRef.current.map&&!statusRef.current.room&&!statusRef.current.coreOpen)keys.current.add(e.code);
    }
    function up(e:KeyboardEvent){keys.current.delete(e.code);}
    function blur(){keys.current.clear();touch.current.forward=0;touch.current.strafe=0;}
    function lockChange(){setPointerLocked(Boolean(document.pointerLockElement));}
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    document.addEventListener('pointerlockchange',lockChange);
    return ()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('pointerlockchange',lockChange);};
  // State used in handlers is always read from statusRef.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[visited,sound,closeGuide,openGuide]);

  useEffect(()=>{
    const move=(e:MouseEvent)=>{if(!document.pointerLockElement)return;mouse.current.yaw-=e.movementX*.0021;mouse.current.pitch=clamp(mouse.current.pitch-e.movementY*.0021,-1.22,1.22);};
    window.addEventListener('mousemove',move);
    return()=>window.removeEventListener('mousemove',move);
  },[]);
  useEffect(()=>()=>{stopFacilityAmbience();document.exitPointerLock?.();},[]);

  const active=!guide&&!map&&!room&&!coreOpen;
  const enabled=visited.length===WORLD_SECTORS.length;
  const current=SECTORS.find(s=>s.id===room);

  return <main className="rw-root" aria-label="Explorable 3D JARVIS Reactor Facility">
    <Suspense fallback={null}>
      <FacilityScene handles={handles} active={active} quality={quality} reducedMotion={reducedMotion} onLocation={location}/>
    </Suspense>
    <Loading3D/>
    <div className="rw-capture" aria-label="First-person 3D movement area" onPointerDown={e=>{
      if(!active)return;
      if(sound)startFacilityAmbience();
      if(e.pointerType==='mouse'&&e.button===0&&e.currentTarget.requestPointerLock){try{const request=e.currentTarget.requestPointerLock();if(request&&typeof request.catch==='function')void request.catch(()=>{});}catch{}}
      else {drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}
    }} onPointerMove={e=>{
      if(!active||pointerLocked||drag.current?.id!==e.pointerId)return;
      mouse.current.yaw-=(e.clientX-drag.current.x)*(mobile?.006:.003);
      mouse.current.pitch=clamp(mouse.current.pitch-(e.clientY-drag.current.y)*(mobile?.005:.003),-1.22,1.22);
      drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};
    }} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}/>
    <div className="rw-crosshair" aria-hidden="true"><i/><i/><i/><i/></div>
    <header className="rw-header"><div className="rw-identity"><span className="rw-led"/><div><b>J.A.R.V.I.S. / IMMERSIVE WORLD</b><small>CHIRAG NAYAKA M S · ENGINEER / DATA SCIENTIST</small></div></div><div className="rw-actions"><button onClick={()=>{setMap(v=>!v);void document.exitPointerLock?.();}}>MAP <kbd>M</kbd></button><button onClick={()=>{void document.exitPointerLock?.();window.dispatchEvent(new Event('jarvis:open-chat'));}}>JARVIS <kbd>J</kbd></button><button onClick={openGuide}>HELP <kbd>H</kbd></button></div></header>
    <aside className="rw-upper-hud"><span>FACILITY SYSTEMS <b>ONLINE</b></span><span>POSITION {position}</span><span>SCENE QUALITY <button className="rw-mini" onClick={()=>setQuality(q=>q==='high'?'low':'high')}>{quality.toUpperCase()}</button></span></aside>
    <aside className="rw-progress"><strong>WORLD PROGRESS</strong><div className="rw-progress-count"><b>{visited.length}</b><span>/ 06</span></div><div className="rw-progress-track"><i style={{width:`${visited.length/6*100}%`}}/></div><span>{enabled?'FINAL REACTOR UNLOCKED':'EXPLORE ALL SECTORS'}</span></aside>
    <footer className="rw-footer"><div className="rw-footer-left">WASD MOVE <span>•</span> MOUSE LOOK <span>•</span> E INTERACT <span>•</span> SHIFT SPRINT</div><div className="rw-footer-buttons"><button onClick={()=>{setSound(v=>{setFacilityMuted(v);if(!v)startFacilityAmbience();return !v;});}}>{sound?'AMBIENCE ON':'AMBIENCE OFF'}</button><button onClick={()=>onDashboard('overview')}>FULL PORTFOLIO ↗</button></div></footer>
    {active&&near&&<button className="rw-interact" onClick={()=>openRoom(near!)}><span className="rw-interact-key">E</span><span>ACCESS {SECTORS.find(s=>s.id===near)?.name}</span><span>→</span></button>}
    {active&&!near&&nearCore&&<button className="rw-interact" onClick={activateCore}><span className="rw-interact-key">E</span><span>{enabled?'ACTIVATE FINAL ARC REACTOR':'INSPECT MAIN ARC REACTOR'}</span><span>→</span></button>}
    {active&&!near&&!nearCore&&<span className="rw-look-prompt">{pointerLocked?'ESC RELEASES CURSOR':'CLICK THE WORLD TO LOOK AROUND'}</span>}
    {room&&current&&<div className="rw-modal-backdrop"><section className="rw-terminal" role="dialog" aria-modal="true" aria-label={`${current.name} room terminal`}><div className="rw-kicker">PHYSICAL TERMINAL // {String(SECTORS.indexOf(current)+1).padStart(2,'0')}</div><button className="rw-x" onClick={()=>setRoom(null)} aria-label="Close">×</button><h2 style={{color:current.accent}}>{current.name}</h2><p>{current.summary}</p><p className="rw-caption">Sector successfully logged in your exploration record. Open the complete dashboard section for details and interactive content.</p><div className="rw-training-actions"><button className="rw-primary" onClick={()=>onDashboard(current.id)}>OPEN {current.id==='mission'?'ULTRON MISSION':'PORTFOLIO DOSSIER'} ↗</button><button onClick={()=>setRoom(null)}>CONTINUE WALKING</button></div></section></div>}
    {coreOpen&&<div className="rw-modal-backdrop"><section className="rw-terminal rw-final" role="dialog" aria-modal="true" aria-label="Arc reactor finale"><div className="rw-kicker">FINAL DESTINATION / MAIN ARC REACTOR</div><button className="rw-x" onClick={()=>setCoreOpen(false)} aria-label="Close">×</button><h2>{enabled?'REACTOR SEQUENCE COMPLETE':'CORE ACCESS LOCKED'}</h2><p>{enabled?'All six sectors have been explored. Your journey through Chirag’s technical universe is complete. The reactor is online.':`You have opened ${visited.length}/6 terminals. Visit the remaining sectors, then return to the central Arc Reactor to complete your journey.`}</p><div className="rw-training-actions"><button className="rw-primary" onClick={()=>{setCoreOpen(false);setMap(true);}}>OPEN WORLD MAP</button>{completed&&<button onClick={()=>onDashboard('overview')}>FULL PORTFOLIO ↗</button>}<button onClick={()=>setCoreOpen(false)}>RETURN TO WORLD</button></div></section></div>}
    {map&&<div className="rw-modal-backdrop"><section className="rw-map" role="dialog" aria-modal="true" aria-label="Holographic world map"><div className="rw-map-head"><div><div className="rw-kicker">JARVIS // NAVIGATION MATRIX</div><h2>CHOOSE YOUR DESTINATION</h2></div><button className="rw-x-inline" onClick={()=>setMap(false)}>CLOSE ×</button></div><div className="rw-map-grid">{SECTORS.map((s,i)=><button key={s.id} onClick={()=>fastTravel(s.id)} style={{['--rw-accent' as string]:s.accent}}><b>{String(i+1).padStart(2,'0')}</b><div><strong>{s.name}</strong><small>{s.summary}</small></div><span>{visited.includes(s.id)?'VISITED':'UNEXPLORED'} ↗</span></button>)}</div><div className="rw-map-bottom"><p><b>FINAL DESTINATION:</b> Central reactor — complete all six sectors.</p><button onClick={returnCore}>RETURN TO ATRIUM ↗</button></div></section></div>}
    <ControlsOverlay open={guide} first={firstGuide} onClose={closeGuide} onDashboard={()=>onDashboard('overview')}/>
    {mobile&&active&&<div className="rw-mobile-controls"><div className="rw-movement"><button onPointerDown={()=>touch.current.forward=1} onPointerUp={()=>touch.current.forward=0} onPointerLeave={()=>touch.current.forward=0}>↑</button><div><button onPointerDown={()=>touch.current.strafe=-1} onPointerUp={()=>touch.current.strafe=0} onPointerLeave={()=>touch.current.strafe=0}>←</button><button onPointerDown={()=>touch.current.forward=-1} onPointerUp={()=>touch.current.forward=0} onPointerLeave={()=>touch.current.forward=0}>↓</button><button onPointerDown={()=>touch.current.strafe=1} onPointerUp={()=>touch.current.strafe=0} onPointerLeave={()=>touch.current.strafe=0}>→</button></div></div><div className="rw-mobile-right"><span>DRAG SCREEN TO LOOK</span>{near&&<button onClick={()=>openRoom(near!)}>INTERACT</button>}{nearCore&&!near&&<button onClick={activateCore}>CORE</button>}</div></div>}
    <button className="rw-replay" onClick={onReplay} title="Replay cinematic biography">REPLAY INTRO</button>
  </main>;
}
