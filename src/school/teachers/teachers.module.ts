import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcademicSessionModule } from '../../academic-session/academic-session.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TopicsModule } from './topics/topics.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { AttendanceTeacherModule } from './attendance-teacher/attendance-teacher.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, SubjectsModule, TopicsModule, AssessmentsModule, AttendanceTeacherModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService, SubjectsModule, TopicsModule, AssessmentsModule, AttendanceTeacherModule]
})
export class TeachersModule {}
