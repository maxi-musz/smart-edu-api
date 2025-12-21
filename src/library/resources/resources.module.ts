import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}

