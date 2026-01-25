# 8OWL Project

## Overview
8OWL is a voice-enabled consciousness companion API. It provides voice cloning, text-to-speech, and speech-to-text capabilities through a FastAPI backend.

## Tech Stack
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Voice Services**: Deepgram (STT), Cartesia (TTS/voice cloning)

## Project Structure
```
/
├── run.py              # Entry point to start the server
├── server/
│   ├── app.py          # FastAPI application
│   ├── voice.py        # Voice API endpoints
│   ├── deepgram_client.py  # Deepgram STT integration
│   ├── cartesia_client.py  # Cartesia TTS integration
│   └── voice_profiles.py   # Voice profile storage
├── docs/               # Documentation
└── .env.example        # Example environment variables
```

## Running the Application
The API server runs on port 5000. Start with:
```bash
python run.py
```

## API Endpoints
- `GET /` - Root endpoint with API info
- `GET /health` - Health check
- `POST /api/voice/onboard` - User voice onboarding
- `POST /api/voice/speak` - Text-to-speech
- `POST /api/voice/transcribe` - Speech-to-text
- `POST /api/voice/converse` - Full conversation loop
- `WS /api/voice/ws/converse` - WebSocket streaming

## Required Environment Variables
- `DEEPGRAM_API_KEY` - For speech-to-text
- `CARTESIA_API_KEY` - For text-to-speech and voice cloning
- `ANTHROPIC_API_KEY` - For AI processing (optional)

## Recent Changes
- January 2026: Initial Replit environment setup
  - Configured Python 3.11 with dependencies
  - Created run.py entry point for port 5000
  - Updated Deepgram client for HTTP API compatibility
