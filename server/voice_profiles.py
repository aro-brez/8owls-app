"""
Voice Profile Management
Stores and retrieves voice IDs for users.
"""

import json
import os
from typing import Optional, Dict

PROFILES_FILE = "voice_profiles.json"


class VoiceProfileManager:
    def __init__(self):
        self.profiles: Dict[str, dict] = {}
        self._load()

    def _load(self):
        """Load profiles from file."""
        if os.path.exists(PROFILES_FILE):
            with open(PROFILES_FILE, "r") as f:
                self.profiles = json.load(f)

    def _save(self):
        """Save profiles to file."""
        with open(PROFILES_FILE, "w") as f:
            json.dump(self.profiles, f, indent=2)

    def set_profile(
        self,
        user_id: str,
        voice_id: str,
        owl_name: str,
        owl_avatar: str,
        user_name: str,
        user_role: str
    ):
        """Store a user's voice profile."""
        self.profiles[user_id] = {
            "voice_id": voice_id,
            "owl_name": owl_name,
            "owl_avatar": owl_avatar,
            "user_name": user_name,
            "user_role": user_role
        }
        self._save()

    def get_profile(self, user_id: str) -> Optional[dict]:
        """Get a user's voice profile."""
        return self.profiles.get(user_id)

    def get_voice_id(self, user_id: str) -> str:
        """Get voice ID for a user, or default if not found."""
        profile = self.get_profile(user_id)
        if profile:
            return profile["voice_id"]
        return "default"


# Singleton instance
profiles = VoiceProfileManager()
