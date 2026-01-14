import { PartialType } from '@nestjs/swagger';
import { CreateExamBodySubjectDto } from './create-subject.dto';

export class UpdateExamBodySubjectDto extends PartialType(CreateExamBodySubjectDto) {}

