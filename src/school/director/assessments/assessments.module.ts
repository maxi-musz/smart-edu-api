import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { DirectorAssessmentsController } from './assessments.controller';
import { DirectorAssessmentsService } from './assessments.service';

@Module({
  imports: [PrismaModule],
  controllers: [DirectorAssessmentsController],
  providers: [DirectorAssessmentsService],
  exports: [DirectorAssessmentsService]
})
export class AssessmentsModule {}

