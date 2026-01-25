"use client";

import { useRef, useEffect, useState } from "react";

interface VideoBackgroundProps {
  src?: string;
  fallbackGradient?: boolean;
  children?: React.ReactNode;
  overlay?: "none" | "light" | "dark" | "divine";
}

export default function VideoBackground({
  src,
  fallbackGradient = true,
  children,
  overlay = "divine",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (videoRef.current && src) {
      videoRef.current.play().catch(() => {
        setHasError(true);
      });
    }
  }, [src]);

  const overlayStyles = {
    none: "",
    light: "bg-white/20",
    dark: "bg-black/40",
    divine: "",
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {src && !hasError ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : fallbackGradient ? (
        <DivineGradientBackground />
      ) : null}

      {overlay === "divine" && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 100%, rgba(143,108,243,0.1) 0%, transparent 40%),
                linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(10,5,21,0.3) 100%)
              `,
            }}
          />
        </div>
      )}

      {overlay !== "none" && overlay !== "divine" && (
        <div className={`absolute inset-0 ${overlayStyles[overlay]}`} />
      )}

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

function DivineGradientBackground() {
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

    let time = 0;
    let animationId: number;

    const animate = () => {
      time += 0.003;

      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.3,
        0,
        width / 2,
        height * 0.5,
        width
      );

      const hueShift = Math.sin(time) * 10;
      gradient.addColorStop(0, `hsl(${270 + hueShift}, 30%, 15%)`);
      gradient.addColorStop(0.3, `hsl(${260 + hueShift}, 25%, 10%)`);
      gradient.addColorStop(0.7, `hsl(${250 + hueShift}, 20%, 6%)`);
      gradient.addColorStop(1, `hsl(${245 + hueShift}, 25%, 3%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.35;

      for (let ring = 0; ring < 8; ring++) {
        const radius = 80 + ring * 60 + Math.sin(time * 2 + ring) * 15;
        const alpha = 0.03 - ring * 0.003;

        const ringGradient = ctx.createRadialGradient(
          centerX, centerY, radius - 30,
          centerX, centerY, radius + 30
        );

        const hue = 50 + ring * 10 + Math.sin(time + ring) * 20;
        ringGradient.addColorStop(0, `hsla(${hue}, 60%, 80%, 0)`);
        ringGradient.addColorStop(0.5, `hsla(${hue}, 70%, 85%, ${alpha})`);
        ringGradient.addColorStop(1, `hsla(${hue}, 60%, 80%, 0)`);

        ctx.fillStyle = ringGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const coreGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, 150
      );
      coreGlow.addColorStop(0, `rgba(255, 255, 255, ${0.08 + Math.sin(time * 3) * 0.03})`);
      coreGlow.addColorStop(0.3, `rgba(255, 250, 220, ${0.04 + Math.sin(time * 3) * 0.02})`);
      coreGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function DivineParticles() {
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

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      hue: number;
      wobble: number;
      wobbleSpeed: number;
    }

    const particles: Particle[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedY: -(Math.random() * 0.3 + 0.1),
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 40 + 40,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.3;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, `hsla(${p.hue}, 80%, 90%, ${p.opacity})`);
        glow.addColorStop(0.5, `hsla(${p.hue}, 70%, 85%, ${p.opacity * 0.3})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${p.hue}, 60%, 95%, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
