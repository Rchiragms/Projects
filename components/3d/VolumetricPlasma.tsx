"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec3 vPosition;

void main() {
  vPosition = position;

  gl_Position =
    projectionMatrix *
    modelViewMatrix *
    vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uCamera;

varying vec3 vPosition;

#define STEPS 48

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;

  return fract(
    p.x * p.y * p.z *
    (p.x + p.y + p.z)
  );
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1,0,0)), f.x),
      mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
      mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
      f.y
    ),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;

  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }

  return v;
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);

  return mat2(c, -s, s, c);
}

float plasma(vec3 p) {
  float r = length(p.xz);
  float a = atan(p.z, p.x);

  float speed =
    0.45 / pow(max(r, 0.6), 1.2);

  float flow =
    a * 3.0 -
    log(max(r, 0.3)) * 7.0 -
    uTime * speed * 3.0;

  vec3 q = p;
  q.xz = rot(-uTime * speed) * q.xz;

  float n = fbm(q * 1.8);
  float detail = fbm(q * 4.0);

  float spiral =
    smoothstep(
      -0.5,
      0.8,
      sin(flow + n * 2.0)
    );

  float thickness =
    0.32 + n * 0.2;

  float vertical =
    exp(
      -pow(
        abs(p.y - (n - 0.5) * 0.25) /
        thickness,
        2.0
      )
    );

  float inner =
    smoothstep(0.75, 1.0, r);

  float outer =
    1.0 - smoothstep(1.8, 2.9, r);

  float density =
    vertical *
    inner *
    outer *
    (0.25 + spiral * 1.6) *
    (0.5 + n + detail * 0.4);

  return max(density, 0.0);
}

vec3 fireColor(float d, float r) {
  float heat =
    d / max(r, 0.7);

  vec3 dark =
    vec3(0.2, 0.012, 0.0);

  vec3 orange =
    vec3(1.0, 0.17, 0.012);

  vec3 amber =
    vec3(1.0, 0.43, 0.055);

  vec3 gold =
    vec3(1.0, 0.68, 0.18);

  vec3 c = mix(
    dark,
    orange,
    smoothstep(0.05, 0.5, heat)
  );

  c = mix(
    c,
    amber,
    smoothstep(0.4, 1.0, heat)
  );

  c = mix(
    c,
    gold,
    smoothstep(1.0, 2.3, heat) * 0.45
  );

  return c;
}

void main() {
  vec3 ro = uCamera;
  vec3 rd = normalize(vPosition - ro);

  float b = dot(ro, rd);
  float c = dot(ro, ro) - 9.0;
  float h = b*b - c;

  if (h < 0.0) discard;

  float t0 = max(-b - sqrt(h), 0.0);
  float t1 = -b + sqrt(h);

  float stepSize =
    (t1 - t0) / float(STEPS);

  vec3 pos = ro + rd * t0;

  vec3 color = vec3(0.0);
  float alpha = 0.0;

  float minRadius = 100.0;

  for (int i = 0; i < STEPS; i++) {
    float radius = length(pos);

    minRadius = min(minRadius, radius);

    if (radius < 0.78) {
      break;
    }

    float d = plasma(pos);

    if (d > 0.01) {
      vec3 emission =
        fireColor(d, length(pos.xz));

      float a =
        1.0 - exp(-d * stepSize * 1.5);

      a *= 1.0 - alpha;

      color += emission * a * 1.6;
      alpha += a;
    }

    float bend =
      0.1 / max(radius*radius*radius, 0.5);

    rd = normalize(
      rd - normalize(pos) * bend * stepSize
    );

    pos += rd * stepSize;

    if (length(pos) > 3.05) break;
    if (alpha > 0.98) break;
  }

  if (minRadius < 0.78) {
    color = vec3(0.0);
    alpha = 1.0;
  }

  float ring =
    exp(
      -pow(
        (minRadius - 0.86) / 0.05,
        2.0
      )
    );

  color +=
    vec3(1.0, 0.35, 0.03) *
    ring * 0.25;

  alpha = max(alpha, ring * 0.3);

  gl_FragColor = vec4(color, alpha);
}
`;

export default function VolumetricPlasma() {
  const material =
    useRef<THREE.ShaderMaterial>(null);

  const mesh =
    useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamera: {
        value: new THREE.Vector3(),
      },
    }),
    []
  );

  const inverse = useMemo(
    () => new THREE.Matrix4(),
    []
  );

  const localCamera = useMemo(
    () => new THREE.Vector3(),
    []
  );

  useFrame(({ clock, camera }) => {
    if (!material.current || !mesh.current) {
      return;
    }

    material.current.uniforms.uTime.value =
      clock.elapsedTime;

    mesh.current.updateWorldMatrix(true, false);

    inverse
      .copy(mesh.current.matrixWorld)
      .invert();

    localCamera
      .copy(camera.position)
      .applyMatrix4(inverse);

    material.current.uniforms.uCamera.value.copy(
      localCamera
    );
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[3, 48, 48]} />

      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}