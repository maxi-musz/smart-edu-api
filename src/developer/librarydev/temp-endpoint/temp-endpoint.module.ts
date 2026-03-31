import { Module } from '@nestjs/common';
import { TempEndpointController } from './temp-endpoint.controller';
import { TempEndpointService } from './temp-endpoint.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TempEndpointController],
  providers: [TempEndpointService],
  exports: [TempEndpointService],
})
export class TempEndpointModule {}
