# Smart Edu Hub — Chat with PDF Setup Guide

This guide shows how to implement **chat-with-PDF with memory** in your NestJS + React Native project, using Cursor AI for code integration.

---

## 🛠️ Step 1: Database Schema

Add a `chat_messages` table.

### Prisma Example:
```prisma
model ChatMessage {
  id         String   @id @default(uuid())
  userId     String
  materialId String
  role       String   // 'user' or 'assistant'
  content    String
  createdAt  DateTime @default(now())

  @@index([userId, materialId])
}
```

Run migration:
```
npx prisma migrate dev --name add_chat_messages
```

---

## 🛠️ Step 2: DTOs

`chat/dto/chat-message.dto.ts`:

```ts
import { IsString } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  userId: string;

  @IsString()
  materialId: string;

  @IsString()
  message: string;
}
```

---

## 🛠️ Step 3: Chat Service

`chat/chat.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(userId: string, materialId: string, role: 'user' | 'assistant', content: string) {
    return this.prisma.chatMessage.create({
      data: { userId, materialId, role, content },
    });
  }

  async getRecentHistory(userId: string, materialId: string, limit = 5) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { userId, materialId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map(m => ({ role: m.role, content: m.content }));
  }
}
```

---

## 🛠️ Step 4: Chat Controller

`chat/chat.controller.ts`:

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { LlmService } from '../llm/llm.service';
import { EmbeddingService } from '../llm/embedding.service';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private llmService: LlmService,
    private embeddingService: EmbeddingService
  ) {}

  @Post('message')
  async handleMessage(@Body() dto: ChatMessageDto) {
    const { userId, materialId, message } = dto;

    await this.chatService.saveMessage(userId, materialId, 'user', message);
    const history = await this.chatService.getRecentHistory(userId, materialId, 5);

    const embedding = await this.embeddingService.createEmbedding(message);
    const contextChunks = await this.embeddingService.searchInMaterial(materialId, embedding);

    const messages = [
      { role: 'system', content: 'You are a helpful tutor for this material.' },
      ...history,
      { role: 'user', content: message },
      { role: 'system', content: `Context:\n${contextChunks.join('\n')}` },
    ];

    const answer = await this.llmService.ask(messages);
    await this.chatService.saveMessage(userId, materialId, 'assistant', answer);

    return { answer };
  }
}
```

---

## 🛠️ Step 5: LLM & Embedding Services

`llm/llm.service.ts`:

```ts
import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LlmService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async ask(messages: { role: string; content: string }[]) {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
    });

    return response.choices[0].message.content;
  }
}
```

`llm/embedding.service.ts`:

```ts
import OpenAI from 'openai';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async createEmbedding(text: string) {
    const embedding = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return embedding.data[0].embedding;
  }

  async searchInMaterial(materialId: string, queryEmbedding: number[]) {
    // Placeholder for pgvector / Pinecone / Weaviate integration
    return ["Relevant chunk 1", "Relevant chunk 2"];
  }
}
```

---

## 🛠️ Step 6: React Native Integration

```tsx
const sendMessage = async () => {
  const response = await fetch(`${API_URL}/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      materialId,
      message: inputText,
    }),
  });

  const data = await response.json();
  setMessages([...messages, { role: 'assistant', content: data.answer }]);
};
```

---

✅ With this setup:
- First question → stored + answered with material context.  
- Follow-up → history ensures continuity.  

---

## 💰 Cheapest LLM API Option

- **OpenAI `gpt-4o-mini`** → Best balance of price and capability.  
  - Input: $0.0006 per 1K tokens  
  - Output: $0.0024 per 1K tokens  
- **Anthropic Claude Haiku** → Also very cheap, but not as widely supported in Node/NestJS SDKs.  
- **DeepSeek / Groq-backed models** → Extremely cheap (fractions of a cent) but less integrated.  

👉 If you want lowest cost with strong ecosystem: **OpenAI gpt-4o-mini** is the winner right now.

