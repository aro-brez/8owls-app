# Eight Owls - Meet Your Mirror

## Overview
Eight Owls is a voice-enabled consciousness companion app where everyone gets a personal AI owl that sounds like them, learns from them, and helps them think clearer. Sister brand of BREZ with ethereal, divine, ancient-future vibes.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Voice Services**: Deepgram (STT), Cartesia (TTS/voice cloning)
- **Design**: BREZ-inspired color palette (Mindaro Green, Cold Violet, Azure, Pink, Turquoise)

## Project Structure
```
/
├── web/                    # Next.js frontend
│   └── src/
│       ├── app/           # Pages and layouts
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/    # React components
│       │   ├── AuroraVisualizer.tsx  # Canvas-based aurora animation
│       │   ├── OwlAvatar.tsx         # Owl avatar with 12 gradient styles
│       │   ├── Onboarding.tsx        # Voice recording + owl setup
│       │   └── Conversation.tsx      # Main chat interface
│       └── lib/
│           └── api.ts     # API utilities for backend communication
├── server/                 # FastAPI backend
│   ├── app.py             # Main app with CORS, routing
│   ├── voice.py           # Voice API endpoints
│   ├── deepgram_client.py # Speech-to-text integration
│   └── cartesia_client.py # Text-to-speech integration
├── run.py                  # Backend entry point (port 8000)
└── docs/                   # Documentation
```

## Running the Application
- **Frontend**: Runs on port 5000 via `cd web && npm run dev`
- **Backend API**: Runs on port 8000 via `python run.py`

## Key Features
1. **Onboarding Flow**: Voice recording (30+ sec), owl naming, avatar selection
2. **Aurora Visualizer**: Canvas-based, responds to voice amplitude and state (listening, speaking, processing)
3. **Conversation Interface**: Real-time voice recording with transcript display
4. **12 Owl Avatars**: Gradient-styled with BREZ colors
5. **Settings Panel**: Memory controls, owl customization, start over option

## Brand Colors (BREZ Palette)
- Mindaro Green: #E3F98A
- Cold Violet: #8F6CF3
- Azure: #64B7F3
- Pink: #F361D3
- Turquoise: #5DF1B3
- Silver: #EAEDEE

## API Endpoints
- `POST /api/voice/onboard` - Process voice sample, create user profile, clone voice
- `POST /api/voice/converse` - Transcribe user speech, generate AI response, return TTS audio
- `POST /api/voice/transcribe` - Speech-to-text only
- `POST /api/voice/speak` - Text-to-speech with cloned voice
- `GET /health` - Health check

## Environment Variables
- `DEEPGRAM_API_KEY` - For speech-to-text
- `CARTESIA_API_KEY` - For text-to-speech and voice cloning
- `ANTHROPIC_API_KEY` - For AI processing (optional)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)

## Recent Changes
- January 2026: Complete frontend-backend integration
  - Wired Onboarding.tsx to call /api/voice/onboard with audio blob
  - Wired Conversation.tsx to call /api/voice/converse for real-time chat
  - Added graceful fallbacks when API keys are missing
  - Configured CORS and Next.js allowedDevOrigins for Replit
  - Set up deployment configuration

## The Vibe
- Ethereal - Light, floating, breathes
- Divine - Sacred, attention respected
- Ancient Future - Timeless design
- Sophisticated - Refined, knows what to leave out
- Apple Intuitive - No learning curve, just works
