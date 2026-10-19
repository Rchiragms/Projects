"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export default function OrbitalTrails() {
  const group = useRef<THREE.Group>(null);

  const trails = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const points: THREE.Vector3[] = [];

      const start = index * 0.75 - 1.2;

      const radius =
        1.35 + index * 0.14;

      const arcLength =
        Math.PI * (0.8 + index * 0.12);

      for (let i = 0; i <= 120; i++) {
        const t = i / 120;

        const angle =
          start + t * arcLength;

        const r =
          radius +
          t * 0.45;

        const x =
          Math.cos(angle) * r;

        const z =
          Math.sin(angle) * r;

        const y =
          Math.sin(angle * 1.4 + index) *
          (0.12 + index * 0.035);

        points.push(
          new THREE.Vector3(x, y, z)
        );
      }

      const curve =
        new THREE.CatmullRomCurve3(points);

      const geometry =
        new THREE.TubeGeometry(
          curve,
          120,
          index === 0 ? 0.006 : 0.0025,
          5,
          false
        );

      const material =
        new THREE.MeshBasicMaterial({
          color:
            index === 0
              ? "#ffd28b"
              : "#ff711b",
          transparent: true,
          opacity:
            index === 0
              ? 0.65
              : 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        });

      return {
        geometry,
        material,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;

    group.current.rotation.y =
      clock.elapsedTime * 0.025;
  });

  return (
    <group ref={group}>
      {trails.map((trail, index) => (
        <mesh
          key={index}
          geometry={trail.geometry}
          material={trail.material}
        />
      ))}
    </group>
  );
}