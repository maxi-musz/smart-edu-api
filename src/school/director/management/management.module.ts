import { Module } from '@nestjs/common';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';
import { AuditModule } from '../../../audit/audit.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, AuditModule],
  controllers: [ManagementController],
  providers: [ManagementService],
  exports: [ManagementService],
})
export class ManagementModule {}
