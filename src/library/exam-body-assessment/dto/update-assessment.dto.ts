import { PartialType } from '@nestjs/swagger';
import { CreateLibraryExamBodyAssessmentDto } from './create-assessment.dto';

export class UpdateLibraryExamBodyAssessmentDto extends PartialType(CreateLibraryExamBodyAssessmentDto) {}
