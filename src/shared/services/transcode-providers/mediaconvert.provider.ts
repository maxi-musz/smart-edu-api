import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
  JobStatus,
  AacCodingMode,
  H264CodecProfile,
  H264CodecLevel,
  H264QualityTuningLevel,
  H264RateControlMode,
  ContainerType,
  AudioDefaultSelection,
  OutputGroupType,
  HlsManifestDurationFormat,
  HlsOutputSelection,
  HlsSegmentControl,
  HlsStreamInfResolution,
  VideoTimecodeInsertion,
  ColorSpace,
  InputTimecodeSource,
  TimecodeSource,
  VideoCodec,
  AudioCodec,
  H264FramerateControl,
  H264GopSizeUnits,
  ScalingBehavior,
  AntiAlias,
} from '@aws-sdk/client-mediaconvert';
import {
  TranscodeProvider,
  TranscodeOptions,
  TranscodeOutput,
  VideoResolution,
  DEFAULT_RESOLUTIONS,
} from './transcode-provider.interface';
import * as colors from 'colors';

/**
 * AWS MediaConvert-based transcoding provider.
 * Submits jobs to AWS MediaConvert (managed service) for transcoding.
 * 
 * Pros: Fast, scalable, no server CPU usage, reliable
 * Cons: ~$0.015-0.024 per minute of output (varies by region/codec)
 * 
 * Required env vars:
 * - AWS_MEDIACONVERT_ENDPOINT (from your AWS account - find in MediaConvert console)
 * - AWS_MEDIACONVERT_ROLE_ARN (IAM role with S3 + MediaConvert permissions)
 * - AWS_S3_BUCKET (your S3 bucket)
 * - AWS_REGION
 */
@Injectable()
export class MediaConvertTranscodeProvider implements TranscodeProvider {
  readonly name = 'AWS MediaConvert';
  
  private readonly logger = new Logger(MediaConvertTranscodeProvider.name);
  private readonly client: MediaConvertClient;
  private readonly roleArn: string;
  private readonly bucketName: string;
  private readonly resolutions: VideoResolution[] = DEFAULT_RESOLUTIONS;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    // Use custom endpoint if set; otherwise use standard regional endpoint (no need to find "Account" in console)
    const customEndpoint = this.configService.get<string>('AWS_MEDIACONVERT_ENDPOINT');
    const endpoint = customEndpoint || `https://mediaconvert.${region}.amazonaws.com`;

    this.roleArn = this.configService.get<string>('AWS_MEDIACONVERT_ROLE_ARN') || '';
    // Bucket name is always taken from AWS_S3_BUCKET; you point this env var
    // to the correct bucket per environment (dev/staging/prod).
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';

    this.roleArnMissing = !this.roleArn;

    this.client = new MediaConvertClient({
      region,
      endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.region = region;
  }

  private region: string;
  private roleArnMissing: boolean;

  /**
   * Log MediaConvert provider status (called from main.ts after startup)
   */
  logStatus(): void {
    if (this.roleArnMissing) {
      this.logger.warn(colors.yellow(`⚠️ AWS_MEDIACONVERT_ROLE_ARN not set - MediaConvert will fail if used`));
    } else {
      this.logger.log(colors.green(`✅ MediaConvert provider initialized (region: ${this.region}, bucket: ${this.bucketName})`));
    }
  }

  async transcode(options: TranscodeOptions): Promise<TranscodeOutput> {
    const { sourceS3Key, hlsS3Prefix } = options;

    try {
      // Note: MediaConvert always reads from S3, can't use localFilePath
      // If localFilePath was provided, it was already uploaded to S3 by the caller

      this.logger.log(colors.blue(`🚀 Submitting MediaConvert job for: ${sourceS3Key}`));

      // Create the job
      const jobId = await this.createJob(sourceS3Key, hlsS3Prefix);
      this.logger.log(colors.cyan(`📋 MediaConvert job created: ${jobId}`));

      // Wait for completion
      this.logger.log(colors.blue(`⏳ Waiting for MediaConvert job to complete...`));
      await this.waitForJobCompletion(jobId);

      this.logger.log(colors.green(`✅ MediaConvert job completed: ${jobId}`));
      return { success: true };
    } catch (error) {
      this.logger.error(colors.red(`❌ MediaConvert error: ${error.message}`));
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a MediaConvert job for HLS transcoding
   */
  private async createJob(sourceS3Key: string, hlsS3Prefix: string): Promise<string> {
    const inputUri = `s3://${this.bucketName}/${sourceS3Key}`;
    // Use a fixed base name 'main' so outputs are consistently named:
    // main.m3u8 (master), main_1080p.m3u8, main_1080p_00001.ts, etc.
    // This matches what hls-transcode.service.ts expects (getMasterPlaylistFilename returns 'main.m3u8')
    const outputUri = `s3://${this.bucketName}/${hlsS3Prefix}/main`;

    // Build output groups for each resolution
    const outputs = this.resolutions.map((res) => ({
      ContainerSettings: {
        Container: ContainerType.M3U8,
        M3u8Settings: {
          AudioFramesPerPes: 4,
          PcrControl: 'PCR_EVERY_PES_PACKET' as const,
          PmtPid: 480,
          PrivateMetadataPid: 503,
          ProgramNumber: 1,
          PatInterval: 0,
          PmtInterval: 0,
          VideoPid: 481,
          AudioPids: [482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492],
        },
      },
      VideoDescription: {
        Width: res.width,
        Height: res.height,
        CodecSettings: {
          Codec: VideoCodec.H_264,
          H264Settings: {
            RateControlMode: H264RateControlMode.CBR,
            Bitrate: parseInt(res.videoBitrate) * 1000,
            CodecProfile: H264CodecProfile.MAIN,
            CodecLevel: H264CodecLevel.AUTO,
            QualityTuningLevel: H264QualityTuningLevel.SINGLE_PASS,
            FramerateControl: H264FramerateControl.INITIALIZE_FROM_SOURCE,
            GopSize: 2,
            GopSizeUnits: H264GopSizeUnits.SECONDS,
          },
        },
        ScalingBehavior: ScalingBehavior.DEFAULT,
        AntiAlias: AntiAlias.ENABLED,
      },
      AudioDescriptions: [
        {
          CodecSettings: {
            Codec: AudioCodec.AAC,
            AacSettings: {
              Bitrate: parseInt(res.audioBitrate) * 1000,
              CodingMode: AacCodingMode.CODING_MODE_2_0,
              SampleRate: 48000,
            },
          },
        },
      ],
      NameModifier: `_${res.name}`,
    }));

    const command = new CreateJobCommand({
      Role: this.roleArn,
      Settings: {
        Inputs: [
          {
            FileInput: inputUri,
            AudioSelectors: {
              'Audio Selector 1': {
                DefaultSelection: AudioDefaultSelection.DEFAULT,
              },
            },
            VideoSelector: {},
            TimecodeSource: InputTimecodeSource.ZEROBASED,
          },
        ],
        OutputGroups: [
          {
            Name: 'HLS Group',
            OutputGroupSettings: {
              Type: OutputGroupType.HLS_GROUP_SETTINGS,
              HlsGroupSettings: {
                Destination: outputUri,
                SegmentLength: 6,
                MinSegmentLength: 0,
                ManifestDurationFormat: HlsManifestDurationFormat.INTEGER,
                OutputSelection: HlsOutputSelection.MANIFESTS_AND_SEGMENTS,
                SegmentControl: HlsSegmentControl.SEGMENTED_FILES,
                StreamInfResolution: HlsStreamInfResolution.INCLUDE,
              },
            },
            Outputs: outputs,
          },
        ],
        TimecodeConfig: {
          Source: TimecodeSource.ZEROBASED,
        },
      },
    });

    const response = await this.client.send(command);

    if (!response.Job?.Id) {
      throw new Error('MediaConvert did not return a job ID');
    }

    return response.Job.Id;
  }

  /**
   * Poll MediaConvert until job completes or fails
   */
  private async waitForJobCompletion(jobId: string): Promise<void> {
    const maxWaitTime = 60 * 60 * 1000; // 1 hour max
    const pollInterval = 10000; // 10 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const command = new GetJobCommand({ Id: jobId });
      const response = await this.client.send(command);
      const status = response.Job?.Status;

      this.logger.debug(colors.cyan(`📊 Job ${jobId} status: ${status}`));

      switch (status) {
        case JobStatus.COMPLETE:
          return;
        case JobStatus.ERROR:
          throw new Error(`MediaConvert job failed: ${response.Job?.ErrorMessage || 'Unknown error'}`);
        case JobStatus.CANCELED:
          throw new Error('MediaConvert job was canceled');
        case JobStatus.SUBMITTED:
        case JobStatus.PROGRESSING:
          // Still running, wait and poll again
          await this.sleep(pollInterval);
          break;
        default:
          this.logger.warn(colors.yellow(`⚠️ Unknown job status: ${status}`));
          await this.sleep(pollInterval);
      }
    }

    throw new Error(`MediaConvert job timed out after ${maxWaitTime / 60000} minutes`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
