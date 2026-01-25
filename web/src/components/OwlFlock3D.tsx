"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

interface OwlProps {
  position: [number, number, number];
  speed: number;
  wingPhase: number;
  scale: number;
  delay: number;
}

function FlyingOwl({ position, speed, wingPhase, scale, delay }: OwlProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, "/owls/owl-flying.jpg");
  const startTime = useRef(Date.now());
  const initialZ = position[2];

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000 - delay;
    
    if (elapsed < 0) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    meshRef.current.position.x = position[0] + elapsed * speed * 2;
    meshRef.current.position.y = position[1] + Math.sin(elapsed * 2 + wingPhase) * 0.3;
    meshRef.current.position.z = initialZ + Math.sin(elapsed * 0.5) * 0.5;

    const wingFlap = Math.sin(elapsed * 12 + wingPhase) * 0.15;
    meshRef.current.scale.set(scale * (1 + wingFlap * 0.3), scale, scale);

    meshRef.current.rotation.y = Math.PI + Math.sin(elapsed * 0.3) * 0.1;
    meshRef.current.rotation.z = Math.sin(elapsed * 2) * 0.05;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[2, 2.5]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
        opacity={0.9}
      />
    </mesh>
  );
}

interface MainOwlProps {
  phase: "flock" | "turning" | "approaching" | "closeUp";
  progress: number;
}

function MainOwl({ phase, progress }: MainOwlProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, "/owls/owl-fullbody-1.png");

  useFrame(() => {
    if (!meshRef.current) return;

    if (phase === "flock") {
      meshRef.current.position.set(-8 + progress * 10, 0, -5);
      meshRef.current.rotation.y = Math.PI;
      meshRef.current.scale.setScalar(0.8);
    } else if (phase === "turning") {
      meshRef.current.position.set(2, 0, -3 + progress * 1);
      meshRef.current.rotation.y = Math.PI * (1 - progress);
      meshRef.current.scale.setScalar(0.8 + progress * 0.5);
    } else if (phase === "approaching") {
      const z = -2 + progress * 4;
      const scale = 1.3 + progress * 4;
      meshRef.current.position.set(0, -progress * 1.5, z);
      meshRef.current.rotation.y = 0;
      meshRef.current.scale.setScalar(scale);
    } else if (phase === "closeUp") {
      meshRef.current.position.set(0, -1.5, 2);
      meshRef.current.rotation.y = 0;
      meshRef.current.scale.setScalar(5.3);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <planeGeometry args={[2, 2.5]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface OwlFlock3DProps {
  phase: "flock" | "turning" | "approaching" | "closeUp";
  progress: number;
  showFlock: boolean;
}

function FallbackOwl({ phase, progress }: { phase: string; progress: number }) {
  const getTransform = () => {
    if (phase === "flock") {
      return {
        x: -50 + progress * 150,
        scale: 0.3,
        opacity: 1
      };
    } else if (phase === "turning") {
      return {
        x: 0,
        scale: 0.3 + progress * 0.4,
        opacity: 1
      };
    } else if (phase === "approaching") {
      return {
        x: 0,
        scale: 0.7 + progress * 4,
        opacity: 1
      };
    } else {
      return {
        x: 0,
        scale: 5,
        opacity: 1
      };
    }
  };

  const { x, scale, opacity } = getTransform();

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ opacity }}
    >
      <img
        src="/owls/owl-flying.jpg"
        alt="Owl"
        className="transition-all duration-500"
        style={{
          transform: `translateX(${x}%) scale(${scale})`,
          maxWidth: "70%",
          filter: "drop-shadow(0 0 60px rgba(147, 112, 219, 0.5)) drop-shadow(0 0 30px rgba(0, 255, 200, 0.3))"
        }}
      />
    </div>
  );
}

export default function OwlFlock3D({ phase, progress, showFlock }: OwlFlock3DProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebGLSupported(isWebGLAvailable());
  }, []);

  const flockOwls = useMemo(() => {
    const owls: OwlProps[] = [];
    for (let i = 0; i < 6; i++) {
      owls.push({
        position: [-12 - i * 2, (Math.random() - 0.5) * 3, -8 - Math.random() * 4],
        speed: 1.5 + Math.random() * 0.5,
        wingPhase: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 0.3,
        delay: i * 0.2,
      });
    }
    return owls;
  }, []);

  if (webGLSupported === null) {
    return <div className="absolute inset-0" />;
  }

  if (!webGLSupported) {
    return <FallbackOwl phase={phase} progress={progress} />;
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        
        {showFlock && flockOwls.map((owl, i) => (
          <FlyingOwl key={i} {...owl} />
        ))}
        
        <MainOwl phase={phase} progress={progress} />
      </Canvas>
    </div>
  );
}
