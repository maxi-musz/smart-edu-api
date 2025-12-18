import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryDevModule } from './librarydev/librarydev.module';
import { IdentityModule } from './identity/identity.module';

@Module({
  imports: [PrismaModule, LibraryDevModule, IdentityModule],
})
export class DeveloperModule {}

