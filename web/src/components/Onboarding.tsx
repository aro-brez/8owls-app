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

type Step = "greeting" | "recording" | "naming" | "avatar" | "welcome";

const popularNames = ["Aria", "Scout", "Echo", "Nova", "Atlas", "Sage", "Orion", "Luna", "Phoenix", "Kai"];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("greeting");
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const minRecordingTime = 30;

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
      setStep("recording");
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
      setStep("naming");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleNameSubmit = () => {
    if (owlName.trim()) {
      setStep("avatar");
    }
  };

  const handleAvatarSubmit = async () => {
    if (!audioBlob) {
      setError("No audio recorded. Please try again.");
      return;
    }

    setIsProcessing(true);
    setStep("welcome");
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
      }, 1500);
    } catch (err) {
      console.error("Onboarding error:", err);
      setIsProcessing(false);
      setWelcomeMessage(`Nice to meet you! I'm ${owlName}, your Owl. I heard everything you shared. What do you want to tackle first?`);
      
      setTimeout(() => {
        onComplete({
          userId,
          owlName,
          owlAvatar: selectedAvatar,
          voiceId: "default",
          userName: "Friend",
        });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen gradient-ethereal flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {step === "greeting" && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="animate-float">
              <OwlAvatar avatarId={0} size="xl" />
            </div>
            
            <AuroraVisualizer isListening={false} />
            
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Hi, I&apos;m your Owl.
              </h1>
              <p className="text-gray-600 leading-relaxed">
                I&apos;m here to help you think clearer, act faster, and accomplish what matters.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Before we begin, tell me about yourself - what you do, what you&apos;re working on, what you want to achieve.
              </p>
              <p className="text-sm text-gray-400">
                Take at least 30 seconds.
              </p>
            </div>

            <button
              onClick={startRecording}
              className="mic-button mx-auto"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
              </svg>
            </button>
            <p className="text-sm text-gray-400">Tap to start recording</p>
          </div>
        )}

        {step === "recording" && (
          <div className="text-center space-y-8">
            <div className="animate-breathe">
              <OwlAvatar avatarId={0} size="xl" animated={false} />
            </div>

            <AuroraVisualizer isListening={true} audioLevel={audioLevel} />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                I&apos;m listening...
              </h2>
              
              <div className="w-full">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min((recordingTime / minRecordingTime) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {recordingTime < minRecordingTime
                    ? `${minRecordingTime - recordingTime} seconds remaining`
                    : "You can stop when you're ready"}
                </p>
              </div>
            </div>

            <button
              onClick={stopRecording}
              disabled={recordingTime < minRecordingTime}
              className={`mic-button recording mx-auto ${
                recordingTime < minRecordingTime ? "opacity-50 cursor-not-allowed" : ""
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
            <p className="text-sm text-gray-400">
              {recordingTime < minRecordingTime
                ? "Keep talking..."
                : "Tap to stop"}
            </p>
          </div>
        )}

        {step === "naming" && (
          <div className="text-center space-y-8">
            <AuroraVisualizer isProcessing={true} />

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Creating your Owl...
              </h2>
              <p className="text-gray-600">What would you like to call me?</p>
            </div>

            <input
              type="text"
              value={owlName}
              onChange={(e) => setOwlName(e.target.value)}
              placeholder="Enter a name..."
              className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-center text-lg"
              autoFocus
            />

            <div className="flex flex-wrap justify-center gap-2">
              {popularNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setOwlName(name)}
                  className="px-3 py-1 text-sm rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>

            <button
              onClick={handleNameSubmit}
              disabled={!owlName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === "avatar" && (
          <div className="text-center space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Choose {owlName}&apos;s appearance
            </h2>

            <OwlAvatarPicker
              selectedId={selectedAvatar}
              onSelect={setSelectedAvatar}
            />

            <button onClick={handleAvatarSubmit} className="btn-primary">
              Meet {owlName}
            </button>
          </div>
        )}

        {step === "welcome" && (
          <div className="text-center space-y-8">
            <OwlAvatar
              avatarId={selectedAvatar}
              name={owlName}
              size="xl"
            />

            <AuroraVisualizer
              isProcessing={isProcessing}
              isSpeaking={isSpeaking}
            />

            <div className="text-bubble">
              <p className="text-gray-700">
                {isProcessing
                  ? "Processing your voice..."
                  : welcomeMessage || `Nice to meet you! I'm ${owlName}, your Owl. What do you want to tackle first?`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
