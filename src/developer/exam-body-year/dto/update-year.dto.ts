import { PartialType } from '@nestjs/swagger';
import { CreateExamBodyYearDto } from './create-year.dto';

export class UpdateExamBodyYearDto extends PartialType(CreateExamBodyYearDto) {}

