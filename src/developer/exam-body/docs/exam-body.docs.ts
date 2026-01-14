import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

export class ExamBodyDocs {
  static create() {
    return applyDecorators(
      ApiOperation({
        summary: 'Create a new examination body',
        description: 'Creates a new Nigerian examination body (WAEC, JAMB, NECO, etc.) with icon upload',
      }),
      ApiBody({
        description: 'Exam body data with icon file',
        schema: {
          type: 'object',
          required: ['name', 'fullName', 'code', 'icon'],
          properties: {
            name: { 
              type: 'string', 
              description: 'Short name of the exam body',
              example: 'WAEC',
            },
            fullName: { 
              type: 'string', 
              description: 'Full official name',
              example: 'West African Examinations Council',
            },
            code: { 
              type: 'string', 
              description: 'Unique code',
              example: 'WAEC',
            },
            description: { 
              type: 'string', 
              description: 'Description of the exam body (optional)',
              example: 'Conducts standardized examinations in West Africa',
            },
            websiteUrl: { 
              type: 'string', 
              description: 'Official website URL (optional)',
              example: 'https://www.waecgh.org',
            },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive', 'archived'],
              description: 'Status of the exam body (optional)',
              default: 'active',
            },
            icon: { 
              type: 'string', 
              format: 'binary', 
              description: 'Icon file (JPEG, PNG, GIF, WEBP, SVG - max 2MB) **REQUIRED**',
            },
          },
        },
      }),
      ApiResponse({
        status: 201,
        description: 'Exam body created successfully',
        schema: {
          example: {
            success: true,
            message: 'Exam body created successfully',
            data: {
              id: 'exambody_123',
              name: 'WAEC',
              fullName: 'West African Examinations Council',
              code: 'WAEC',
              description: 'Conducts standardized examinations in West Africa',
              logoUrl: 'https://s3.amazonaws.com/exam-bodies/icons/WAEC_1234567890_icon.png',
              websiteUrl: 'https://www.waecgh.org',
              status: 'active',
              createdAt: '2026-01-14T10:00:00.000Z',
              updatedAt: '2026-01-14T10:00:00.000Z',
            },
          },
        },
      }),
      ApiResponse({
        status: 400,
        description: 'Bad request - Icon file missing or invalid',
      }),
      ApiResponse({
        status: 409,
        description: 'Exam body with the same name or code already exists',
      }),
    );
  }

  static findAll() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all examination bodies',
        description: 'Retrieves a list of all registered examination bodies',
      }),
      ApiResponse({
        status: 200,
        description: 'Exam bodies retrieved successfully',
      }),
    );
  }

  static findOne() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get a specific examination body',
        description: 'Retrieves details of a specific examination body by ID',
      }),
      ApiParam({
        name: 'id',
        description: 'Exam body ID',
        type: String,
      }),
      ApiResponse({
        status: 200,
        description: 'Exam body retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
    );
  }

  static update() {
    return applyDecorators(
      ApiOperation({
        summary: 'Update an examination body',
        description: 'Updates details of an existing examination body. Icon file is optional.',
      }),
      ApiParam({
        name: 'id',
        description: 'Exam body ID',
        type: String,
      }),
      ApiBody({
        description: 'Exam body data (all fields optional, including icon)',
        schema: {
          type: 'object',
          properties: {
            name: { 
              type: 'string', 
              description: 'Short name of the exam body',
              example: 'WAEC Nigeria',
            },
            fullName: { 
              type: 'string', 
              description: 'Full official name',
              example: 'West African Examinations Council - Nigeria',
            },
            code: { 
              type: 'string', 
              description: 'Unique code',
              example: 'WAEC-NG',
            },
            description: { 
              type: 'string', 
              description: 'Description of the exam body',
              example: 'Updated description',
            },
            websiteUrl: { 
              type: 'string', 
              description: 'Official website URL',
              example: 'https://www.waecnigeria.org',
            },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive', 'archived'],
              description: 'Status of the exam body',
            },
            icon: { 
              type: 'string', 
              format: 'binary', 
              description: 'New icon file (JPEG, PNG, GIF, WEBP, SVG - max 2MB) - Optional',
            },
          },
        },
      }),
      ApiResponse({
        status: 200,
        description: 'Exam body updated successfully',
      }),
      ApiResponse({
        status: 400,
        description: 'Bad request - Invalid icon file',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
      ApiResponse({
        status: 409,
        description: 'Exam body with the same name or code already exists',
      }),
    );
  }

  static remove() {
    return applyDecorators(
      ApiOperation({
        summary: 'Delete an examination body',
        description: 'Permanently deletes an examination body',
      }),
      ApiParam({
        name: 'id',
        description: 'Exam body ID',
        type: String,
      }),
      ApiResponse({
        status: 200,
        description: 'Exam body deleted successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
    );
  }
}

