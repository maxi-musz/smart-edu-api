import { Module } from '@nestjs/common';
import { LibraryDevController } from './librarydev.controller';
import { LibraryDevService } from './librarydev.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryDevClassModule } from './librarydev-class/librarydev-class.module';
import { LibraryDevSubjectModule } from './librarydev-subject/librarydev-subject.module';

@Module({
  imports: [PrismaModule, LibraryDevClassModule, LibraryDevSubjectModule],
  controllers: [LibraryDevController],
  providers: [LibraryDevService],
  exports: [LibraryDevService],
})
export class LibraryDevModule {}

