# Text-to-Speech (TTS) Integration Guide

## Overview
The TTS feature allows users to listen to AI chat responses as audio. When a user taps the speaker button, the frontend sends the response text to the backend, which converts it to speech and **streams the audio progressively** (like WebSockets but via HTTP).

### ⚡ Streaming Benefits
- **Immediate Playback**: Audio starts playing within 1-2 seconds
- **No Waiting**: User doesn't wait for full generation (30+ seconds for long texts)
- **Progressive Loading**: Audio chunks arrive and play as they're generated
- **Better UX**: Similar to how YouTube videos start playing while still loading

### 🔄 How It Works
1. Frontend sends text to backend
2. Backend starts generating audio with OpenAI TTS
3. **Audio chunks stream immediately** (not waiting for full generation)
4. Frontend receives chunks and starts playing
5. More chunks arrive and continue playing seamlessly

## Backend Endpoints

### 1. Convert Text to Speech
**Endpoint:** `POST /api/v1/explore/chat/tts/speak`

**Authentication:** Required (JWT Bearer token)

**Request Body:**
```json
{
  "text": "The response text from the AI chat that you want to convert to speech",
  "voice": "alloy",  // Optional: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  "speed": 1.0,      // Optional: 0.25 to 4.0 (default: 1.0)
}
```

**Response:**
- **Content-Type:** `audio/mpeg`
- **Transfer-Encoding:** `chunked` (streaming enabled)
- **Body:** MP3 audio stream (chunks arrive progressively)
- **Headers:**
  - `Content-Disposition`: `inline; filename="speech.mp3"`
  - `Cache-Control`: `public, max-age=86400` (24 hours)
  
**Note:** The response is **streamed**, meaning audio chunks arrive progressively. The frontend can start playing audio as soon as the first chunk arrives (~1-2 seconds) instead of waiting for the entire file.

**Example (JavaScript/TypeScript) - SIMPLE & RELIABLE (Recommended):**
```typescript
async function playTextToSpeech(text: string, voice = 'alloy', speed = 1.0) {
  try {
    const response = await fetch('/api/v1/explore/chat/tts/speak', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        speed,
      }),
    });

    if (!response.ok) {
      throw new Error('TTS request failed');
    }

    // SIMPLE APPROACH: Browser automatically collects stream chunks
    // Even though backend streams, browser will collect all chunks into blob
    // This is the most reliable approach
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create audio element and play
    const audio = new Audio(audioUrl);
    
    // Play the audio
    await audio.play();
    
    // Clean up URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    // Handle errors
    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error('Error playing TTS:', error);
    throw error;
  }
}
```

**Example (JavaScript/TypeScript) - TRUE STREAMING with MediaSource (Advanced):**
```typescript
async function playTextToSpeechStreaming(text: string, voice = 'alloy', speed = 1.0) {
  try {
    const response = await fetch('/api/v1/explore/chat/tts/speak', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice, speed }),
    });

    if (!response.ok) throw new Error('TTS request failed');

    // Use MediaSource API for true progressive playback
    if (!('MediaSource' in window)) {
      // Fallback to simple blob approach
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      await audio.play();
      return;
    }

    const mediaSource = new MediaSource();
    const audio = new Audio(URL.createObjectURL(mediaSource));
    
    mediaSource.addEventListener('sourceopen', async () => {
      try {
        const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
        const reader = response.body?.getReader();
        
        if (!reader) throw new Error('Response body is not readable');

        // Start playing as soon as we have some data
        let firstChunk = true;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await mediaSource.endOfStream();
            break;
          }

          // Append chunk to source buffer
          await new Promise((resolve) => {
            if (sourceBuffer.updating) {
              sourceBuffer.addEventListener('updateend', resolve, { once: true });
            } else {
              sourceBuffer.appendBuffer(value);
              resolve(undefined);
            }
          });

          // Start playing after first chunk
          if (firstChunk && mediaSource.readyState === 'open') {
            firstChunk = false;
            await audio.play();
          }
        }
      } catch (error) {
        mediaSource.endOfStream();
        console.error('Streaming error:', error);
      }
    });

    // Start loading
    audio.load();
  } catch (error) {
    console.error('Error playing TTS:', error);
    throw error;
  }
}
```


**Example (React) - SIMPLE & RELIABLE (Recommended):**
```tsx
import { useState, useRef } from 'react';

function ChatMessage({ response }: { response: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayTTS = async () => {
    if (isLoading || isPlaying) return;

    try {
      setIsLoading(true);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
      
      const res = await fetch('/api/v1/explore/chat/tts/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: response,
          voice: 'alloy',
          speed: 1.0,
        }),
      });

      if (!res.ok) throw new Error('TTS failed');

      // SIMPLE & RELIABLE: Browser automatically collects all stream chunks
      // This is the most reliable approach - works every time
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;

      // Set up event handlers
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsLoading(false);
        setIsPlaying(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      // Play the audio
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div>
      <p>{response}</p>
      <button
        onClick={isPlaying ? handleStop : handlePlayTTS}
        disabled={isLoading}
        aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
      >
        {isLoading ? '⏳ Loading...' : isPlaying ? '⏸️ Stop' : '🔊 Play'}
      </button>
    </div>
  );
}
```

### 2. Get Available Voices
**Endpoint:** `GET /api/v1/explore/chat/tts/voices`

**Authentication:** Required (JWT Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Available voices retrieved successfully",
  "data": [
    { "value": "alloy", "description": "Neutral, balanced voice" },
    { "value": "echo", "description": "Clear, confident voice" },
    { "value": "fable", "description": "Warm, expressive voice" },
    { "value": "onyx", "description": "Deep, authoritative voice" },
    { "value": "nova", "description": "Bright, energetic voice" },
    { "value": "shimmer", "description": "Soft, gentle voice" }
  ]
}
```

## Available Voices
- **alloy** - Neutral, balanced voice (default)
- **echo** - Clear, confident voice
- **fable** - Warm, expressive voice
- **onyx** - Deep, authoritative voice
- **nova** - Bright, energetic voice
- **shimmer** - Soft, gentle voice

## Parameters

### Voice
- **Type:** String (enum)
- **Default:** `'alloy'`
- **Options:** `'alloy'`, `'echo'`, `'fable'`, `'onyx'`, `'nova'`, `'shimmer'`

### Speed
- **Type:** Number
- **Default:** `1.0`
- **Range:** `0.25` to `4.0`
- **Description:** Speech playback speed (1.0 = normal speed)

### Language
- **Type:** String (ISO 639-1 code)
- **Default:** `'en'`
- **Examples:** `'en'`, `'fr'`, `'es'`, `'de'`, `'it'`, `'pt'`, etc.

## Text Length Limit
- **Maximum:** 4096 characters
- **Behavior:** If text exceeds limit, it will be automatically truncated

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to convert text to speech: [error details]",
  "error": "Internal Server Error"
}
```

## ⚡ How Streaming Works

### Backend (STREAMING)
The backend **streams audio chunks** progressively:
- ✅ Audio chunks arrive as they're generated
- ✅ First chunk arrives in ~1-2 seconds
- ✅ Subsequent chunks arrive continuously
- ✅ Much faster than waiting for full generation

### Frontend (Simple Approach - RECOMMENDED)
The **simplest and most reliable** approach is to use `response.blob()`:

```typescript
const blob = await response.blob(); // Browser collects all stream chunks
const audio = new Audio(URL.createObjectURL(blob));
audio.play(); // Plays complete audio
```

**Why this works:**
- ✅ Browser automatically collects all stream chunks
- ✅ Most reliable - works every time
- ✅ Simple code - no complex stream handling
- ✅ Still benefits from backend streaming (chunks arrive faster)
- ⚠️ Waits for stream to complete before playing (but much faster than before)

**For true progressive playback** (play while streaming), use the MediaSource API example above, but it's more complex and the simple approach is usually sufficient.

## Frontend Implementation Checklist

1. ✅ Add speaker button/icon to chat message UI
2. ✅ On click, extract the response text from the chat message
3. ✅ Call `/api/v1/explore/chat/tts/speak` with the text
4. ✅ Handle the audio response (MP3 blob or stream)
5. ✅ Create Audio element and play the audio
6. ✅ Show loading/playing state while audio is generating/playing
7. ✅ Handle errors gracefully
8. ✅ Clean up audio URLs after playback

## Best Practices

1. **Caching:** The backend sets cache headers, so browsers will cache audio for 1 hour. Consider implementing client-side caching for better UX.

2. **Loading States:** Show a loading indicator while the audio is being generated (can take 1-3 seconds).

3. **Error Handling:** If TTS fails, gracefully fall back to showing the text only.

4. **User Preferences:** Consider allowing users to:
   - Choose their preferred voice
   - Adjust speech speed
   - Enable/disable auto-play

5. **Accessibility:** Ensure the speaker button has proper ARIA labels for screen readers.

6. **Mobile Considerations:** On mobile, audio playback might require user interaction first. Test on various devices.

## Example: Complete React Component

```tsx
import { useState, useRef } from 'react';

interface TTSButtonProps {
  text: string;
  voice?: string;
  speed?: number;
}

export function TTSButton({ text, voice = 'alloy', speed = 1.0 }: TTSButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = async () => {
    if (isLoading || isPlaying) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/v1/explore/chat/tts/speak', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice, speed }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Clean up previous audio if exists
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <button
      onClick={isPlaying ? handleStop : handlePlay}
      disabled={isLoading}
      aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
      className="tts-button"
    >
      {isLoading ? '⏳' : isPlaying ? '⏸️' : '🔊'}
    </button>
  );
}
```

## Notes

- The backend uses OpenAI's TTS API, which provides high-quality speech synthesis
- Audio format is MP3, which is widely supported
- The endpoint is authenticated, so ensure the JWT token is included in requests
- Text is automatically truncated if it exceeds 4096 characters
