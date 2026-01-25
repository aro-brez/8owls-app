"use client";

import { useState, useEffect, useRef } from "react";
import RealisticOwl from "./RealisticOwl";
import { DivineParticles } from "./VideoBackground";

interface MagicalIntroProps {
  onComplete: () => void;
  videoSrc?: string;
}

export default function MagicalIntro({ onComplete, videoSrc }: MagicalIntroProps) {
  const [phase, setPhase] = useState<"darkness" | "awakening" | "presence" | "gaze" | "ready">("darkness");
  const [showText, setShowText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      time += 0.008;

      const phaseProgress = phase === "darkness" ? 0.3 : phase === "awakening" ? 0.6 : 1;

      const bgGradient = ctx.createRadialGradient(
        width / 2, height * 0.35, 0,
        width / 2, height * 0.5, width
      );

      bgGradient.addColorStop(0, `rgba(${30 * phaseProgress}, ${22 * phaseProgress}, ${55 * phaseProgress}, 1)`);
      bgGradient.addColorStop(0.4, `rgba(${18 * phaseProgress}, ${14 * phaseProgress}, ${42 * phaseProgress}, 1)`);
      bgGradient.addColorStop(1, `rgba(${8 * phaseProgress}, ${5 * phaseProgress}, ${20 * phaseProgress}, 1)`);

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      if (phase !== "darkness") {
        const centerX = width / 2;
        const centerY = height * 0.35;

        for (let ring = 0; ring < 12; ring++) {
          const baseRadius = 100 + ring * 50;
          const radiusPulse = Math.sin(time * 1.5 + ring * 0.5) * 20;
          const radius = baseRadius + radiusPulse;

          const alpha = (0.08 - ring * 0.005) * phaseProgress;

          const hueShift = time * 8;
          const hue = (50 + ring * 8 + hueShift) % 360;

          const ringGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.7,
            centerX, centerY, radius * 1.3
          );

          ringGradient.addColorStop(0, `hsla(${hue}, 50%, 90%, 0)`);
          ringGradient.addColorStop(0.4, `hsla(${hue}, 60%, 85%, ${alpha})`);
          ringGradient.addColorStop(0.6, `hsla(${hue + 20}, 55%, 88%, ${alpha * 0.8})`);
          ringGradient.addColorStop(1, `hsla(${hue}, 50%, 90%, 0)`);

          ctx.fillStyle = ringGradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        const coreGlow = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, 200
        );

        const corePulse = Math.sin(time * 2) * 0.02 + 0.98;
        coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.15 * corePulse * phaseProgress})`);
        coreGlow.addColorStop(0.2, `rgba(255, 250, 230, ${0.08 * corePulse * phaseProgress})`);
        coreGlow.addColorStop(0.5, `rgba(255, 240, 200, ${0.03 * phaseProgress})`);
        coreGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = coreGlow;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
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
  }, [phase]);

  useEffect(() => {
    const sequence = async () => {
      await new Promise((r) => setTimeout(r, 1000));
      setPhase("awakening");
      await new Promise((r) => setTimeout(r, 1500));
      setPhase("presence");
      await new Promise((r) => setTimeout(r, 2000));
      setPhase("gaze");
      await new Promise((r) => setTimeout(r, 1000));
      setShowText(true);
      await new Promise((r) => setTimeout(r, 600));
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
    <div className="fixed inset-0 overflow-hidden bg-[#0a0515]">
      {videoSrc ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0" />
      )}

      {phase !== "darkness" && <DivineParticles />}

      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.05) 0%, transparent 50%),
            linear-gradient(180deg, transparent 0%, rgba(10,5,21,0.4) 100%)
          `,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`relative transition-all duration-1000 ease-out ${
            phase === "darkness"
              ? "opacity-0 scale-50"
              : phase === "awakening"
              ? "opacity-60 scale-90"
              : "opacity-100 scale-100"
          }`}
          style={{
            transform: phase === "presence" || phase === "gaze" || phase === "ready"
              ? `translateY(${Math.sin(Date.now() / 1000) * 5}px)`
              : undefined,
          }}
        >
          <RealisticOwl
            owlId={0}
            size="xl"
            interactive={phase === "gaze" || phase === "ready"}
            glowing={phase === "gaze" || phase === "ready"}
          />
        </div>

        {showText && (
          <div 
            className="mt-12 text-center"
            style={{ animation: "fadeSlideUp 1.2s ease-out forwards" }}
          >
            <p 
              className="text-white/40 text-xs tracking-[0.5em] uppercase mb-5 font-light"
              style={{ animation: "fadeSlideUp 1s ease-out forwards", animationDelay: "0.15s", opacity: 0 }}
            >
              Eight Owls
            </p>
            <h1 
              className="text-4xl md:text-5xl font-extralight text-white mb-12 tracking-wider"
              style={{ 
                animation: "fadeSlideUp 1s ease-out forwards", 
                animationDelay: "0.35s", 
                opacity: 0,
                textShadow: "0 0 60px rgba(255,255,255,0.3)",
              }}
            >
              Meet Your Mirror
            </h1>
            
            {phase === "ready" && (
              <button
                onClick={onComplete}
                className="group relative px-16 py-4 rounded-full overflow-hidden transition-all duration-500 hover:scale-105"
                style={{ animation: "fadeSlideUp 1s ease-out forwards", animationDelay: "0.55s", opacity: 0 }}
              >
                <div 
                  className="absolute inset-0 transition-all duration-500"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,250,230,0.15) 0%, rgba(255,255,255,0.08) 100%)",
                    backdropFilter: "blur(10px)",
                  }}
                />
                <div 
                  className="absolute inset-[1px] rounded-full transition-all duration-500"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,250,230,0.05) 100%)",
                  }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/10" />
                <span className="relative text-white/90 font-light tracking-[0.3em] text-sm uppercase">
                  Begin
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
