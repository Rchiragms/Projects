"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec4 mvPosition =
      modelViewMatrix * vec4(position, 1.0);

    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;

    gl_Position =
      projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vViewPosition);

    float fresnel = pow(
      1.0 - abs(dot(normal, viewDirection)),
      3.4
    );

    float pulse =
      0.9 + 0.1 * sin(uTime * 1.2);

    vec3 cyan =
      vec3(0.04, 0.48, 1.0);

    vec3 iceBlue =
      vec3(0.35, 0.85, 1.0);

    vec3 color = mix(
      cyan,
      iceBlue,
      fresnel
    );

    float alpha =
      fresnel * 0.12 * pulse;

    gl_FragColor = vec4(
      color * (0.35 + fresnel * 1.5),
      alpha
    );
  }
`;

export default function ContainmentShell() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value =
        clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[1.75, 96, 96]} />

      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{
          uTime: { value: 0 },
        }}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}