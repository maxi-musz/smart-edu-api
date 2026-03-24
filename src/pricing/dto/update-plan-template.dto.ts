import { PartialType } from '@nestjs/swagger';
import { CreatePlanTemplateDto } from './create-plan-template.dto';

/** All fields optional; `name` may be omitted to leave unchanged. */
export class UpdatePlanTemplateDto extends PartialType(CreatePlanTemplateDto) {}
