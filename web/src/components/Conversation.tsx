"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import AuroraVisualizer from "./AuroraVisualizer";
import { converse, playAudio, transcribeAudio } from "@/lib/api";

const Dashboard3D = dynamic(() => import("./Dashboard3D"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 animate-pulse" />
    </div>
  )
});

interface ConversationProps {
  profile: {
    userId: string;
    owlName: string;
    owlAvatar: number;
    voiceId: string;
    userName: string;
  };
  onReset: () => void;
}

interface Message {
  id: string;
  role: "user" | "owl";
  content: string;
  timestamp: Date;
}

const owlImages = [
  "/owls/realistic-owl-1.png",
  "/owls/realistic-owl-2.png",
  "/owls/realistic-owl-3.png",
  "/owls/realistic-owl-4.png",
  "/owls/realistic-owl-5.png",
  "/owls/realistic-owl-6.png",
];

function FloatingOwl({ avatarId, name, isListening, isSpeaking }: { 
  avatarId: number; 
  name: string;
  isListening: boolean;
  isSpeaking: boolean;
}) {
  const [bobOffset, setBobOffset] = useState(0);
  const [swayOffset, setSwayOffset] = useState(0);
  
  useEffect(() => {
    let frame: number;
    let time = 0;
    
    const animate = () => {
      time += 0.02;
      setBobOffset(Math.sin(time * 1.5) * 8);
      setSwayOffset(Math.sin(time * 0.8) * 3);
      frame = requestAnimationFrame(animate);
    };
    
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const glowIntensity = isListening ? 0.8 : isSpeaking ? 0.6 : 0.3;
  const scale = isListening ? 1.05 : isSpeaking ? 1.02 : 1;

  return (
    <div 
      className="relative flex flex-col items-center"
      style={{
        transform: `translateY(${bobOffset}px) rotate(${swayOffset}deg) scale(${scale})`,
        transition: 'transform 0.3s ease-out'
      }}
    >
      <div 
        className="relative w-48 h-48 md:w-64 md:h-64"
        style={{
          filter: `drop-shadow(0 0 ${40 * glowIntensity}px rgba(147, 112, 219, ${glowIntensity})) 
                   drop-shadow(0 0 ${60 * glowIntensity}px rgba(100, 183, 243, ${glowIntensity * 0.7}))
                   drop-shadow(0 0 ${20 * glowIntensity}px rgba(93, 241, 179, ${glowIntensity * 0.5}))`
        }}
      >
        <img
          src={owlImages[avatarId - 1] || owlImages[0]}
          alt={name}
          className="w-full h-full object-contain"
        />
      </div>
      <p className="mt-2 text-lg font-medium text-white/90">{name}</p>
    </div>
  );
}

export default function Conversation({ profile, onReset }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "owl",
      content: `Welcome back! I'm ${profile.owlName}, your Owl. What would you like to explore today?`,
      timestamp: new Date(),
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

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

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        await processRecording(blob);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      updateAudioLevel();
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
    }
  };

  const processRecording = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);

    const userMessageId = `msg_${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      role: "user",
      content: "Processing...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await converse(blob, profile.userId);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessageId
            ? { ...m, content: result.transcript || "..." }
            : m
        )
      );

      setIsProcessing(false);
      setIsSpeaking(true);

      const owlResponse: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "owl",
        content: result.response || "I'm thinking about that...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, owlResponse]);

      if (result.audio && result.audio.size > 0) {
        try {
          await playAudio(result.audio);
        } catch (audioErr) {
          console.log("Audio playback error:", audioErr);
        }
      }

      setIsSpeaking(false);
    } catch (err) {
      console.error("Conversation error:", err);
      
      try {
        const transcript = await transcribeAudio(blob);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessageId
              ? { ...m, content: transcript || "I said something..." }
              : m
          )
        );
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessageId
              ? { ...m, content: "..." }
              : m
          )
        );
      }

      setIsProcessing(false);
      setIsSpeaking(true);

      const fallbackResponse: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "owl",
        content: `I heard you. Let me think about that... What else would you like to explore?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackResponse]);

      setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
    }
  };

  const latestOwlMessage = messages.filter(m => m.role === "owl").slice(-1)[0];
  const latestUserMessage = messages.filter(m => m.role === "user").slice(-1)[0];

  return (
    <div className="min-h-screen bg-[#0a0515] flex flex-col overflow-hidden relative">
      {/* Full-screen immersive 3D aurora background */}
      <div className="absolute inset-0 z-0">
        <Dashboard3D 
          avatarId={profile.owlAvatar}
          isListening={isRecording}
          isSpeaking={isSpeaking}
        />
      </div>

      {error && (
        <div className="absolute top-20 left-4 right-4 p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-red-200 text-sm text-center z-40 backdrop-blur-sm">
          {error}
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full hover:bg-white/15 transition-all"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="px-4 py-2 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full">
          <img 
            src="/8wls-logo.png" 
            alt="8WLS" 
            className="h-6 md:h-7 w-auto invert opacity-90"
          />
        </div>
        
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full hover:bg-white/15 transition-all"
        >
          <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pb-6">
        {/* Spacer to let the owl be visible in the immersive background */}
        <div className="flex-1 min-h-[45vh]" />

        <div className="w-full max-w-2xl space-y-3 overflow-hidden">
          {latestOwlMessage && (
            <div className="w-full px-5 py-4 rounded-2xl bg-white/8 backdrop-blur-xl border border-white/15 shadow-lg">
              <p className="text-[10px] font-semibold text-amber-300/90 mb-1.5 uppercase tracking-widest">
                {profile.owlName}
              </p>
              <p className="text-white text-base leading-relaxed drop-shadow-sm">
                {latestOwlMessage.content}
              </p>
            </div>
          )}
          
          {latestUserMessage && (
            <div className="w-full px-5 py-4 rounded-2xl bg-white/6 backdrop-blur-xl border border-white/10 shadow-lg">
              <p className="text-[10px] font-semibold text-cyan-300/90 mb-1.5 uppercase tracking-widest">
                You
              </p>
              <p className="text-white/95 text-base leading-relaxed drop-shadow-sm">
                {latestUserMessage.content}
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 pt-6 flex flex-col items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            className={`relative px-10 py-5 rounded-full transition-all duration-500 backdrop-blur-xl border ${
              isRecording 
                ? "bg-gradient-to-r from-pink-500/40 to-purple-500/40 border-pink-400/40 scale-105" 
                : "bg-white/10 border-white/20 hover:bg-white/15"
            } ${
              isProcessing || isSpeaking ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
            }`}
            style={{
              boxShadow: isRecording 
                ? '0 0 50px rgba(236, 72, 153, 0.4), inset 0 0 30px rgba(255,255,255,0.1)' 
                : '0 0 40px rgba(147, 51, 234, 0.2), inset 0 0 20px rgba(255,255,255,0.05)'
            }}
          >
            <div className="flex items-center justify-center gap-3">
              {isRecording ? (
                <div className="w-4 h-4 bg-white rounded-sm animate-pulse" />
              ) : (
                <svg className="w-6 h-6 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
              <span className="text-white/90 text-sm font-medium tracking-wide">
                {isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : isRecording ? "Stop" : "Speak"}
              </span>
            </div>
            {isRecording && (
              <div className="absolute inset-0 rounded-full animate-ping bg-pink-500/20" />
            )}
          </button>
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1235] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-medium text-white/80 mb-3">Your Owl</h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-cyan-500/20 p-1">
                    <img 
                      src={owlImages[profile.owlAvatar - 1] || owlImages[0]} 
                      alt={profile.owlName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{profile.owlName}</p>
                    <p className="text-sm text-white/50">Your consciousness companion</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="font-medium text-white/80 mb-2">Memory</h3>
                <p className="text-sm text-white/50 mb-3">
                  {profile.owlName} remembers your conversations.
                </p>
                <button className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Clear all memory
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  onReset();
                }}
                className="w-full py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors border border-red-500/20"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
