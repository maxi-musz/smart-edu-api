import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  size: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  status: string;
}

export class MaterialDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  downloads: number;

  @ApiProperty()
  status: string;
}

export class ComprehensiveTopicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: [VideoDto] })
  videos: VideoDto[];

  @ApiProperty({ type: [MaterialDto] })
  materials: MaterialDto[];

  @ApiProperty()
  instructions: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SubjectDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  thumbnail: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  totalTopics: number;

  @ApiProperty()
  totalVideos: number;

  @ApiProperty()
  totalMaterials: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  progress: number;

  @ApiProperty({ type: [String] })
  classes: string[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class FiltersDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  orderBy?: string;

  @ApiPropertyOptional()
  orderDirection?: string;
}

export class StatsDto {
  @ApiProperty()
  totalTopics: number;

  @ApiProperty()
  totalVideos: number;

  @ApiProperty()
  totalMaterials: number;

  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  completedTopics: number;

  @ApiProperty()
  inProgressTopics: number;

  @ApiProperty()
  notStartedTopics: number;
}

export class ComprehensiveSubjectResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    subject: SubjectDataDto;
    topics: ComprehensiveTopicDto[];
    pagination: PaginationDto;
    filters: FiltersDto;
    stats: StatsDto;
  };
}
