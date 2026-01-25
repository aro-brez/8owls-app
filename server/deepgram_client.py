"""
Deepgram STT Integration
Handles both streaming and batch transcription using HTTP API.
"""

import os
import httpx

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
DEEPGRAM_BASE_URL = "https://api.deepgram.com/v1"


class DeepgramSTTClient:
    def __init__(self):
        self.api_key = DEEPGRAM_API_KEY
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "audio/wav"
        }

    async def transcribe_audio(self, audio_bytes: bytes, mimetype: str = "audio/wav") -> str:
        """
        Transcribe audio file to text.
        Used for onboarding and non-streaming scenarios.
        """
        if not self.api_key:
            return "[Deepgram API key not configured]"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{DEEPGRAM_BASE_URL}/listen?punctuate=true&model=nova-2&language=en&smart_format=true",
                headers={
                    "Authorization": f"Token {self.api_key}",
                    "Content-Type": mimetype
                },
                content=audio_bytes
            )
            
            if response.status_code != 200:
                return f"[Transcription error: {response.status_code}]"
            
            data = response.json()
            transcript = data.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
            return transcript

    async def create_streaming_connection(self, on_transcript_callback):
        """
        Create a streaming connection for real-time transcription.
        Note: WebSocket streaming requires additional implementation.
        For now, returns None and batch transcription should be used.
        """
        return None


deepgram = DeepgramSTTClient()
