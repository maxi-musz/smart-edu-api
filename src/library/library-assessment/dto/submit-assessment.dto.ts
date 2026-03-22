import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LibraryAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  questionType?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptions?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class SubmitLibraryAssessmentDto {
  @ApiProperty({ type: [LibraryAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LibraryAnswerDto)
  answers: LibraryAnswerDto[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  submissionTime?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  timeTaken?: number;
}
