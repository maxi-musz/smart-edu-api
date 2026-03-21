import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ResultsModule } from './results/results.module';
import { StudentAssessmentModule } from './student-assessment/student-assessment.module';

@Module({
  imports: [PrismaModule, ResultsModule, StudentAssessmentModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
