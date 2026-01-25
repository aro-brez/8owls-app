"use client";

import { useEffect, useRef } from "react";

interface AuroraVisualizerProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  audioLevel?: number;
  theme?: "light" | "dark";
}

export default function AuroraVisualizer({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  audioLevel = 0,
  theme = "light",
}: AuroraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothAudioRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    const animate = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;

      smoothAudioRef.current += (audioLevel - smoothAudioRef.current) * 0.15;
      const audio = smoothAudioRef.current;

      ctx.clearRect(0, 0, width * dpr, height * dpr);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const baseAmplitude = isListening 
        ? 20 + audio * 45 
        : isSpeaking 
          ? 18 + audio * 30 
          : isProcessing 
            ? 14 
            : 8;

      const speed = isListening ? 1.0 : isSpeaking ? 0.8 : isProcessing ? 0.5 : 0.25;
      const layers = 6;

      for (let layer = 0; layer < layers; layer++) {
        const layerPhase = layer * 0.6;
        const layerAmp = baseAmplitude * (1 - layer * 0.08);
        const yBase = height * 0.5 + (layer - layers / 2) * 4;

        ctx.beginPath();
        ctx.moveTo(-10, height);

        const points: { x: number; y: number }[] = [];

        for (let x = -10; x <= width + 10; x += 1.5) {
          const nx = x / width;

          const wave1 = Math.sin(nx * Math.PI * 2.5 + t * speed + layerPhase) * layerAmp;
          const wave2 = Math.sin(nx * Math.PI * 4 + t * speed * 0.7 + layerPhase * 1.5) * (layerAmp * 0.5);
          const wave3 = Math.sin(nx * Math.PI * 6.5 + t * speed * 1.2 + layerPhase * 0.8) * (layerAmp * 0.25);
          const wave4 = Math.sin(nx * Math.PI * 1.2 + t * speed * 0.35) * (layerAmp * 0.6);
          const wave5 = Math.sin(nx * Math.PI * 9 + t * speed * 1.8) * (layerAmp * 0.12);

          const turbulence = isListening || isSpeaking
            ? Math.sin(nx * 25 + t * 3.5) * audio * 6 + Math.sin(nx * 40 + t * 5) * audio * 2
            : 0;

          const y = yBase + wave1 + wave2 + wave3 + wave4 + wave5 + turbulence;
          points.push({ x, y });
        }

        for (let i = 0; i < points.length; i++) {
          if (i === 0) {
            ctx.moveTo(points[i].x, points[i].y);
          } else {
            const prev = points[i - 1];
            const curr = points[i];
            const cpX = (prev.x + curr.x) / 2;
            const cpY = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
          }
        }

        ctx.lineTo(width + 10, height);
        ctx.lineTo(-10, height);
        ctx.closePath();

        const hueShift = t * 15 + audio * 30;
        const layerHueOffset = layer * 25;

        const gradient = ctx.createLinearGradient(0, yBase - layerAmp, width, yBase + layerAmp);

        const hue1 = (265 + hueShift + layerHueOffset) % 360;
        const hue2 = (215 + hueShift + layerHueOffset + 20) % 360;
        const hue3 = (175 + hueShift + layerHueOffset + 40) % 360;
        const hue4 = (310 + hueShift + layerHueOffset) % 360;

        const sat = 65 + audio * 25;
        const light = theme === "dark" ? 60 + layer * 3 : 70 + layer * 2;
        const alpha = theme === "dark" 
          ? 0.35 - layer * 0.04 
          : 0.28 - layer * 0.035;

        gradient.addColorStop(0, `hsla(${hue1}, ${sat}%, ${light}%, ${alpha})`);
        gradient.addColorStop(0.3, `hsla(${hue2}, ${sat + 5}%, ${light + 3}%, ${alpha * 0.85})`);
        gradient.addColorStop(0.5, `hsla(${hue3}, ${sat}%, ${light + 5}%, ${alpha * 0.9})`);
        gradient.addColorStop(0.7, `hsla(${hue4}, ${sat - 5}%, ${light}%, ${alpha * 0.85})`);
        gradient.addColorStop(1, `hsla(${hue1}, ${sat}%, ${light}%, ${alpha})`);

        ctx.fillStyle = gradient;
        ctx.fill();
      }

      const shimmerCount = 4;
      for (let i = 0; i < shimmerCount; i++) {
        const shimmerSpeed = 0.3 + i * 0.15;
        const shimmerX = ((t * 50 * shimmerSpeed + i * width / shimmerCount) % (width * 1.8)) - width * 0.4;
        const shimmerWidth = 80 + audio * 60;

        const shimmerGradient = ctx.createLinearGradient(
          shimmerX - shimmerWidth, 0,
          shimmerX + shimmerWidth, 0
        );

        const shimmerAlpha = 0.06 + audio * 0.08;
        shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        shimmerGradient.addColorStop(0.4, `rgba(255, 255, 255, ${shimmerAlpha * 0.5})`);
        shimmerGradient.addColorStop(0.5, `rgba(255, 255, 255, ${shimmerAlpha})`);
        shimmerGradient.addColorStop(0.6, `rgba(255, 255, 255, ${shimmerAlpha * 0.5})`);
        shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = shimmerGradient;
        ctx.fillRect(0, height * 0.15, width, height * 0.7);
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      resizeCanvas();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isSpeaking, isProcessing, audioLevel, theme]);

  const bgStyle = theme === "dark"
    ? {}
    : { background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 100%)" };

  return (
    <div className="w-full h-20 relative overflow-hidden rounded-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          ...bgStyle,
          filter: "blur(0.3px)",
        }}
      />
    </div>
  );
}

export function OilPatternVisualizer({
  audioLevel = 0,
  isActive = false,
  className = "",
}: {
  audioLevel?: number;
  isActive?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const smoothAudioRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const width = rect.width;
    const height = rect.height;

    const animate = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;

      smoothAudioRef.current += (audioLevel - smoothAudioRef.current) * 0.1;
      const audio = smoothAudioRef.current;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cellSize = 3;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize;
          const y = row * cellSize;

          const nx = x / width;
          const ny = y / height;

          const n1 = Math.sin(nx * 4 + ny * 3 + t) * 0.5 + 0.5;
          const n2 = Math.sin(nx * 6 - ny * 4 + t * 0.7) * 0.5 + 0.5;
          const n3 = Math.sin(nx * 2 + ny * 5 + t * 1.3) * 0.5 + 0.5;
          const n4 = Math.sin((nx + ny) * 8 + t * 0.5) * 0.5 + 0.5;

          const blend = (n1 * 0.4 + n2 * 0.3 + n3 * 0.2 + n4 * 0.1);

          const hue = 240 + blend * 120 + t * 10 + audio * 40;
          const saturation = 60 + blend * 30 + audio * 20;
          const lightness = 50 + blend * 20;
          const alpha = 0.6 + blend * 0.3;

          ctx.fillStyle = `hsla(${hue % 360}, ${saturation}%, ${lightness}%, ${alpha})`;
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }

      ctx.filter = "blur(2px)";
      ctx.drawImage(canvas, 0, 0, width, height);
      ctx.filter = "none";

      const overlay = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2
      );
      overlay.addColorStop(0, `rgba(255, 255, 255, ${0.1 + audio * 0.15})`);
      overlay.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [audioLevel, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-20 rounded-2xl ${className}`}
      style={{ filter: "saturate(1.2) contrast(1.05)" }}
    />
  );
}
