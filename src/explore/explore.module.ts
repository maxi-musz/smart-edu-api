import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { ExploreAssessmentController } from './explore.assessment.controller';
import { ExploreAssessmentService } from './explore.assessment.service';

@Module({
  controllers: [ExploreController, ExploreAssessmentController],
  providers: [ExploreService, ExploreAssessmentService],
  exports: [ExploreService],
})
export class ExploreModule {}

