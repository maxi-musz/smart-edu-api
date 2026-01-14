import { Module } from '@nestjs/common';
import { ExamBodyYearService } from './exam-body-year.service';
import { ExamBodyYearController } from './exam-body-year.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamBodyYearController],
  providers: [ExamBodyYearService],
  exports: [ExamBodyYearService],
})
export class ExamBodyYearModule {}

