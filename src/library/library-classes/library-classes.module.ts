import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryClassesController } from './library-classes.controller';
import { LibraryClassesService } from './library-classes.service';

@Module({
  imports: [PrismaModule],
  controllers: [LibraryClassesController],
  providers: [LibraryClassesService],
  exports: [LibraryClassesService],
})
export class LibraryClassesModule {}
