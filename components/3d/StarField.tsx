"use client";

import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function StarField() {
  const spaceRef = useRef<THREE.Group>(null);

  useFrame(({ clock }, delta) => {
    if (!spaceRef.current) return;

    /*
     * Extremely slow movement.
     * We do NOT want the background looking
     * like a spinning particle effect.
     */
    spaceRef.current.rotation.y += delta * 0.0015;

    spaceRef.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.025) * 0.015;
  });

  return (
    <group ref={spaceRef}>
      {/* Very distant stars */}

      <Stars
        radius={100}
        depth={60}
        count={4500}
        factor={2.4}
        saturation={0}
        fade
        speed={0.1}
      />

      {/* Medium-distance stars */}

      <Stars
        radius={55}
        depth={30}
        count={1200}
        factor={2.8}
        saturation={0}
        fade
        speed={0.15}
      />

      {/* Brighter nearby stars */}

      <Stars
        radius={30}
        depth={15}
        count={300}
        factor={3.5}
        saturation={0}
        fade
        speed={0.2}
      />
    </group>
  );
}