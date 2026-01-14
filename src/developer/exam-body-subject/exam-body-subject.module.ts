import { Module } from '@nestjs/common';
import { ExamBodySubjectService } from './exam-body-subject.service';
import { ExamBodySubjectController } from './exam-body-subject.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../shared/services/providers/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ExamBodySubjectController],
  providers: [ExamBodySubjectService],
  exports: [ExamBodySubjectService],
})
export class ExamBodySubjectModule {}

