import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from './library-auth/library-auth.module';
import { ProfileModule } from './profile/profile.module';
import { SchoolsModule } from './schools/schools.module';
import { ResourcesModule } from './resources/resources.module';
import { SubjectModule } from './subject/subject.module';
import { TopicModule } from './subject/topic/topic.module';
import { ContentModule } from './content/content.module';
import { GeneralMaterialsModule } from './general-materials/general-materials.module';
import { AssessmentModule } from './assessment/assessment.module';
import { LibraryExamBodyAssessmentModule } from './exam-body-assessment/exam-body-assessment.module';
import { LibraryExamBodyModule } from './exam-body/exam-body.module';
import { LibraryExamBodySubjectModule } from './exam-body-subject/exam-body-subject.module';
import { LibraryExamBodyYearModule } from './exam-body-year/exam-body-year.module';
import { LibraryUsersModule } from './library-users/library-users.module';

@Module({
  imports: [
    PrismaModule,
    LibraryAuthModule,
    LibraryUsersModule,
    ProfileModule,
    SchoolsModule,
    ResourcesModule,
    SubjectModule,
    TopicModule,
    ContentModule,
    GeneralMaterialsModule,
    AssessmentModule,
    LibraryExamBodyAssessmentModule,
    LibraryExamBodyModule,
    LibraryExamBodySubjectModule,
    LibraryExamBodyYearModule,
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}


