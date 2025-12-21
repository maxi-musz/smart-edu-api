import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UploadLibraryMaterialDto {
  @ApiProperty({
    description: 'ID of the library topic to upload material to',
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
    description: 'Title of the material',
    example: 'Algebra Study Guide',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the material',
    example: 'Comprehensive guide covering all algebra concepts',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class UploadLibraryMaterialResponseDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  progressEndpoint: string;
}

