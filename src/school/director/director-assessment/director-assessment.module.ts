import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StorageModule } from '../../../shared/services/providers/storage.module';
import { DirectorAssessmentController } from './director-assessment.controller';
import { DirectorAssessmentService } from './director-assessment.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DirectorAssessmentController],
  providers: [DirectorAssessmentService],
})
export class DirectorAssessmentModule {}
