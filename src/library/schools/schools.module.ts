import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../school/auth/auth.module';
import { SubjectModule } from '../../school/director/subject/subject.module';
import { AssessmentsModule } from '../../school/teachers/assessments/assessments.module';
import { LibrarySchoolAssessmentsController } from './assessments/library-school-assessments.controller';

@Module({
  imports: [PrismaModule, AuthModule, SubjectModule, AssessmentsModule],
  controllers: [SchoolsController, LibrarySchoolAssessmentsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}

