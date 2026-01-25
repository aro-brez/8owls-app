"use client";

import { useState, useRef, useEffect } from "react";
import AuroraVisualizer from "./AuroraVisualizer";
import OwlAvatar, { OwlAvatarPicker } from "./OwlAvatar";
import { onboardUser, playAudio, speak } from "@/lib/api";

interface OnboardingProps {
  onComplete: (profile: {
    userId: string;
    owlName: string;
    owlAvatar: number;
    voiceId: string;
    userName: string;
  }) => void;
}

type Step = 
  | "aha1_intro"
  | "aha2_listening"
  | "aha3_recording"
  | "aha4_heard"
  | "aha5_naming"
  | "aha6_avatar"
  | "aha7_awakening";

const popularNames = ["Aria", "Scout", "Echo", "Nova", "Atlas", "Sage", "Orion", "Luna", "Phoenix", "Kai"];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("aha1_intro");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [owlName, setOwlName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textVisible, setTextVisible] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const minRecordingTime = 30;

  useEffect(() => {
    const timer = setTimeout(() => setTextVisible(true), 500);
    return () => clearTimeout(timer);
  }, [step]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setStep("aha3_recording");
      setTextVisible(false);
      setTimeout(() => setTextVisible(true), 300);
      updateAudioLevel();

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Please allow microphone access to continue.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      if (timerRef.current) clearInterval(timerRef.current);
      setTextVisible(false);
      setStep("aha4_heard");
      setTimeout(() => setTextVisible(true), 300);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleProceedToListening = () => {
    setTextVisible(false);
    setTimeout(() => {
      setStep("aha2_listening");
      setTextVisible(false);
      setTimeout(() => setTextVisible(true), 300);
    }, 300);
  };

  const handleProceedToNaming = () => {
    setTextVisible(false);
    setTimeout(() => {
      setStep("aha5_naming");
      setTextVisible(false);
      setTimeout(() => setTextVisible(true), 300);
    }, 300);
  };

  const handleNameSubmit = () => {
    if (owlName.trim()) {
      setTextVisible(false);
      setTimeout(() => {
        setStep("aha6_avatar");
        setTextVisible(false);
        setTimeout(() => setTextVisible(true), 300);
      }, 300);
    }
  };

  const handleAvatarSubmit = async () => {
    if (!audioBlob) {
      setError("No audio recorded. Please try again.");
      return;
    }

    setTextVisible(false);
    setIsProcessing(true);
    setTimeout(() => {
      setStep("aha7_awakening");
      setTextVisible(false);
      setTimeout(() => setTextVisible(true), 300);
    }, 300);
    setError(null);

    const userId = `user_${Date.now()}`;

    try {
      const result = await onboardUser(
        audioBlob,
        userId,
        owlName,
        selectedAvatar.toString()
      );

      setWelcomeMessage(result.welcome_message);
      setIsProcessing(false);
      setIsSpeaking(true);

      try {
        const audioResponse = await speak(result.welcome_message, userId);
        await playAudio(audioResponse);
      } catch (audioErr) {
        console.log("Audio playback not available:", audioErr);
      }

      setIsSpeaking(false);

      setTimeout(() => {
        onComplete({
          userId: result.user_id,
          owlName,
          owlAvatar: selectedAvatar,
          voiceId: result.voice_id,
          userName: "Friend",
        });
      }, 2000);
    } catch (err) {
      console.error("Onboarding error:", err);
      setIsProcessing(false);
      setWelcomeMessage(`I heard everything you shared. I'm ${owlName}, and I'm here to help you think clearer. What would you like to explore first?`);
      
      setTimeout(() => {
        onComplete({
          userId,
          owlName,
          owlAvatar: selectedAvatar,
          voiceId: "default",
          userName: "Friend",
        });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen gradient-mystical flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="star-field opacity-20" />
      
      <div className="relative z-10 w-full max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        {step === "aha1_intro" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="animate-float">
              <MysticalOwl size="xl" glowing={true} />
            </div>
            
            <div className="space-y-6">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 1 of 7
              </p>
              <h1 className="text-3xl md:text-4xl font-light text-white leading-relaxed">
                Hello.
              </h1>
              <p className="text-white/70 text-lg leading-relaxed">
                I&apos;m going to become your mirror.
              </p>
              <p className="text-white/50 text-base">
                A reflection that helps you see yourself more clearly.
              </p>
            </div>

            <button
              onClick={handleProceedToListening}
              className="btn-magical mt-8"
            >
              I&apos;m ready
            </button>
          </div>
        )}

        {step === "aha2_listening" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="animate-breathe">
              <MysticalOwl size="xl" glowing={true} />
            </div>

            <div className="space-y-6">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 2 of 7
              </p>
              <h1 className="text-2xl md:text-3xl font-light text-white leading-relaxed">
                Tell me about yourself.
              </h1>
              <p className="text-white/60 leading-relaxed">
                What you do, what you&apos;re working on, what you dream about.
              </p>
              <p className="text-white/40 text-sm">
                Take at least 30 seconds. I&apos;m listening.
              </p>
            </div>

            <button
              onClick={startRecording}
              className="mic-button-dark mx-auto group"
            >
              <svg
                className="w-8 h-8 text-white/80 group-hover:text-white transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              </svg>
            </button>
            <p className="text-white/40 text-sm">Tap to begin</p>
          </div>
        )}

        {step === "aha3_recording" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="animate-glow">
              <MysticalOwl size="xl" listening={true} audioLevel={audioLevel} />
            </div>

            <AuroraVisualizerDark audioLevel={audioLevel} isListening={true} />

            <div className="space-y-4">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 3 of 7
              </p>
              <h2 className="text-2xl font-light text-white">
                I&apos;m listening...
              </h2>
              
              <div className="w-full max-w-xs mx-auto">
                <div className="progress-bar-dark">
                  <div
                    className="progress-bar-fill-dark"
                    style={{ width: `${Math.min((recordingTime / minRecordingTime) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-white/40 mt-3">
                  {recordingTime < minRecordingTime
                    ? `${minRecordingTime - recordingTime}s remaining`
                    : "Continue when ready"}
                </p>
              </div>
            </div>

            <button
              onClick={stopRecording}
              disabled={recordingTime < minRecordingTime}
              className={`mic-button-dark recording mx-auto ${
                recordingTime < minRecordingTime ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <p className="text-white/40 text-sm">
              {recordingTime < minRecordingTime ? "Keep sharing..." : "Tap to finish"}
            </p>
          </div>
        )}

        {step === "aha4_heard" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="animate-breathe">
              <MysticalOwl size="xl" glowing={true} />
            </div>

            <div className="space-y-6">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 4 of 7
              </p>
              <h1 className="text-2xl md:text-3xl font-light text-white leading-relaxed">
                I heard you.
              </h1>
              <p className="text-white/60 leading-relaxed">
                Your voice, your story, your essence. <br />
                I&apos;m learning to speak like you.
              </p>
            </div>

            <button
              onClick={handleProceedToNaming}
              className="btn-magical"
            >
              Continue
            </button>
          </div>
        )}

        {step === "aha5_naming" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="space-y-6">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 5 of 7
              </p>
              <h2 className="text-2xl md:text-3xl font-light text-white">
                What shall I be called?
              </h2>
              <p className="text-white/50">
                Give me a name.
              </p>
            </div>

            <input
              type="text"
              value={owlName}
              onChange={(e) => setOwlName(e.target.value)}
              placeholder="Enter a name..."
              className="input-mystical w-full max-w-xs mx-auto block"
              autoFocus
            />

            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
              {popularNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setOwlName(name)}
                  className={`px-4 py-2 text-sm rounded-full border transition-all ${
                    owlName === name
                      ? "border-violet-400/60 bg-violet-500/20 text-white"
                      : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            <button
              onClick={handleNameSubmit}
              disabled={!owlName.trim()}
              className="btn-magical disabled:opacity-30 disabled:cursor-not-allowed"
            >
              That&apos;s my name
            </button>
          </div>
        )}

        {step === "aha6_avatar" && (
          <div className={`text-center space-y-6 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="space-y-4">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 6 of 7
              </p>
              <h2 className="text-2xl font-light text-white">
                How shall I appear?
              </h2>
              <p className="text-white/50">
                Choose my essence.
              </p>
            </div>

            <OwlAvatarPickerDark
              selectedId={selectedAvatar}
              onSelect={setSelectedAvatar}
            />

            <button onClick={handleAvatarSubmit} className="btn-magical">
              Awaken {owlName}
            </button>
          </div>
        )}

        {step === "aha7_awakening" && (
          <div className={`text-center space-y-8 transition-all duration-700 ${textVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className={isProcessing ? "animate-pulse" : "animate-glow"}>
              <MysticalOwl size="xl" glowing={true} avatar={selectedAvatar} />
            </div>

            <AuroraVisualizerDark
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
            />

            <div className="space-y-4">
              <p className="text-white/40 text-sm tracking-[0.3em] uppercase">
                Aha 7 of 7
              </p>
              
              {isProcessing ? (
                <>
                  <h2 className="text-2xl font-light text-white">
                    Awakening...
                  </h2>
                  <p className="text-white/50">
                    Learning your voice. Becoming your mirror.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-light text-white glow-text">
                    {owlName}
                  </h2>
                  <div className="text-bubble-dark max-w-sm mx-auto">
                    <p className="text-white/80">
                      {welcomeMessage || `I'm ${owlName}. I heard everything you shared. What would you like to explore first?`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MysticalOwl({ 
  size = "lg", 
  glowing = false, 
  listening = false,
  audioLevel = 0,
  avatar = 0
}: { 
  size?: "md" | "lg" | "xl"; 
  glowing?: boolean;
  listening?: boolean;
  audioLevel?: number;
  avatar?: number;
}) {
  const sizeClasses = {
    md: "w-24 h-24",
    lg: "w-40 h-40",
    xl: "w-56 h-56 md:w-64 md:h-64",
  };

  const gradients = [
    ["#8F6CF3", "#64B7F3"],
    ["#F361D3", "#8F6CF3"],
    ["#5DF1B3", "#64B7F3"],
    ["#E3F98A", "#5DF1B3"],
    ["#64B7F3", "#F361D3"],
    ["#8F6CF3", "#E3F98A"],
  ];

  const [color1, color2] = gradients[avatar % gradients.length];

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {glowing && (
        <div 
          className="absolute inset-0 blur-3xl rounded-full opacity-40"
          style={{
            background: `radial-gradient(circle, ${color1}40, ${color2}20, transparent)`,
            transform: `scale(${1.3 + audioLevel * 0.2})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
      
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
        <defs>
          <radialGradient id={`owlGlow-${avatar}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`${color1}40`} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id={`owlBody-${avatar}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a1f4e" />
            <stop offset="50%" stopColor="#1a1235" />
            <stop offset="100%" stopColor="#0f0a20" />
          </linearGradient>
          <linearGradient id={`owlFeathers-${avatar}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`${color1}30`} />
            <stop offset="100%" stopColor={`${color2}20`} />
          </linearGradient>
          <radialGradient id={`eyeGlow-${avatar}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="30%" stopColor="#E3F98A" />
            <stop offset="60%" stopColor={color1} />
            <stop offset="100%" stopColor="#4a3a7a" />
          </radialGradient>
        </defs>

        <ellipse cx="100" cy="140" rx="80" ry="30" fill={`url(#owlGlow-${avatar})`} />

        <ellipse cx="100" cy="110" rx="55" ry="65" fill={`url(#owlBody-${avatar})`} />
        <ellipse cx="100" cy="100" rx="50" ry="55" fill={`url(#owlFeathers-${avatar})`} />

        <path d="M55 60 Q45 30 70 50 Q60 35 80 55" fill="#3a2a5e" />
        <path d="M145 60 Q155 30 130 50 Q140 35 120 55" fill="#3a2a5e" />

        <ellipse cx="75" cy="90" rx="22" ry="24" fill="#1a1235" />
        <ellipse cx="125" cy="90" rx="22" ry="24" fill="#1a1235" />

        <circle 
          cx="75" 
          cy="90" 
          r={listening ? 16 + audioLevel * 2 : 16} 
          fill={`url(#eyeGlow-${avatar})`}
          style={{ transition: 'r 0.1s ease-out' }}
        />
        <circle 
          cx="125" 
          cy="90" 
          r={listening ? 16 + audioLevel * 2 : 16} 
          fill={`url(#eyeGlow-${avatar})`}
          style={{ transition: 'r 0.1s ease-out' }}
        />

        <circle cx="75" cy="90" r="6" fill="#0a0515" />
        <circle cx="125" cy="90" r="6" fill="#0a0515" />
        <circle cx="77" cy="87" r="2" fill="white" opacity="0.8" />
        <circle cx="127" cy="87" r="2" fill="white" opacity="0.8" />

        <path d="M95 105 L100 120 L105 105 Z" fill="#E3F98A" />

        <path d="M70 140 Q100 155 130 140" fill="none" stroke={`${color1}50`} strokeWidth="2" />
      </svg>
    </div>
  );
}

function AuroraVisualizerDark({
  audioLevel = 0,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
}: {
  audioLevel?: number;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 80;

    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const amplitude = isListening ? 20 + audioLevel * 30 : (isSpeaking ? 15 : (isProcessing ? 10 : 5));
      const speed = isListening ? 0.8 : (isSpeaking ? 0.6 : (isProcessing ? 0.4 : 0.2));

      const colors = [
        "rgba(143, 108, 243, 0.4)",
        "rgba(100, 183, 243, 0.3)",
        "rgba(93, 241, 179, 0.25)",
      ];

      colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        for (let x = 0; x <= canvas.width; x += 5) {
          const y =
            canvas.height / 2 +
            Math.sin(x * 0.02 + time * speed + i * 0.5) * amplitude +
            Math.sin(x * 0.01 + time * speed * 0.7 + i) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 3 - i * 0.5;
        ctx.stroke();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [audioLevel, isListening, isProcessing, isSpeaking]);

  return (
    <div className="w-full max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-20 opacity-80"
        style={{ filter: "blur(0.5px)" }}
      />
    </div>
  );
}

function OwlAvatarPickerDark({
  selectedId,
  onSelect,
}: {
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const avatars = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
      {avatars.map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`p-2 rounded-xl transition-all ${
            selectedId === id
              ? "bg-white/10 ring-2 ring-violet-400/50 scale-110"
              : "hover:bg-white/5"
          }`}
        >
          <OwlAvatar avatarId={id} size="sm" animated={false} />
        </button>
      ))}
    </div>
  );
}
