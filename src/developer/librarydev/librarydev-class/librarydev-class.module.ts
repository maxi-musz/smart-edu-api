import { Module } from '@nestjs/common';
import { LibraryDevClassController } from './librarydev-class.controller';
import { LibraryDevClassService } from './librarydev-class.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryDevClassController],
  providers: [LibraryDevClassService],
  exports: [LibraryDevClassService],
})
export class LibraryDevClassModule {}


