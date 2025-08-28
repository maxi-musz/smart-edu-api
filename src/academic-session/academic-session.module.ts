import { Module } from '@nestjs/common';
import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicSessionController],
  providers: [AcademicSessionService],
  exports: [AcademicSessionService]
})
export class AcademicSessionModule {}
