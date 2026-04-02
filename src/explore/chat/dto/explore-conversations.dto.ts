import { IsString, IsOptional, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ExploreListConversationsDto {
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

export class ExploreConversationMessagesDto {
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
