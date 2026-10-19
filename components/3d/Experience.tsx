"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

type Arc = readonly [number, number];

const TAU = Math.PI * 2;

const FULL: Arc[] = [[0, TAU]];

const MAJOR: Arc[] = [
  [0.12, 0.82],
  [1.02, 1.65],
  [1.91, 2.58],
  [2.77, 3.33],
  [3.58, 4.30],
  [4.52, 5.29],
  [5.52, 6.13],
];

const INNER: Arc[] = [
  [0.08, 0.91],
  [1.18, 1.72],
  [1.92, 2.64],
  [2.91, 3.74],
  [4.02, 4.66],
  [4.91, 6.18],
];

const dashes = (count: number, amount: number): Arc[] =>
  Array.from(
    { length: count },
    (_, i): Arc => [
      (i * TAU) / count,
      ((i + amount) * TAU) / count,
    ]
  );

const TICKS = dashes(144, 0.22);
const FINE = dashes(240, 0.18);
const BLOCKS = dashes(48, 0.48);
const FINS = dashes(72, 0.62);
const SPARKS = dashes(36, 0.3);

// =====================================================
// CREATE PRECISE CIRCULAR HUD GEOMETRY
// =====================================================

function arcGeometry(
  radius: number,
  width: number,
  arcs: Arc[]
) {
  const data: number[] = [];

  for (const [start, end] of arcs) {
    const steps = Math.max(
      2,
      Math.ceil((end - start) * radius * 70)
    );

    for (let i = 0; i < steps; i++) {
      const a =
        start + ((end - start) * i) / steps;

      const b =
        start + ((end - start) * (i + 1)) / steps;

      const inner = radius - width * 0.5;
      const outer = radius + width * 0.5;

      const xy = (r: number, angle: number) => [
        r * Math.cos(angle),
        r * Math.sin(angle),
        0,
      ];

      data.push(
        ...xy(inner, a),
        ...xy(outer, a),
        ...xy(inner, b),

        ...xy(outer, a),
        ...xy(outer, b),
        ...xy(inner, b)
      );
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(data, 3)
  );

  return geometry;
}

type RingProps = {
  radius: number;
  width: number;
  arcs?: Arc[];
  color?: string;
  opacity?: number;
  brightness?: number;
  z?: number;
};

function Ring({
  radius,
  width,
  arcs = FULL,
  color = "#43d6ff",
  opacity = 0.8,
  brightness = 1.6,
  z = 0,
}: RingProps) {
  const geometry = useMemo(
    () => arcGeometry(radius, width, arcs),
    [radius, width, arcs]
  );

  const tint = useMemo(
    () =>
      new THREE.Color(color).multiplyScalar(brightness),
    [color, brightness]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh
      geometry={geometry}
      position-z={z}
      frustumCulled={false}
    >
      <meshBasicMaterial
        color={tint}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// =====================================================
// INDEPENDENT ROTATION
// =====================================================

function Rotor({
  speed,
  children,
  tilt = [0, 0, 0],
}: {
  speed: number;
  children: ReactNode;
  tilt?: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z =
        tilt[2] + clock.elapsedTime * speed;
    }
  });

  return (
    <group ref={ref} rotation={tilt}>
      {children}
    </group>
  );
}

// =====================================================
// ANIMATED CENTRAL ENERGY VORTEX
// =====================================================

const energyVertex = `
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position =
    projectionMatrix *
    modelViewMatrix *
    vec4(position, 1.0);
}
`;

const energyFragment = `
precision highp float;

varying vec2 vUv;

uniform float uTime;

float h(vec2 p) {
  return fract(
    sin(dot(p, vec2(127.1, 311.7))) *
    43758.5453
  );
}

float n(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  f = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      h(i),
      h(i + vec2(1.0, 0.0)),
      f.x
    ),
    mix(
      h(i + vec2(0.0, 1.0)),
      h(i + vec2(1.0, 1.0)),
      f.x
    ),
    f.y
  );
}

float fb(vec2 p) {
  float v = 0.0;
  float a = 0.5;

  for (int i = 0; i < 4; i++) {
    v += a * n(p);

    p =
      mat2(1.6, -1.2, 1.2, 1.6) * p;

    a *= 0.52;
  }

  return v;
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;

  float r = length(p);
  float angle = atan(p.y, p.x);
  float t = uTime;

  float warp = fb(
    p * 5.0 +
    vec2(t * 0.09, -t * 0.05)
  );

  float spiral = sin(
    angle * 5.0 -
    r * 18.0 -
    t * 1.2 +
    warp * 4.0
  );

  float wires =
    pow(max(spiral, 0.0), 11.0);

  float eddies = fb(
    p * 13.0 -
    vec2(t * 0.14, t * 0.07)
  );

  float haze =
    exp(-r * r * 4.9) *
    (0.4 + 0.6 * eddies);

  float core =
    exp(-r * r * 90.0);

  float alpha =
    (
      haze * 0.18 +
      wires * 0.49 *
      exp(-r * r * 1.9) +
      core * 0.7
    ) *
    (
      1.0 -
      smoothstep(0.72, 1.0, r)
    );

  vec3 col = mix(
    vec3(0.06, 0.27, 0.9),
    vec3(0.20, 1.15, 2.7),
    clamp(warp + 0.15, 0.0, 1.0)
  );

  col +=
    vec3(0.9, 1.3, 2.2) *
    core;

  gl_FragColor = vec4(
    col,
    clamp(alpha, 0.0, 1.0)
  );
}
`;

function EnergyVortex() {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0,
      },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.uniforms.uTime.value =
        clock.elapsedTime;
    }
  });

  return (
    <mesh position-z={0.05}>
      <planeGeometry args={[2.45, 2.45]} />

      <shaderMaterial
        ref={mat}
        vertexShader={energyVertex}
        fragmentShader={energyFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// =====================================================
// TRANSPARENT THREE-DIMENSIONAL DATA SPHERE
// =====================================================

const sphereVertex = `
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;

  vNormal =
    normalize(normalMatrix * normal);

  gl_Position =
    projectionMatrix *
    modelViewMatrix *
    vec4(position, 1.0);
}
`;

const sphereFragment = `
precision highp float;

varying vec3 vNormal;
varying vec2 vUv;

uniform float uTime;

void main() {
  float t = uTime;

  float face =
    abs(normalize(vNormal).z);

  float edge =
    pow(1.0 - face, 2.8);

  float lat =
    1.0 -
    smoothstep(
      0.02,
      0.06,
      abs(
        sin(
          vUv.y *
          3.14159265 *
          26.0
        )
      )
    );

  float lon =
    1.0 -
    smoothstep(
      0.015,
      0.055,
      abs(
        sin(
          vUv.x *
          3.14159265 *
          32.0
        )
      )
    );

  float grid =
    max(lat * 0.8, lon * 0.7);

  float wave =
    0.5 +
    0.5 *
    sin(
      vUv.y * 55.0 +
      vUv.x * 19.0 -
      t * 2.8
    );

  float scan =
    pow(
      0.5 +
      0.5 *
      sin(
        vUv.y * 110.0 -
        t * 3.2
      ),
      14.0
    );

  float alpha =
    0.025 +
    edge * 0.52 +
    grid * 0.15 +
    wave * 0.04 +
    scan * 0.11;

  vec3 col = mix(
    vec3(0.04, 0.31, 1.1),
    vec3(0.20, 1.16, 2.25),
    clamp(
      edge * 0.92 +
      grid * 0.44 +
      scan * 0.38,
      0.0,
      1.0
    )
  );

  gl_FragColor = vec4(
    col,
    clamp(alpha, 0.0, 0.87)
  );
}
`;

function DataGlobe() {
  const mesh = useRef<THREE.Mesh>(null);

  const mat = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0,
      },
    }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    if (mesh.current) {
      mesh.current.rotation.y =
        t * 0.22;

      mesh.current.rotation.x =
        0.28 +
        0.12 * Math.sin(t * 0.23);

      mesh.current.rotation.z =
        0.16 * Math.sin(t * 0.19);
    }

    if (mat.current) {
      mat.current.uniforms.uTime.value = t;
    }
  });

  return (
    <mesh
      ref={mesh}
      position-z={0.18}
    >
      <sphereGeometry args={[0.87, 64, 48]} />

      <shaderMaterial
        ref={mat}
        vertexShader={sphereVertex}
        fragmentShader={sphereFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// =====================================================
// ROTATING THREE-DIMENSIONAL WIREFRAME LATTICE
// =====================================================

function Lattice() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y =
        clock.elapsedTime * -0.12;

      ref.current.rotation.x =
        0.28 +
        0.08 *
        Math.sin(clock.elapsedTime * 0.45);
    }
  });

  return (
    <group
      ref={ref}
      position-z={0.18}
    >
      <mesh>
        <icosahedronGeometry args={[0.86, 2]} />

        <meshBasicMaterial
          color="#50dfff"
          transparent
          opacity={0.12}
          wireframe
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh
        rotation={[
          Math.PI / 3.7,
          0.25,
          0.15,
        ]}
      >
        <torusGeometry
          args={[0.95, 0.007, 6, 160]}
        />

        <meshBasicMaterial
          color="#a4f5ff"
          transparent
          opacity={0.54}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh
        rotation={[
          Math.PI / 1.8,
          -0.3,
          -0.15,
        ]}
      >
        <torusGeometry
          args={[1.03, 0.005, 6, 160]}
        />

        <meshBasicMaterial
          color="#288de9"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// =====================================================
// FLOATING HOLOGRAPHIC PARTICLES
// =====================================================

function HaloParticles() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const vertices =
      new Float32Array(1450 * 3);

    for (let i = 0; i < 1450; i++) {
      const a =
        (i * 2.399963) % TAU;

      const r =
        1.15 +
        Math.sqrt((i + 0.5) / 1450) *
          1.86 +
        Math.sin(i * 91.7) * 0.065;

      vertices[i * 3] =
        r * Math.cos(a);

      vertices[i * 3 + 1] =
        r * Math.sin(a);

      vertices[i * 3 + 2] =
        0.34 * Math.sin(i * 1.31);
    }

    const geo =
      new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        vertices,
        3
      )
    );

    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.z =
        -clock.elapsedTime * 0.012;
    }
  });

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <pointsMaterial
          color="#65c8f9"
          size={0.012}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

// =====================================================
// MOVING ORBITAL ENERGY NODES
// =====================================================

function OrbitingNodes() {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z =
        clock.elapsedTime * 0.3;
    }
  });

  return (
    <group ref={ref} rotation-x={0.66}>
      {Array.from(
        { length: 8 },
        (_, i) => {
          const a =
            (i * TAU) / 8;

          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * 1.39,
                Math.sin(a) * 1.39,
                0.3,
              ]}
            >
              <sphereGeometry
                args={[
                  i % 2 ? 0.025 : 0.038,
                  10,
                  10,
                ]}
              />

              <meshBasicMaterial
                color={
                  i % 2
                    ? "#7feafa"
                    : "#d5ffff"
                }
                toneMapped={false}
              />
            </mesh>
          );
        }
      )}
    </group>
  );
}

// =====================================================
// COMPLETE HOLOGRAM AND CINEMATIC TRANSITION
// =====================================================

function Hologram({
  entering,
}: {
  entering: boolean;
}) {
  const root =
    useRef<THREE.Group>(null);

  const pointer = useRef(
    new THREE.Vector2()
  );

  const target = useRef(
    new THREE.Vector2()
  );

  const started =
    useRef<number | null>(null);

  const { viewport } = useThree();

  const mobile =
    viewport.width < 7;

  const baseScale = Math.min(
    1.2,
    mobile
      ? viewport.width / 6.35
      : viewport.height / 7.5
  );

  const baseX = mobile
    ? 0
    : viewport.width * 0.242;

  const baseY = mobile
    ? viewport.height * 0.115
    : 0;

  useEffect(() => {
    function move(event: PointerEvent) {
      target.current.set(
        (event.clientX /
          window.innerWidth) *
          2 -
          1,

        1 -
          (event.clientY /
            window.innerHeight) *
            2
      );
    }

    window.addEventListener(
      "pointermove",
      move,
      { passive: true }
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        move
      );
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!root.current) return;

    const t = clock.elapsedTime;

    if (
      entering &&
      started.current === null
    ) {
      started.current = t;
    }

    if (!entering) {
      started.current = null;
    }

    const progress =
      started.current === null
        ? 0
        : THREE.MathUtils.clamp(
            (t - started.current) /
              1.22,
            0,
            1
          );

    const surge =
      progress *
      progress *
      (3 - 2 * progress);

    pointer.current.lerp(
      target.current,
      1 - Math.exp(-delta * 2.2)
    );

    const intro =
      1 - Math.exp(-t * 2.3);

    root.current.position.x =
      THREE.MathUtils.damp(
        root.current.position.x,

        baseX * (1 - surge) +
          pointer.current.x *
            0.1 *
            (1 - surge),

        2.7,
        delta
      );

    root.current.position.y =
      THREE.MathUtils.damp(
        root.current.position.y,

        baseY * (1 - surge) +
          pointer.current.y *
            0.085 *
            (1 - surge),

        2.7,
        delta
      );

    root.current.rotation.y =
      THREE.MathUtils.damp(
        root.current.rotation.y,

        pointer.current.x *
          0.11 *
          (1 - surge),

        2.4,
        delta
      );

    root.current.rotation.x =
      THREE.MathUtils.damp(
        root.current.rotation.x,

        -pointer.current.y *
          0.085 *
          (1 - surge),

        2.4,
        delta
      );

    root.current.rotation.z =
      surge * 0.65 +
      Math.sin(t * 0.13) * 0.015;

    root.current.scale.setScalar(
      baseScale *
        (0.73 + 0.27 * intro) *
        (1 + surge * 5.2)
    );
  });

  return (
    <group
      ref={root}
      position={[
        baseX,
        baseY,
        0,
      ]}
      scale={baseScale}
    >
      {/* OUTER HOLOGRAPHIC PERIMETER */}

      <Ring
        radius={2.89}
        width={0.006}
        arcs={MAJOR}
        color="#207cb7"
        opacity={0.46}
        brightness={1.1}
        z={-0.42}
      />

      <Ring
        radius={2.78}
        width={0.009}
        color="#42cfff"
        opacity={0.23}
        z={-0.37}
      />

      {/* FIRST ROTATING STRUCTURE */}

      <Rotor speed={0.062}>
        <Ring
          radius={2.66}
          width={0.019}
          arcs={MAJOR}
          color="#8beaff"
          opacity={0.84}
          z={-0.24}
        />

        <Ring
          radius={2.57}
          width={0.037}
          arcs={BLOCKS}
          color="#2c94f7"
          opacity={0.6}
          z={-0.21}
        />

        <Ring
          radius={2.49}
          width={0.006}
          color="#64b4ff"
          opacity={0.24}
          z={-0.18}
        />
      </Rotor>

      {/* COUNTER-ROTATING SCANNER */}

      <Rotor speed={-0.11}>
        <Ring
          radius={2.43}
          width={0.053}
          arcs={TICKS}
          color="#5ccfff"
          opacity={0.7}
          z={-0.18}
        />

        <Ring
          radius={2.32}
          width={0.012}
          arcs={INNER}
          color="#b2f9ff"
          opacity={0.83}
          z={-0.16}
        />

        <Ring
          radius={2.26}
          width={0.004}
          color="#2684c5"
          opacity={0.45}
          z={-0.15}
        />
      </Rotor>

      {/* SEGMENTED DIGITAL APERTURE */}

      <Rotor speed={0.18}>
        <Ring
          radius={2.13}
          width={0.063}
          arcs={FINS}
          color="#278cf1"
          opacity={0.46}
          z={-0.14}
        />

        <Ring
          radius={2.04}
          width={0.014}
          arcs={MAJOR}
          color="#91eaff"
          opacity={0.78}
          z={-0.13}
        />

        <Ring
          radius={1.95}
          width={0.05}
          arcs={BLOCKS}
          color="#347ad5"
          opacity={0.53}
          z={-0.12}
        />
      </Rotor>

      {/* HIGH-DETAIL MICRO MARKINGS */}

      <Rotor speed={-0.23}>
        <Ring
          radius={1.82}
          width={0.05}
          arcs={FINE}
          color="#a2ecff"
          opacity={0.6}
          z={-0.1}
        />

        <Ring
          radius={1.71}
          width={0.011}
          arcs={INNER}
          color="#62cdff"
          opacity={0.8}
          z={-0.06}
        />
      </Rotor>

      {/* TILTED THREE-DIMENSIONAL ORBITS */}

      <Rotor
        speed={0.12}
        tilt={[
          0.82,
          0.16,
          0.32,
        ]}
      >
        <Ring
          radius={1.58}
          width={0.012}
          arcs={MAJOR}
          color="#c4faff"
          opacity={0.92}
          z={0.08}
        />

        <Ring
          radius={1.73}
          width={0.005}
          arcs={INNER}
          color="#4cbeff"
          opacity={0.39}
          z={0.05}
        />
      </Rotor>

      <Rotor
        speed={-0.09}
        tilt={[
          -0.55,
          -0.28,
          0,
        ]}
      >
        <Ring
          radius={1.46}
          width={0.015}
          arcs={INNER}
          color="#46d5ff"
          opacity={0.68}
          z={0.07}
        />
      </Rotor>

      {/* HOLOGRAPHIC PARTICLES */}

      <HaloParticles />

      {/* MULTI-LAYER CENTRAL AI CORE */}

      <EnergyVortex />

      <DataGlobe />

      <Lattice />

      <OrbitingNodes />

      {/* INNER REACTOR ROTORS */}

      <Rotor speed={0.41}>
        <Ring
          radius={1.12}
          width={0.032}
          arcs={SPARKS}
          color="#e2ffff"
          opacity={0.91}
          z={1.12}
        />

        <Ring
          radius={1.02}
          width={0.006}
          arcs={MAJOR}
          color="#61d3ff"
          opacity={0.7}
          z={1.16}
        />
      </Rotor>

      <Rotor speed={-0.54}>
        <Ring
          radius={0.47}
          width={0.011}
          arcs={INNER}
          color="#d2ffff"
          opacity={0.83}
          z={1.22}
        />

        <Ring
          radius={0.32}
          width={0.02}
          arcs={SPARKS}
          color="#64dfff"
          opacity={0.8}
          z={1.25}
        />
      </Rotor>

      {/* BRIGHT CENTRAL LIGHT SOURCE */}

      <mesh position-z={1.36}>
        <sphereGeometry
          args={[0.063, 16, 16]}
        />

        <meshBasicMaterial
          color={
            new THREE.Color().setRGB(
              2.8,
              4.1,
              5.3
            )
          }
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// =====================================================
// MAIN EXPERIENCE
// =====================================================

export default function Experience({
  entering = false,
}: {
  entering?: boolean;
}) {
  return (
    <div
      className="jarvis-scene"
      aria-hidden="true"
    >
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 15],
          zoom: 100,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference:
            "high-performance",
        }}
        dpr={[1, 1.5]}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <Hologram entering={entering} />

        <EffectComposer
          multisampling={0}
        >
          <Bloom
            mipmapBlur
            intensity={1.05}
            luminanceThreshold={0.74}
            luminanceSmoothing={0.24}
          />
        </EffectComposer>
      </Canvas>

      <div
        className={
          `jarvis-surge` +
          (
            entering
              ? " jarvis-surge--active"
              : ""
          )
        }
      />

      <style>{`
        .jarvis-scene {
          position: absolute;
          inset: 0;
          overflow: hidden;
          isolation: isolate;
          pointer-events: none;
          background: #020610;
        }

        .jarvis-scene::before {
          content: "";
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              ellipse 38% 52% at 74% 52%,
              rgba(7,102,174,.22),
              transparent 78%
            ),
            radial-gradient(
              ellipse 58% 70% at 72% 58%,
              rgba(3,38,93,.13),
              transparent 80%
            ),
            linear-gradient(
              125deg,
              #02050b,
              #030913 65%,
              #02050c
            );
        }

        .jarvis-scene::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .18;

          background:
            repeating-linear-gradient(
              0deg,
              transparent 0,
              transparent 3px,
              rgba(35,140,220,.08) 4px
            );
        }

        .jarvis-surge {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              ellipse at 50% 50%,
              rgba(132,237,255,.92),
              rgba(17,118,210,.65) 38%,
              rgba(2,7,18,.6) 88%
            );

          opacity: 0;

          transition:
            opacity .75s ease .48s;
        }

        .jarvis-surge--active {
          opacity: 1;
        }

        @media (max-width: 700px) {
          .jarvis-scene::before {
            background:
              radial-gradient(
                ellipse 80% 34% at 50% 36%,
                rgba(9,117,190,.22),
                transparent 83%
              ),
              #020610;
          }
        }
      `}</style>
    </div>
  );
}