"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";

const owlImages = [
  "/owls/realistic-owl-1.png",
  "/owls/realistic-owl-2.png",
  "/owls/realistic-owl-3.png",
  "/owls/realistic-owl-4.png",
  "/owls/realistic-owl-5.png",
  "/owls/realistic-owl-6.png",
];

function TwinklingStars() {
  const starsRef = useRef<THREE.Points>(null);
  const count = 200;
  
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!starsRef.current) return;
    const time = state.clock.elapsedTime;
    const material = starsRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.6 + Math.sin(time * 0.5) * 0.2;
  });

  return (
    <points ref={starsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function PsychedelicWaves() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      
      float wave1 = sin(uv.x * 3.0 + uTime * 0.5) * 0.5 + 0.5;
      float wave2 = sin(uv.y * 4.0 - uTime * 0.3) * 0.5 + 0.5;
      float wave3 = sin((uv.x + uv.y) * 2.0 + uTime * 0.4) * 0.5 + 0.5;
      
      vec3 color1 = vec3(0.56, 0.42, 0.95); // Purple
      vec3 color2 = vec3(0.39, 0.72, 0.95); // Cyan
      vec3 color3 = vec3(0.95, 0.38, 0.83); // Pink
      vec3 color4 = vec3(0.36, 0.95, 0.70); // Turquoise
      
      vec3 finalColor = mix(color1, color2, wave1);
      finalColor = mix(finalColor, color3, wave2 * 0.5);
      finalColor = mix(finalColor, color4, wave3 * 0.3);
      
      float alpha = 0.15 + wave1 * 0.1 + wave2 * 0.05;
      alpha *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.5, uv.y);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <mesh ref={meshRef} position={[0, 2, -8]}>
      <planeGeometry args={[25, 12]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function FlyingOwl3D({ avatarId, isLanding, isListening, isSpeaking }: { 
  avatarId: number;
  isLanding: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, "/owls/owl-flying.jpg");
  const [phase, setPhase] = useState<"flying" | "landing" | "idle">("flying");
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    if (isLanding) {
      setTimeout(() => setPhase("landing"), 500);
      setTimeout(() => setPhase("idle"), 2500);
    }
  }, [isLanding]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    if (phase === "flying") {
      meshRef.current.position.x = -8 + time * 2;
      meshRef.current.position.y = Math.sin(time * 3) * 0.5 + 1;
      meshRef.current.position.z = -3;
      meshRef.current.rotation.z = Math.sin(time * 4) * 0.1;
      
      if (meshRef.current.position.x > 0) {
        setPhase("landing");
      }
    } else if (phase === "landing") {
      meshRef.current.position.x *= 0.95;
      meshRef.current.position.y *= 0.97;
      meshRef.current.position.z = meshRef.current.position.z * 0.95 + 0.5 * 0.05;
      meshRef.current.rotation.z *= 0.9;
      
      const scale = meshRef.current.scale.x;
      if (scale < 2.5) {
        meshRef.current.scale.setScalar(scale * 1.02);
      }
    } else {
      meshRef.current.position.y = Math.sin(time * 1.5) * 0.15;
      meshRef.current.rotation.z = Math.sin(time * 0.8) * 0.03;
      
      const pulseScale = isListening ? 2.7 : isSpeaking ? 2.6 : 2.5;
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (pulseScale - currentScale) * 0.1);
    }
  });

  return (
    <mesh ref={meshRef} position={[-8, 1, -3]} scale={1.2}>
      <planeGeometry args={[3, 2.5]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
    </mesh>
  );
}

function LandedOwl3D({ avatarId, isListening, isSpeaking }: {
  avatarId: number;
  isListening: boolean;
  isSpeaking: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, owlImages[avatarId - 1] || owlImages[0]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    meshRef.current.position.y = Math.sin(time * 1.5) * 0.12;
    meshRef.current.rotation.z = Math.sin(time * 0.8) * 0.02;
    
    const baseScale = 2.8;
    const pulseScale = isListening ? baseScale + 0.2 : isSpeaking ? baseScale + 0.1 : baseScale;
    const pulse = Math.sin(time * 3) * 0.05;
    meshRef.current.scale.setScalar(pulseScale + (isListening || isSpeaking ? pulse : 0));
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]} scale={2.8}>
      <planeGeometry args={[2, 2.5]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.1} />
    </mesh>
  );
}

interface Dashboard3DProps {
  avatarId: number;
  isListening: boolean;
  isSpeaking: boolean;
  showFlying?: boolean;
}

function Scene({ avatarId, isListening, isSpeaking, showFlying }: Dashboard3DProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 5]} intensity={1} color="#9370db" />
      <pointLight position={[-5, 3, 2]} intensity={0.5} color="#00ffcc" />
      
      <PsychedelicWaves />
      <TwinklingStars />
      
      {showFlying ? (
        <FlyingOwl3D 
          avatarId={avatarId} 
          isLanding={true}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      ) : (
        <LandedOwl3D 
          avatarId={avatarId}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      )}
    </>
  );
}

export default function Dashboard3D({ avatarId, isListening, isSpeaking, showFlying = false }: Dashboard3DProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene 
            avatarId={avatarId} 
            isListening={isListening} 
            isSpeaking={isSpeaking}
            showFlying={showFlying}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
