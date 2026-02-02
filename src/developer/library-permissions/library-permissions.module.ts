import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryPermissionsController } from './library-permissions.controller';
import { LibraryPermissionsService } from './library-permissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryPermissionsController],
  providers: [LibraryPermissionsService],
  exports: [LibraryPermissionsService],
})
export class LibraryPermissionsModule {}
