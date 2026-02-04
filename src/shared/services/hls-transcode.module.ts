import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HlsTranscodeService } from './hls-transcode.service';
import { FfmpegTranscodeProvider } from './transcode-providers/ffmpeg.provider';
import { MediaConvertTranscodeProvider } from './transcode-providers/mediaconvert.provider';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from './s3.module';

@Module({
  imports: [PrismaModule, S3Module, ConfigModule],
  providers: [
    HlsTranscodeService,
    FfmpegTranscodeProvider,
    MediaConvertTranscodeProvider,
  ],
  exports: [HlsTranscodeService],
})
export class HlsTranscodeModule {}
