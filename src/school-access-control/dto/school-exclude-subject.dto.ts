import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for school owner to exclude (turn off) a subject for the school.
 * Only school_director and school_admin can exclude. Excluded subjects are hidden
 * from non-admin users in explore; school owner still sees all.
 */
export class SchoolExcludeSubjectDto {
  @ApiProperty({
    description: 'Library subject ID to exclude for the school',
    example: 'clxxx123456',
  })
  @IsString()
  subjectId: string;
}
