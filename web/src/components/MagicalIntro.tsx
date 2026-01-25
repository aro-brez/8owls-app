"use client";

import { useState, useEffect, useRef } from "react";

interface MagicalIntroProps {
  onComplete: () => void;
}

export default function MagicalIntro({ onComplete }: MagicalIntroProps) {
  const [phase, setPhase] = useState<"darkness" | "stars" | "flight" | "arrive" | "gaze" | "ready">("darkness");
  const [showText, setShowText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number; hue: number }[] = [];

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        hue: Math.random() * 60 + 220,
      });
    }

    let animationId: number;
    let time = 0;

    const drawChromaticAurora = (t: number, intensity: number) => {
      const layers = 8;
      const centerY = height * 0.45;

      for (let layer = 0; layer < layers; layer++) {
        const layerProgress = layer / layers;
        const layerY = centerY + (layer - layers / 2) * 8;
        const amplitude = 25 + layer * 3 + intensity * 15;

        ctx.beginPath();
        ctx.moveTo(-20, height);

        const points: { x: number; y: number }[] = [];
        for (let x = -20; x <= width + 20; x += 2) {
          const nx = x / width;

          const wave1 = Math.sin(nx * Math.PI * 2 + t * 0.4 + layer * 0.3) * amplitude;
          const wave2 = Math.sin(nx * Math.PI * 3.5 + t * 0.25 + layer * 0.5) * (amplitude * 0.5);
          const wave3 = Math.sin(nx * Math.PI * 5 + t * 0.6 + layer * 0.2) * (amplitude * 0.3);
          const wave4 = Math.sin(nx * Math.PI * 1.2 + t * 0.15) * (amplitude * 0.7);
          const wave5 = Math.sin(nx * Math.PI * 8 + t * 0.8) * (amplitude * 0.15);

          const y = layerY + wave1 + wave2 + wave3 + wave4 + wave5;
          points.push({ x, y });
        }

        for (let i = 0; i < points.length; i++) {
          if (i === 0) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            const prev = points[i - 1];
            const curr = points[i];
            ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2);
          }
        }

        ctx.lineTo(width + 20, height);
        ctx.lineTo(-20, height);
        ctx.closePath();

        const hueShift = t * 12;
        const hue1 = (265 + hueShift + layer * 18) % 360;
        const hue2 = (210 + hueShift + layer * 22) % 360;
        const hue3 = (175 + hueShift + layer * 15) % 360;
        const hue4 = (320 + hueShift + layer * 10) % 360;

        const gradient = ctx.createLinearGradient(0, layerY - amplitude, width, layerY + amplitude);
        const alpha = (0.12 - layerProgress * 0.01) * intensity;
        const sat = 70 + intensity * 20;
        const light = 55 + layer * 4;

        gradient.addColorStop(0, `hsla(${hue1}, ${sat}%, ${light}%, ${alpha})`);
        gradient.addColorStop(0.25, `hsla(${hue2}, ${sat + 10}%, ${light + 5}%, ${alpha * 0.9})`);
        gradient.addColorStop(0.5, `hsla(${hue3}, ${sat + 5}%, ${light + 8}%, ${alpha})`);
        gradient.addColorStop(0.75, `hsla(${hue4}, ${sat}%, ${light + 3}%, ${alpha * 0.9})`);
        gradient.addColorStop(1, `hsla(${hue1}, ${sat}%, ${light}%, ${alpha})`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }

      for (let i = 0; i < 5; i++) {
        const shimmerX = ((t * 35 + i * width / 5) % (width * 1.6)) - width * 0.3;
        const shimmerWidth = 100 + Math.sin(t + i) * 30;

        const shimmerGradient = ctx.createLinearGradient(
          shimmerX - shimmerWidth, 0,
          shimmerX + shimmerWidth, 0
        );

        shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        shimmerGradient.addColorStop(0.3, `rgba(255, 255, 255, ${0.02 * intensity})`);
        shimmerGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.06 * intensity})`);
        shimmerGradient.addColorStop(0.7, `rgba(255, 255, 255, ${0.02 * intensity})`);
        shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = shimmerGradient;
        ctx.fillRect(0, height * 0.2, width, height * 0.5);
      }
    };

    const animate = () => {
      time += 0.016;

      const bgGradient = ctx.createRadialGradient(
        width / 2, height * 0.4, 0,
        width / 2, height * 0.4, width * 0.9
      );

      const bgIntensity = phase === "darkness" ? 0.3 : 1;
      bgGradient.addColorStop(0, `rgba(${25 * bgIntensity}, ${18 * bgIntensity}, ${50 * bgIntensity}, 1)`);
      bgGradient.addColorStop(0.4, `rgba(${18 * bgIntensity}, ${12 * bgIntensity}, ${40 * bgIntensity}, 1)`);
      bgGradient.addColorStop(1, `rgba(${8 * bgIntensity}, ${4 * bgIntensity}, ${20 * bgIntensity}, 1)`);

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const starOpacity = phase === "darkness" ? 0.3 : 1;
      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 80 + star.x) * 0.4 + 0.6;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 30%, 90%, ${star.opacity * twinkle * starOpacity})`;
        ctx.fill();

        if (star.size > 1.2) {
          const glowSize = star.size * 4;
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize);
          glow.addColorStop(0, `hsla(${star.hue}, 60%, 80%, ${star.opacity * twinkle * 0.15 * starOpacity})`);
          glow.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (phase !== "darkness") {
        const auroraIntensity = phase === "stars" ? 0.5 : 1;
        drawChromaticAurora(time, auroraIntensity);
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
      await new Promise((r) => setTimeout(r, 800));
      setPhase("stars");
      await new Promise((r) => setTimeout(r, 1200));
      setPhase("flight");
      await new Promise((r) => setTimeout(r, 2000));
      setPhase("arrive");
      await new Promise((r) => setTimeout(r, 1500));
      setPhase("gaze");
      await new Promise((r) => setTimeout(r, 1000));
      setShowText(true);
      await new Promise((r) => setTimeout(r, 500));
      setPhase("ready");
    };
    sequence();
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0515]">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {phase !== "darkness" && (
          <div
            className={`relative transition-all duration-1000 ease-out ${
              phase === "flight"
                ? "opacity-100 -translate-y-0 scale-100"
                : phase === "arrive" || phase === "gaze" || phase === "ready"
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 -translate-y-32 scale-75"
            }`}
            style={{
              animation: phase === "flight" 
                ? "owlFlight 2s ease-out forwards"
                : phase === "gaze" || phase === "ready"
                ? "owlFloat 4s ease-in-out infinite"
                : "none",
            }}
          >
            <div className="relative">
              <div 
                className="absolute inset-0 blur-[60px] rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(143,108,243,0.4) 0%, rgba(100,183,243,0.2) 50%, transparent 70%)",
                  transform: "scale(1.8)",
                  animation: "pulseGlow 3s ease-in-out infinite",
                }}
              />
              
              <MysticalOwlSVG phase={phase} />
            </div>
          </div>
        )}

        {showText && (
          <div 
            className="mt-16 text-center"
            style={{ animation: "fadeSlideUp 1s ease-out forwards" }}
          >
            <p 
              className="text-white/50 text-xs tracking-[0.4em] uppercase mb-4"
              style={{ animation: "fadeSlideUp 0.8s ease-out forwards", animationDelay: "0.1s", opacity: 0 }}
            >
              Eight Owls
            </p>
            <h1 
              className="text-4xl md:text-5xl font-extralight text-white mb-10 tracking-wide"
              style={{ animation: "fadeSlideUp 0.8s ease-out forwards", animationDelay: "0.3s", opacity: 0 }}
            >
              Meet Your Mirror
            </h1>
            
            {phase === "ready" && (
              <button
                onClick={onComplete}
                className="group relative px-14 py-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-105"
                style={{ animation: "fadeSlideUp 0.8s ease-out forwards", animationDelay: "0.5s", opacity: 0 }}
              >
                <div 
                  className="absolute inset-0 transition-opacity duration-300"
                  style={{
                    background: "linear-gradient(135deg, rgba(143,108,243,0.6) 0%, rgba(100,183,243,0.5) 50%, rgba(93,241,179,0.4) 100%)",
                  }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/10" />
                <div 
                  className="absolute inset-[1px] rounded-full"
                  style={{ 
                    background: "linear-gradient(135deg, rgba(143,108,243,0.3) 0%, rgba(100,183,243,0.2) 100%)",
                    backdropFilter: "blur(20px)",
                  }}
                />
                <span className="relative text-white font-normal tracking-widest text-sm uppercase">
                  Begin
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes owlFlight {
          0% {
            opacity: 0;
            transform: translateY(-150px) scale(0.5);
          }
          60% {
            opacity: 1;
            transform: translateY(10px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes owlFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1.8);
          }
          50% {
            opacity: 0.9;
            transform: scale(2);
          }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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

function MysticalOwlSVG({ phase }: { phase: string }) {
  const isGazing = phase === "gaze" || phase === "ready";

  return (
    <div className="w-52 h-52 md:w-64 md:h-64 relative">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="owlAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(143, 108, 243, 0.3)">
              <animate attributeName="stop-color" values="rgba(143,108,243,0.3);rgba(100,183,243,0.3);rgba(143,108,243,0.3)" dur="4s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          <linearGradient id="owlBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2d2250" />
            <stop offset="50%" stopColor="#1a1438" />
            <stop offset="100%" stopColor="#0d0a1a" />
          </linearGradient>

          <linearGradient id="featherSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(143,108,243,0.15)">
              <animate attributeName="stop-color" values="rgba(143,108,243,0.15);rgba(100,183,243,0.15);rgba(93,241,179,0.1);rgba(143,108,243,0.15)" dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="rgba(100,183,243,0.1)" />
          </linearGradient>

          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#E3F98A" />
            <stop offset="55%" stopColor="#8F6CF3" />
            <stop offset="100%" stopColor="#2d2250" />
          </radialGradient>

          <filter id="eyeBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          </filter>
        </defs>

        <ellipse cx="100" cy="145" rx="70" ry="25" fill="url(#owlAura)" opacity="0.5" />

        <ellipse cx="100" cy="108" rx="52" ry="62" fill="url(#owlBody)" />
        <ellipse cx="100" cy="100" rx="47" ry="55" fill="url(#featherSheen)" />

        <path d="M58 62 Q48 32 72 52 Q60 38 82 58" fill="#3d3060" />
        <path d="M142 62 Q152 32 128 52 Q140 38 118 58" fill="#3d3060" />

        <ellipse cx="75" cy="92" rx="20" ry="22" fill="#151020" />
        <ellipse cx="125" cy="92" rx="20" ry="22" fill="#151020" />

        <circle cx="75" cy="92" r="14" fill="url(#eyeGlow)" filter={isGazing ? "url(#eyeBlur)" : undefined}>
          {isGazing && (
            <animate attributeName="r" values="14;15;14" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="125" cy="92" r="14" fill="url(#eyeGlow)" filter={isGazing ? "url(#eyeBlur)" : undefined}>
          {isGazing && (
            <animate attributeName="r" values="14;15;14" dur="2s" repeatCount="indefinite" />
          )}
        </circle>

        {isGazing && (
          <>
            <circle cx="75" cy="92" r="20" fill="none" stroke="rgba(227,249,138,0.3)" strokeWidth="1">
              <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="92" r="20" fill="none" stroke="rgba(227,249,138,0.3)" strokeWidth="1">
              <animate attributeName="r" values="16;22;16" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        <circle cx="75" cy="92" r="5" fill="#0a0515" />
        <circle cx="125" cy="92" r="5" fill="#0a0515" />
        <circle cx="77" cy="89" r="2" fill="white" opacity="0.9" />
        <circle cx="127" cy="89" r="2" fill="white" opacity="0.9" />

        <path d="M95 108 L100 122 L105 108 Z" fill="#E3F98A" />

        <path d="M72 142 Q100 156 128 142" fill="none" stroke="rgba(143,108,243,0.3)" strokeWidth="1.5" />
        <path d="M78 152 Q100 163 122 152" fill="none" stroke="rgba(100,183,243,0.2)" strokeWidth="1" />

        <ellipse cx="52" cy="108" rx="12" ry="32" fill="#1a1438">
          <animateTransform attributeName="transform" type="rotate" values="0 52 108;-3 52 108;0 52 108" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="148" cy="108" rx="12" ry="32" fill="#1a1438">
          <animateTransform attributeName="transform" type="rotate" values="0 148 108;3 148 108;0 148 108" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
}
