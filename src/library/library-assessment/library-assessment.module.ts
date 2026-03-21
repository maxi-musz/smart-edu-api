import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../shared/services/providers/storage.module';
import { LibraryAssessmentController } from './library-assessment.controller';
import { LibraryAssessmentService } from './library-assessment.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [LibraryAssessmentController],
  providers: [LibraryAssessmentService],
})
export class LibraryAssessmentModule {}
