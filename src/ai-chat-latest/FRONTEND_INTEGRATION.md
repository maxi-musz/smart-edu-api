# AI Chat Latest - Frontend Integration Guide

Complete guide for integrating the AI Chat Latest Socket.IO module in your frontend application.

## Quick Start

### 1. Install Dependencies

```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

### 2. Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

// Get your JWT token from your auth system
const token = localStorage.getItem('authToken'); // or however you store it

// Connect to the socket server
const socket: Socket = io('{base}/ai-chat-latest', {
  auth: {
    token: token // JWT token is required
  },
  transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### 3. Connection Event Handlers

```typescript
// Connection established
socket.on('connect', () => {
  console.log('✅ Connected to AI Chat Latest');
});

// Connection successful (includes user data)
socket.on('connection:success', (data) => {
  console.log('Connection confirmed:', data);
  // data.data contains: { userId, socketId, timestamp }
});

// Connection failed
socket.on('connection:error', (error) => {
  console.error('❌ Connection failed:', error.message);
  // Handle authentication failure
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle reconnection if needed
});
```

## Core Functionality

### Sending Messages

```typescript
// Send a message to the AI
socket.emit('message:send', {
  message: 'What is the main topic of this document?',
  materialId: 'optional-material-id',      // For document-specific chat
  conversationId: 'optional-conversation-id' // To continue existing conversation
});

// Listen for your message echo (confirmation)
socket.on('message:user', (data) => {
  console.log('Your message sent:', data.data.content);
  // Update UI with user message
  addMessageToUI({
    id: data.data.id,
    content: data.data.content,
    role: 'USER',
    timestamp: data.data.createdAt
  });
});

// Listen for AI response
socket.on('message:assistant', (data) => {
  console.log('AI Response:', data.data.content);
  // Update UI with AI response
  addMessageToUI({
    id: data.data.id,
    content: data.data.content,
    role: 'ASSISTANT',
    tokensUsed: data.data.tokensUsed,
    responseTime: data.data.responseTimeMs,
    timestamp: data.data.createdAt
  });
  
  // Update conversation title if generated
  if (data.data.chatTitle) {
    updateConversationTitle(data.data.conversationId, data.data.chatTitle);
  }
  
  // Update usage limits
  if (data.data.usageLimits) {
    updateUsageLimits(data.data.usageLimits);
  }
});

// Listen for typing indicator
socket.on('message:typing', (data) => {
  if (data.data.isTyping) {
    showTypingIndicator();
  } else {
    hideTypingIndicator();
  }
});

// Handle message errors
socket.on('message:error', (error) => {
  console.error('Message error:', error.message);
  showErrorMessage(error.message);
});
```

### Conversation Management

```typescript
// Create a new conversation
socket.emit('conversation:create', {
  title: 'My New Chat',           // Optional
  materialId: 'material-id'       // Optional: for document chat
});

socket.on('conversation:created', (data) => {
  console.log('Conversation created:', data.data);
  // data.data contains: { id, title, status, materialId, totalMessages, ... }
  // Update your conversations list
  addConversationToList(data.data);
});

// Get all conversations (also sent automatically on connect)
socket.emit('conversations:get');

socket.on('conversations:list', (data) => {
  console.log('Your conversations:', data.data);
  // data.data is an array of conversations
  // Update your conversations list UI
  updateConversationsList(data.data);
});

// Get chat history for a conversation
socket.emit('conversation:history', {
  conversationId: 'conversation-id',
  limit: 50,    // Optional, default: 50
  offset: 0     // Optional, default: 0
});

socket.on('conversation:history', (data) => {
  console.log('Chat history:', data.data);
  // data.data contains: { conversationHistory: [...], usageLimits: {...} }
  // Load messages into chat UI
  loadMessagesIntoUI(data.data.conversationHistory);
  updateUsageLimits(data.data.usageLimits);
});

// Listen for conversation title updates
socket.on('conversation:title-updated', (data) => {
  // Update conversation title in UI
  updateConversationTitle(data.data.conversationId, data.data.title);
});
```

## Complete React Example

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT';
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  lastActivity: string;
  totalMessages: number;
}

const AiChatComponent: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get token from your auth system
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3000/ai-chat-latest', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to AI Chat');
    });

    newSocket.on('connection:success', (data) => {
      console.log('Connection successful:', data);
    });

    // Receive conversations list (sent on connect)
    newSocket.on('conversations:list', (data) => {
      setConversations(data.data);
    });

    // Receive user message echo
    newSocket.on('message:user', (data) => {
      setMessages(prev => [...prev, {
        id: data.data.id,
        content: data.data.content,
        role: 'USER',
        createdAt: data.data.createdAt,
      }]);
    });

    // Receive AI response
    newSocket.on('message:assistant', (data) => {
      setMessages(prev => [...prev, {
        id: data.data.id,
        content: data.data.content,
        role: 'ASSISTANT',
        createdAt: data.data.createdAt,
      }]);
      setIsTyping(false);
      
      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(data.data.conversationId);
      }
    });

    // Typing indicator
    newSocket.on('message:typing', (data) => {
      setIsTyping(data.data.isTyping);
    });

    // Error handling
    newSocket.on('message:error', (error) => {
      console.error('Error:', error.message);
      setIsTyping(false);
      alert(`Error: ${error.message}`);
    });

    // Chat history
    newSocket.on('conversation:history', (data) => {
      setMessages(data.data.conversationHistory.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        createdAt: msg.createdAt,
      })));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !inputMessage.trim()) return;

    setIsTyping(true);
    
    socket.emit('message:send', {
      message: inputMessage,
      conversationId: currentConversationId || undefined,
    });

    setInputMessage('');
  };

  const loadConversation = (conversationId: string) => {
    if (!socket) return;
    
    setCurrentConversationId(conversationId);
    setMessages([]);
    
    socket.emit('conversation:history', {
      conversationId,
      limit: 50,
      offset: 0,
    });
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  return (
    <div className="ai-chat-container">
      {/* Sidebar with conversations */}
      <div className="conversations-sidebar">
        <button onClick={createNewConversation}>New Chat</button>
        {conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => loadConversation(conv.id)}
            className={currentConversationId === conv.id ? 'active' : ''}
          >
            <h4>{conv.title}</h4>
            <p>{conv.totalMessages} messages</p>
          </div>
        ))}
      </div>

      {/* Chat area */}
      <div className="chat-area">
        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role.toLowerCase()}`}>
              <p>{msg.content}</p>
              <span className="timestamp">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {isTyping && (
            <div className="message assistant typing">
              <p>AI is typing...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={isTyping}
          />
          <button onClick={sendMessage} disabled={isTyping || !inputMessage.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatComponent;
```

## Vue.js Example

```vue
<template>
  <div class="ai-chat">
    <div class="messages">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.role.toLowerCase()]"
      >
        <p>{{ message.content }}</p>
        <span class="timestamp">{{ formatTime(message.createdAt) }}</span>
      </div>
      <div v-if="isTyping" class="message assistant typing">
        AI is typing...
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="Type your message..."
        :disabled="isTyping"
      />
      <button @click="sendMessage" :disabled="isTyping || !inputMessage.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

const socket = ref<Socket | null>(null);
const messages = ref<any[]>([]);
const inputMessage = ref('');
const isTyping = ref(false);

onMounted(() => {
  const token = localStorage.getItem('authToken');
  
  socket.value = io('http://localhost:3000/ai-chat-latest', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.value.on('connect', () => {
    console.log('Connected');
  });

  socket.value.on('message:user', (data) => {
    messages.value.push({
      id: data.data.id,
      content: data.data.content,
      role: 'USER',
      createdAt: data.data.createdAt,
    });
  });

  socket.value.on('message:assistant', (data) => {
    messages.value.push({
      id: data.data.id,
      content: data.data.content,
      role: 'ASSISTANT',
      createdAt: data.data.createdAt,
    });
    isTyping.value = false;
  });

  socket.value.on('message:typing', (data) => {
    isTyping.value = data.data.isTyping;
  });

  socket.value.on('message:error', (error) => {
    console.error('Error:', error.message);
    isTyping.value = false;
  });
});

onUnmounted(() => {
  socket.value?.close();
});

const sendMessage = () => {
  if (!socket.value || !inputMessage.value.trim()) return;
  
  isTyping.value = true;
  socket.value.emit('message:send', {
    message: inputMessage.value,
  });
  inputMessage.value = '';
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString();
};
</script>
```

## Event Reference

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ message: string, materialId?: string, conversationId?: string }` | Send a message to AI |
| `conversation:create` | `{ title?: string, materialId?: string }` | Create new conversation |
| `conversation:history` | `{ conversationId: string, limit?: number, offset?: number }` | Get chat history |
| `conversations:get` | None | Get all conversations |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connection:success` | `{ success: true, data: { userId, socketId, timestamp } }` | Connection established |
| `connection:error` | `{ success: false, message: string, error?: string }` | Connection failed |
| `message:typing` | `{ success: true, data: { isTyping: boolean } }` | Typing indicator |
| `message:user` | `{ success: true, data: Message }` | User message echo |
| `message:assistant` | `{ success: true, data: Message }` | AI response |
| `message:error` | `{ success: false, message: string, error?: string }` | Message error |
| `conversation:created` | `{ success: true, data: Conversation }` | Conversation created |
| `conversation:title-updated` | `{ success: true, data: { conversationId, title } }` | Title updated |
| `conversation:history` | `{ success: true, data: { conversationHistory, usageLimits } }` | Chat history |
| `conversations:list` | `{ success: true, data: Conversation[] }` | Conversations list |

## Error Handling

All error events follow this structure:

```typescript
{
  success: false;
  message: string;      // Human-readable error message
  error?: string;      // Technical error details (optional)
  event: string;        // Event name that failed
}
```

**Common Errors:**
- `connection:error` - Authentication failed, invalid token, or connection issue
- `message:error` - Message processing failed (rate limit, invalid data, etc.)
- `conversation:error` - Conversation operation failed
- `conversations:error` - Failed to retrieve conversations

## Best Practices

1. **Token Management**: Always provide a valid JWT token in the connection auth
2. **Reconnection**: Socket.IO handles reconnection automatically, but you can customize it
3. **Error Handling**: Always listen for error events and show user-friendly messages
4. **Typing Indicator**: Show typing indicator when `message:typing` is true
5. **Message Ordering**: Messages are sent in order, but use timestamps for UI ordering
6. **Conversation ID**: Store the conversation ID after first message to continue conversations
7. **Cleanup**: Always close socket connection when component unmounts

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to socket
- ✅ Check if token is valid and not expired
- ✅ Verify server URL is correct
- ✅ Check CORS settings on server
- ✅ Ensure socket server is running

**Problem**: Authentication fails
- ✅ Verify JWT token format: `Bearer <token>` or just `<token>`
- ✅ Check token expiration
- ✅ Ensure token includes required fields: `sub`, `email`, `school_id`

### Message Issues

**Problem**: Messages not being received
- ✅ Check if socket is connected (`socket.connected`)
- ✅ Verify event names match exactly (case-sensitive)
- ✅ Check browser console for errors
- ✅ Ensure you're listening to the correct events

**Problem**: Typing indicator not working
- ✅ Listen for `message:typing` event
- ✅ Check `data.data.isTyping` value

## Production Configuration

```typescript
// Use environment variables for server URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

const socket = io(`${SOCKET_URL}/ai-chat-latest`, {
  auth: { token },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
});
```

## Support

For backend-specific questions, refer to the backend documentation.
For Socket.IO specific issues, check [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/).

