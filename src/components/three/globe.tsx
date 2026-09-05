"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";

const CITY_NODES: [number, number, number][] = [
  [0.9, 0.3, 0.3],
  [-0.7, 0.5, 0.5],
  [0.4, 0.8, -0.4],
  [-0.3, 0.9, 0.2],
  [0.6, -0.4, 0.7],
  [-0.5, -0.3, 0.8],
  [0.8, 0.1, -0.6],
  [-0.2, 0.7, -0.6],
  [0.3, -0.8, 0.3],
  [-0.8, 0.2, -0.4],
  [0.1, 0.95, 0.1],
  [-0.6, -0.6, 0.4],
  [0.7, -0.2, -0.7],
  [-0.4, 0.4, -0.8],
  [0.5, 0.6, 0.6],
];

function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[1.5, 32, 24]} />
        <meshBasicMaterial
          color="#6c5ce7"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.52, 16, 12]} />
        <meshBasicMaterial
          color="#6c5ce7"
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

function CityNode({
  position,
  delay,
}: {
  position: [number, number, number];
  delay: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = useRef(1);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + delay;
      scale.current = 1 + Math.sin(t * 2) * 0.3;
      ref.current.scale.setScalar(scale.current);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#00d2ff" transparent opacity={0.9} />
    </mesh>
  );
}

function GlowNode({
  position,
  delay,
}: {
  position: [number, number, number];
  delay: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + delay;
      ref.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.4);
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#00d2ff" transparent opacity={0.15} />
    </mesh>
  );
}

function AmbientParticles() {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
      ref.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#6c5ce7"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function GlobeScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <WireframeGlobe />
      {CITY_NODES.map((pos, i) => (
        <CityNode key={`city-${i}`} position={pos} delay={i * 0.5} />
      ))}
      {CITY_NODES.map((pos, i) => (
        <GlowNode key={`glow-${i}`} position={pos} delay={i * 0.3} />
      ))}
      <AmbientParticles />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export default function Globe() {
  return (
    <div className="relative w-full" style={{ height: 500 }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <GlobeScene />
        </Float>
      </Canvas>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
