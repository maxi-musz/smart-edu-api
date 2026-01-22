import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { ExploreAssessmentController } from './explore.assessment.controller';
import { ExploreAssessmentService } from './explore.assessment.service';
import { ExploreAiBooksController } from './explore-aibooks.controller';
import { ExploreAiBooksService } from './explore-aibooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from '../library/library-auth/library-auth.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [ExploreController, ExploreAssessmentController, ExploreAiBooksController],
  providers: [ExploreService, ExploreAssessmentService, ExploreAiBooksService],
  exports: [ExploreService, ExploreAiBooksService],
})
export class ExploreModule {}

