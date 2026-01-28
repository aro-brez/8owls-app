/**
 * 8ŴØŁ API Client
 * Connects the frontend to the Python backend
 *
 * Uses relative URLs because Next.js proxies /api/* to localhost:8000
 * See next.config.ts rewrites
 */

// No API_BASE needed - use relative URLs for proxy

export interface ConverseResult {
  transcript: string;
  response: string;
  audio: Blob;
}

export interface OnboardResult {
  userId: string;
  voiceId: string;
  owlName: string;
  transcript: string;
  welcomeMessage: string;
}

/**
 * Full conversation: send audio, get response audio back
 */
export async function converse(audioBlob: Blob, userId: string): Promise<ConverseResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('user_id', userId);

  const response = await fetch(`/api/voice/converse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  // Get transcript and response text from headers
  const transcript = response.headers.get('X-Transcript') || '';
  const responseText = response.headers.get('X-Response') || '';

  // Get audio blob from body
  const audioData = await response.blob();

  return {
    transcript: decodeURIComponent(transcript),
    response: decodeURIComponent(responseText),
    audio: audioData,
  };
}

/**
 * Transcribe audio to text only
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`/api/voice/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription error: ${response.status}`);
  }

  const data = await response.json();
  return data.transcript || '';
}

/**
 * Speak text (TTS)
 */
export async function speak(text: string, userId: string): Promise<Blob> {
  const response = await fetch(`/api/voice/speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`TTS error: ${response.status}`);
  }

  return response.blob();
}

/**
 * Onboard a new user with voice cloning
 */
export async function onboard(
  audioBlob: Blob,
  userId: string,
  owlName: string,
  owlAvatar: string = 'default',
  userName: string = '',
  userRole: string = ''
): Promise<OnboardResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('user_id', userId);
  formData.append('owl_name', owlName);
  formData.append('owl_avatar', owlAvatar);
  formData.append('user_name', userName);
  formData.append('user_role', userRole);

  const response = await fetch(`/api/voice/onboard`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Onboard error: ${response.status}`);
  }

  return response.json();
}

/**
 * Play audio blob through speakers
 */
export async function playAudio(audioBlob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    audio.play().catch(reject);
  });
}

/**
 * Get user profile
 */
export async function getProfile(userId: string) {
  const response = await fetch(`/api/voice/profile/${userId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Profile error: ${response.status}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`/health`);
    return response.ok;
  } catch {
    return false;
  }
}
