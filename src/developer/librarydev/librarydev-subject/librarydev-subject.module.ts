import { Module } from '@nestjs/common';
import { LibraryDevSubjectController } from './librarydev-subject.controller';
import { LibraryDevSubjectService } from './librarydev-subject.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryDevSubjectController],
  providers: [LibraryDevSubjectService],
  exports: [LibraryDevSubjectService],
})
export class LibraryDevSubjectModule {}


