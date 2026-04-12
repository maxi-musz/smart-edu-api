import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { DirectorAuditController } from './director-audit.controller';
import { DirectorAuditService } from './director-audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [DirectorAuditController],
  providers: [DirectorAuditService],
  exports: [DirectorAuditService],
})
export class DirectorAuditModule {}
