import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  subject: {
    id: string;
    name: string;
    code: string;
    color: string;
  };

  @ApiProperty()
  school: {
    id: string;
    school_name: string;
  };

  @ApiProperty()
  academicSession: {
    id: string;
    academic_year: string;
    term: string;
  };

  @ApiProperty()
  createdBy: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
