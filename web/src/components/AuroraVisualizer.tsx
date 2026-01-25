"use client";

import { useEffect, useRef } from "react";

interface AuroraVisualizerProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  audioLevel?: number;
}

export default function AuroraVisualizer({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  audioLevel = 0,
}: AuroraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const colors = {
      idle: [
        { r: 183, g: 206, b: 250, a: 0.6 },
        { r: 143, g: 108, b: 243, a: 0.5 },
        { r: 100, g: 183, b: 243, a: 0.4 },
      ],
      listening: [
        { r: 243, g: 97, b: 211, a: 0.7 },
        { r: 143, g: 108, b: 243, a: 0.6 },
        { r: 227, g: 249, b: 138, a: 0.5 },
      ],
      speaking: [
        { r: 93, g: 241, b: 179, a: 0.7 },
        { r: 100, g: 183, b: 243, a: 0.6 },
        { r: 143, g: 108, b: 243, a: 0.5 },
      ],
      processing: [
        { r: 143, g: 108, b: 243, a: 0.8 },
        { r: 100, g: 183, b: 243, a: 0.7 },
        { r: 93, g: 241, b: 179, a: 0.6 },
      ],
    };

    const getActiveColors = () => {
      if (isProcessing) return colors.processing;
      if (isSpeaking) return colors.speaking;
      if (isListening) return colors.listening;
      return colors.idle;
    };

    const drawWave = (
      yOffset: number,
      amplitude: number,
      frequency: number,
      speed: number,
      color: { r: number; g: number; b: number; a: number }
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2 + yOffset);

      const dynamicAmplitude = amplitude * (1 + audioLevel * 2);

      for (let x = 0; x <= canvas.width; x += 2) {
        const y =
          canvas.height / 2 +
          yOffset +
          Math.sin(x * frequency + timeRef.current * speed) * dynamicAmplitude +
          Math.sin(x * frequency * 0.5 + timeRef.current * speed * 1.3) *
            (dynamicAmplitude * 0.5);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.3})`);
      gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.3})`);

      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const activeColors = getActiveColors();
      const baseSpeed = isProcessing ? 0.03 : isListening || isSpeaking ? 0.02 : 0.01;

      drawWave(-30, 40, 0.008, baseSpeed, activeColors[0]);
      drawWave(0, 50, 0.006, baseSpeed * 0.8, activeColors[1]);
      drawWave(30, 35, 0.01, baseSpeed * 1.2, activeColors[2]);

      timeRef.current += 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [isListening, isSpeaking, isProcessing, audioLevel]);

  return (
    <div className="w-full h-32 relative overflow-hidden rounded-2xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)" }}
      />
    </div>
  );
}
