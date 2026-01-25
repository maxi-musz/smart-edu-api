import { PartialType } from '@nestjs/swagger';
import { CreateLibraryExamBodyYearDto } from './create-year.dto';

export class UpdateLibraryExamBodyYearDto extends PartialType(CreateLibraryExamBodyYearDto) {}
