import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsEnum, 
  Min, 
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, DifficultyLevel } from './create-cbt-question.dto';

/**
 * DTO for updating an option in a multiple choice question
 */
export class UpdateLibraryCBTOptionDto {
  @ApiPropertyOptional({
    description: 'Option ID (required for updates, omit for new options)',
    example: 'cmjb9opt123'
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Option text',
    example: 'Paris'
  })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiPropertyOptional({
    description: 'Order/position of the option',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiPropertyOptional({
    description: 'Whether this option is correct',
    example: true
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({
    description: 'Image URL for the option',
    example: 'https://s3.amazonaws.com/bucket/option-image.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the option',
    example: 'https://s3.amazonaws.com/bucket/option-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;
}

/**
 * DTO for updating correct answers for a question
 */
export class UpdateLibraryCBTCorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'Answer ID (required for updates, omit for new answers)',
    example: 'cmjb9ans123'
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Correct text answer (for text-based questions)',
    example: 'Photosynthesis is the process by which plants convert sunlight into energy.'
  })
  @IsString()
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional({
    description: 'Correct numeric answer (for numeric questions)',
    example: 42.5
  })
  @IsNumber()
  @IsOptional()
  answerNumber?: number;

  @ApiPropertyOptional({
    description: 'Correct date answer (for date questions)',
    example: '1945-05-08T00:00:00Z'
  })
  @IsString()
  @IsOptional()
  answerDate?: string;

  @ApiPropertyOptional({
    description: 'Array of correct option IDs (for multiple choice questions)',
    example: ['option_1', 'option_3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionIds?: string[];

  @ApiPropertyOptional({
    description: 'Complex answer data in JSON format (for matching, ordering, etc.)',
    example: { pairs: [['A', '1'], ['B', '2']] }
  })
  @IsOptional()
  answerJson?: any;
}

/**
 * DTO for updating an existing question in a Library CBT Assessment
 * All fields are optional - only provide fields you want to update
 */
export class UpdateLibraryCBTQuestionDto {
  @ApiPropertyOptional({
    description: 'Question text/prompt',
    example: 'What is the capital of France?'
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  questionText?: string;

  @ApiPropertyOptional({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE_SINGLE
  })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiPropertyOptional({
    description: 'Order/position of the question in the CBT',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for correct answer',
    example: 2.0,
    minimum: 0.1
  })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether this question is required (must be answered)',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Time limit for this specific question in seconds',
    example: 60,
    minimum: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(10)
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Image URL for the question',
    example: 'https://s3.amazonaws.com/bucket/question-image.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the question',
    example: 'https://s3.amazonaws.com/bucket/question-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL for the question',
    example: 'https://s3.amazonaws.com/bucket/question-video.mp4'
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether to allow multiple attempts for this question',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  allowMultipleAttempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show hint for this question',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  showHint?: boolean;

  @ApiPropertyOptional({
    description: 'Hint text to help users answer the question',
    example: 'Think about European capitals'
  })
  @IsString()
  @IsOptional()
  hintText?: string;

  @ApiPropertyOptional({
    description: 'Minimum length for text answers (in characters)',
    example: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minLength?: number;

  @ApiPropertyOptional({
    description: 'Maximum length for text answers (in characters)',
    example: 500,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({
    description: 'Minimum value for numeric answers',
    example: 0
  })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum value for numeric answers',
    example: 100
  })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiPropertyOptional({
    description: 'Explanation for the correct answer',
    example: 'Paris is the capital and largest city of France.'
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Options for multiple choice questions (completely replaces existing options)',
    type: [UpdateLibraryCBTOptionDto],
    example: [
      { optionText: 'Paris', order: 1, isCorrect: true },
      { optionText: 'London', order: 2, isCorrect: false },
      { optionText: 'Berlin', order: 3, isCorrect: false },
      { optionText: 'Madrid', order: 4, isCorrect: false }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryCBTOptionDto)
  @IsOptional()
  options?: UpdateLibraryCBTOptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answers for the question (completely replaces existing answers)',
    type: [UpdateLibraryCBTCorrectAnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryCBTCorrectAnswerDto)
  @IsOptional()
  correctAnswers?: UpdateLibraryCBTCorrectAnswerDto[];
}

