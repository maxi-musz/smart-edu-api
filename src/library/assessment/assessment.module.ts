import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { CBTController } from './cbt.controller';
import { CBTService } from './cbt.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { StorageModule } from '../../shared/services/providers/storage.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, StorageModule],
  controllers: [CBTController, AssessmentController], // CBT first for route priority!
  providers: [AssessmentService, CBTService],
  exports: [AssessmentService, CBTService],
})
export class AssessmentModule {}

