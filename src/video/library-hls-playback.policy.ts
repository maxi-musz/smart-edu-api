import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HlsTranscodeStatus } from '@prisma/client';

/**
 * Library videos must not be played from source MP4 once HLS is the delivery standard.
 * Call this before returning a playback URL or incrementing views.
 */
export function assertLibraryVideoReadyForHlsPlayback(video: {
  hlsStatus: HlsTranscodeStatus | null;
  hlsPlaybackUrl: string | null;
}): void {
  const ready =
    video.hlsStatus === HlsTranscodeStatus.completed &&
    !!video.hlsPlaybackUrl?.trim();

  if (ready) {
    return;
  }

  if (video.hlsStatus === HlsTranscodeStatus.failed) {
    throw new UnprocessableEntityException({
      success: false,
      message:
        'Video processing failed. Please re-upload the video or contact support.',
      hlsStatus: video.hlsStatus,
    });
  }

  throw new ServiceUnavailableException({
    success: false,
    message:
      'Video is not ready for playback yet. Adaptive streaming is still being prepared.',
    hlsStatus: video.hlsStatus ?? HlsTranscodeStatus.pending,
  });
}
