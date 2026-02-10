import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Query parameters for downloading a student result as PDF.
 * Both studentId and academicSessionId are required to uniquely identify the result.
 */
export class DownloadResultPdfQueryDto {
  @ApiProperty({
    description: 'Student ID (Student model id) whose result to download',
    example: 'clxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    description: 'Academic session ID for which the result was released',
    example: 'clxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  academicSessionId: string;
}
