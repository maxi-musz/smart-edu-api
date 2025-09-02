import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicDto {
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
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SubjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiProperty()
  color: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  thumbnail?: any;

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

  @ApiProperty({ type: [TopicDto] })
  topics: TopicDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
