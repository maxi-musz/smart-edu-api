import { Module } from '@nestjs/common';
import { DirectorResultModule } from './director-result/director-result.module';
import { TeacherResultModule } from './teacher-result/teacher-result.module';

/**
 * School results domain: director release workflows and teacher-facing result APIs.
 */
@Module({
  imports: [DirectorResultModule, TeacherResultModule],
  exports: [DirectorResultModule, TeacherResultModule],
})
export class ResultsModule {}
