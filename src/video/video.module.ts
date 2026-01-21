import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UniversalJwtStrategy, UniversalJwtGuard } from './guards/universal-jwt.guard';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [VideoController],
  providers: [VideoService, UniversalJwtStrategy, UniversalJwtGuard],
  exports: [VideoService],
})
export class VideoModule {}

