"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface MagicalIntroProps {
  onComplete: () => void;
  videoSrc?: string;
}

type Phase = "distant" | "approaching" | "looking" | "gazeButton" | "gazeYou" | "ready";

export default function MagicalIntro({ onComplete, videoSrc }: MagicalIntroProps) {
  const [phase, setPhase] = useState<Phase>("distant");
  const [showText, setShowText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [owlLook, setOwlLook] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.3);

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
      time += 0.006;
      ctx.clearRect(0, 0, width, height);

      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "#0d0a1a");
      bgGradient.addColorStop(0.4, "#0f0d20");
      bgGradient.addColorStop(1, "#080510");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const auroraLayers = 6;
      for (let layer = 0; layer < auroraLayers; layer++) {
        const layerOffset = layer * 0.4;
        const baseY = height * (0.15 + layer * 0.08);
        const amplitude = 40 + layer * 20;
        const frequency = 0.002 - layer * 0.0002;

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= width; x += 3) {
          const wave1 = Math.sin(x * frequency + time * 0.8 + layerOffset) * amplitude;
          const wave2 = Math.sin(x * frequency * 1.5 + time * 0.5 + layerOffset * 2) * (amplitude * 0.5);
          const wave3 = Math.sin(x * frequency * 0.5 + time * 1.2) * (amplitude * 0.3);
          const y = baseY + wave1 + wave2 + wave3;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const hue1 = 140 + layer * 30 + Math.sin(time + layer) * 20;
        const hue2 = 180 + layer * 25 + Math.cos(time * 0.7 + layer) * 30;
        const alpha = 0.04 - layer * 0.004;

        const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, baseY + height * 0.3);
        gradient.addColorStop(0, `hsla(${hue1}, 70%, 70%, ${alpha * 1.5})`);
        gradient.addColorStop(0.3, `hsla(${hue2}, 60%, 60%, ${alpha})`);
        gradient.addColorStop(0.6, `hsla(${hue1 + 40}, 50%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.fill();
      }

      for (let i = 0; i < 3; i++) {
        const shimmerX = (width * 0.2) + (width * 0.6) * ((time * 0.1 + i * 0.33) % 1);
        const shimmerY = height * 0.25 + Math.sin(time * 2 + i) * 50;

        const shimmer = ctx.createRadialGradient(shimmerX, shimmerY, 0, shimmerX, shimmerY, 150);
        shimmer.addColorStop(0, `hsla(${160 + i * 40}, 80%, 80%, ${0.08 + Math.sin(time * 3 + i) * 0.04})`);
        shimmer.addColorStop(0.5, `hsla(${180 + i * 30}, 60%, 70%, 0.02)`);
        shimmer.addColorStop(1, "transparent");

        ctx.fillStyle = shimmer;
        ctx.fillRect(0, 0, width, height);
      }

      const topGlow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, height * 0.7);
      topGlow.addColorStop(0, `hsla(${150 + Math.sin(time) * 20}, 50%, 80%, 0.15)`);
      topGlow.addColorStop(0.3, `hsla(${170 + Math.cos(time * 0.8) * 20}, 40%, 70%, 0.08)`);
      topGlow.addColorStop(0.6, `hsla(${190}, 30%, 60%, 0.03)`);
      topGlow.addColorStop(1, "transparent");

      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 1234.5678;
        const px = (Math.sin(seed) * 0.5 + 0.5) * width;
        const baseY = (Math.cos(seed * 2) * 0.5 + 0.5) * height * 0.6;
        const py = baseY - ((time * 30 + i * 20) % (height * 0.6));
        const size = 1 + Math.sin(seed * 3) * 0.5;
        const alpha = 0.3 + Math.sin(time * 2 + seed) * 0.2;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${160 + Math.sin(seed) * 40}, 70%, 85%, ${alpha})`;
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
      await new Promise((r) => setTimeout(r, 800));
      setPhase("approaching");
      
      const zoomIn = () => {
        let progress = 0;
        const zoomInterval = setInterval(() => {
          progress += 0.02;
          const eased = 1 - Math.pow(1 - progress, 3);
          setZoom(0.3 + eased * 0.7);
          if (progress >= 1) clearInterval(zoomInterval);
        }, 30);
      };
      zoomIn();

      await new Promise((r) => setTimeout(r, 500));
      setOwlLook({ x: -15, y: -10 });
      await new Promise((r) => setTimeout(r, 600));
      setOwlLook({ x: 20, y: -5 });
      await new Promise((r) => setTimeout(r, 500));
      setPhase("looking");
      setOwlLook({ x: -10, y: 5 });
      await new Promise((r) => setTimeout(r, 600));
      setOwlLook({ x: 10, y: 0 });
      await new Promise((r) => setTimeout(r, 500));

      setPhase("gazeButton");
      setOwlLook({ x: 0, y: 40 });
      await new Promise((r) => setTimeout(r, 1000));
      setShowText(true);

      await new Promise((r) => setTimeout(r, 800));
      setPhase("gazeYou");
      
      const lookAtYou = () => {
        let progress = 0;
        const lookInterval = setInterval(() => {
          progress += 0.03;
          const eased = 1 - Math.pow(1 - progress, 2);
          setOwlLook({ x: 0 * (1 - eased), y: 40 * (1 - eased) });
          if (progress >= 1) clearInterval(lookInterval);
        }, 30);
      };
      lookAtYou();

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

  const owlScale = zoom;
  const cameraZoom = 1 + (zoom - 0.3) * 0.3;

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
          style={{ transform: `scale(${cameraZoom})`, transformOrigin: "center 40%" }}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="relative transition-all duration-700 ease-out"
          style={{
            transform: `
              scale(${owlScale})
              translateX(${owlLook.x * 0.5}px)
              translateY(${owlLook.y * 0.3}px)
            `,
            opacity: phase === "distant" ? 0.4 : 1,
          }}
        >
          <div
            className="absolute -inset-20 rounded-full blur-[80px] transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, rgba(100,183,243,0.15) 0%, rgba(93,241,179,0.1) 40%, transparent 70%)`,
              opacity: phase === "ready" ? 0.8 : 0.4,
            }}
          />

          <div 
            className="relative"
            style={{
              transform: `rotateY(${owlLook.x * 0.3}deg) rotateX(${-owlLook.y * 0.2}deg)`,
              transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="relative">
              <Image
                src="/owls/realistic-owl-1.png"
                alt="Your owl companion"
                width={400}
                height={400}
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
                style={{
                  filter: `drop-shadow(0 0 ${50 + zoom * 40}px rgba(100,183,243,0.6)) drop-shadow(0 0 ${80 + zoom * 60}px rgba(93,241,179,0.3))`,
                  maskImage: "radial-gradient(ellipse 75% 80% at 50% 50%, black 40%, transparent 75%)",
                  WebkitMaskImage: "radial-gradient(ellipse 75% 80% at 50% 50%, black 40%, transparent 75%)",
                }}
                priority
              />
            </div>
          </div>

        </div>

        {showText && (
          <div 
            className="mt-16 text-center relative z-10"
            style={{ animation: "fadeSlideUp 1.2s ease-out forwards" }}
          >
            <p 
              className="text-emerald-200/50 text-xs tracking-[0.5em] uppercase mb-5 font-light"
              style={{ animation: "fadeSlideUp 1s ease-out forwards", animationDelay: "0.15s", opacity: 0 }}
            >
              Eight Owls
            </p>
            <h1 
              className="text-4xl md:text-5xl font-extralight text-white/90 mb-12 tracking-wider"
              style={{ 
                animation: "fadeSlideUp 1s ease-out forwards", 
                animationDelay: "0.35s", 
                opacity: 0,
                textShadow: "0 0 60px rgba(100,183,243,0.3), 0 0 120px rgba(93,241,179,0.2)",
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
