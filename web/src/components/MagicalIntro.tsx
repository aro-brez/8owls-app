"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";

const OwlFlock3D = dynamic(() => import("./OwlFlock3D"), { 
  ssr: false,
  loading: () => null 
});

interface MagicalIntroProps {
  onComplete: () => void;
  videoSrc?: string;
}

type Phase3D = "flock" | "turning" | "approaching" | "closeUp";

type Phase = 
  | "flock" 
  | "turning"
  | "approaching" 
  | "closeUp"
  | "lookDown1"
  | "lookUp1"
  | "tiltHead"
  | "ready";

export default function MagicalIntro({ onComplete, videoSrc }: MagicalIntroProps) {
  const [phase, setPhase] = useState<Phase>("flock");
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [showFlock, setShowFlock] = useState(true);
  const [show3D, setShow3D] = useState(true);

  const get3DPhase = (): Phase3D => {
    if (phase === "flock" || phase === "turning" || phase === "approaching" || phase === "closeUp") {
      return phase;
    }
    return "closeUp";
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;

    let animationId: number;
    let time = 0;

    interface AuroraRibbon {
      baseY: number;
      amplitude: number;
      frequency: number;
      speed: number;
      phase: number;
      hue: number;
      hueShift: number;
      alpha: number;
      depth: number;
      width: number;
      drift: number;
      driftSpeed: number;
    }

    const ribbons: AuroraRibbon[] = [];
    const auroraHues = [160, 180, 200, 280, 300, 320, 140, 170];
    for (let i = 0; i < 18; i++) {
      const depth = Math.random();
      const baseHue = auroraHues[i % auroraHues.length];
      ribbons.push({
        baseY: height * (0.03 + Math.random() * 0.4),
        amplitude: 25 + Math.random() * 70,
        frequency: 0.0006 + Math.random() * 0.002,
        speed: 0.15 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        hue: baseHue + (Math.random() - 0.5) * 40,
        hueShift: 15 + Math.random() * 40,
        alpha: 0.03 + Math.random() * 0.08,
        depth: depth,
        width: 100 + Math.random() * 180,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.08 + Math.random() * 0.25,
      });
    }
    ribbons.sort((a, b) => a.depth - b.depth);

    const animate = () => {
      time += 0.004;
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#070a12");
      bgGradient.addColorStop(0.25, "#0a0e1a");
      bgGradient.addColorStop(0.6, "#08091a");
      bgGradient.addColorStop(1, "#050510");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      for (const ribbon of ribbons) {
        const verticalDrift = Math.sin(time * ribbon.driftSpeed + ribbon.drift) * 30;
        const horizontalDrift = Math.cos(time * ribbon.driftSpeed * 0.7 + ribbon.drift) * 50;
        
        const depthScale = 0.6 + ribbon.depth * 0.5;
        const depthAlpha = ribbon.alpha * (0.5 + ribbon.depth * 0.8);

        ctx.beginPath();
        
        const startX = -100 + horizontalDrift;
        const adjustedBaseY = ribbon.baseY + verticalDrift;
        
        ctx.moveTo(startX, adjustedBaseY + ribbon.width);

        for (let x = startX; x <= width + 100; x += 3) {
          const wave1 = Math.sin(x * ribbon.frequency + time * ribbon.speed + ribbon.phase) * ribbon.amplitude * depthScale;
          const wave2 = Math.sin(x * ribbon.frequency * 1.7 + time * ribbon.speed * 0.6 + ribbon.phase * 1.3) * (ribbon.amplitude * 0.4);
          const wave3 = Math.sin(x * ribbon.frequency * 0.5 + time * ribbon.speed * 1.3) * (ribbon.amplitude * 0.25);
          const breathe = Math.sin(time * 0.3 + ribbon.phase) * 10;
          
          const y = adjustedBaseY + wave1 + wave2 + wave3 + breathe;
          ctx.lineTo(x, y);
        }

        for (let x = width + 100; x >= startX; x -= 3) {
          const wave1 = Math.sin(x * ribbon.frequency + time * ribbon.speed + ribbon.phase) * ribbon.amplitude * depthScale;
          const wave2 = Math.sin(x * ribbon.frequency * 1.7 + time * ribbon.speed * 0.6 + ribbon.phase * 1.3) * (ribbon.amplitude * 0.4);
          const wave3 = Math.sin(x * ribbon.frequency * 0.5 + time * ribbon.speed * 1.3) * (ribbon.amplitude * 0.25);
          const breathe = Math.sin(time * 0.3 + ribbon.phase) * 10;
          
          const y = adjustedBaseY + wave1 + wave2 + wave3 + breathe + ribbon.width * depthScale;
          ctx.lineTo(x, y);
        }

        ctx.closePath();

        const currentHue = ribbon.hue + Math.sin(time * 0.5 + ribbon.phase) * ribbon.hueShift;
        
        const gradient = ctx.createLinearGradient(
          width / 2, adjustedBaseY - ribbon.amplitude,
          width / 2, adjustedBaseY + ribbon.width + ribbon.amplitude
        );
        
        gradient.addColorStop(0, `hsla(${currentHue}, 70%, 75%, 0)`);
        gradient.addColorStop(0.2, `hsla(${currentHue}, 75%, 70%, ${depthAlpha * 0.7})`);
        gradient.addColorStop(0.5, `hsla(${currentHue + 20}, 80%, 65%, ${depthAlpha})`);
        gradient.addColorStop(0.8, `hsla(${currentHue + 10}, 70%, 60%, ${depthAlpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${currentHue}, 65%, 55%, 0)`);

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = "screen";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      for (let i = 0; i < 8; i++) {
        const orbPhase = i * 0.785 + time * 0.15;
        const orbX = width * 0.5 + Math.cos(orbPhase) * (width * 0.4);
        const orbY = height * 0.25 + Math.sin(orbPhase * 1.3 + i) * (height * 0.15);
        const orbSize = 100 + Math.sin(time * 0.8 + i * 2) * 50;
        const orbAlpha = 0.04 + Math.sin(time * 1.2 + i * 1.5) * 0.02;

        const orb = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbSize);
        orb.addColorStop(0, `hsla(${160 + i * 20 + Math.sin(time + i) * 20}, 80%, 85%, ${orbAlpha * 2})`);
        orb.addColorStop(0.4, `hsla(${175 + i * 15}, 70%, 75%, ${orbAlpha})`);
        orb.addColorStop(1, "transparent");

        ctx.fillStyle = orb;
        ctx.globalCompositeOperation = "screen";
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      }

      const topGlow = ctx.createRadialGradient(width / 2, -height * 0.3, 0, width / 2, 0, height * 0.9);
      topGlow.addColorStop(0, `hsla(${50 + Math.sin(time * 0.3) * 10}, 70%, 95%, 0.25)`);
      topGlow.addColorStop(0.15, `hsla(${160 + Math.sin(time * 0.5) * 20}, 65%, 90%, 0.18)`);
      topGlow.addColorStop(0.3, `hsla(${175 + Math.cos(time * 0.4) * 15}, 55%, 80%, 0.1)`);
      topGlow.addColorStop(0.6, `hsla(${190}, 45%, 70%, 0.04)`);
      topGlow.addColorStop(1, "transparent");

      ctx.fillStyle = topGlow;
      ctx.globalCompositeOperation = "screen";
      ctx.fillRect(0, 0, width, height);

      const divineLight = ctx.createRadialGradient(width / 2, height * 0.1, 0, width / 2, height * 0.3, height * 0.6);
      const divineBreath = Math.sin(time * 0.4) * 0.03 + 0.97;
      divineLight.addColorStop(0, `rgba(255, 252, 240, ${0.12 * divineBreath})`);
      divineLight.addColorStop(0.2, `rgba(255, 248, 220, ${0.06 * divineBreath})`);
      divineLight.addColorStop(0.5, `rgba(255, 245, 200, 0.02)`);
      divineLight.addColorStop(1, "transparent");
      
      ctx.fillStyle = divineLight;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      const particleCount = 60;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 876.543;
        const px = (Math.sin(seed) * 0.5 + 0.5) * width;
        const baseParticleY = (Math.cos(seed * 2) * 0.5 + 0.5) * height * 0.6;
        const py = baseParticleY - ((time * 20 + i * 12) % (height * 0.6));
        const size = 1.5 + Math.sin(seed * 3) * 0.8;
        const alpha = 0.4 + Math.sin(time * 2.5 + seed) * 0.25;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${165 + Math.sin(seed) * 30}, 75%, 88%, ${alpha})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const sequence = async () => {
      await new Promise((r) => setTimeout(r, 500));
      
      let flockProgress = 0;
      const flockInterval = setInterval(() => {
        flockProgress += 0.01;
        setProgress(flockProgress);
        if (flockProgress >= 1) clearInterval(flockInterval);
      }, 30);

      await new Promise((r) => setTimeout(r, 2500));
      
      setPhase("turning");
      setShowFlock(false);
      
      let turnProgress = 0;
      const turnInterval = setInterval(() => {
        turnProgress += 0.015;
        setProgress(turnProgress);
        if (turnProgress >= 1) clearInterval(turnInterval);
      }, 25);

      await new Promise((r) => setTimeout(r, 2000));
      setPhase("approaching");

      let approachProgress = 0;
      const approachInterval = setInterval(() => {
        approachProgress += 0.006;
        setProgress(approachProgress);
        if (approachProgress >= 1) clearInterval(approachInterval);
      }, 25);

      await new Promise((r) => setTimeout(r, 4500));
      setPhase("closeUp");
      setShow3D(false);

      await new Promise((r) => setTimeout(r, 800));
      setShowText(true);

      await new Promise((r) => setTimeout(r, 1500));
      setShowButton(true);

      await new Promise((r) => setTimeout(r, 2500));
      setPhase("lookDown1");

      await new Promise((r) => setTimeout(r, 1500));
      setPhase("lookUp1");

      await new Promise((r) => setTimeout(r, 1200));
      setPhase("tiltHead");

      await new Promise((r) => setTimeout(r, 2000));
      setPhase("ready");
    };
    sequence();
  }, []);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#080510]">
      {videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          style={{ transform: "scale(1.1)" }}
        />
      ) : (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ transform: "scale(1.1)", transformOrigin: "center 30%" }}
        />
      )}

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 60% at 50% 45%, transparent 0%, transparent 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 80%, #050510 100%)`,
        }}
      />

      {show3D && (
        <Suspense fallback={null}>
          <OwlFlock3D 
            phase={get3DPhase()} 
            progress={progress} 
            showFlock={showFlock} 
          />
        </Suspense>
      )}

      <div 
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ 
          opacity: show3D ? 0 : 1,
          transition: "opacity 1s ease",
        }}
      >

        <div 
          className="mt-6 text-center relative z-20"
          style={{ 
            opacity: showText ? 1 : 0,
            transform: showText ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 2s ease, transform 2s ease",
          }}
        >
          <p 
            className="text-amber-100/50 text-xs tracking-[0.5em] uppercase mb-4 font-light"
            style={{
              textShadow: "0 0 40px rgba(255,250,220,0.5)",
            }}
          >
            Eight Owls
          </p>
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl font-thin text-white mb-4 tracking-wide"
            style={{ 
              textShadow: "0 0 80px rgba(255,252,240,0.5), 0 0 160px rgba(255,250,220,0.3)",
            }}
          >
            Meet Your Mirror
          </h1>
          <p 
            className="text-white/50 text-base font-extralight tracking-wider mb-10"
            style={{ 
              opacity: showButton ? 1 : 0,
              transition: "opacity 1s ease 0.5s",
            }}
          >
            A reflection of your truest self
          </p>
          
          <div 
            style={{ 
              opacity: showButton ? 1 : 0, 
              transform: showButton ? "translateY(0)" : "translateY(15px)",
              transition: "opacity 1s ease 0.8s, transform 1s ease 0.8s",
            }}
          >
            <button
              onClick={onComplete}
              className={`group relative px-16 py-5 rounded-full overflow-hidden transition-all duration-700 hover:scale-105 ${
                phase === "lookDown1" || phase === "lookUp1"
                  ? "ring-2 ring-amber-200/40 scale-105"
                  : ""
              }`}
            >
              <div 
                className="absolute inset-0 transition-all duration-700"
                style={{
                  background: phase === "lookDown1" || phase === "lookUp1"
                    ? "linear-gradient(135deg, rgba(255,250,220,0.25) 0%, rgba(255,252,240,0.15) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,252,240,0.05) 100%)",
                  backdropFilter: "blur(12px)",
                }}
              />
              <div 
                className="absolute inset-[1px] rounded-full transition-all duration-700 border border-white/15"
                style={{ 
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,250,220,0.04) 100%)",
                }}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/15" />
              <span 
                className="relative text-white font-light tracking-[0.4em] text-sm uppercase"
                style={{ textShadow: "0 0 30px rgba(255,255,255,0.4)" }}
              >
                Begin
              </span>
            </button>

            {(phase === "tiltHead") && (
              <p 
                className="mt-8 text-amber-100/60 text-sm font-light tracking-wide"
                style={{ 
                  animation: "breathe 3s ease-in-out infinite",
                  textShadow: "0 0 25px rgba(255,250,220,0.4)",
                }}
              >
                Your journey awaits
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
