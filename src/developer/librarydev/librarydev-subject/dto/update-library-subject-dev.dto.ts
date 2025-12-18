import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLibrarySubjectDevDto {
  @ApiPropertyOptional({
    description: 'Updated subject name',
    example: 'Advanced Mathematics',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated subject code (must be unique per platform)',
    example: 'MTH201',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Updated library class ID to group this subject under (or null to detach)',
    example: 'clibclass1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  classId?: string | null;

  @ApiPropertyOptional({
    description: 'Updated subject color',
    example: '#10B981',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Updated description',
    example: 'Updated description for the subject.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}


