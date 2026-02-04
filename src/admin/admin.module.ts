import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SchoolManagementModule } from './school-management/school-management.module';
import { AuthAdminModule } from './auth-admin/auth-admin.module';
import { SessionAndTermModule } from './session-and-term/session-and-term.module';
import { HlsTranscodeAdminModule } from './hls-transcode/hls-transcode.module';
import { AdminStudentsController } from './students/admin-students.controller';

@Module({
  controllers: [AdminController, AdminStudentsController],
  providers: [AdminService],
  imports: [SchoolManagementModule, AuthAdminModule, SessionAndTermModule, HlsTranscodeAdminModule]
})
export class AdminModule {}
