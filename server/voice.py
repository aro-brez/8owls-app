"""
Voice API Endpoints
Main voice integration for Eight Owls.
"""

import os
import asyncio
from fastapi import APIRouter, WebSocket, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from .deepgram_client import deepgram
from .cartesia_client import cartesia
from .voice_profiles import profiles

router = APIRouter(prefix="/api/voice", tags=["voice"])


# ============================================================================
# ONBOARDING ENDPOINT
# ============================================================================

class OnboardResponse(BaseModel):
    user_id: str
    voice_id: str
    owl_name: str
    transcript: str
    welcome_message: str


@router.post("/onboard", response_model=OnboardResponse)
async def onboard(
    audio: UploadFile = File(...),
    user_id: str = Form(...),
    owl_name: str = Form(...),
    owl_avatar: str = Form("default"),
    user_name: str = Form(""),
    user_role: str = Form("")
):
    """
    Onboard a new user:
    1. Receive 30+ seconds of audio
    2. Clone their voice
    3. Transcribe to learn about them
    4. Create their owl profile
    5. Return welcome message
    """
    audio_bytes = await audio.read()

    # Clone voice
    voice_id = await cartesia.clone_voice(
        audio_bytes=audio_bytes,
        name=f"owl-{user_id}-{owl_name}"
    )

    # Transcribe to learn about them
    transcript = await deepgram.transcribe_audio(audio_bytes)

    # Extract name and role from transcript if not provided
    if not user_name:
        user_name = transcript.split()[0] if transcript else "Friend"

    # Store profile
    profiles.set_profile(
        user_id=user_id,
        voice_id=voice_id,
        owl_name=owl_name,
        owl_avatar=owl_avatar,
        user_name=user_name,
        user_role=user_role
    )

    welcome_message = f"Nice to meet you, {user_name}. I heard that you're {extract_key_info(transcript)}. I'm {owl_name}, your Owl. What do you want to tackle first?"

    return OnboardResponse(
        user_id=user_id,
        voice_id=voice_id,
        owl_name=owl_name,
        transcript=transcript,
        welcome_message=welcome_message
    )


def extract_key_info(transcript: str) -> str:
    """Extract key info from transcript. In production, use Claude."""
    words = transcript.split()
    if len(words) > 20:
        return " ".join(words[:20]) + "..."
    return transcript


# ============================================================================
# SPEAK ENDPOINT (TTS)
# ============================================================================

class SpeakRequest(BaseModel):
    text: str
    user_id: str = "default"


@router.post("/speak")
async def speak(request: SpeakRequest):
    """Convert text to speech using user's cloned voice."""
    voice_id = profiles.get_voice_id(request.user_id)

    audio_bytes = await cartesia.speak(
        text=request.text,
        voice_id=voice_id
    )

    return Response(
        content=audio_bytes,
        media_type="audio/wav"
    )


# ============================================================================
# TRANSCRIBE ENDPOINT (STT)
# ============================================================================

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """Transcribe audio to text."""
    audio_bytes = await audio.read()
    transcript = await deepgram.transcribe_audio(audio_bytes)
    return {"transcript": transcript}


# ============================================================================
# CONVERSE ENDPOINT (Full Loop)
# ============================================================================

@router.post("/converse")
async def converse(
    audio: UploadFile = File(...),
    user_id: str = Form("default")
):
    """
    Full conversation loop:
    1. Transcribe audio
    2. Process through SEED agent (TODO: integrate)
    3. Synthesize response in user's voice
    """
    # 1. Transcribe
    audio_bytes = await audio.read()
    transcript = await deepgram.transcribe_audio(audio_bytes)

    if not transcript.strip():
        return Response(
            content=await cartesia.speak(
                "I didn't catch that. Could you say it again?",
                profiles.get_voice_id(user_id)
            ),
            media_type="audio/wav"
        )

    # 2. Process through SEED agent
    # TODO: Integrate with seed_agent
    response_text = f"I heard you say: {transcript}. Let me think about that..."

    # 3. Synthesize in user's voice
    voice_id = profiles.get_voice_id(user_id)
    response_audio = await cartesia.speak(
        text=response_text,
        voice_id=voice_id
    )

    return Response(
        content=response_audio,
        media_type="audio/wav",
        headers={
            "X-Transcript": transcript,
            "X-Response": response_text
        }
    )


# ============================================================================
# WEBSOCKET STREAMING ENDPOINT
# ============================================================================

@router.websocket("/ws/converse")
async def websocket_converse(websocket: WebSocket, user_id: str = "default"):
    """
    Real-time streaming conversation via WebSocket.

    Protocol:
    - Client sends: audio chunks (binary)
    - Server sends: audio response chunks (binary) + transcripts (text/json)
    """
    await websocket.accept()

    voice_id = profiles.get_voice_id(user_id)
    pending_transcript = ""

    async def handle_transcript(transcript: str):
        nonlocal pending_transcript
        pending_transcript += " " + transcript

        await websocket.send_json({
            "type": "transcript",
            "text": transcript,
            "final": False
        })

    dg_connection = await deepgram.create_streaming_connection(handle_transcript)

    try:
        while True:
            data = await websocket.receive()

            if "bytes" in data:
                dg_connection.send(data["bytes"])

            elif "text" in data:
                message = data["text"]

                if message == "END_TURN":
                    if pending_transcript.strip():
                        # TODO: Process through SEED agent
                        response_text = f"I heard: {pending_transcript.strip()}"

                        await websocket.send_json({
                            "type": "response",
                            "text": response_text
                        })

                        response_audio = await cartesia.speak(
                            text=response_text,
                            voice_id=voice_id
                        )
                        await websocket.send_bytes(response_audio)

                        pending_transcript = ""

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        dg_connection.finish()
        await websocket.close()


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/profile/{user_id}")
async def get_profile(user_id: str):
    """Get user's owl profile."""
    profile = profiles.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.delete("/profile/{user_id}")
async def delete_profile(user_id: str):
    """Delete user's profile and voice."""
    if user_id in profiles.profiles:
        del profiles.profiles[user_id]
        profiles._save()
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Profile not found")
