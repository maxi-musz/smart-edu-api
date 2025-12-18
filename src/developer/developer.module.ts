import { Module } from '@nestjs/common';
import { DeveloperController } from './developer.controller';
import { DeveloperService } from './developer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryDevModule } from './librarydev/librarydev.module';

@Module({
  imports: [PrismaModule, LibraryDevModule],
  controllers: [DeveloperController],
  providers: [DeveloperService],
  exports: [DeveloperService],
})
export class DeveloperModule {}


