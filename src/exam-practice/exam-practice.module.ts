import { Module } from '@nestjs/common';
import { ExamPracticeService } from './exam-practice.service';
import { ExamPracticeController } from './exam-practice.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamPracticeController],
  providers: [ExamPracticeService],
  exports: [ExamPracticeService],
})
export class ExamPracticeModule {}

