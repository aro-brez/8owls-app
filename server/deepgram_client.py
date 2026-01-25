"""
Deepgram STT Integration
Handles both streaming and batch transcription.
"""

import os
import asyncio
from deepgram import Deepgram

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")


class DeepgramClient:
    def __init__(self):
        self.client = Deepgram(DEEPGRAM_API_KEY)

    async def transcribe_audio(self, audio_bytes: bytes, mimetype: str = "audio/wav") -> str:
        """
        Transcribe audio file to text.
        Used for onboarding and non-streaming scenarios.
        """
        response = await self.client.transcription.prerecorded(
            {"buffer": audio_bytes, "mimetype": mimetype},
            {
                "punctuate": True,
                "model": "nova-2",
                "language": "en",
                "smart_format": True
            }
        )

        transcript = response["results"]["channels"][0]["alternatives"][0]["transcript"]
        return transcript

    async def create_streaming_connection(self, on_transcript_callback):
        """
        Create a streaming connection for real-time transcription.

        Args:
            on_transcript_callback: async function(transcript: str) called when text is ready
        """
        connection = await self.client.transcription.live({
            "punctuate": True,
            "model": "nova-2",
            "language": "en",
            "encoding": "linear16",
            "sample_rate": 16000,
            "channels": 1,
            "interim_results": True,
            "endpointing": 300,  # ms of silence to detect end of speech
        })

        async def handle_transcript(data):
            """Handle incoming transcription data."""
            if data.get("is_final"):
                transcript = data["channel"]["alternatives"][0]["transcript"]
                if transcript.strip():
                    await on_transcript_callback(transcript)

        connection.register_handler(
            connection.event.TRANSCRIPT_RECEIVED,
            handle_transcript
        )

        return connection


# Singleton instance
deepgram = DeepgramClient()
