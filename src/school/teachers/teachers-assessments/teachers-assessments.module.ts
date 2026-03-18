import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TeachersAssessmentsController } from './teachers-assessments.controller';
import { TeachersAssessmentsService } from './teachers-assessments.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeachersAssessmentsController],
  providers: [TeachersAssessmentsService],
})
export class TeachersAssessmentsModule {}
