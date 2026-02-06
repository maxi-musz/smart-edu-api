import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../school/auth/auth.module';
import { SubjectModule } from '../../school/director/subject/subject.module';

@Module({
  imports: [PrismaModule, AuthModule, SubjectModule],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}

