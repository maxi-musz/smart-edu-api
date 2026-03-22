import { Module } from '@nestjs/common';
import { DirectorAssessmentsService } from './director-assessments.service';

@Module({
  providers: [DirectorAssessmentsService],
  exports: [DirectorAssessmentsService],
})
export class DirectorAssessmentsModule {}
