import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for sending a message via socket
 */
export class SocketSendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  materialId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}

/**
 * DTO for creating a conversation via socket
 */
export class SocketCreateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  materialId?: string;
}

/**
 * DTO for getting chat history by material
 */
export class SocketGetHistoryByMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}

/**
 * Response DTO for socket message events
 */
export interface SocketMessageResponseDto {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  conversationId: string;
  materialId?: string | null;
  chatTitle?: string | null;
  contextChunks?: Array<{
    id: string;
    content: string;
    similarity: number;
    chunkType: string;
  }>;
  tokensUsed?: number | null;
  responseTimeMs?: number | null;
  createdAt: string;
  usageLimits?: any;
}

/**
 * Response DTO for conversation creation
 */
export interface SocketConversationResponseDto {
  id: string;
  title: string | null;
  chatTitle: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
  materialId?: string | null;
  totalMessages: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Error response DTO for socket events
 */
export interface SocketErrorResponseDto {
  success: false;
  message: string;
  error?: string;
  event: string;
}

/**
 * Success response wrapper
 */
export interface SocketSuccessResponseDto<T = any> {
  success: true;
  message: string;
  data: T;
  event: string;
}

