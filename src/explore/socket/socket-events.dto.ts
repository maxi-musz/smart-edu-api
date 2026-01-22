import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  language?: string;
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
    materialId: string;
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
