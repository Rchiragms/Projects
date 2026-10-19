"use client";

import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import { useRef } from "react";
import * as THREE from "three";

export default function CinematicCamera() {
  const { camera } = useThree();

  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;

    const time =
      elapsed.current;

    /*
     * Intro lasts approximately 8 seconds.
     */
    const rawProgress =
      Math.min(time / 8, 1);

    /*
     * Smoothstep easing.
     *
     * Slow start
     * Faster middle
     * Slow finish
     */
    const progress =
      rawProgress *
      rawProgress *
      (3 - 2 * rawProgress);

    /*
     * Camera starts far away.
     */
    const startPosition =
      new THREE.Vector3(
        0.4,
        0.8,
        14
      );

    /*
     * Final hero position.
     */
const endPosition = new THREE.Vector3(
  0,
  0.15,
  8
);

    camera.position.lerpVectors(
      startPosition,
      endPosition,
      progress
    );

    /*
     * Once the camera reaches the core,
     * introduce almost invisible
     * cinematic floating movement.
     */
    if (rawProgress >= 1) {
      camera.position.x =
        Math.sin(time * 0.17) *
        0.07;

      camera.position.y =
        0.15 +
        Math.sin(time * 0.13) *
          0.035;
    }

    camera.lookAt(0, 0, 0);
  });

  return null;
}