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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars: { x: number; y: number; size: number; opacity: number; twinkleSpeed: number }[] = [];
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number }[] = [];

    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.016;
      
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.8
      );

      if (phase === "darkness") {
        gradient.addColorStop(0, "rgba(15, 10, 30, 1)");
        gradient.addColorStop(1, "rgba(5, 2, 15, 1)");
      } else {
        gradient.addColorStop(0, "rgba(30, 20, 60, 1)");
        gradient.addColorStop(0.5, "rgba(20, 15, 45, 1)");
        gradient.addColorStop(1, "rgba(10, 5, 25, 1)");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (phase !== "darkness") {
        ctx.save();
        const auroraGradient = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height * 0.7);
        auroraGradient.addColorStop(0, "rgba(143, 108, 243, 0)");
        auroraGradient.addColorStop(0.3, "rgba(143, 108, 243, 0.05)");
        auroraGradient.addColorStop(0.5, "rgba(100, 183, 243, 0.08)");
        auroraGradient.addColorStop(0.7, "rgba(93, 241, 179, 0.05)");
        auroraGradient.addColorStop(1, "rgba(227, 249, 138, 0)");

        ctx.fillStyle = auroraGradient;
        ctx.beginPath();
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = canvas.height * 0.4 + Math.sin(x * 0.01 + time) * 30 + Math.sin(x * 0.02 + time * 0.7) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      stars.forEach((star) => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 100) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle * (phase === "darkness" ? 0.3 : 1)})`;
        ctx.fill();

        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 180, 255, ${star.opacity * twinkle * 0.1})`;
          ctx.fill();
        }
      });

      if (phase === "flight" || phase === "arrive") {
        for (let i = 0; i < 2; i++) {
          particles.push({
            x: canvas.width / 2 + (Math.random() - 0.5) * 100,
            y: canvas.height / 2 + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.8 + 0.2,
            life: 1,
          });
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.opacity *= 0.98;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const hue = 260 + Math.random() * 60;
        ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${p.opacity * p.life})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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

  const handleBegin = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0a0515]">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {phase !== "darkness" && (
          <div
            className={`relative transition-all duration-1000 ${
              phase === "flight"
                ? "animate-owl-flight"
                : phase === "arrive"
                ? "animate-owl-arrive"
                : phase === "gaze" || phase === "ready"
                ? "animate-owl-gaze"
                : "opacity-0 scale-50"
            }`}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-violet-500/30 via-blue-400/20 to-emerald-400/30 rounded-full scale-150 animate-pulse" />
              
              <div className="relative w-48 h-48 md:w-64 md:h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                  <defs>
                    <radialGradient id="owlGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(143, 108, 243, 0.4)" />
                      <stop offset="100%" stopColor="rgba(143, 108, 243, 0)" />
                    </radialGradient>
                    <linearGradient id="owlBody" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2a1f4e" />
                      <stop offset="50%" stopColor="#1a1235" />
                      <stop offset="100%" stopColor="#0f0a20" />
                    </linearGradient>
                    <linearGradient id="owlFeathers" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4a3a7a" />
                      <stop offset="100%" stopColor="#2a1f4e" />
                    </linearGradient>
                    <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="30%" stopColor="#E3F98A" />
                      <stop offset="60%" stopColor="#8F6CF3" />
                      <stop offset="100%" stopColor="#4a3a7a" />
                    </radialGradient>
                  </defs>

                  <ellipse cx="100" cy="140" rx="80" ry="30" fill="url(#owlGlow)" className="animate-pulse" />

                  <ellipse cx="100" cy="110" rx="55" ry="65" fill="url(#owlBody)" />

                  <ellipse cx="100" cy="100" rx="50" ry="55" fill="url(#owlFeathers)" opacity="0.5" />

                  <path d="M55 60 Q45 30 70 50 Q60 35 80 55" fill="#3a2a5e" />
                  <path d="M145 60 Q155 30 130 50 Q140 35 120 55" fill="#3a2a5e" />

                  <ellipse cx="75" cy="90" rx="22" ry="24" fill="#1a1235" />
                  <ellipse cx="125" cy="90" rx="22" ry="24" fill="#1a1235" />

                  <circle cx="75" cy="90" r="16" fill="url(#eyeGlow)" className={phase === "gaze" || phase === "ready" ? "animate-eye-glow" : ""} />
                  <circle cx="125" cy="90" r="16" fill="url(#eyeGlow)" className={phase === "gaze" || phase === "ready" ? "animate-eye-glow" : ""} />

                  <circle cx="75" cy="90" r="6" fill="#0a0515" />
                  <circle cx="125" cy="90" r="6" fill="#0a0515" />
                  <circle cx="77" cy="87" r="2" fill="white" opacity="0.8" />
                  <circle cx="127" cy="87" r="2" fill="white" opacity="0.8" />

                  <path d="M95 105 L100 120 L105 105 Z" fill="#E3F98A" />

                  <path d="M70 140 Q100 155 130 140" fill="none" stroke="#5a4a8a" strokeWidth="2" opacity="0.5" />
                  <path d="M75 150 Q100 162 125 150" fill="none" stroke="#4a3a7a" strokeWidth="1.5" opacity="0.3" />

                  <ellipse cx="50" cy="110" rx="15" ry="35" fill="#2a1f4e" className="origin-center animate-wing-left" />
                  <ellipse cx="150" cy="110" rx="15" ry="35" fill="#2a1f4e" className="origin-center animate-wing-right" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {showText && (
          <div className="mt-12 text-center animate-text-reveal">
            <p className="text-white/60 text-sm tracking-[0.3em] uppercase mb-4 animate-fade-up">
              Eight Owls
            </p>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-8 animate-fade-up animation-delay-200">
              Meet Your Mirror
            </h1>
            
            {phase === "ready" && (
              <button
                onClick={handleBegin}
                className="group relative px-12 py-4 rounded-full overflow-hidden animate-fade-up animation-delay-400"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/80 via-blue-500/80 to-emerald-500/80 group-hover:opacity-100 opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative text-white font-medium tracking-wide">
                  Begin
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes owl-flight {
          0% {
            opacity: 0;
            transform: translateY(-200px) scale(0.3) rotate(-10deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-50px) scale(0.8) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
          }
        }

        @keyframes owl-arrive {
          0% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes owl-gaze {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-5px) scale(1.01);
          }
        }

        @keyframes eye-glow {
          0%, 100% {
            filter: brightness(1) drop-shadow(0 0 10px rgba(227, 249, 138, 0.5));
          }
          50% {
            filter: brightness(1.3) drop-shadow(0 0 20px rgba(227, 249, 138, 0.8));
          }
        }

        @keyframes wing-left {
          0%, 100% {
            transform: rotate(0deg) translateX(0);
          }
          50% {
            transform: rotate(-5deg) translateX(-3px);
          }
        }

        @keyframes wing-right {
          0%, 100% {
            transform: rotate(0deg) translateX(0);
          }
          50% {
            transform: rotate(5deg) translateX(3px);
          }
        }

        @keyframes text-reveal {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-owl-flight {
          animation: owl-flight 2s ease-out forwards;
        }

        .animate-owl-arrive {
          animation: owl-arrive 1.5s ease-in-out;
        }

        .animate-owl-gaze {
          animation: owl-gaze 3s ease-in-out infinite;
        }

        .animate-eye-glow {
          animation: eye-glow 2s ease-in-out infinite;
        }

        .animate-wing-left {
          animation: wing-left 2s ease-in-out infinite;
          transform-origin: right center;
        }

        .animate-wing-right {
          animation: wing-right 2s ease-in-out infinite;
          transform-origin: left center;
        }

        .animate-text-reveal {
          animation: text-reveal 1s ease-out forwards;
        }

        .animate-fade-up {
          animation: fade-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}
