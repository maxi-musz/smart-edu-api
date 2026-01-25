import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryDevModule } from './librarydev/librarydev.module';
import { IdentityModule } from './identity/identity.module';
import { ExamBodyModule } from './exam-body/exam-body.module';

@Module({
  imports: [
    PrismaModule,
    LibraryDevModule,
    IdentityModule,
    ExamBodyModule,
  ],
})
export class DeveloperModule {}

