import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuditModule } from '../../../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ClassesService],
  controllers: [ClassesController],
})
export class ClassesModule {}
