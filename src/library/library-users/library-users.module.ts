import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { LibraryUsersController } from './library-users.controller';
import { LibraryUsersService } from './library-users.service';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [LibraryUsersController],
  providers: [LibraryUsersService],
  exports: [LibraryUsersService],
})
export class LibraryUsersModule {}
