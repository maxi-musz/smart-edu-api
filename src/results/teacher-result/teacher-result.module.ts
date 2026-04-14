import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TeacherResultController } from './teacher-result.controller';
import { TeacherResultService } from './teacher-result.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeacherResultController],
  providers: [TeacherResultService],
  exports: [TeacherResultService],
})
export class TeacherResultModule {}
