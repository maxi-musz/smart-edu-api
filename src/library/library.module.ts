import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from './library-auth/library-auth.module';
import { ProfileModule } from './profile/profile.module';
import { SchoolsModule } from './schools/schools.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, ProfileModule, SchoolsModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}


