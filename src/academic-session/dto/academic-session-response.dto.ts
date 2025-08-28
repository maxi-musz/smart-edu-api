import { ApiProperty } from '@nestjs/swagger';
import { AcademicTerm, AcademicSessionStatus } from '@prisma/client';

export class AcademicSessionResponseDto {
  @ApiProperty({
    description: 'Academic session ID',
    example: 'session-uuid'
  })
  id: string;

  @ApiProperty({
    description: 'School ID',
    example: 'school-uuid'
  })
  school_id: string;

  @ApiProperty({
    description: 'Academic year in format like "2024/2025"',
    example: '2024/2025'
  })
  academic_year: string;

  @ApiProperty({
    description: 'Start year of the academic session',
    example: 2024
  })
  start_year: number;

  @ApiProperty({
    description: 'End year of the academic session',
    example: 2025
  })
  end_year: number;

  @ApiProperty({
    description: 'Academic term',
    enum: AcademicTerm,
    example: 'first'
  })
  term: AcademicTerm;

  @ApiProperty({
    description: 'Start date of the academic session',
    example: '2024-09-01T00:00:00.000Z'
  })
  start_date: Date;

  @ApiProperty({
    description: 'End date of the academic session',
    example: '2024-12-20T00:00:00.000Z'
  })
  end_date: Date;

  @ApiProperty({
    description: 'Status of the academic session',
    enum: AcademicSessionStatus,
    example: 'active'
  })
  status: AcademicSessionStatus;

  @ApiProperty({
    description: 'Whether this is the current academic session',
    example: true
  })
  is_current: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-08-28T10:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-08-28T10:00:00.000Z'
  })
  updatedAt: Date;
}
