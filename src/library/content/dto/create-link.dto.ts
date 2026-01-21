import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class CreateLibraryLinkDto {
  @ApiProperty({
    description: 'ID of the library topic to attach link to',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({
    description: 'ID of the library subject (for validation)',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Title of the link',
    example: 'Khan Academy - Algebra Basics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'URL of the external link',
    example: 'https://www.khanacademy.org/math/algebra',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    description: 'Description of the link',
    example: 'External resource for learning algebra basics',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of link (e.g., article, video, reference, tutorial, documentation)',
    example: 'tutorial',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  linkType?: string;
}

