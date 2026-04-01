import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExploreAiBooksController } from './ai-books.controller';
import { ExploreAiBooksService } from './ai-books.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExploreAiBooksController],
  providers: [ExploreAiBooksService],
  exports: [ExploreAiBooksService],
})
export class ExploreAiBooksModule {}
