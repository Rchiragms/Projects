"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position =
    projectionMatrix *
    modelViewMatrix *
    vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(
    sin(dot(p, vec2(127.1, 311.7))) *
    43758.5453
  );
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  f = f*f*(3.0-2.0*f);

  return mix(
    mix(hash(i), hash(i+vec2(1,0)), f.x),
    mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 p = (vUv - 0.5) * 6.0;

  float radius = length(p);
  float angle = atan(p.y, p.x);

  float time = uTime;

  float rotation =
    time * 0.09 / max(radius, 0.7);

  float flowingAngle =
    angle - rotation;

  vec2 q = vec2(
    cos(flowingAngle) * radius,
    sin(flowingAngle) * radius
  );

  float largeNoise = fbm(
    q * 1.35 +
    vec2(time * 0.015, -time * 0.02)
  );

  float detailNoise = fbm(
    q * 3.1
  );

  float cloud =
    smoothstep(
      0.34,
      0.72,
      largeNoise * 0.8 +
      detailNoise * 0.2
    );

  float inner =
    smoothstep(0.95, 1.3, radius);

  float outer =
    1.0 -
    smoothstep(2.0, 2.95, radius);

  float density =
    cloud * inner * outer;

  // Broken, diffuse cloud edges
  density *=
    0.45 + largeNoise * 0.85;

  vec3 darkRed =
    vec3(0.18, 0.018, 0.004);

  vec3 orange =
    vec3(0.9, 0.17, 0.018);

  vec3 color = mix(
    darkRed,
    orange,
    largeNoise
  );

  gl_FragColor = vec4(
    color * density * 0.75,
    density * 0.22
  );
}
`;

export default function PlasmaAtmosphere() {
  const material =
    useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value =
        clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[6, 6]} />

      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}