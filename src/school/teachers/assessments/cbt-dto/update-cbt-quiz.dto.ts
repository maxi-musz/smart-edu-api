import { PartialType } from '@nestjs/swagger';
import { CreateCBTQuizDto } from './create-cbt-quiz.dto';

export class UpdateCBTQuizDto extends PartialType(CreateCBTQuizDto) {}
