import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, AuditModule],
  providers: [SubjectService],
  controllers: [SubjectController],
  exports: [SubjectService],
})
export class SubjectModule {}
