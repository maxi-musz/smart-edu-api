import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../school/auth/auth.module';
import { SubjectModule } from '../../school/director/subject/subject.module';
import { AssessmentsModule } from '../../school/teachers/assessments/assessments.module';
import { PushNotificationsModule } from '../../push-notifications/push-notifications.module';
import { AuditModule } from '../../audit/audit.module';
import { LibrarySchoolAssessmentsController } from './assessments/library-school-assessments.controller';
import { LibrarySchoolResultsController } from './results/library-school-results.controller';
import { LibrarySchoolResultsService } from './results/library-school-results.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    SubjectModule,
    AssessmentsModule,
    PushNotificationsModule,
    AuditModule,
  ],
  controllers: [
    SchoolsController,
    LibrarySchoolAssessmentsController,
    LibrarySchoolResultsController,
  ],
  providers: [SchoolsService, LibrarySchoolResultsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}

