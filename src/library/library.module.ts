import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from './library-auth/library-auth.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, ProfileModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}


