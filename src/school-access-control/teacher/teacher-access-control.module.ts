import { Module } from '@nestjs/common';
import { TeacherAccessControlController } from './teacher-access-control.controller';
import { TeacherAccessControlService } from './teacher-access-control.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../school/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
  ],
  controllers: [TeacherAccessControlController],
  providers: [TeacherAccessControlService],
  exports: [TeacherAccessControlService],
})
export class TeacherAccessControlModule {}
