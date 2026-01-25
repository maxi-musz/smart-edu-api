import { PartialType } from '@nestjs/swagger';
import { CreateLibraryExamBodySubjectDto } from './create-subject.dto';

export class UpdateLibraryExamBodySubjectDto extends PartialType(CreateLibraryExamBodySubjectDto) {}
