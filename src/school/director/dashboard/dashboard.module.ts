import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeachersModule } from '../teachers/teachers.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';

@Module({
  imports: [PrismaModule, TeachersModule, AcademicSessionModule],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
