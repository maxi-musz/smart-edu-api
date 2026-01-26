import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { LibraryExamBodyController } from './exam-body.controller';
import { LibraryExamBodyService } from './exam-body.service';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [LibraryExamBodyController],
  providers: [LibraryExamBodyService],
})
export class LibraryExamBodyModule {}
