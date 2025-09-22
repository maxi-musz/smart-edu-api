import { Module } from '@nestjs/common';
import { AttendanceTeacherService } from './attendance-teacher.service';
import { AttendanceTeacherController } from './attendance-teacher.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceTeacherController],
  providers: [AttendanceTeacherService],
  exports: [AttendanceTeacherService]
})
export class AttendanceTeacherModule {}
