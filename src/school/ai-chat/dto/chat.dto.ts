import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsArray } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'The message content from the user',
    example: 'What is the main topic of this document?'
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Material ID to chat with (optional - for document-specific chat)',
    example: 'cmfh35jfh0002sbix6l9n752e'
  })
  @IsString()
  @IsOptional()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'Conversation ID to continue existing chat (optional)',
    example: 'conv_1234567890abcdef'
  })
  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class ChatMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ required: false })
  materialId?: string | null;

  @ApiProperty({ required: false })
  chatTitle?: string | null;

  @ApiProperty({ required: false })
  contextChunks?: Array<{
    id: string;
    content: string;
    similarity: number;
    chunkType: string;
  }>;

  @ApiProperty({ required: false })
  tokensUsed?: number | null;

  @ApiProperty({ required: false })
  responseTimeMs?: number | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ required: false })
  usageLimits?: any;
}

export class CreateConversationDto {
  @ApiPropertyOptional({
    description: 'Conversation title',
    example: 'Discussion about Mathematics Chapter 5'
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Material ID to chat with',
    example: 'cmfh35jfh0002sbix6l9n752e'
  })
  @IsString()
  @IsOptional()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'System prompt for the conversation',
    example: 'You are a helpful AI assistant that answers questions about educational materials.'
  })
  @IsString()
  @IsOptional()
  systemPrompt?: string;
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string | null;

  @ApiProperty()
  chatTitle: string | null;

  @ApiProperty()
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';

  @ApiProperty({ required: false })
  materialId?: string | null;

  @ApiProperty()
  totalMessages: number;

  @ApiProperty()
  lastActivity: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class GetChatHistoryDto {
  @ApiPropertyOptional({
    description: 'Number of messages to retrieve',
    example: 50,
    default: 50
  })
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    default: 0
  })
  @IsOptional()
  offset?: number = 0;
}

export class ChatHistoryResponseDto {
  @ApiProperty()
  conversationHistory: ChatMessageResponseDto[];

  @ApiProperty()
  usageLimits: any;
}
