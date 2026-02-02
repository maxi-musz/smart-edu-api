import { Module } from '@nestjs/common';
import { SchoolAccessControlController } from './school-access-control.controller';
import { SchoolAccessControlService } from './school-access-control.service';
import { AccessControlHelperService } from './access-control-helper.service';
import { TeacherAccessControlModule } from './teacher/teacher-access-control.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../school/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TeacherAccessControlModule,
  ],
  controllers: [SchoolAccessControlController],
  providers: [
    SchoolAccessControlService,
    AccessControlHelperService,
  ],
  exports: [
    SchoolAccessControlService,
    AccessControlHelperService,
  ],
})
export class SchoolAccessControlModule {}
