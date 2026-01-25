"use client";

import { useState, useEffect } from "react";
import MagicalIntro from "@/components/MagicalIntro";
import Onboarding from "@/components/Onboarding";
import Conversation from "@/components/Conversation";

interface OwlProfile {
  userId: string;
  owlName: string;
  owlAvatar: number;
  voiceId: string;
  userName: string;
}

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [profile, setProfile] = useState<OwlProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("owlProfile");
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    
    if (saved) {
      setProfile(JSON.parse(saved));
      setShowIntro(false);
    } else if (hasSeenIntro) {
      setShowIntro(false);
    }
    
    setIsLoading(false);
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true");
    setShowIntro(false);
  };

  const handleOnboardingComplete = (newProfile: OwlProfile) => {
    localStorage.setItem("owlProfile", JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handleReset = () => {
    localStorage.removeItem("owlProfile");
    sessionStorage.removeItem("hasSeenIntro");
    setProfile(null);
    setShowIntro(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0515] flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 opacity-50" />
        </div>
      </div>
    );
  }

  if (showIntro && !profile) {
    return <MagicalIntro onComplete={handleIntroComplete} />;
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Conversation profile={profile} onReset={handleReset} />;
}
