"use client";

import * as THREE from "three";

export default function BlackHoleCore() {
  return (
    <group>
      {/* Deep black event horizon */}
      <mesh renderOrder={5}>
        <sphereGeometry args={[0.78, 96, 96]} />

        <meshBasicMaterial
          color="#000000"
          toneMapped={false}
        />
      </mesh>

      {/* Narrow photon-ring-inspired edge */}
      <mesh rotation={[0.08, 0.12, 0]}>
        <torusGeometry
          args={[0.82, 0.008, 8, 240]}
        />

        <meshBasicMaterial
          color="#ff741c"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}