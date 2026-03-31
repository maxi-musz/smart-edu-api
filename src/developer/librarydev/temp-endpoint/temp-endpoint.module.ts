import { Module } from '@nestjs/common';
import { TempEndpointController } from './temp-endpoint.controller';
import { TempEndpointService } from './temp-endpoint.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ExploreChatServicesModule } from '../../../explore/chat/explore-chat-services.module';
import { S3Module } from '../../../shared/services/s3.module';

@Module({
  imports: [PrismaModule, ExploreChatServicesModule, S3Module],
  controllers: [TempEndpointController],
  providers: [TempEndpointService],
  exports: [TempEndpointService],
})
export class TempEndpointModule {}
