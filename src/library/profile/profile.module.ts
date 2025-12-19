import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

