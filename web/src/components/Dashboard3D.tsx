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

function MagicalOcean() {
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
      
      // Multiple wave layers for rich ocean effect
      float wave1 = sin(uv.x * 4.0 + uTime * 0.4) * 0.5 + 0.5;
      float wave2 = sin(uv.x * 6.0 - uTime * 0.5 + uv.y * 2.0) * 0.5 + 0.5;
      float wave3 = sin((uv.x * 3.0 + uv.y * 1.5) + uTime * 0.3) * 0.5 + 0.5;
      float wave4 = sin(uv.x * 8.0 + uTime * 0.6) * 0.5 + 0.5;
      float wave5 = cos(uv.x * 5.0 - uTime * 0.35 + uv.y) * 0.5 + 0.5;
      
      // Aurora colors - cyan, purple, pink, turquoise, gold
      vec3 color1 = vec3(0.39, 0.72, 0.95); // Cyan
      vec3 color2 = vec3(0.56, 0.42, 0.95); // Purple
      vec3 color3 = vec3(0.95, 0.38, 0.83); // Pink
      vec3 color4 = vec3(0.36, 0.95, 0.70); // Turquoise
      vec3 color5 = vec3(0.89, 0.98, 0.54); // Gold/Mindaro
      
      // Blend colors in waves
      vec3 finalColor = mix(color1, color2, wave1);
      finalColor = mix(finalColor, color3, wave2 * 0.6);
      finalColor = mix(finalColor, color4, wave3 * 0.4);
      finalColor = mix(finalColor, color5, wave4 * 0.2);
      
      // Add shimmer
      float shimmer = sin(uv.x * 20.0 + uTime * 2.0) * sin(uv.y * 15.0 - uTime * 1.5) * 0.1;
      finalColor += shimmer;
      
      // Full screen aurora - flows everywhere
      float centerDist = length(uv - 0.5);
      float vignette = 1.0 - smoothstep(0.3, 0.9, centerDist);
      
      // Gentle overall fade
      float alpha = (0.5 + wave1 * 0.25 + wave5 * 0.15) * vignette;
      alpha = clamp(alpha, 0.0, 0.85);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <mesh ref={meshRef} position={[0, 0, -3]} rotation={[0, 0, 0]}>
      <planeGeometry args={[50, 40]} />
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
  const glowRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, owlImages[avatarId - 1] || owlImages[0]);
  const [phase, setPhase] = useState<"flying" | "landing" | "idle">("flying");
  
  const owlMaterial = useMemo(() => createOwlMaterial(texture), [texture]);
  
  useEffect(() => {
    if (isLanding) {
      setTimeout(() => setPhase("landing"), 500);
      setTimeout(() => setPhase("idle"), 3000);
    }
  }, [isLanding]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    owlMaterial.uniforms.uTime.value = time;
    
    if (phase === "flying") {
      meshRef.current.position.x = -6 + time * 1.2;
      meshRef.current.position.y = Math.sin(time * 2) * 0.6 + 1.2;
      meshRef.current.position.z = -1;
      meshRef.current.rotation.z = Math.sin(time * 3) * 0.12;
      meshRef.current.scale.setScalar(2.5 + Math.sin(time * 2) * 0.15);
      
      if (meshRef.current.position.x > 0) {
        setPhase("landing");
      }
    } else if (phase === "landing") {
      meshRef.current.position.x *= 0.92;
      meshRef.current.position.y = meshRef.current.position.y * 0.95 + (-0.3) * 0.05;
      meshRef.current.position.z = meshRef.current.position.z * 0.95 + 0 * 0.05;
      meshRef.current.rotation.z *= 0.9;
      
      const targetScale = 3.2;
      const currentScale = meshRef.current.scale.x;
      meshRef.current.scale.setScalar(currentScale + (targetScale - currentScale) * 0.03);
    } else {
      meshRef.current.position.y = -0.3 + Math.sin(time * 0.8) * 0.15;
      meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
      
      const baseScale = 3.2;
      const pulseScale = isListening ? baseScale + 0.3 : isSpeaking ? baseScale + 0.15 : baseScale;
      const pulse = Math.sin(time * 2.5) * 0.1;
      meshRef.current.scale.setScalar(pulseScale + (isListening || isSpeaking ? pulse : 0));
    }
    
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.ShaderMaterial;
      glowMat.uniforms.uTime.value = time;
      const intensity = phase === "idle" ? (isListening ? 1.8 : isSpeaking ? 1.4 : 0.8) : 0.5;
      glowMat.uniforms.uIntensity.value = intensity;
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.position.z -= 0.5;
      glowRef.current.scale.setScalar(meshRef.current.scale.x * 1.5);
    }
  });

  const glowVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const glowFragmentShader = `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);
      float glow = exp(-dist * 3.0) * uIntensity;
      
      vec3 color1 = vec3(0.56, 0.42, 0.95);
      vec3 color2 = vec3(0.39, 0.72, 0.95);
      vec3 color3 = vec3(0.89, 0.98, 0.54);
      
      float t = sin(uTime * 0.5) * 0.5 + 0.5;
      vec3 glowColor = mix(mix(color1, color2, t), color3, sin(uTime * 0.3) * 0.3 + 0.3);
      
      gl_FragColor = vec4(glowColor, glow * 0.6);
    }
  `;

  return (
    <>
      <mesh ref={glowRef} position={[-6, 1.2, -1.5]}>
        <planeGeometry args={[4, 4]} />
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uIntensity: { value: 0.5 }
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={meshRef} position={[-6, 1.2, -1]} scale={2.5} material={owlMaterial}>
        <planeGeometry args={[2, 2.5]} />
      </mesh>
    </>
  );
}

function createOwlMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uTime;
      varying vec2 vUv;
      
      void main() {
        vec4 texColor = texture2D(uTexture, vUv);
        
        vec2 center = vUv - 0.5;
        float dist = length(center);
        
        // Smooth circular fade
        float fade = 1.0 - smoothstep(0.2, 0.48, dist);
        
        // Extra soft corners
        float cornerDist = max(abs(center.x), abs(center.y));
        float cornerFade = 1.0 - smoothstep(0.25, 0.45, cornerDist);
        float alpha = fade * cornerFade;
        
        // Smooth falloff
        alpha = alpha * alpha * (3.0 - 2.0 * alpha);
        
        if (alpha < 0.01) discard;
        
        // Divine golden/purple halo glow around the owl
        float haloStart = 0.15;
        float haloEnd = 0.4;
        float haloStrength = smoothstep(haloStart, 0.25, dist) * (1.0 - smoothstep(0.25, haloEnd, dist));
        
        // Animated halo colors
        vec3 haloColor1 = vec3(0.89, 0.78, 0.54); // Gold
        vec3 haloColor2 = vec3(0.56, 0.42, 0.95); // Purple
        vec3 haloColor3 = vec3(0.39, 0.72, 0.95); // Cyan
        float t = sin(uTime * 0.5) * 0.5 + 0.5;
        vec3 haloColor = mix(mix(haloColor1, haloColor2, t), haloColor3, sin(uTime * 0.3) * 0.3 + 0.2);
        
        // Add halo glow
        vec3 finalColor = texColor.rgb + haloColor * haloStrength * 0.6;
        
        // Inner radiance
        float innerGlow = smoothstep(0.25, 0.0, dist) * 0.15;
        finalColor += innerGlow;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}

function HorizonOwl({ avatarId, isListening, isSpeaking }: {
  avatarId: number;
  isListening: boolean;
  isSpeaking: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, owlImages[avatarId - 1] || owlImages[0]);
  
  const owlMaterial = useMemo(() => createOwlMaterial(texture), [texture]);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    meshRef.current.position.y = -0.3 + Math.sin(time * 0.8) * 0.15;
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.02;
    
    const baseScale = 3.2;
    const pulseScale = isListening ? baseScale + 0.3 : isSpeaking ? baseScale + 0.15 : baseScale;
    const pulse = Math.sin(time * 2.5) * 0.1;
    meshRef.current.scale.setScalar(pulseScale + (isListening || isSpeaking ? pulse : 0));
    
    owlMaterial.uniforms.uTime.value = time;
    
    if (glowRef.current) {
      const glowMat = glowRef.current.material as THREE.ShaderMaterial;
      glowMat.uniforms.uTime.value = time;
      glowMat.uniforms.uIntensity.value = isListening ? 1.8 : isSpeaking ? 1.4 : 0.8;
      glowRef.current.position.copy(meshRef.current.position);
      glowRef.current.position.z -= 0.5;
      glowRef.current.scale.setScalar(meshRef.current.scale.x * 1.5);
    }
  });

  const glowVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const glowFragmentShader = `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center);
      
      float glow = exp(-dist * 3.0) * uIntensity;
      
      vec3 color1 = vec3(0.56, 0.42, 0.95);
      vec3 color2 = vec3(0.39, 0.72, 0.95);
      vec3 color3 = vec3(0.89, 0.98, 0.54);
      
      float t = sin(uTime * 0.5) * 0.5 + 0.5;
      vec3 glowColor = mix(mix(color1, color2, t), color3, sin(uTime * 0.3) * 0.3 + 0.3);
      
      gl_FragColor = vec4(glowColor, glow * 0.6);
    }
  `;

  return (
    <>
      <mesh ref={glowRef} position={[0, -0.3, -0.5]}>
        <planeGeometry args={[4, 4]} />
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uIntensity: { value: 0.8 }
          }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={meshRef} position={[0, -0.3, 0]} scale={3.2} material={owlMaterial}>
        <planeGeometry args={[2, 2.5]} />
      </mesh>
    </>
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
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={1.2} color="#9370db" />
      <pointLight position={[-5, 3, 2]} intensity={0.6} color="#00ffcc" />
      <pointLight position={[5, 2, 3]} intensity={0.4} color="#f361d3" />
      
      <MagicalOcean />
      <TwinklingStars />
      
      {showFlying ? (
        <FlyingOwl3D 
          avatarId={avatarId} 
          isLanding={true}
          isListening={isListening}
          isSpeaking={isSpeaking}
        />
      ) : (
        <HorizonOwl 
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
