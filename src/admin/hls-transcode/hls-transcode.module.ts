import { Module } from '@nestjs/common';
import { HlsTranscodeController } from './hls-transcode.controller';
import { HlsTranscodeModule as SharedHlsTranscodeModule } from '../../shared/services/hls-transcode.module';

@Module({
  imports: [SharedHlsTranscodeModule],
  controllers: [HlsTranscodeController],
})
export class HlsTranscodeAdminModule {}
