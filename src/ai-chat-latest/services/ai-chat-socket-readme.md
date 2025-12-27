# AI Chat Socket Service Documentation

## Overview

The `AiChatSocketService` handles all AI chat operations via Socket.IO, providing real-time communication for AI chat functionality. This service implements direct database queries for optimal performance and independence from the school module.

## Service Methods

### `getUserConversations(user: User)`

Retrieves all conversations for a user, ordered by last activity (most recent first).

#### Implementation Details

- **Database Query**: Directly queries the `chatConversation` table using Prisma
- **Filtering**: Filters conversations by `user_id`
- **Ordering**: Orders by `last_activity` in descending order (newest first)
- **Limit**: Returns up to 50 most recent conversations
- **Error Handling**: Wraps errors with descriptive messages

#### Parameters

```typescript
user: User  // User object with id or sub property
```

#### Returns

```typescript
Promise<SocketConversationResponseDto[]>
```

#### Response Format

Each conversation object contains:

```typescript
{
  id: string;                    // Conversation ID
  title: string | null;          // Conversation title
  chatTitle: string | null;      // Alias for title (for clarity)
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
  materialId: string | null;     // Associated material/document ID
  totalMessages: number;         // Total number of messages in conversation
  lastActivity: string;          // ISO string of last activity timestamp
  createdAt: string;             // ISO string of creation timestamp
  updatedAt: string;             // ISO string of last update timestamp
}
```

#### Example Usage

```typescript
// In the gateway handler
const userObj = this.getUserWithSchoolId(client);
const conversations = await this.aiChatSocketService.getUserConversations(userObj);

// Emit to client
client.emit('conversations:list', {
  success: true,
  message: 'Conversations retrieved',
  data: conversations,
  event: 'conversations:list',
});
```

#### Error Handling

If an error occurs:
- Logs error with red color formatting
- Throws `Error` with message: `Failed to get conversations: {error.message}`

#### Database Query

```typescript
const conversations = await this.prisma.chatConversation.findMany({
  where: {
    user_id: userId,
  },
  orderBy: { last_activity: 'desc' },
  take: 50,
});
```

### `getChatHistory(user: User, conversationId: string, limit?: number, offset?: number)`

Retrieves chat history for a specific conversation, including usage limits.

#### Implementation Details

- **Database Query**: Directly queries the `chatMessage` table using Prisma
- **Filtering**: Filters messages by `conversation_id` and `user_id`
- **Ordering**: Orders by `createdAt` in descending order (newest first)
- **Pagination**: Supports `limit` and `offset` parameters
- **Usage Limits**: Fetches and merges subscription plan limits with user defaults
- **Error Handling**: Wraps errors with descriptive messages

#### Parameters

```typescript
user: User              // User object with id or sub property
conversationId: string // Conversation ID to retrieve history for
limit?: number         // Number of messages to retrieve (default: 50)
offset?: number        // Number of messages to skip (default: 0)
```

#### Returns

```typescript
Promise<{
  conversationHistory: Array<{
    id: string;
    content: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    conversationId: string;
    materialId: string | null;
    tokensUsed: number | null;
    responseTimeMs: number | null;
    createdAt: string;
  }>;
  usageLimits: {
    filesUploadedThisMonth: number;
    totalFilesUploadedAllTime: number;
    totalStorageUsedMB: number;
    maxFilesPerMonth: number;
    maxFileSizeMB: number;
    maxStorageMB: number;
    tokensUsedThisWeek: number;
    tokensUsedThisDay: number;
    tokensUsedAllTime: number;
    maxTokensPerWeek: number;
    maxTokensPerDay: number;
    maxDocumentUploadsPerDay: number;
    lastFileResetDate: string;
    lastTokenResetDate: string;
  };
}>
```

#### Response Format

**Conversation History Array**: Each message object contains:
- `id`: Message ID
- `content`: Message content
- `role`: Message role (USER, ASSISTANT, or SYSTEM)
- `conversationId`: Associated conversation ID
- `materialId`: Associated material/document ID (if any)
- `tokensUsed`: Number of tokens used for this message
- `responseTimeMs`: Response time in milliseconds (for AI messages)
- `createdAt`: ISO string of creation timestamp

**Usage Limits Object**: Contains current usage and limits for:
- File uploads (monthly, all-time, storage)
- Token usage (weekly, daily, all-time)
- Document upload limits (role-based)
- Reset dates for counters

#### Example Usage

```typescript
// In the gateway handler
const userObj = this.getUserWithSchoolId(client);
const history = await this.aiChatSocketService.getChatHistory(
  userObj,
  conversationId,
  50,  // limit
  0    // offset
);

// Emit to client
client.emit('conversation:history', {
  success: true,
  message: 'Chat history retrieved',
  data: history,
  event: 'conversation:history',
});
```

#### Error Handling

If an error occurs:
- Logs error with red color formatting
- Throws `Error` with message: `Failed to get chat history: {error.message}`

#### Database Query

```typescript
const messages = await this.prisma.chatMessage.findMany({
  where: {
    conversation_id: conversationId,
    user_id: userId,
  },
  orderBy: { createdAt: 'desc' },
  take: parsedLimit,
  skip: parsedOffset,
});
```

#### Usage Limits Implementation

The method includes a private `getUserUsageLimits` helper that:
1. Fetches user data from the database
2. Retrieves subscription plan if `schoolId` exists
3. Merges plan limits with user model defaults
4. Determines role-based document upload limits
5. Returns comprehensive usage limits object

## Socket Endpoints

### `conversation:history`

**Event Name**: `conversation:history`

**Direction**: Client → Server

**Payload**:
```typescript
{
  conversationId: string;  // Required: Conversation ID
  limit?: number;         // Optional: Number of messages (default: 50)
  offset?: number;        // Optional: Pagination offset (default: 0)
}
```

**Description**: Requests chat history for a specific conversation.

#### Client Usage

```typescript
// Emit the event
socket.emit('conversation:history', {
  conversationId: 'conv_1234567890abcdef',
  limit: 50,
  offset: 0
});

// Listen for response
socket.on('conversation:history', (data) => {
  console.log('Chat history:', data.data.conversationHistory);
  console.log('Usage limits:', data.data.usageLimits);
  // data.data contains: { conversationHistory: [...], usageLimits: {...} }
});
```

#### Server Response

**Event Name**: `conversation:history`

**Success Response**:
```typescript
{
  success: true,
  message: 'Chat history retrieved',
  data: {
    conversationHistory: Array<Message>,
    usageLimits: UsageLimits
  },
  event: 'conversation:history'
}
```

**Error Response**:
```typescript
{
  success: false,
  message: 'Failed to get chat history',
  error: string,  // Error message
  event: 'conversation:error'
}
```

#### Gateway Handler

Located in `ai-chat-latest.gateway.ts`:

```typescript
@SubscribeMessage('conversation:history')
async handleGetChatHistory(
  @MessageBody() data: { conversationId: string; limit?: number; offset?: number },
  @ConnectedSocket() client: Socket,
) {
  try {
    const userObj = await this.getUserWithSchoolId(client);
    const history = await this.aiChatSocketService.getChatHistory(
      userObj,
      data.conversationId,
      data.limit || 50,
      data.offset || 0,
    );

    client.emit('conversation:history', {
      success: true,
      message: 'Chat history retrieved',
      data: history,
      event: 'conversation:history',
    } as SocketSuccessResponseDto);
  } catch (error) {
    this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
    client.emit('conversation:error', {
      success: false,
      message: 'Failed to get chat history',
      error: error.message,
      event: 'conversation:error',
    } as SocketErrorResponseDto);
  }
}
```

### `conversations:get`

**Event Name**: `conversations:get`

**Direction**: Client → Server

**Payload**: None (no parameters required)

**Description**: Requests all conversations for the authenticated user.

#### Client Usage

```typescript
// Emit the event
socket.emit('conversations:get');

// Listen for response
socket.on('conversations:list', (data) => {
  console.log('Conversations:', data.data);
  // data.data is an array of SocketConversationResponseDto[]
});
```

#### Server Response

**Event Name**: `conversations:list`

**Success Response**:
```typescript
{
  success: true,
  message: 'Conversations retrieved',
  data: SocketConversationResponseDto[],
  event: 'conversations:list'
}
```

**Error Response**:
```typescript
{
  success: false,
  message: 'Failed to get conversations',
  error: string,  // Error message
  event: 'conversations:error'
}
```

#### Automatic on Connect

The conversations list is automatically sent when a client connects (if `schoolId` is available). This allows the frontend to immediately display the user's conversations without needing to make a separate request.

#### Gateway Handler

Located in `ai-chat-latest.gateway.ts`:

```typescript
@SubscribeMessage('conversations:get')
async handleGetConversations(@ConnectedSocket() client: Socket) {
  try {
    const userObj = await this.getUserWithSchoolId(client);
    const conversations = await this.aiChatSocketService.getUserConversations(userObj);

    client.emit('conversations:list', {
      success: true,
      message: 'Conversations retrieved',
      data: conversations,
      event: 'conversations:list',
    } as SocketSuccessResponseDto);
  } catch (error) {
    this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
    client.emit('conversations:error', {
      success: false,
      message: 'Failed to get conversations',
      error: error.message,
      event: 'conversations:error',
    } as SocketErrorResponseDto);
  }
}
```

## Differences from School Module

This implementation differs from the school module's chat service methods:

### `getUserConversations`
1. **Direct Implementation**: Implements the logic directly instead of calling `chatService.getUserConversations()`
2. **Independence**: Does not depend on the school module's chat service
3. **Simplified**: Uses direct Prisma queries for better performance
4. **User ID Extraction**: Extracts `userId` from `user.id` or `user.sub` directly

### `getChatHistory`
1. **Standalone Implementation**: Implements the logic directly instead of calling `chatService.getChatHistory()`
2. **Direct Database Access**: Uses Prisma to query `chatMessage` table directly
3. **Usage Limits**: Includes private `getUserUsageLimits` method that merges subscription plan limits with user defaults
4. **No Dependencies**: Completely independent from the school module's chat service

## Related Methods

- `sendMessage()` - Send a message to AI (still uses school chat service)
- `createConversation()` - Create a new conversation (still uses school chat service)
- `getUserConversations()` - Get all conversations for a user (standalone)
- `getChatHistory()` - Get chat history for a conversation (standalone)

## Notes

- `getUserConversations` returns up to 50 most recent conversations
- Conversations are ordered by `last_activity` in descending order
- `getChatHistory` supports pagination via `limit` and `offset` parameters
- Messages in chat history are ordered by `createdAt` in descending order (newest first)
- All timestamps are returned as ISO strings
- Both methods handle both regular users and library users (via gateway's `getUserWithSchoolId`)
- Usage limits include subscription plan overrides when available

