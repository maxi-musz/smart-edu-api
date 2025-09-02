import { ApiProperty } from '@nestjs/swagger';
import { SubjectResponseDto } from './subject-response.dto';

export class PaginationMetaDto {
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

export class PaginatedSubjectsResponseDto {
  @ApiProperty({ type: [SubjectResponseDto] })
  data: SubjectResponseDto[];

  @ApiProperty()
  meta: PaginationMetaDto;

  @ApiProperty()
  message: string;
}
