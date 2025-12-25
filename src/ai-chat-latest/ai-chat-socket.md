# AI Chat Latest Module

A fully modular Socket.IO-based real-time AI chat module for the Smart Edu Backend.

## Overview

This module provides real-time AI chat functionality using Socket.IO, replacing the HTTP polling mechanism used in the original `ai-chat` module. It's designed to be fully modular and can be integrated independently.

## Features

- ✅ Real-time bidirectional communication via Socket.IO
- ✅ JWT authentication for socket connections
- ✅ Event-based message handling
- ✅ Typing indicators
- ✅ Conversation management
- ✅ Chat history retrieval
- ✅ Reuses existing chat service logic

## Module Structure

```
ai-chat-latest/
├── ai-chat-latest.module.ts      # Module definition
├── ai-chat-latest.gateway.ts     # Socket.IO gateway
├── guards/
│   └── socket-jwt.guard.ts      # JWT authentication guard
├── services/
│   └── ai-chat-socket.service.ts # Socket service wrapper
├── dto/
│   └── socket-events.dto.ts     # DTOs for socket events
├── index.ts                      # Module exports
└── README.md                     # This file
```

## Socket Events

### Client → Server Events

#### `message:send`
Send a message to the AI.

**Payload:**
```typescript
{
  message: string;
  materialId?: string;      // Optional: for document-specific chat
  conversationId?: string;  // Optional: to continue existing conversation
}
```

**Response Events:**
- `message:typing` - AI typing indicator
- `message:user` - Echo of user message
- `message:assistant` - AI response
- `message:error` - Error occurred

#### `conversation:create`
Create a new conversation.

**Payload:**
```typescript
{
  title?: string;
  materialId?: string;
}
```

**Response Event:** `conversation:created`

#### `conversation:history`
Get chat history for a conversation.

**Payload:**
```typescript
{
  conversationId: string;
  limit?: number;  // Default: 50
  offset?: number; // Default: 0
}
```

**Response Event:** `conversation:history`

#### `conversations:get`
Get all user conversations.

**Payload:** None

**Response Event:** `conversations:list`

### Server → Client Events

#### `connection:success`
Emitted when client successfully connects.

#### `connection:error`
Emitted when connection fails.

#### `message:typing`
Typing indicator from AI.

```typescript
{
  success: true;
  message: string;
  data: { isTyping: boolean };
  event: 'message:typing';
}
```

#### `message:user`
Echo of user's message.

#### `message:assistant`
AI's response message.

#### `conversation:title-updated`
Emitted when conversation title is auto-generated.

#### `conversation:created`
Emitted when a new conversation is created.

#### `conversation:history`
Chat history response.

#### `conversations:list`
List of user's conversations.

#### Error Events
All error events follow this format:
```typescript
{
  success: false;
  message: string;
  error?: string;
  event: string;
}
```

## Client Integration

### Connection

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000/ai-chat-latest', {
  auth: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});
```

### Authentication

The module uses JWT authentication. Provide the token in one of these ways:

1. **Via handshake auth (recommended):**
```typescript
const socket = io('http://localhost:3000/ai-chat-latest', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

2. **Via Authorization header:**
```typescript
const socket = io('http://localhost:3000/ai-chat-latest', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token'
  }
});
```

### Example Usage

```typescript
// Connect
socket.on('connect', () => {
  console.log('Connected to AI Chat Latest');
});

// Listen for connection success
socket.on('connection:success', (data) => {
  console.log('Connection successful:', data);
});

// Listen for conversations list (sent on connect)
socket.on('conversations:list', (data) => {
  console.log('Your conversations:', data.data);
});

// Send a message
socket.emit('message:send', {
  message: 'What is the main topic of this document?',
  materialId: 'optional-material-id',
  conversationId: 'optional-conversation-id'
});

// Listen for AI response
socket.on('message:assistant', (data) => {
  console.log('AI Response:', data.data.content);
});

// Listen for typing indicator
socket.on('message:typing', (data) => {
  if (data.data.isTyping) {
    console.log('AI is typing...');
  }
});

// Create a conversation
socket.emit('conversation:create', {
  title: 'My New Chat',
  materialId: 'optional-material-id'
});

// Get chat history
socket.emit('conversation:history', {
  conversationId: 'conversation-id',
  limit: 50,
  offset: 0
});

// Handle errors
socket.on('message:error', (error) => {
  console.error('Error:', error.message);
});
```

## Dependencies

This module depends on:
- `@nestjs/websockets` - NestJS WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter
- `socket.io` - Socket.IO library
- `@nestjs/jwt` - JWT handling
- Existing `AiChatModule` - Reuses chat service logic

## Configuration

The module uses the same JWT configuration as the rest of the application:
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time (default: 7d)

## Notes

- The module reuses the existing `ChatService` from the `ai-chat` module, ensuring consistency
- All database operations are handled in services (not in the gateway)
- The module is fully modular and can be used independently
- Socket connections are authenticated using JWT tokens
- Users are automatically joined to user-specific rooms for targeted messaging

## Error Handling

All errors are emitted as events with the format:
```typescript
{
  success: false;
  message: string;
  error?: string;
  event: string;
}
```

Common error events:
- `connection:error` - Connection failed
- `message:error` - Message processing failed
- `conversation:error` - Conversation operation failed
- `conversations:error` - Failed to get conversations

