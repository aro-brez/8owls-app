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

    const animate = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#0a0d18");
      bgGradient.addColorStop(0.3, "#0c1020");
      bgGradient.addColorStop(1, "#080510");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const auroraLayers = 8;
      for (let layer = 0; layer < auroraLayers; layer++) {
        const layerOffset = layer * 0.3;
        const baseY = height * (0.08 + layer * 0.06);
        const amplitude = 30 + layer * 15;
        const frequency = 0.0015 - layer * 0.0001;

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= width; x += 2) {
          const wave1 = Math.sin(x * frequency + time * 0.6 + layerOffset) * amplitude;
          const wave2 = Math.sin(x * frequency * 1.3 + time * 0.4 + layerOffset * 1.5) * (amplitude * 0.6);
          const wave3 = Math.sin(x * frequency * 0.7 + time * 0.9) * (amplitude * 0.4);
          const y = baseY + wave1 + wave2 + wave3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const hue1 = 150 + layer * 20 + Math.sin(time * 0.5 + layer) * 15;
        const hue2 = 180 + layer * 15 + Math.cos(time * 0.4 + layer) * 20;
        const alpha = 0.06 - layer * 0.005;

        const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, baseY + height * 0.25);
        gradient.addColorStop(0, `hsla(${hue1}, 75%, 75%, ${alpha * 1.8})`);
        gradient.addColorStop(0.2, `hsla(${hue2}, 65%, 65%, ${alpha * 1.2})`);
        gradient.addColorStop(0.5, `hsla(${hue1 + 30}, 55%, 55%, ${alpha * 0.6})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.fill();
      }

      for (let i = 0; i < 5; i++) {
        const shimmerX = (width * 0.1) + (width * 0.8) * ((time * 0.08 + i * 0.2) % 1);
        const shimmerY = height * 0.2 + Math.sin(time * 1.5 + i * 2) * 40;

        const shimmer = ctx.createRadialGradient(shimmerX, shimmerY, 0, shimmerX, shimmerY, 200);
        shimmer.addColorStop(0, `hsla(${160 + i * 30}, 85%, 85%, ${0.1 + Math.sin(time * 2.5 + i) * 0.05})`);
        shimmer.addColorStop(0.4, `hsla(${180 + i * 25}, 70%, 75%, 0.03)`);
        shimmer.addColorStop(1, "transparent");

        ctx.fillStyle = shimmer;
        ctx.fillRect(0, 0, width, height);
      }

      const topGlow = ctx.createRadialGradient(width / 2, -height * 0.2, 0, width / 2, 0, height * 0.8);
      topGlow.addColorStop(0, `hsla(${155 + Math.sin(time * 0.7) * 15}, 60%, 85%, 0.2)`);
      topGlow.addColorStop(0.3, `hsla(${175 + Math.cos(time * 0.5) * 15}, 50%, 75%, 0.1)`);
      topGlow.addColorStop(0.6, `hsla(${190}, 40%, 65%, 0.04)`);
      topGlow.addColorStop(1, "transparent");

      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 987.654;
        const px = (Math.sin(seed) * 0.5 + 0.5) * width;
        const baseY = (Math.cos(seed * 2) * 0.5 + 0.5) * height * 0.5;
        const py = baseY - ((time * 25 + i * 15) % (height * 0.5));
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
