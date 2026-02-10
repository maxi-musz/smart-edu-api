import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

export class ResultDocs {
  static get bearerAuth() {
    return ApiBearerAuth('JWT-auth');
  }

  static get downloadPdfOperation() {
    return ApiOperation({
      summary: 'Download result as PDF',
      description:
        'Generates and downloads the student report card as a PDF. Requires the authenticated user to belong to the same school as the result (school user) or to a platform that owns the school (library user). Only released results (released_by_school_admin) are available.',
    });
  }

  static get downloadPdfQueries() {
    return applyDecorators(
      ApiQuery({
        name: 'studentId',
        required: true,
        type: String,
        description:
          'Student identifier: either Student.id or User.id (logged-in student). Result table stores Student.id; the API accepts both for convenience.',
        example: 'clxxxxxxxxxxxxxxxxxxx',
      }),
      ApiQuery({
        name: 'academicSessionId',
        required: true,
        type: String,
        description: 'Academic session ID for which the result was released',
        example: 'clxxxxxxxxxxxxxxxxxxx',
      }),
    );
  }

  static get downloadPdfResponse200() {
    return ApiResponse({
      status: 200,
      description: 'PDF file stream (application/pdf). Filename in Content-Disposition.',
      content: {
        'application/pdf': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    });
  }

  static get response400() {
    return ApiResponse({
      status: 400,
      description: 'Bad request - Missing or invalid studentId/academicSessionId',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'studentId and academicSessionId are required' },
          statusCode: { type: 'number', example: 400 },
        },
      },
    });
  }

  static get response401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Unauthorized' },
          statusCode: { type: 'number', example: 401 },
        },
      },
    });
  }

  static get response403() {
    return ApiResponse({
      status: 403,
      description: 'Forbidden - No access to this result',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'You do not have access to this result' },
          statusCode: { type: 'number', example: 403 },
        },
      },
    });
  }

  static get response404() {
    return ApiResponse({
      status: 404,
      description: 'Not found - Result not found or not released for this student/session',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Result not found or not released' },
          statusCode: { type: 'number', example: 404 },
        },
      },
    });
  }

  static get response500() {
    return ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Internal server error' },
          statusCode: { type: 'number', example: 500 },
        },
      },
    });
  }
}
