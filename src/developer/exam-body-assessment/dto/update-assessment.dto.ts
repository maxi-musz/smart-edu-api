import { PartialType } from '@nestjs/swagger';
import { CreateExamBodyAssessmentDto } from './create-assessment.dto';

export class UpdateExamBodyAssessmentDto extends PartialType(CreateExamBodyAssessmentDto) {}

