import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCBTQuizDto } from './create-cbt-quiz.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export class UpdateCBTQuizDto extends PartialType(CreateCBTQuizDto) {
  @ApiPropertyOptional({
    description: 'Status of the quiz',
    enum: QuizStatus,
    example: QuizStatus.PUBLISHED
  })
  @IsEnum(QuizStatus)
  @IsOptional()
  status?: QuizStatus;
}
