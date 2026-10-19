"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import BlackHoleCore from "./BlackHoleCore";
import AccretionStreams from "./AccretionStreams";
import OrbitalTrails from "./OrbitalTrails";
import PlasmaAtmosphere from "./PlasmaAtmosphere";
import ContainmentShell from "./ContainmentShell";

export default function BlackHoleSystem() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ pointer }, delta) => {
    if (!group.current) return;

    group.current.rotation.x =
      THREE.MathUtils.damp(
        group.current.rotation.x,
        -pointer.y * 0.045,
        2,
        delta
      );

    group.current.rotation.y =
      THREE.MathUtils.damp(
        group.current.rotation.y,
        pointer.x * 0.065,
        2,
        delta
      );
  });

  return (
    <group position={[1.8, 0.15, 0]}>
      <group ref={group}>
        <group rotation={[0.78, 0.1, 0.35]}>
          <PlasmaAtmosphere />

          <AccretionStreams />

          <OrbitalTrails />

          <BlackHoleCore />
        </group>

        <ContainmentShell />
      </group>
    </group>
  );
}