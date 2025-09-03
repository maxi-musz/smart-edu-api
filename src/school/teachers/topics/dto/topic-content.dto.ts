import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VideoContentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional()
  duration?: string;

  @ApiPropertyOptional()
  thumbnail?: any;

  @ApiPropertyOptional()
  size?: string;

  @ApiProperty()
  views: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PDFMaterialDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  size?: string;

  @ApiProperty()
  downloads: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AssignmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  maxScore?: number;

  @ApiPropertyOptional()
  timeLimit?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CBTQuizDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  duration?: number;

  @ApiPropertyOptional()
  totalQuestions?: number;

  @ApiPropertyOptional()
  passingScore?: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LiveClassDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  meetingUrl: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  maxParticipants?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LibraryResourceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  resourceType: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  format?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TopicContentSummaryDto {
  @ApiProperty()
  totalVideos: number;

  @ApiProperty()
  totalMaterials: number;

  @ApiProperty()
  totalAssignments: number;

  @ApiProperty()
  totalQuizzes: number;

  @ApiProperty()
  totalLiveClasses: number;

  @ApiProperty()
  totalLibraryResources: number;

  @ApiProperty()
  totalContent: number;
}

export class TopicContentResponseDto {
  @ApiProperty()
  topicId: string;

  @ApiProperty()
  topicTitle: string;

  @ApiProperty()
  topicDescription?: string;

  @ApiProperty()
  topicOrder: number;

  @ApiProperty()
  contentSummary: TopicContentSummaryDto;

  @ApiProperty({ type: [VideoContentDto] })
  videos: VideoContentDto[];

  @ApiProperty({ type: [PDFMaterialDto] })
  materials: PDFMaterialDto[];

  @ApiProperty({ type: [AssignmentDto] })
  assignments: AssignmentDto[];

  @ApiProperty({ type: [CBTQuizDto] })
  quizzes: CBTQuizDto[];

  @ApiProperty({ type: [LiveClassDto] })
  liveClasses: LiveClassDto[];

  @ApiProperty({ type: [LibraryResourceDto] })
  libraryResources: LibraryResourceDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
