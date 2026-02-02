import { Module } from '@nestjs/common';
import { LibraryAccessControlController } from './library-access-control.controller';
import { LibraryAccessControlService } from './library-access-control.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryAuthModule } from '../library/library-auth/library-auth.module';

@Module({
  imports: [
    PrismaModule,
    LibraryAuthModule,
  ],
  controllers: [LibraryAccessControlController],
  providers: [LibraryAccessControlService],
  exports: [LibraryAccessControlService],
})
export class LibraryAccessControlModule {}
