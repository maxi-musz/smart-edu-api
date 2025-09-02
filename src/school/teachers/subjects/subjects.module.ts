import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService]
})
export class SubjectsModule {}
