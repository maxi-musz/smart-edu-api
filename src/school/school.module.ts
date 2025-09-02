import { Module } from '@nestjs/common';
import { DirectorModule } from './director/director.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { SchoolController } from './school.controller';

@Module({
  imports: [DirectorModule, TeachersModule, StudentsModule, AuthModule, AcademicSessionModule],
  controllers: [SchoolController]
})
export class SchoolModule {}
