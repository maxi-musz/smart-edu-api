import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as colors from 'colors';

@Injectable()
export class CloudFrontService {
  private readonly logger = new Logger(CloudFrontService.name);
  private readonly cloudFrontDomain: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
  }

  /**
   * Log CloudFront service status (called from main.ts after startup)
   */
  logStatus(): void {
    if (this.cloudFrontDomain) {
      this.logger.log(colors.green(`✅ CloudFront enabled: ${this.cloudFrontDomain}`));
    } else {
      this.logger.log(colors.yellow(`⚠️ CloudFront not configured - using direct S3 URLs`));
    }
  }

  /**
   * Check if CloudFront is configured
   */
  isEnabled(): boolean {
    return !!this.cloudFrontDomain;
  }

  /**
   * Get the configured CloudFront domain
   */
  getDomain(): string | undefined {
    return this.cloudFrontDomain;
  }

  /**
   * Build CloudFront URL for a resource if configured
   * Falls back to the original URL if CloudFront is not configured or s3Key is missing
   * 
   * @param s3Key - The S3 object key (path within bucket)
   * @param fallbackUrl - The original URL to use if CloudFront is not available
   * @returns The CloudFront URL or fallback URL
   */
  getUrl(s3Key: string | null | undefined, fallbackUrl: string): string {
    if (this.cloudFrontDomain && s3Key) {
      const cloudFrontUrl = `https://${this.cloudFrontDomain}/${s3Key}`;
      this.logger.debug(colors.blue(`🌐 CloudFront URL: ${cloudFrontUrl}`));
      return cloudFrontUrl;
    }

    return fallbackUrl;
  }

  /**
   * Build CloudFront URL for video playback
   * Logs when CloudFront is being used for easier debugging
   */
  getVideoUrl(videoS3Key: string | null | undefined, fallbackVideoUrl: string): string {
    if (this.cloudFrontDomain && videoS3Key) {
      this.logger.log(colors.blue(`🌐 Using CloudFront for video delivery`));
      return `https://${this.cloudFrontDomain}/${videoS3Key}`;
    }

    return fallbackVideoUrl;
  }

  /**
   * Return the HLS playback URL, normalizing for provider.
   * MediaConvert writes main.m3u8; FFmpeg writes master.m3u8.
   * If the stored URL points to master.m3u8 but we use MediaConvert, return main.m3u8 so existing DB records work.
   */
  getHlsPlaybackUrl(storedHlsUrl: string): string {
    const provider = this.configService.get<string>('HLS_TRANSCODE_PROVIDER') || 'ffmpeg';
    if (provider.toLowerCase() === 'mediaconvert' && storedHlsUrl.endsWith('/master.m3u8')) {
      return storedHlsUrl.replace(/\/master\.m3u8$/, '/main.m3u8');
    }
    return storedHlsUrl;
  }
}
