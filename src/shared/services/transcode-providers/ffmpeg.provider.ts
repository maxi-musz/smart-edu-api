import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../s3.service';
import {
  TranscodeProvider,
  TranscodeOptions,
  TranscodeOutput,
  VideoResolution,
  DEFAULT_RESOLUTIONS,
} from './transcode-provider.interface';
import * as colors from 'colors';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

/**
 * FFmpeg-based transcoding provider.
 * Runs FFmpeg locally on the server to transcode videos to HLS.
 * 
 * Pros: Free (no per-minute cost), full control
 * Cons: Uses server CPU, slower, you manage scaling
 */
@Injectable()
export class FfmpegTranscodeProvider implements TranscodeProvider {
  readonly name = 'FFmpeg (Local)';
  
  private readonly logger = new Logger(FfmpegTranscodeProvider.name);
  private readonly tempDir: string;
  private readonly resolutions: VideoResolution[] = DEFAULT_RESOLUTIONS;

  constructor(private readonly s3Service: S3Service) {
    this.tempDir = path.join(os.tmpdir(), 'hls-transcode');
    fs.mkdirSync(this.tempDir, { recursive: true });
  }

  /**
   * Log FFmpeg provider status (called from main.ts after startup)
   */
  logStatus(): void {
    this.logger.log(colors.green(`✅ FFmpeg provider initialized (temp dir: ${this.tempDir})`));
  }

  async transcode(options: TranscodeOptions): Promise<TranscodeOutput> {
    const { sourceS3Key, hlsS3Prefix, title, localFilePath } = options;
    const workDir = path.join(this.tempDir, `transcode_${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });

    const inputFile = path.join(workDir, 'source.mp4');
    const outputDir = path.join(workDir, 'hls');
    fs.mkdirSync(outputDir, { recursive: true });

    try {
      // Step 1: Get source video - use local file if provided, else download from S3
      if (localFilePath && fs.existsSync(localFilePath)) {
        this.logger.log(colors.blue(`📂 Using local file (skip S3 download): ${localFilePath}`));
        fs.copyFileSync(localFilePath, inputFile);
        try {
          fs.unlinkSync(localFilePath);
        } catch {
          // ignore cleanup failure
        }
        this.logger.log(colors.green(`✅ Source video ready`));
      } else {
        this.logger.log(colors.blue(`📥 Downloading source video from S3: ${sourceS3Key}`));
        const downloadResult = await this.s3Service.downloadToTempFile(sourceS3Key);
        fs.renameSync(downloadResult.filePath, inputFile);
        this.logger.log(colors.green(`✅ Downloaded source video`));
      }

      // Step 2: Run FFmpeg to generate HLS variants
      this.logger.log(colors.blue(`🔄 Starting FFmpeg transcode (${this.resolutions.map(r => r.name).join(', ')})...`));
      await this.runFfmpegTranscode(inputFile, outputDir);
      this.logger.log(colors.green(`✅ FFmpeg transcode completed`));

      // Step 3: Upload all HLS files to S3
      this.logger.log(colors.blue(`📤 Uploading HLS files to S3...`));
      await this.uploadHlsFiles(outputDir, hlsS3Prefix);
      this.logger.log(colors.green(`✅ HLS files uploaded to S3`));

      return { success: true };
    } catch (error) {
      this.logger.error(colors.red(`❌ FFmpeg transcode error: ${error.message}`));
      return { success: false, error: error.message };
    } finally {
      // Cleanup temp files
      this.cleanupDir(workDir);
    }
  }

  /**
   * Run FFmpeg to create HLS with multiple resolutions
   */
  private async runFfmpegTranscode(inputFile: string, outputDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = [
        '-i', inputFile,
        '-hide_banner',
        '-loglevel', 'warning',
      ];

      // Add filter complex for scaling to different resolutions
      const filterParts: string[] = [];
      this.resolutions.forEach((res, index) => {
        filterParts.push(`[0:v]scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`);
      });
      args.push('-filter_complex', filterParts.join(';'));

      // Add output mappings for each resolution
      this.resolutions.forEach((res, index) => {
        const playlistName = `${res.name}.m3u8`;
        const segmentName = `${res.name}_%03d.ts`;

        args.push(
          '-map', `[v${index}]`,
          '-map', '0:a?',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-b:v', res.videoBitrate,
          '-maxrate', res.videoBitrate,
          '-bufsize', `${parseInt(res.videoBitrate) * 2}k`,
          '-c:a', 'aac',
          '-b:a', res.audioBitrate,
          '-ac', '2',
          '-f', 'hls',
          '-hls_time', '6',
          '-hls_playlist_type', 'vod',
          '-hls_segment_filename', path.join(outputDir, segmentName),
          path.join(outputDir, playlistName),
        );
      });

      this.logger.log(colors.cyan(`🎬 FFmpeg command: ffmpeg ${args.slice(0, 20).join(' ')} ...`));

      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code === 0) {
          // Generate master playlist
          await this.generateMasterPlaylist(outputDir);
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });
  }

  /**
   * Generate master HLS playlist that references all resolution variants
   */
  private async generateMasterPlaylist(outputDir: string): Promise<void> {
    const lines: string[] = ['#EXTM3U', '#EXT-X-VERSION:3'];

    for (const res of this.resolutions) {
      const bandwidth = parseInt(res.videoBitrate) * 1000 + parseInt(res.audioBitrate) * 1000;
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${res.width}x${res.height}`,
        `${res.name}.m3u8`,
      );
    }

    const masterPath = path.join(outputDir, 'master.m3u8');
    fs.writeFileSync(masterPath, lines.join('\n'));
    this.logger.log(colors.green(`✅ Generated master playlist: master.m3u8`));
  }

  /**
   * Upload all HLS files from output directory to S3
   */
  private async uploadHlsFiles(outputDir: string, s3Prefix: string): Promise<void> {
    const files = fs.readdirSync(outputDir);

    for (const file of files) {
      const localPath = path.join(outputDir, file);
      const s3Key = `${s3Prefix}/${file}`;

      let contentType = 'application/octet-stream';
      if (file.endsWith('.m3u8')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (file.endsWith('.ts')) {
        contentType = 'video/MP2T';
      }

      await this.s3Service.uploadLocalFile(localPath, s3Prefix, file, contentType);
      this.logger.debug(colors.blue(`📤 Uploaded: ${s3Key}`));
    }
  }

  /**
   * Clean up temporary directory
   */
  private cleanupDir(dir: string): void {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        this.logger.debug(colors.yellow(`🗑️ Cleaned up temp dir: ${dir}`));
      }
    } catch (error) {
      this.logger.warn(colors.yellow(`⚠️ Failed to cleanup temp dir: ${error.message}`));
    }
  }
}
