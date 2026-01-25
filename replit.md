# Eight Owls - Meet Your Mirror

## Overview
Eight Owls is a voice-enabled consciousness companion app where everyone gets a personal AI owl that sounds like them, learns from them, and helps them think clearer. Sister brand of BREZ with ethereal, divine, ancient-future vibes. Harry Potter-inspired magical owl that flies in and becomes your mirror.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Python 3.11, FastAPI, Uvicorn
- **Voice Services**: Deepgram (STT), Cartesia (TTS/voice cloning)
- **Design**: Dark mystical theme with BREZ color accents

## Project Structure
```
/
├── web/                    # Next.js frontend
│   ├── public/
│   │   └── owls/          # 6 photorealistic owl portraits
│   └── src/
│       ├── app/           # Pages and layouts
│       │   ├── layout.tsx
│       │   ├── page.tsx   # Main entry with intro/onboarding/conversation flow
│       │   └── globals.css # Dark mystical theme styles
│       ├── components/
│       │   ├── MagicalIntro.tsx    # Divine intro with realistic owl and light rings
│       │   ├── AuroraVisualizer.tsx # Voice visualizer with chromatic waves
│       │   ├── VideoBackground.tsx  # Video bg with divine gradient fallback
│       │   ├── RealisticOwl.tsx    # Interactive 3D tilt owl with glow effects
│       │   ├── Onboarding.tsx      # 7 aha moments journey
│       │   └── Conversation.tsx    # Main chat interface
│       └── lib/
│           └── api.ts     # API utilities
├── server/                 # FastAPI backend
│   ├── app.py             # Main app with CORS, routing
│   ├── voice.py           # Voice API endpoints
│   ├── deepgram_client.py # STT integration
│   └── cartesia_client.py # TTS integration
└── run.py                  # Backend entry point (port 8000)
```

## Running the Application
- **Frontend**: Runs on port 5000 via `cd web && npm run dev`
- **Backend API**: Runs on port 8000 via `python run.py`

## The Magical Experience

### Opening Animation (MagicalIntro)
1. Dark starry night sky appears with twinkling stars
2. Aurora borealis waves gently shimmer
3. Magical owl flies in from above with wings animated
4. Owl lands, pauses, and gazes at you with glowing golden-violet eyes
5. "Eight Owls - Meet Your Mirror" text fades in
6. "Begin" button appears with magical gradient

### 7 Aha Moments (Onboarding)
1. **Aha 1 - Intro**: "Hello. I'm going to become your mirror."
2. **Aha 2 - Listening**: "Tell me about yourself" with microphone ready
3. **Aha 3 - Recording**: Owl listens with animated eyes responding to voice
4. **Aha 4 - Heard**: "I heard you. Your voice, your story, your essence."
5. **Aha 5 - Naming**: "What shall I be called?" - name your owl
6. **Aha 6 - Avatar**: "How shall I appear?" - choose owl appearance
7. **Aha 7 - Awakening**: Owl awakens with your voice and personalized greeting

## Key Features
1. **Divine Intro**: Canvas-based heavenly light with realistic owl and expanding rings
2. **7 Aha Moments**: Progressive onboarding with moments of delight
3. **Voice Cloning**: Your owl learns to speak like you
4. **Aurora Visualizer**: 8-layer chromatic oil-pattern waves, holographic shifts
5. **6 Photorealistic Owls**: Great horned, snowy, barn, spotted, grey, long-eared
6. **Interactive Owl**: 3D tilt on hover, glowing pulse during listening/speaking
7. **Video Background**: Support for video backgrounds with divine gradient fallback
8. **Divine Particles**: Ascending light particles for heavenly atmosphere
9. **Conversation Interface**: Real-time voice chat with transcript

## Brand Colors (Dark Mystical Theme)
- Background: #0a0515 (Deep space)
- Surface: #1a1235 (Dark violet)
- Accent 1: #8F6CF3 (Cold Violet)
- Accent 2: #64B7F3 (Azure)
- Accent 3: #5DF1B3 (Turquoise)
- Accent 4: #E3F98A (Mindaro/Gold glow)
- Accent 5: #F361D3 (Pink)

## API Endpoints
- `POST /api/voice/onboard` - Process voice sample, create profile, clone voice
- `POST /api/voice/converse` - Transcribe speech, generate AI response, TTS audio
- `POST /api/voice/transcribe` - Speech-to-text only
- `POST /api/voice/speak` - Text-to-speech with cloned voice
- `GET /health` - Health check

## Environment Variables
- `DEEPGRAM_API_KEY` - For speech-to-text
- `CARTESIA_API_KEY` - For TTS and voice cloning
- `ANTHROPIC_API_KEY` - For AI processing (optional)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Recent Changes
- January 2026: Divine aesthetic evolution
  - Evolved from mystical/magical to divine/angelic "entering Heaven" aesthetic
  - Created 6 photorealistic owl portraits with divine lighting
  - Built RealisticOwl.tsx with interactive 3D tilt effect and glow states
  - Added VideoBackground.tsx for video support with DivineParticles overlay
  - Updated MagicalIntro with divine light rings and realistic owl
  - Upgraded AuroraVisualizer to Apple/Siri quality chromatic waves
  - Integrated RealisticOwlPicker for avatar selection

## The Vibe
- **Divine** - Like entering Heaven, oneness with God
- **Angelic** - Pure, peaceful, transcendent
- **Ethereal** - Light, floating, breathes
- **Peaceful Psychedelic** - Expansive without overwhelm
- **Ancient Future** - Timeless mystical design
- **Pure Light** - Heavenly glow from first moment
