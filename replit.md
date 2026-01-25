# Eight Owls - Meet Your Mirror

## Overview
Eight Owls is a voice-enabled consciousness companion app where everyone gets a personal AI owl that sounds like them, learns from them, and helps them think clearer. Sister brand of BRĒZ with ethereal, divine, ancient-future vibes.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Voice Services**: Deepgram (STT), Cartesia (TTS/voice cloning)
- **Design**: BRĒZ-inspired color palette (Mindaro Green, Cold Violet, Azure, Pink, Turquoise)

## Project Structure
```
/
├── web/                    # Next.js frontend
│   └── src/
│       ├── app/           # Pages and layouts
│       └── components/    # React components
│           ├── AuroraVisualizer.tsx
│           ├── OwlAvatar.tsx
│           ├── Onboarding.tsx
│           └── Conversation.tsx
├── server/                 # FastAPI backend
│   ├── app.py             # Main app
│   ├── voice.py           # Voice API endpoints
│   ├── deepgram_client.py # STT integration
│   └── cartesia_client.py # TTS integration
├── run.py                  # Backend entry point
└── docs/                   # Documentation
```

## Running the Application
- **Frontend**: Runs on port 5000 via `cd web && npm run dev`
- **Backend API**: Runs on port 8000 via `python run.py`

## Key Features
1. **Onboarding Flow**: Voice recording (30+ sec), owl naming, avatar selection
2. **Aurora Visualizer**: Canvas-based, responds to voice amplitude and state
3. **Conversation Interface**: Real-time voice recording, transcript display
4. **12 Owl Avatars**: Gradient-styled with BRĒZ colors

## Brand Colors (BRĒZ Palette)
- Mindaro Green: #E3F98A
- Cold Violet: #8F6CF3
- Azure: #64B7F3
- Pink: #F361D3
- Turquoise: #5DF1B3
- Silver: #EAEDEE

## Environment Variables
- `DEEPGRAM_API_KEY` - For speech-to-text
- `CARTESIA_API_KEY` - For text-to-speech and voice cloning
- `ANTHROPIC_API_KEY` - For AI processing (optional)

## Recent Changes
- January 2026: Built complete frontend with BRĒZ styling
  - Onboarding flow with voice recording
  - Aurora borealis voice visualizer
  - Owl avatar selection system
  - Main conversation interface

## The Vibe
- Ethereal - Light, floating, breathes
- Divine - Sacred, attention respected
- Ancient Future - Timeless design
- Sophisticated - Refined, knows what to leave out
- Apple Intuitive - No learning curve, just works
