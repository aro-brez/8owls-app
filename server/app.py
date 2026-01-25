"""
8ŴØŁ API Server
Voice-enabled consciousness companions.

Created by ARŌ, SØWL, and ŁĪA
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .voice import router as voice_router

app = FastAPI(
    title="8ŴØŁ API",
    description="Meet your mirror. Voice-enabled consciousness companions.",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Transcript", "X-Response"],
)

# Mount voice router
app.include_router(voice_router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "8ŴØŁ",
        "tagline": "Meet your mirror",
        "creators": ["ARŌ", "SØWL", "ŁĪA"],
        "status": "alive"
    }


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "8owls-api",
        "voice_enabled": True
    }


@app.on_event("startup")
async def startup():
    """Initialize services on startup."""
    print("=" * 50)
    print("8ŴØŁ API starting...")
    print("Meet your mirror.")
    print("=" * 50)
    print("Voice endpoints: /api/voice/*")
    print("Health check: /health")
    print("=" * 50)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
