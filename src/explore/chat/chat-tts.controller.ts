import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../../school/auth/guard';
import { TextToSpeechService } from './services/text-to-speech.service';
import { TextToSpeechDto } from './dto/text-to-speech.dto';
import { ChatTTSDocs } from './docs/chat-tts.docs';

@ApiTags('Explore Chat - Text to Speech')
@Controller('explore/chat/tts')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ChatTTSController {
  constructor(private readonly ttsService: TextToSpeechService) {}

  @Post('speak')
  @HttpCode(HttpStatus.OK)
  @ChatTTSDocs.textToSpeech()
  @Header('Content-Type', 'audio/mpeg')
  async textToSpeech(
    @Request() req: any,
    @Body() dto: TextToSpeechDto,
    @Res() res: Response,
  ) {
    try {
      // Use streaming for better performance - starts sending audio immediately
      const audioStream = await this.ttsService.textToSpeechStream(dto.text, {
        voice: dto.voice,
        speed: dto.speed,
        language: dto.language,
      });

      // Set headers for streaming audio response
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.setHeader('Transfer-Encoding', 'chunked'); // Enable streaming

      // Type cast to Node.js Readable stream
      const nodeStream = audioStream as unknown as Readable;
      
      // Track stream completion for logging
      let streamBytes = 0;
      nodeStream.on('data', (chunk: Buffer) => {
        streamBytes += chunk.length;
      });
      
      nodeStream.on('end', () => {
        console.log(`[TTS Controller] Stream completed: ${streamBytes} bytes sent to client`);
      });
      
      // Pipe the stream directly to response
      nodeStream.pipe(res);
      
      // Handle stream errors
      nodeStream.on('error', (error: any) => {
        console.error('[TTS Controller] Stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            statusCode: 500,
            message: `TTS stream error: ${error.message}`,
            error: 'Internal Server Error',
          });
        }
      });
      
      // Handle response finish (all data sent)
      res.on('finish', () => {
        console.log(`[TTS Controller] Response finished: ${streamBytes} bytes sent`);
      });
      
      // Handle response close (client disconnects)
      // Note: When response closes, the pipe will automatically clean up the stream
      res.on('close', () => {
        console.log(`[TTS Controller] Response closed by client`);
        // Check if stream has destroy method (Node.js Readable stream)
        if (nodeStream && typeof nodeStream.destroy === 'function' && !nodeStream.destroyed) {
          nodeStream.destroy();
        }
      });
    } catch (error: any) {
      throw error;
    }
  }

  @Post('voices')
  @HttpCode(HttpStatus.OK)
  @ChatTTSDocs.getAvailableVoices()
  getAvailableVoices() {
    const voices = this.ttsService.getAvailableVoices();
    return {
      success: true,
      message: 'Available voices retrieved successfully',
      data: voices,
    };
  }
}
