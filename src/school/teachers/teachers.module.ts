import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcademicSessionModule } from '../../academic-session/academic-session.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService]
})
export class TeachersModule {}
