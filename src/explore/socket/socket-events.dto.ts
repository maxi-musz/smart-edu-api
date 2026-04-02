import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for sending a message via socket in explore chat
 */
export class ExploreChatSendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  materialId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsOptional()
  language?: string;
}

export class ExploreChatListConversationsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  chapterId?: string;

  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class ExploreChatConversationMessagesDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

/**
 * Response DTO for socket message events
 */
export interface ExploreChatMessageResponseDto {
  success: boolean;
  message: string;
  data: {
    response: string;
    userId: string;
    conversationId?: string;
    conversationTitle?: string | null;
    chapterId: string;
    chapterTitle: string;
    materialId: string;
    materialTitle: string;
    language?: string;
    tokensUsed?: number;
    responseTimeMs?: number;
    timestamp: string;
  };
  event: string;
}

/**
 * Error response DTO for socket events
 */
export interface ExploreChatErrorResponseDto {
  success: false;
  message: string;
  error?: string;
  /** Present when e.g. OpenAI failed but the conversation and user message were persisted */
  data?: Record<string, unknown>;
  event: string;
}

/**
 * Success response wrapper
 */
export interface ExploreChatSuccessResponseDto<T = any> {
  success: true;
  message: string;
  data: T;
  event: string;
}
