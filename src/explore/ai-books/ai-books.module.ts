import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../shared/services/s3.module';
import { ExploreAiBooksController } from './ai-books.controller';
import { ExploreAiBooksService } from './ai-books.service';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [ExploreAiBooksController],
  providers: [ExploreAiBooksService],
  exports: [ExploreAiBooksService],
})
export class ExploreAiBooksModule {}
