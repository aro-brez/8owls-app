"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface RealisticOwlProps {
  owlId?: number;
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
  glowing?: boolean;
  speaking?: boolean;
  listening?: boolean;
  audioLevel?: number;
  onClick?: () => void;
  className?: string;
}

const owlImages = [
  "/owls/realistic-owl-1.png",
  "/owls/realistic-owl-2.png",
  "/owls/realistic-owl-3.png",
  "/owls/realistic-owl-4.png",
  "/owls/realistic-owl-5.png",
  "/owls/realistic-owl-6.png",
];

const sizeMap = {
  sm: { container: "w-16 h-16", image: 64 },
  md: { container: "w-24 h-24", image: 96 },
  lg: { container: "w-40 h-40", image: 160 },
  xl: { container: "w-56 h-56 md:w-64 md:h-64", image: 256 },
};

export default function RealisticOwl({
  owlId = 0,
  size = "lg",
  interactive = true,
  glowing = false,
  speaking = false,
  listening = false,
  audioLevel = 0,
  onClick,
  className = "",
}: RealisticOwlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [pulseIntensity, setPulseIntensity] = useState(0);

  useEffect(() => {
    if (listening) {
      setPulseIntensity(audioLevel);
    } else if (speaking) {
      const interval = setInterval(() => {
        setPulseIntensity(Math.random() * 0.5 + 0.3);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setPulseIntensity(0);
    }
  }, [listening, speaking, audioLevel]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interactive || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const owlSrc = owlImages[owlId % owlImages.length];
  const { container, image } = sizeMap[size];

  const eyeOffsetX = (mousePos.x - 0.5) * 3;
  const eyeOffsetY = (mousePos.y - 0.5) * 2;

  const glowIntensity = glowing ? 0.6 : isHovered ? 0.4 : 0.2;
  const glowColor = listening
    ? `rgba(243, 97, 211, ${glowIntensity + pulseIntensity * 0.3})`
    : speaking
    ? `rgba(93, 241, 179, ${glowIntensity + pulseIntensity * 0.3})`
    : `rgba(143, 108, 243, ${glowIntensity})`;

  return (
    <div
      ref={containerRef}
      className={`relative ${container} ${className} ${
        interactive ? "cursor-pointer" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0.5, y: 0.5 });
      }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 rounded-full blur-[40px] transition-all duration-300"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: `scale(${1.4 + pulseIntensity * 0.3})`,
        }}
      />

      {(listening || speaking) && (
        <>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${glowColor.replace(
                /[\d.]+\)$/,
                "0.15)"
              )} 0%, transparent 60%)`,
              animation: "pulseRing 2s ease-out infinite",
              transform: `scale(${1.8 + pulseIntensity * 0.5})`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${glowColor.replace(
                /[\d.]+\)$/,
                "0.1)"
              )} 0%, transparent 50%)`,
              animation: "pulseRing 2s ease-out infinite 0.5s",
              transform: `scale(${2.2 + pulseIntensity * 0.5})`,
            }}
          />
        </>
      )}

      <div
        className="relative w-full h-full rounded-full overflow-hidden transition-transform duration-200"
        style={{
          transform: interactive
            ? `perspective(500px) rotateY(${eyeOffsetX}deg) rotateX(${-eyeOffsetY}deg) scale(${
                isHovered ? 1.05 : 1
              })`
            : "none",
          boxShadow: `
            0 0 ${30 + pulseIntensity * 20}px ${glowColor},
            0 0 ${60 + pulseIntensity * 30}px ${glowColor.replace(/[\d.]+\)$/, "0.3)")}
          `,
        }}
      >
        <Image
          src={owlSrc}
          alt="Owl companion"
          width={image}
          height={image}
          className="w-full h-full object-cover"
          priority
        />

        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `linear-gradient(${
              135 + eyeOffsetX * 20
            }deg, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            opacity: isHovered ? 1 : 0.5,
          }}
        />

        {(listening || speaking) && (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 40%, ${glowColor.replace(
                /[\d.]+\)$/,
                `${0.1 + pulseIntensity * 0.2})`
              )} 0%, transparent 60%)`,
            }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes pulseRing {
          0% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }
      `}</style>
    </div>
  );
}

export function RealisticOwlPicker({
  selectedId,
  onSelect,
}: {
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
      {owlImages.map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={`relative p-2 rounded-2xl transition-all duration-300 ${
            selectedId === index
              ? "bg-white/10 ring-2 ring-violet-400/50 scale-105"
              : "hover:bg-white/5 hover:scale-102"
          }`}
        >
          <RealisticOwl
            owlId={index}
            size="sm"
            interactive={false}
            glowing={selectedId === index}
          />
          {selectedId === index && (
            <div className="absolute inset-0 rounded-2xl ring-2 ring-violet-400/30 animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
