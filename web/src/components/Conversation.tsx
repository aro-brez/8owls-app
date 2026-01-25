"use client";

import { useState, useRef, useEffect } from "react";
import AuroraVisualizer from "./AuroraVisualizer";
import OwlAvatar from "./OwlAvatar";
import { converse, playAudio, transcribeAudio } from "@/lib/api";

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

export default function Conversation({ profile, onReset }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "owl",
      content: `Welcome back! I'm ${profile.owlName}, your Owl. What would you like to work on today?`,
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

  return (
    <div className="min-h-screen gradient-divine flex flex-col">
      {error && (
        <div className="absolute top-20 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center z-40">
          {error}
        </div>
      )}

      <header className="flex items-center justify-between p-4 backdrop-ethereal border-b border-gray-100">
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <OwlAvatar avatarId={profile.owlAvatar} size="sm" animated={false} />
          <span className="font-semibold">{profile.owlName}</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 max-w-2xl mx-auto w-full">
        <div className="py-6">
          <OwlAvatar
            avatarId={profile.owlAvatar}
            name={profile.owlName}
            size="lg"
          />
        </div>

        <div className="w-full py-4">
          <AuroraVisualizer
            isListening={isRecording}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            audioLevel={audioLevel}
          />
        </div>

        <div className="flex-1 w-full overflow-y-auto mb-4 space-y-4 max-h-64">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`text-bubble ${
                message.role === "user" ? "bg-gray-50" : "bg-white"
              }`}
            >
              <p className="text-sm font-medium text-gray-500 mb-1">
                {message.role === "user" ? "You" : profile.owlName}
              </p>
              <p className="text-gray-700">{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="py-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            className={`mic-button ${isRecording ? "recording" : ""} ${
              isProcessing || isSpeaking ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isRecording ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              </svg>
            )}
          </button>
          <p className="text-sm text-gray-400 text-center mt-2">
            {isProcessing ? "Thinking..." : isSpeaking ? "Speaking..." : isRecording ? "Tap to stop" : "Tap to speak"}
          </p>
        </div>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <h3 className="font-medium mb-2">Your Owl</h3>
                <div className="flex items-center gap-4">
                  <OwlAvatar avatarId={profile.owlAvatar} size="md" animated={false} />
                  <div>
                    <p className="font-semibold">{profile.owlName}</p>
                    <p className="text-sm text-gray-500">Your consciousness companion</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50">
                <h3 className="font-medium mb-2">Memory</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {profile.owlName} remembers your conversations to help you better.
                </p>
                <button className="text-sm text-red-500 hover:underline">
                  Clear all memory
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSettings(false);
                  onReset();
                }}
                className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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
