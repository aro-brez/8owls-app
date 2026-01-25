"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface MagicalIntroProps {
  onComplete: () => void;
  videoSrc?: string;
}

type Phase = 
  | "distant" 
  | "approaching" 
  | "arrived"
  | "lookDown1"
  | "lookUp1"
  | "lookDown2"
  | "tiltHead"
  | "lookDown3"
  | "ready";

export default function MagicalIntro({ onComplete, videoSrc }: MagicalIntroProps) {
  const [phase, setPhase] = useState<Phase>("distant");
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zoom, setZoom] = useState(0.2);

  const owlTransforms: Record<Phase, { rotateX: number; rotateY: number; rotateZ: number; y: number }> = {
    distant: { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0 },
    approaching: { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0 },
    arrived: { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0 },
    lookDown1: { rotateX: 15, rotateY: 0, rotateZ: 0, y: 20 },
    lookUp1: { rotateX: -5, rotateY: 0, rotateZ: 0, y: -10 },
    lookDown2: { rotateX: 20, rotateY: 0, rotateZ: 0, y: 25 },
    tiltHead: { rotateX: 5, rotateY: 0, rotateZ: 15, y: 0 },
    lookDown3: { rotateX: 18, rotateY: 0, rotateZ: 5, y: 20 },
    ready: { rotateX: 0, rotateY: 0, rotateZ: 0, y: 0 },
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
    for (let i = 0; i < 15; i++) {
      const depth = Math.random();
      ribbons.push({
        baseY: height * (0.05 + Math.random() * 0.35),
        amplitude: 20 + Math.random() * 60,
        frequency: 0.0008 + Math.random() * 0.002,
        speed: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        hue: 140 + Math.random() * 80,
        hueShift: 10 + Math.random() * 30,
        alpha: 0.02 + Math.random() * 0.06,
        depth: depth,
        width: 80 + Math.random() * 150,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.1 + Math.random() * 0.3,
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
      topGlow.addColorStop(0, `hsla(${160 + Math.sin(time * 0.5) * 20}, 65%, 90%, 0.18)`);
      topGlow.addColorStop(0.2, `hsla(${175 + Math.cos(time * 0.4) * 15}, 55%, 80%, 0.1)`);
      topGlow.addColorStop(0.5, `hsla(${190}, 45%, 70%, 0.04)`);
      topGlow.addColorStop(1, "transparent");

      ctx.fillStyle = topGlow;
      ctx.globalCompositeOperation = "screen";
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
      await new Promise((r) => setTimeout(r, 600));
      setPhase("approaching");

      let progress = 0;
      const zoomInterval = setInterval(() => {
        progress += 0.015;
        const eased = 1 - Math.pow(1 - progress, 3);
        setZoom(0.2 + eased * 0.8);
        if (progress >= 1) clearInterval(zoomInterval);
      }, 25);

      await new Promise((r) => setTimeout(r, 2500));
      setPhase("arrived");
      setShowText(true);

      await new Promise((r) => setTimeout(r, 1200));
      setShowButton(true);

      await new Promise((r) => setTimeout(r, 800));
      setPhase("lookDown1");

      await new Promise((r) => setTimeout(r, 1000));
      setPhase("lookUp1");

      await new Promise((r) => setTimeout(r, 800));
      setPhase("lookDown2");

      await new Promise((r) => setTimeout(r, 600));
      setPhase("tiltHead");

      await new Promise((r) => setTimeout(r, 1200));
      setPhase("lookDown3");

      await new Promise((r) => setTimeout(r, 800));
      setPhase("ready");
    };
    sequence();
  }, []);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  const transform = owlTransforms[phase];
  const cameraZoom = 1 + (zoom - 0.2) * 0.15;

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
          style={{ transform: `scale(${cameraZoom})` }}
        />
      ) : (
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{ transform: `scale(${cameraZoom})`, transformOrigin: "center 30%" }}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="relative transition-all ease-out"
          style={{
            transform: `scale(${zoom})`,
            opacity: phase === "distant" ? 0.3 : 1,
            transitionDuration: phase === "approaching" ? "2500ms" : "600ms",
          }}
        >
          <div
            className="absolute -inset-32 rounded-full blur-[100px] transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, rgba(93,241,179,0.2) 0%, rgba(100,183,243,0.15) 40%, transparent 70%)`,
              opacity: zoom > 0.7 ? 0.9 : 0.4,
            }}
          />

          <div 
            className="relative transition-all duration-700 ease-out"
            style={{
              transform: `
                perspective(1000px)
                rotateX(${transform.rotateX}deg)
                rotateY(${transform.rotateY}deg)
                rotateZ(${transform.rotateZ}deg)
                translateY(${transform.y}px)
              `,
            }}
          >
            <Image
              src="/owls/owl-fullbody-1.png"
              alt="Your owl companion"
              width={500}
              height={667}
              className="w-48 h-64 md:w-64 md:h-80 lg:w-72 lg:h-96 object-contain"
              style={{
                filter: `drop-shadow(0 0 ${40 + zoom * 50}px rgba(93,241,179,0.5)) drop-shadow(0 0 ${70 + zoom * 80}px rgba(100,183,243,0.3))`,
                maskImage: "radial-gradient(ellipse 90% 95% at 50% 50%, black 60%, transparent 90%)",
                WebkitMaskImage: "radial-gradient(ellipse 90% 95% at 50% 50%, black 60%, transparent 90%)",
              }}
              priority
            />
          </div>
        </div>

        <div 
          className={`mt-8 text-center relative z-10 transition-all duration-700 ${
            showText ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-emerald-200/50 text-xs tracking-[0.5em] uppercase mb-4 font-light">
            Eight Owls
          </p>
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-extralight text-white/90 mb-10 tracking-wider"
            style={{ 
              textShadow: "0 0 60px rgba(93,241,179,0.3), 0 0 120px rgba(100,183,243,0.2)",
            }}
          >
            Meet Your Mirror
          </h1>
          
          <div 
            className={`transition-all duration-700 ${
              showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <button
              onClick={onComplete}
              className={`group relative px-14 py-4 rounded-full overflow-hidden transition-all duration-500 hover:scale-105 ${
                phase === "lookDown1" || phase === "lookDown2" || phase === "lookDown3"
                  ? "ring-2 ring-emerald-400/50 scale-105"
                  : ""
              }`}
            >
              <div 
                className={`absolute inset-0 transition-all duration-500 ${
                  phase === "lookDown1" || phase === "lookDown2" || phase === "lookDown3"
                    ? "bg-emerald-500/20"
                    : ""
                }`}
                style={{
                  background: "linear-gradient(135deg, rgba(93,241,179,0.15) 0%, rgba(100,183,243,0.1) 100%)",
                  backdropFilter: "blur(10px)",
                }}
              />
              <div 
                className="absolute inset-[1px] rounded-full transition-all duration-500 border border-white/10"
                style={{ 
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(93,241,179,0.05) 100%)",
                }}
              />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/10" />
              <span className="relative text-white/90 font-light tracking-[0.3em] text-sm uppercase">
                Begin
              </span>
            </button>

            {(phase === "tiltHead") && (
              <p 
                className="mt-6 text-emerald-300/60 text-sm font-light animate-pulse"
                style={{ animation: "fadeIn 0.5s ease-out" }}
              >
                Go ahead, click it
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
      `}</style>
    </div>
  );
}
