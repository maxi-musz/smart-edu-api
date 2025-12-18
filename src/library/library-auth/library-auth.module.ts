import { Module } from '@nestjs/common';
import { LibraryAuthController } from './library-auth.controller';
import { LibraryAuthService } from './library-auth.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryAuthController],
  providers: [LibraryAuthService],
  exports: [LibraryAuthService],
})
export class LibraryAuthModule {}


