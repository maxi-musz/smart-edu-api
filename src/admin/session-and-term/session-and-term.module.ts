import { Module } from '@nestjs/common';
import { SessionAndTermController } from './session-and-term.controller';
import { SessionAndTermService } from './session-and-term.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SessionAndTermController],
  providers: [SessionAndTermService],
  exports: [SessionAndTermService]
})
export class SessionAndTermModule {}

