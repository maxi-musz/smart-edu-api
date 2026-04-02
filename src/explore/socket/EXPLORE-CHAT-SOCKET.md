# Explore Chat Socket Integration Guide

## Overview
This document provides a complete guide for integrating the Explore Chat Socket.IO functionality into your frontend application. The socket enables real-time bidirectional communication between the frontend and backend for chat functionality.

## Quick Start

1. **Install the dependency:**
   ```bash
   npm install socket.io-client
   ```

2. **Connect to the socket:**
   ```typescript
   import { io } from 'socket.io-client';
   
   const socket = io(`${API_BASE_URL}/explore-chat`, {
     transports: ['websocket', 'polling'],
     auth: { token: YOUR_JWT_TOKEN },
   });
   ```

3. **Listen for connection:**
   ```typescript
   socket.on('connection:success', (data) => {
     console.log('Connected!', data);
   });
   ```

4. **Send a message:**
   ```typescript
   socket.emit('message:send', {
     message: 'Your message here',
     materialId: 'chapter-id',  // Chapter ID (name is historical; not LibraryGeneralMaterial.id)
     userId: 'user-id',
     language: 'en',            // Optional: ISO 639-1, defaults to 'en'
     conversationId: undefined, // Omit first turn; then pass id from message:response
   });
   ```

5. **Conversation history:** Persist `conversationId` from the first successful `message:response` and send it on every follow-up for that thread. Use `conversations:list` and `conversation:messages` to build a sidebar and replay transcripts.

## Socket Configuration

### Connection Details
- **Namespace**: `/explore-chat`
- **Base URL**: Use your API base URL (e.g., `https://api.example.com` or `http://localhost:3000`)
- **Full URL**: `${API_BASE_URL}/explore-chat`
- **Authentication**: Required (JWT token)

### Events

#### Connection Events

**`connection:success`** - Emitted when client successfully connects
```typescript
{
  success: true,
  message: 'Connected to Explore Chat',
  data: {
    userId: string,
    socketId: string,
    timestamp: string
  },
  event: 'connection:success'
}
```

**`connection:error`** - Emitted when connection fails
```typescript
{
  success: false,
  message: 'Connection failed',
  error: string,
  event: 'connection:error'
}
```

#### Message Events

**`message:send`** - Send a message (client → server)
```typescript
{
  message: string,              // The message/question to send
  materialId: string,           // Chapter ID (same as elsewhere in this doc)
  userId: string,               // Must match JWT `sub`
  language?: string,            // Optional: ISO 639-1, default 'en'
  conversationId?: string      // Omit to start a new thread (title is derived via OpenAI from the first message)
}
```

**Naming:** In the request payload, `materialId` is the **chapter** id (`LibraryGeneralMaterialChapter.id`). In `message:response`, `materialId` is the **parent book** id (`LibraryGeneralMaterial.id`), and `chapterId` echoes the chapter you sent.

**`message:typing`** - Typing indicator (server → client)
```typescript
{
  success: true,
  message: string,
  data: {
    isTyping: boolean
  },
  event: 'message:typing'
}
```

**`message:response`** - AI response (server → client)
```typescript
{
  success: true,
  message: string,
  data: {
    response: string,           // Markdown formatted AI response
    userId: string,             // Same as JWT subject you send
    conversationId: string,     // Persist for follow-up messages in this thread
    conversationTitle: string | null,
    chapterId: string,          // Chapter ID (your request materialId)
    chapterTitle: string,
    materialId: string,         // Parent LibraryGeneralMaterial id
    materialTitle: string,
    language: string,
    tokensUsed: number,
    responseTimeMs: number,
    timestamp: string
  },
  event: 'message:response'
}
```

**Note:** The `response` field is always in **Markdown format**. Frontend should render it using a markdown renderer (e.g., `react-markdown`, `marked`, `markdown-it`).

**`message:error`** - Error response (server → client)
```typescript
{
  success: false,
  message: string,
  error: string,
  data?: {                     // Present for some failures after the user message was stored (e.g. AI error)
    conversationId?: string,
    conversationTitle?: string | null,
    userId?: string,
    chapterId?: string,
    chapterTitle?: string,
    materialId?: string,
    materialTitle?: string
  },
  event: 'message:error'
}
```

#### Conversation list and transcript (history)

**`conversations:list`** (client → server) — list threads for the signed-in user.

Request body:
```typescript
{
  userId: string,               // Must match JWT `sub`
  chapterId?: string,          // Filter to one chapter
  materialId?: string,         // Filter to one parent material (book)
  limit?: number,              // 1–100, default 20
  cursor?: string              // Previous response's `nextCursor` (conversation id)
}
```

**`conversations:list:response`** (server → client)
```typescript
{
  success: true,
  message: string,
  data: {
    conversations: Array<{
      id: string,
      title: string | null,
      chapterId: string | null,
      materialId: string,
      platformId: string,
      lastActivity: string,
      totalMessages: number,
      preview: string | null
    }>,
    nextCursor: string | null
  },
  event: 'conversations:list:response'
}
```

**`conversations:list:error`** — `{ success: false, message, error, event: 'conversations:list:error' }`

---

**`conversation:messages`** (client → server) — paginated message history for one thread.

Request body:
```typescript
{
  userId: string,               // Must match JWT `sub`
  conversationId: string,
  limit?: number,              // 1–200, default 50
  cursor?: string              // Last message `id` from previous page (exclusive cursor)
}
```

**`conversation:messages:response`** (server → client)
```typescript
{
  success: true,
  message: string,
  data: {
    conversationId: string,
    messages: Array<{
      id: string,
      role: 'USER' | 'ASSISTANT' | 'SYSTEM',
      content: string,
      tokensUsed: number | null,
      model: string | null,
      createdAt: string
    }>,
    nextCursor: string | null
  },
  event: 'conversation:messages:response'
}
```

**`conversation:messages:error`** — `{ success: false, message, error, event: 'conversation:messages:error' }`

## Frontend Integration

### Installation
```bash
npm install socket.io-client
```

### Basic Connection Example

```typescript
import { io, Socket } from 'socket.io-client';

// Get your API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const JWT_TOKEN = localStorage.getItem('token') || ''; // Get from your auth system

// Initialize socket connection
const socket: Socket = io(`${API_BASE_URL}/explore-chat`, {
  transports: ['websocket', 'polling'],
  auth: {
    token: JWT_TOKEN, // JWT token from authentication
  },
  // Alternative: Use headers instead of auth
  // extraHeaders: {
  //   Authorization: `Bearer ${JWT_TOKEN}`
  // }
});

// Connection success
socket.on('connection:success', (data) => {
  console.log('Connected to Explore Chat:', data);
});

// Connection error
socket.on('connection:error', (error) => {
  console.error('Connection failed:', error);
});

function sendMessage(
  message: string,
  chapterId: string,
  userId: string,
  opts?: { language?: string; conversationId?: string }
) {
  socket.emit('message:send', {
    message,
    materialId: chapterId,
    userId,
    language: opts?.language || 'en',
    ...(opts?.conversationId ? { conversationId: opts.conversationId } : {}),
  });
}

// Listen for typing indicator
socket.on('message:typing', (data) => {
  if (data.data.isTyping) {
    console.log('AI is typing...');
  } else {
    console.log('AI finished typing');
  }
});

socket.on('message:response', (data) => {
  const { conversationId, response } = data.data;
  // Store conversationId in client state for this chapter/thread
  console.log('Received response:', response, 'thread:', conversationId);
});

// Listen for errors
socket.on('message:error', (error) => {
  console.error('Message error:', error);
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from Explore Chat');
});
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useExploreChat(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    if (!token) return;

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    const newSocket = io(`${API_BASE_URL}/explore-chat`, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    newSocket.on('connection:success', () => {
      setIsConnected(true);
      console.log('Connected to Explore Chat');
    });

    newSocket.on('connection:error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('message:typing', (data) => {
      setIsTyping(data.data.isTyping);
    });

    newSocket.on('message:response', (data) => {
      setMessages((prev) => [...prev, data.data]);
      setConversationId(data.data.conversationId);
      setIsTyping(false);
    });

    newSocket.on('message:error', (error) => {
      console.error('Message error:', error);
      setIsTyping(false);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const sendMessage = (
    message: string,
    chapterId: string,
    userId: string,
    language?: string,
  ) => {
    if (socket && isConnected) {
      socket.emit('message:send', {
        message,
        materialId: chapterId,
        userId,
        language: language || 'en',
        ...(conversationId ? { conversationId } : {}),
      });
    }
  };

  return {
    socket,
    isConnected,
    messages,
    isTyping,
    sendMessage,
    conversationId,
    setConversationId,
  };
}
```

## Authentication

The socket connection requires JWT authentication. The token should be obtained from your authentication system (e.g., after user login).

### Token Requirements
The JWT token must contain:
- `sub`: User ID (required)
- `email`: User email (required)
- `exp`: Expiration timestamp (optional, validated automatically)

### Providing the Token

**Option 1: Via `auth.token` (Recommended)**
```typescript
const socket = io(`${API_BASE_URL}/explore-chat`, {
  auth: { token: YOUR_JWT_TOKEN }
});
```

**Option 2: Via Authorization Header**
```typescript
const socket = io(`${API_BASE_URL}/explore-chat`, {
  extraHeaders: {
    Authorization: `Bearer ${YOUR_JWT_TOKEN}`
  }
});
```

### Getting the Token
Typically, you'll get the token from:
- `localStorage.getItem('token')`
- Your auth context/store
- Your authentication service
- Session storage

**Example:**
```typescript
// Get token from your auth system
const token = getAuthToken(); // Your auth function
const socket = io(`${API_BASE_URL}/explore-chat`, {
  auth: { token }
});
```

## Current Implementation Status

✅ Socket connection setup  
✅ JWT authentication  
✅ AI-powered message responses (OpenAI integration)  
✅ Multi-language support (15+ languages)  
✅ Markdown formatted responses  
✅ Typing indicators  
✅ Error handling  
✅ Token usage tracking  
✅ Response time tracking  
✅ Database persistence (`LibraryGeneralMaterialChatConversation` / `LibraryGeneralMaterialChatMessage`)  
✅ Conversation threads, AI-generated titles, last 10 turns sent to the model  
✅ `conversations:list` and `conversation:messages` socket APIs  

**Client expectation:** If you omit `conversationId` on every send, the backend creates a **new** conversation each time. Persist `conversationId` from `message:response` for follow-ups.

## Language Support

The `language` parameter accepts **ISO 639-1 language codes** (2-letter codes). 

**Pre-configured Languages (with optimized prompts):**
- `en` - English (default)
- `fr` - French
- `es` - Spanish
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `zh` - Chinese
- `ar` - Arabic
- `hi` - Hindi
- `sw` - Swahili
- `yo` - Yoruba
- `ig` - Igbo
- `ha` - Hausa

**Important:** 
- Any valid **ISO 639-1 language code** will work, even if not in the list above
- If a language code isn't explicitly mapped, OpenAI will still attempt to respond in that language
- The language code is case-insensitive (e.g., `EN`, `en`, `En` all work)
- If `language` is not provided or is empty, it defaults to `'en'` (English)

**Example:**
```typescript
// Request response in French
socket.emit('message:send', {
  message: 'What is this chapter about?',
  materialId: 'chapter-123',
  userId: 'user-123',
  language: 'fr',  // Response will be in French
});
```

## Important Notes

⚠️ **User ID Validation**: The `userId` in the `message:send` payload **must match** the authenticated user's ID from the JWT token. The backend will reject messages with mismatched user IDs.

⚠️ **Chapter ID vs Material ID**: The `materialId` parameter is actually the **chapter ID**, not the material ID. Make sure you're passing the correct chapter ID.

📝 **Persistence:** Conversations are keyed by authenticated user, parent material, platform, and chapter. Messages and titles are stored in the database; list and transcript are available via socket events above.

## Troubleshooting

### Connection Issues

**Problem**: Connection fails with authentication error
- **Solution**: Verify your JWT token is valid and not expired
- **Check**: Token should have `sub` and `email` fields

**Problem**: Connection timeout
- **Solution**: Check your API base URL is correct
- **Check**: Ensure CORS is properly configured on backend

**Problem**: Socket connects but immediately disconnects
- **Solution**: Verify token is being sent correctly in `auth.token`
- **Check**: Check browser console for error messages

### Message Issues

**Problem**: Message sent but no response received
- **Solution**: Check that `userId` matches the authenticated user
- **Check**: Verify `materialId` is a valid **chapter ID** (not material ID) and that the chapter has AI enabled

**Problem**: "User ID mismatch" error
- **Solution**: Ensure the `userId` in the message payload matches the `sub` field in your JWT token

## Environment Variables

Make sure to set your API base URL in your environment variables:

```env
# .env
REACT_APP_API_URL=http://localhost:3000
# or for production
REACT_APP_API_URL=https://api.yourdomain.com
```

## TypeScript Types (Optional)

For better type safety, you can create types for the socket events:

```typescript
interface ConnectionSuccessData {
  success: true;
  message: string;
  data: {
    userId: string;
    socketId: string;
    timestamp: string;
  };
  event: 'connection:success';
}

interface MessageResponseData {
  success: true;
  message: string;
  data: {
    response: string;
    userId: string;
    conversationId: string;
    conversationTitle: string | null;
    chapterId: string;
    chapterTitle: string;
    materialId: string;
    materialTitle: string;
    language: string;
    tokensUsed: number;
    responseTimeMs: number;
    timestamp: string;
  };
  event: 'message:response';
}

// Usage
socket.on('connection:success', (data: ConnectionSuccessData) => {
  // Type-safe access
  console.log(data.data.userId);
});
```
