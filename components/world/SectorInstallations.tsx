"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SECTORS } from "@/lib/world/worldGuide";

function IdentityExhibit() {
  const images=useTexture(['/journey/mysore.webp','/journey/engineering.webp','/journey/glasgow.webp']);
  images.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;});
  return <group>
    {images.map((t,i)=><group position={[(i-1)*4.2,5.4,41.28]} key={i}>
      <mesh rotation={[0,Math.PI,0]}><planeGeometry args={[2.25,3.12]}/><meshBasicMaterial map={t} toneMapped={false}/></mesh>
      <mesh position={[0,0,-.05]}><boxGeometry args={[2.42,3.32,.10]}/><meshStandardMaterial color="#344d61" metalness={.94} roughness={.24}/></mesh>
      <mesh position={[0,-1.64,-.12]}><boxGeometry args={[2.42,.055,.1]}/><meshBasicMaterial color="#5bd4ff" toneMapped={false}/></mesh>
    </group>)}
  </group>;
}

function TechExhibit() {
  const group=useRef<THREE.Group>(null);
  useFrame((_,d)=>{if(group.current)group.current.rotation.y+=d*.24;});
  return <group position={[-4.25,4.3,33]}>
    <mesh position={[0,-2.45,0]}><cylinderGeometry args={[2.2,2.5,.5,12]}/><meshStandardMaterial color="#233945" metalness={.9} roughness={.33}/></mesh>
    <group ref={group}>
      <mesh><boxGeometry args={[1.8,1.8,1.8]}/><meshPhysicalMaterial color="#203849" metalness={.9} roughness={.18} emissive="#0a5e63" emissiveIntensity={.36}/></mesh>
      <mesh><boxGeometry args={[2.1,2.1,2.1]}/><meshBasicMaterial color="#83ffc9" wireframe transparent opacity={.72} toneMapped={false}/></mesh>
      {Array.from({length:8},(_,i)=><mesh key={i} rotation={[0,i*Math.PI/4,0]} position={[0,0,1.13]}><boxGeometry args={[.18,.78,.08]}/><meshBasicMaterial color="#a4ffdd" toneMapped={false}/></mesh>)}
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.65,.04,8,64]}/><meshBasicMaterial color="#a3fff5" toneMapped={false}/></mesh>
    </group>
    <pointLight color="#72ffc7" intensity={22} distance={10}/>
  </group>;
}
function ProjectExhibit() {
  const turbine=useRef<THREE.Group>(null);
  useFrame((_,d)=>{if(turbine.current)turbine.current.rotation.z+=d*.4;});
  return <group position={[4.3,3.3,33]} rotation={[0,-.38,0]}>
    <mesh position={[0,-1.9,0]}><boxGeometry args={[4,1.1,2.7]}/><meshStandardMaterial color="#263946" metalness={.9} roughness={.3}/></mesh>
    <mesh><cylinderGeometry args={[1.65,1.65,1.6,48]}/><meshStandardMaterial color="#677984" metalness={.95} roughness={.22}/></mesh>
    <group ref={turbine} rotation={[Math.PI/2,0,0]} position={[0,0,1.02]}>
      <mesh><cylinderGeometry args={[.55,.55,.28,24]}/><meshStandardMaterial color="#8cadb9" metalness={.96} roughness={.25}/></mesh>
      {Array.from({length:14},(_,i)=><mesh key={i} rotation={[0,i*Math.PI/7,0]} position={[0,0,0]}><boxGeometry args={[.17,.21,2.36]}/><meshStandardMaterial color="#c1d2d9" metalness={.92} roughness={.25}/></mesh>)}
    </group>
    <mesh position={[0,0,1.1]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.46,.09,10,80]}/><meshBasicMaterial color="#8bbfff" toneMapped={false}/></mesh>
    <pointLight position={[0,2,3]} color="#789eff" intensity={14} distance={9}/>
  </group>;
}
function ResearchExhibit() {
  const root=useRef<THREE.Group>(null);
  const points=useMemo(()=>Array.from({length:25},(_,i)=>{
    const a=i*2.399963;
    const r=1.1+1.8*Math.sqrt((i+1)/25);
    return new THREE.Vector3(Math.sin(a)*r,Math.cos(a*.7)*2.05,Math.cos(a)*r);
  }),[]);
  const links=useMemo(()=>{
    const coords:number[]=[];
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
      if(points[i].distanceTo(points[j])<2.3){coords.push(...points[i].toArray(),...points[j].toArray());}
    }
    return new Float32Array(coords);
  },[points]);
  useFrame((s,d)=>{if(root.current){root.current.rotation.y+=d*.075;root.current.position.y=4.65+Math.sin(s.clock.elapsedTime)*.1;}});
  return <group ref={root} position={[0,4.65,33.1]}>
    {points.map((p,i)=><mesh key={i} position={p}><sphereGeometry args={[i%4===0?.19:.10,12,10]}/><meshBasicMaterial color={i%4===0?'#cc91ff':'#7ce6ff'} toneMapped={false}/></mesh>)}
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[links,3]}/></bufferGeometry><lineBasicMaterial color="#a5a4ff" transparent opacity={.44}/></lineSegments>
    <pointLight color="#8c79ff" intensity={18} distance={13}/>
  </group>;
}
function UltronExhibit() {
  const inner=useRef<THREE.Mesh>(null);
  const ring=useRef<THREE.Group>(null);
  useFrame((s,d)=>{if(inner.current){inner.current.rotation.y+=d*.38;inner.current.rotation.x+=d*.11;}if(ring.current)ring.current.rotation.y-=d*.17;});
  return <group position={[0,4.5,32.5]}>
    <mesh><sphereGeometry args={[2.45,16,10]}/><meshStandardMaterial color="#14080e" metalness={.9} roughness={.26} emissive="#6a0c17" emissiveIntensity={.9}/></mesh>
    <mesh ref={inner}><icosahedronGeometry args={[2.15,1]}/><meshBasicMaterial color="#ff244c" wireframe toneMapped={false}/></mesh>
    <group ref={ring}><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[3.1,.13,10,64]}/><meshBasicMaterial color="#ff435b" toneMapped={false}/></mesh><mesh rotation={[.3,0,.7]}><torusGeometry args={[2.72,.07,8,64]}/><meshBasicMaterial color="#ff6675" toneMapped={false}/></mesh></group>
    {[[-4,0], [4,0]].map(([x,z],i)=><group position={[x,-1.3,z]} key={i}><mesh><cylinderGeometry args={[.6,.6,3.2,12]}/><meshStandardMaterial color="#36404a" metalness={.9}/></mesh><mesh position={[0,1.7,0]}><sphereGeometry args={[.72,12,10]}/><meshBasicMaterial color="#ed223e" toneMapped={false}/></mesh></group>)}
    <pointLight color="#ff183a" intensity={35} distance={13}/>
  </group>;
}
function ContactExhibit() {
  const group=useRef<THREE.Group>(null);
  useFrame((_,d)=>{if(group.current)group.current.rotation.y+=d*.11;});
  return <group position={[-3.9,4,33]}>
    <mesh position={[0,-2.1,0]}><cylinderGeometry args={[1.7,2.2,.5,16]}/><meshStandardMaterial color="#34444c" metalness={.93} roughness={.26}/></mesh>
    <group ref={group}>
      <mesh><sphereGeometry args={[1.65,22,15]}/><meshStandardMaterial color="#1b3a4c" transparent opacity={.3} metalness={.4} roughness={.1} side={THREE.DoubleSide}/></mesh>
      {[0,Math.PI/3,Math.PI*2/3].map(a=><mesh rotation={[a,.3,0]} key={a}><torusGeometry args={[1.74,.035,8,64]}/><meshBasicMaterial color="#ffce76" toneMapped={false}/></mesh>)}
      <mesh><icosahedronGeometry args={[.4,2]}/><meshBasicMaterial color="#ffd17f" toneMapped={false}/></mesh>
    </group>
    <pointLight color="#ffce75" intensity={15} distance={10}/>
  </group>;
}
export default function SectorInstallations(){
  return <>
    {SECTORS.map(s=><group rotation={[0,s.angle,0]} key={s.id}>
      {s.id==='about'&&<IdentityExhibit/>}
      {s.id==='skills'&&<TechExhibit/>}
      {s.id==='projects'&&<ProjectExhibit/>}
      {s.id==='research'&&<ResearchExhibit/>}
      {s.id==='mission'&&<UltronExhibit/>}
      {s.id==='contact'&&<ContactExhibit/>}
    </group>)}
  </>;
}
