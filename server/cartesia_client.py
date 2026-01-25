"""
Cartesia TTS Integration
Handles text-to-speech with voice cloning.
"""

import os
import httpx
from typing import Optional

CARTESIA_API_KEY = os.getenv("CARTESIA_API_KEY")
CARTESIA_BASE_URL = "https://api.cartesia.ai"


class CartesiaClient:
    def __init__(self):
        self.api_key = CARTESIA_API_KEY
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def speak(
        self,
        text: str,
        voice_id: str = "default",
        model_id: str = "sonic-english"
    ) -> bytes:
        """
        Convert text to speech using specified voice.

        Args:
            text: Text to speak
            voice_id: ID of cloned voice (or "default" for preset)
            model_id: Cartesia model to use

        Returns:
            Audio bytes (WAV format)
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{CARTESIA_BASE_URL}/tts/bytes",
                headers=self.headers,
                json={
                    "text": text,
                    "voice": {
                        "mode": "id",
                        "id": voice_id
                    },
                    "model_id": model_id,
                    "output_format": {
                        "container": "wav",
                        "encoding": "pcm_f32le",
                        "sample_rate": 24000
                    }
                }
            )
            response.raise_for_status()
            return response.content

    async def clone_voice(
        self,
        audio_bytes: bytes,
        name: str,
        description: str = "Cloned voice for Eight Owls"
    ) -> str:
        """
        Clone a voice from audio sample.

        Args:
            audio_bytes: Audio sample (30+ seconds recommended)
            name: Name for the voice profile
            description: Description of the voice

        Returns:
            voice_id for use in speak()
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{CARTESIA_BASE_URL}/voices/clone",
                headers={"X-API-Key": self.api_key},
                files={
                    "clip": ("sample.wav", audio_bytes, "audio/wav")
                },
                data={
                    "name": name,
                    "description": description
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["id"]

    async def list_voices(self) -> list:
        """List all available voices including cloned ones."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CARTESIA_BASE_URL}/voices",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()


# Singleton instance
cartesia = CartesiaClient()
