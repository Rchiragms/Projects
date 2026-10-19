"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SECTORS, type WorldSector } from "@/lib/world/worldGuide";
import SectorInstallations from "./SectorInstallations";
import { playFacilityCue, setFacilitySpatialMix } from "@/lib/audio/worldAudio";

export type PositionHandle = { x:number; z:number; yaw:number; pitch:number };
export type ControlHandles = {
  keys: React.RefObject<Set<string>>;
  mouse: React.RefObject<{yaw:number; pitch:number}>;
  touch: React.RefObject<{forward:number;strafe:number}>;
  player: React.RefObject<PositionHandle>;
};
type SceneProps = {
  handles: ControlHandles;
  active: boolean;
  quality: "high"|"low";
  reducedMotion: boolean;
  onLocation: (zone: WorldSector|null, nearCore: boolean) => void;
};

const CAMERA_HEIGHT=1.74;
function isWalkable(x:number,z:number) {
  const radius=Math.hypot(x,z);
  if(radius<4.75)return false; // Actual reactor machinery is solid.
  if(radius<16.65)return true;
  return SECTORS.some(sector=>{
    const a=sector.angle;
    const lx=x*Math.cos(a)-z*Math.sin(a);
    const lz=x*Math.sin(a)+z*Math.cos(a);
    return (Math.abs(lx)<2.72 && lz>15.4 && lz<30.4)
      || (Math.abs(lx)<6.95 && lz>=28.45 && lz<40.6);
  });
}

function EnvironmentLighting({quality}:{quality:"high"|"low"}) {
  const {gl,scene}=useThree();
  useEffect(()=>{
    const environment=new RoomEnvironment();
    const generator=new THREE.PMREMGenerator(gl);
    const target=generator.fromScene(environment,0.03);
    const previous=scene.environment;
    scene.environment=target.texture;
    scene.environmentIntensity=quality==='high'?0.85:0.5;
    return ()=>{scene.environment=previous;target.dispose();generator.dispose();environment.dispose();};
  },[gl,scene,quality]);
  return null;
}

function Architecture() {
  const {scene}=useGLTF("/world/reactor_facility.glb");
  const clone=useMemo(()=>scene.clone(true),[scene]);
  useEffect(()=>{
    clone.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const original=object.material as THREE.MeshStandardMaterial;
      const mat=original.clone();
      const tag=object.name.toLowerCase();
      if(tag.includes('blue')){mat.emissive=new THREE.Color('#23aaff');mat.emissiveIntensity=2.9;mat.metalness=0.15;mat.toneMapped=false;}
      if(tag.includes('red')){mat.emissive=new THREE.Color('#ff253b');mat.emissiveIntensity=3;mat.toneMapped=false;}
      if(tag.includes('amber')){mat.emissive=new THREE.Color('#9c581b');mat.emissiveIntensity=.72;}
      if(tag.includes('glass')){mat.emissive=new THREE.Color('#0b4055');mat.emissiveIntensity=.18;mat.transparent=true;mat.opacity=.63;mat.depthWrite=false;}
      mat.needsUpdate=true;object.material=mat;
      object.receiveShadow=tag.includes('deck')||tag.includes('steel');
      object.castShadow=false; // 2,000+ small architectural elements are batched for performance.
    });
    return ()=>clone.traverse(o=>{if(o instanceof THREE.Mesh)(o.material as THREE.Material).dispose();});
  },[clone]);
  return <primitive object={clone} />;
}

function MetallicFloors() {
  const textures=useTexture([
    "/world/floor_albedo.jpg",
    "/world/floor_normal.jpg",
    "/world/floor_roughness.jpg",
  ]);
  useMemo(()=>{
    textures.forEach((t,i)=>{t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,7);t.anisotropy=4;t.needsUpdate=true;if(i===0)t.colorSpace=THREE.SRGBColorSpace;});
  },[textures]);
  const mat=<meshStandardMaterial map={textures[0]} normalMap={textures[1]} normalScale={new THREE.Vector2(.4,.4)} roughnessMap={textures[2]} metalness={.74} roughness={.65} envMapIntensity={.85}/>;
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.011,0]} receiveShadow><circleGeometry args={[17.8,100]}/>{mat}</mesh>
    {SECTORS.map(s=><group key={s.id} rotation={[0,s.angle,0]}>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.028,22.95]} receiveShadow><planeGeometry args={[6.9,14.7]}/>{mat}</mesh>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,.028,35.15]} receiveShadow><planeGeometry args={[15.7,13.4]}/>{mat}</mesh>
    </group>)}
  </>;
}

function CoreAssembly({reducedMotion}:{reducedMotion:boolean}) {
  const group=useRef<THREE.Group>(null);
  const inner=useRef<THREE.Group>(null);
  const rings=useRef<THREE.Group>(null);
  useFrame(({clock},delta)=>{
    if(reducedMotion)return;
    const t=clock.getElapsedTime();
    if(group.current)group.current.rotation.y+=delta*.11;
    if(inner.current){inner.current.rotation.y-=delta*.25;inner.current.position.y=5.45+Math.sin(t*1.15)*.08;}
    if(rings.current)rings.current.rotation.z=Math.sin(t*.13)*.18;
  });
  return <group position={[0,0,0]}>
    <group ref={group} position={[0,5.55,0]}>
      {Array.from({length:16},(_,i)=><group rotation={[0,i*Math.PI/8,0]} key={i}>
        <mesh position={[0,0,2.11]}><boxGeometry args={[.27,4.5,.24]}/><meshPhysicalMaterial color="#8d9aa4" metalness={.97} roughness={.23}/></mesh>
        <mesh position={[0,.1,2.04]}><boxGeometry args={[.11,3.75,.12]}/><meshBasicMaterial color="#8feaff" toneMapped={false}/></mesh>
        <mesh position={[0,-2.15,2.18]}><boxGeometry args={[.5,.37,.75]}/><meshStandardMaterial color="#1f323c" metalness={.9} roughness={.3}/></mesh>
      </group>)}
    </group>
    <group ref={rings} position={[0,5.6,0]}>
      <mesh rotation={[1.2,0,.35]}><torusGeometry args={[2.25,.09,10,96]}/><meshStandardMaterial color="#8097a3" metalness={.95} roughness={.22} emissive="#174861" emissiveIntensity={.55}/></mesh>
      <mesh rotation={[.5,0,1.12]}><torusGeometry args={[1.9,.075,10,96]}/><meshBasicMaterial color="#58caff" toneMapped={false}/></mesh>
      <mesh rotation={[1.8,.6,0]}><torusGeometry args={[1.66,.038,7,96]}/><meshBasicMaterial color="#cdf7ff" toneMapped={false}/></mesh>
    </group>
    <group ref={inner} position={[0,5.45,0]}>
      <mesh><icosahedronGeometry args={[.9,4]}/><meshPhysicalMaterial color="#b5edff" emissive="#4ecfff" emissiveIntensity={4.1} roughness={.07} transmission={.08} thickness={.7} metalness={.15} toneMapped={false}/></mesh>
      <mesh><icosahedronGeometry args={[1.25,2]}/><meshBasicMaterial color="#35c7ff" wireframe transparent opacity={.42} depthWrite={false} toneMapped={false}/></mesh>
      <pointLight color="#4cbfff" intensity={120} distance={23} decay={2}/>
    </group>
    <mesh position={[0,1.8,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[3.5,4.8,96]}/><meshBasicMaterial color="#37c9ff" side={THREE.DoubleSide} toneMapped={false}/></mesh>
  </group>;
}

function createSign(title:string,subtitle:string,accent:string) {
  const c=document.createElement('canvas');c.width=1024;c.height=420;
  const ctx=c.getContext('2d');
  if(ctx){
    ctx.fillStyle='#030b13';ctx.fillRect(0,0,c.width,c.height);
    const grad=ctx.createLinearGradient(0,0,1024,0);grad.addColorStop(0,accent);grad.addColorStop(.55,'#b9dce5');grad.addColorStop(1,accent);
    ctx.strokeStyle=grad;ctx.lineWidth=8;ctx.strokeRect(12,12,1000,396);
    ctx.fillStyle=accent;ctx.fillRect(42,45,140,8);ctx.fillRect(42,365,875,3);
    ctx.font='bold 56px Arial, sans-serif';ctx.fillText(title,47,181,925);
    ctx.fillStyle='#c3d6df';ctx.font='29px Arial, sans-serif';ctx.fillText(subtitle,49,243,930);
    ctx.strokeStyle='#23505a';ctx.lineWidth=2;
    for(let x=45;x<980;x+=37){ctx.beginPath();ctx.moveTo(x,290);ctx.lineTo(x,318);ctx.stroke();}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  return t;
}
function SectorSign({title,subtitle,accent,position,width=4.6}: {title:string;subtitle:string;accent:string;position:[number,number,number];width?:number}) {
  const texture=useMemo(()=>createSign(title,subtitle,accent),[title,subtitle,accent]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={position} rotation={[0,Math.PI,0]}><planeGeometry args={[width,width*.41]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function SectorMarkings() {
  return <>
    {SECTORS.map(s=><group key={s.id} rotation={[0,s.angle,0]}>
      <SectorSign title={s.name} subtitle="PORTFOLIO SECTOR / TERMINAL ACTIVE" accent={s.accent} position={[0,6.5,15.29]} width={5.0}/>
      <SectorSign title={s.name} subtitle="PRESS E TO ACCESS DOSSIER" accent={s.accent} position={[0,2.4,39.38]} width={3.1}/>
      <pointLight position={[0,7.6,17.9]} color={s.id==='mission'?'#ff2441':'#3fb9e7'} intensity={35} distance={13} decay={2}/>
    </group>)}
  </>;
}

function PhysicalCamera({handles,active,reducedMotion,onLocation}: Pick<SceneProps,"handles"|"active"|"reducedMotion"|"onLocation">) {
  const {camera}=useThree();
  const velocity=useRef(new THREE.Vector3());
  const elapsed=useRef(0);
  const footstep=useRef(0);
  const lastSector=useRef<WorldSector|null>(null);
  const lastCore=useRef(false);
  const smoothPos=useRef(new THREE.Vector3(handles.player.current.x,CAMERA_HEIGHT,handles.player.current.z));
  useFrame((state,dt)=>{
    const d=Math.min(dt,.04);
    const p=handles.player.current;
    const mouse=handles.mouse.current;
    const desired=new THREE.Vector3();
    const k=handles.keys.current;
    const touch=handles.touch.current;
    if(active){
      const moveF=(k.has('KeyW')?1:0)-(k.has('KeyS')?1:0)+touch.forward;
      const moveR=(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0)+touch.strafe;
      desired.set(Math.cos(mouse.yaw)*moveR+Math.sin(mouse.yaw)*moveF,0,Math.sin(mouse.yaw)*moveR-Math.cos(mouse.yaw)*moveF);
      if(desired.lengthSq()>1)desired.normalize();
      const speed=k.has('ShiftLeft')||k.has('ShiftRight')?7.1:4.2;
      desired.multiplyScalar(speed);
    }
    const friction=1-Math.exp(-11*d);
    velocity.current.lerp(desired,friction);
    const nx=p.x+velocity.current.x*d,nz=p.z+velocity.current.z*d;
    if(isWalkable(nx,nz)){p.x=nx;p.z=nz;}
    else {
      if(isWalkable(nx,p.z))p.x=nx;
      else if(isWalkable(p.x,nz))p.z=nz;
      velocity.current.multiplyScalar(.18);
    }
    const moving=active&&velocity.current.lengthSq()>.5;
    elapsed.current+=d;
    footstep.current-=d;
    if(moving&&footstep.current<=0){playFacilityCue('footstep');footstep.current=(k.has('ShiftLeft')?0.32:.53);}
    const bob=!reducedMotion&&moving?Math.sin(elapsed.current*(k.has('ShiftLeft')?14:10))*.026:0;
    smoothPos.current.lerp(new THREE.Vector3(p.x,CAMERA_HEIGHT+bob,p.z),1-Math.exp(-18*d));
    camera.position.copy(smoothPos.current);
    camera.rotation.order='YXZ';
    camera.rotation.y=mouse.yaw;camera.rotation.x=mouse.pitch;
    p.yaw=mouse.yaw;p.pitch=mouse.pitch;
    setFacilitySpatialMix(p.x,p.z,mouse.yaw);
    if(Math.floor(state.clock.elapsedTime*5)!==Math.floor((state.clock.elapsedTime-d)*5)){
      let zone:WorldSector|null=null;
      for(const s of SECTORS){const x=p.x*Math.cos(s.angle)-p.z*Math.sin(s.angle),z=p.x*Math.sin(s.angle)+p.z*Math.cos(s.angle);if(Math.abs(x)<4.8 && z>35.4 && z<41){zone=s.id;break;}}
      const nearCore=Math.hypot(p.x,p.z)<7.9;
      if(zone!==lastSector.current||nearCore!==lastCore.current){lastSector.current=zone;lastCore.current=nearCore;onLocation(zone,nearCore);}
    }
  });
  return null;
}

function FullWorld({handles,active,quality,reducedMotion,onLocation}:SceneProps) {
  return <>
    <color attach="background" args={["#040910"]}/>
    <fogExp2 attach="fog" args={["#06101a",quality==='high'?.010:.017]}/>
    <EnvironmentLighting quality={quality}/>
    <hemisphereLight intensity={.8} color="#8fb6cd" groundColor="#0a0c13"/>
    <ambientLight intensity={.26}/>
    <spotLight position={[13,19,11]} angle={.75} intensity={210} distance={54} penumbra={.8} castShadow={quality==='high'} shadow-mapSize-width={1024} shadow-mapSize-height={1024} color="#9dbbd5"/>
    <spotLight position={[-12,16,-7]} angle={.68} intensity={135} distance={39} color="#93cae8" penumbra={.8}/>
    <Architecture/>
    <MetallicFloors/>
    <CoreAssembly reducedMotion={reducedMotion}/>
    <SectorMarkings/>
    <SectorInstallations/>
    <PhysicalCamera handles={handles} active={active} reducedMotion={reducedMotion} onLocation={onLocation}/>
    {quality==='high'&&<EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom intensity={.85} luminanceThreshold={1.1} luminanceSmoothing={.55} mipmapBlur/>
      <Vignette eskil={false} offset={.22} darkness={.5}/>
    </EffectComposer>}
  </>;
}

export default function FacilityScene(props:SceneProps){
  return <Canvas
    dpr={props.quality==='high'?[1,1.55]:[1,1.0]}
    shadows={props.quality==='high'}
    gl={{antialias:props.quality==='low',powerPreference:'high-performance',alpha:false}}
    camera={{position:[0,CAMERA_HEIGHT,12],fov:72,near:.06,far:115}}
    onCreated={({gl})=>{gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.05;}}
    style={{width:'100%',height:'100%',display:'block'}}
    fallback={<div role="alert">WebGL is unavailable. Use the classic portfolio dashboard.</div>}
  >
    <Suspense fallback={null}><FullWorld {...props}/></Suspense>
  </Canvas>;
}
