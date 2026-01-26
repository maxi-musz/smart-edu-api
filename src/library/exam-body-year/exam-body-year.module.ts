import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { LibraryExamBodyYearController } from './exam-body-year.controller';
import { LibraryExamBodyYearService } from './exam-body-year.service';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [LibraryExamBodyYearController],
  providers: [LibraryExamBodyYearService],
})
export class LibraryExamBodyYearModule {}
