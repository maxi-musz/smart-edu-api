import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExploreExamBodyController } from './exam-body.controller';
import { ExploreExamBodyService } from './exam-body.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExploreExamBodyController],
  providers: [ExploreExamBodyService],
  exports: [ExploreExamBodyService],
})
export class ExploreExamBodyModule {}
