import { Module } from '@nestjs/common';
import { ExamBodyService } from './exam-body.service';
import { ExamBodyController } from './exam-body.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../shared/services/providers/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ExamBodyController],
  providers: [ExamBodyService],
  exports: [ExamBodyService],
})
export class ExamBodyModule {}

