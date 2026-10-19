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

#define PI 3.14159265359

float hash(vec2 p) {
  return fract(
    sin(dot(p, vec2(127.1, 311.7))) *
    43758.5453
  );
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(
    mix(a, b, f.x),
    mix(c, d, f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 p = (vUv - 0.5) * 5.6;

  float radius = length(p);
  float angle = atan(p.y, p.x);

  float time = uTime;

  // Differential rotation
  float rotationSpeed =
    0.34 / pow(max(radius, 0.6), 1.2);

  float flowingAngle =
    angle - time * rotationSpeed;

  // Turbulent coordinate warping
  vec2 flowCoordinates = vec2(
    flowingAngle * 1.7,
    radius * 2.2 - time * 0.08
  );

  float broadNoise = fbm(
    flowCoordinates * 1.4
  );

  float mediumNoise = fbm(
    flowCoordinates * 3.0 +
    vec2(time * 0.025, -time * 0.04)
  );

  float distortion =
    (broadNoise - 0.5) * 1.5 +
    (mediumNoise - 0.5) * 0.35;

  // Main spiral flow
  float spiralCoordinate =
    flowingAngle * 2.0 -
    log(max(radius, 0.2)) * 4.6 +
    distortion;

  // Broad molten streams
  float mainStream =
    smoothstep(
      -0.8,
      0.45,
      sin(spiralCoordinate)
    );

  // Secondary organic structures
  float secondaryStream =
    smoothstep(
      -0.55,
      0.65,
      sin(
        spiralCoordinate * 1.7 +
        broadNoise * 2.2
      )
    );

  // Dark gaps between streams
  float streamDensity =
    mainStream * 0.75 +
    secondaryStream * 0.25;

  streamDensity *=
    0.45 +
    broadNoise * 0.75 +
    mediumNoise * 0.2;

  // Central dark region
  float innerMask =
    smoothstep(0.78, 1.08, radius);

  // Soft outer boundary
  float outerMask =
    1.0 -
    smoothstep(1.85, 2.65, radius);

  float density =
    streamDensity *
    innerMask *
    outerMask;

  // Inner material is brighter
  float heat =
    density *
    (1.4 / max(radius, 0.75));

  vec3 ember =
    vec3(0.2, 0.018, 0.002);

  vec3 deepOrange =
    vec3(0.75, 0.085, 0.008);

  vec3 moltenOrange =
    vec3(1.0, 0.26, 0.02);

  vec3 gold =
    vec3(1.0, 0.58, 0.11);

  vec3 color = mix(
    ember,
    deepOrange,
    smoothstep(0.05, 0.35, heat)
  );

  color = mix(
    color,
    moltenOrange,
    smoothstep(0.3, 0.75, heat)
  );

  color = mix(
    color,
    gold,
    smoothstep(0.85, 1.65, heat) * 0.5
  );

  float alpha =
    density * 0.82;

  gl_FragColor = vec4(
    color * density * 1.4,
    alpha
  );
}
`;

export default function AccretionStreams() {
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
      <planeGeometry args={[5.6, 5.6]} />

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