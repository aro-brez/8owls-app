"use client";

import { useState, useEffect } from "react";
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
  const [profile, setProfile] = useState<OwlProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("owlProfile");
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const handleOnboardingComplete = (newProfile: OwlProfile) => {
    localStorage.setItem("owlProfile", JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handleReset = () => {
    localStorage.removeItem("owlProfile");
    setProfile(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-ethereal flex items-center justify-center">
        <div className="animate-breathe">
          <div className="text-6xl">🦉</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return <Conversation profile={profile} onReset={handleReset} />;
}
