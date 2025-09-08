import { PartialType } from '@nestjs/swagger';
import { CreateCBTQuestionDto } from './create-cbt-question.dto';

export class UpdateCBTQuestionDto extends PartialType(CreateCBTQuestionDto) {}
