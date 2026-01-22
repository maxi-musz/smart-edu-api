import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TextToSpeechDto } from '../dto/text-to-speech.dto';

export class ChatTTSDocs {
  static textToSpeech() {
    return applyDecorators(
      ApiOperation({
        summary: 'Convert text to speech',
        description:
          'Converts the provided text to speech audio. Returns MP3 audio file. ' +
          'Frontend should send the response text from the chat, and this endpoint will return the audio.',
      }),
      ApiBody({
        type: TextToSpeechDto,
        description: 'Text to convert to speech with optional voice, speed, and language settings',
      }),
      ApiResponse({
        status: 200,
        description: 'Audio file generated successfully',
        content: {
          'audio/mpeg': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: 'Bad request - invalid text or parameters',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - invalid or missing JWT token',
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  static getAvailableVoices() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get available voices',
        description: 'Returns a list of available voices for text-to-speech',
      }),
      ApiResponse({
        status: 200,
        description: 'Available voices retrieved successfully',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  value: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
      }),
    );
  }
}
