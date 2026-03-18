import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ResultService } from './result.service';
import { ResultController } from './result.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../shared/services/s3.module';
import {
  UniversalJwtStrategy,
  UniversalJwtGuard,
} from '../video/guards/universal-jwt.guard';

@Module({
  imports: [PrismaModule, PassportModule, S3Module],
  controllers: [ResultController],
  providers: [ResultService, UniversalJwtStrategy, UniversalJwtGuard],
  exports: [ResultService],
})
export class ResultModule {}
