import { ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/subject.dto';

export const CreateSubjectDocs = {
  operation: ApiOperation({
    summary: 'Create a new subject',
    description:
      'Create a new subject under a specific library class for the authenticated library user\'s platform. ' +
      'The subject will be associated with the user\'s platform and the specified class. ' +
      'Subject code must be unique within the platform if provided. ' +
      'An optional thumbnail image can be uploaded (JPEG, PNG, GIF, WEBP - max 5MB). ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the created subject with class information.',
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'Subject creation data with optional thumbnail',
    type: CreateSubjectDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Subject created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error or subject code already exists',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found or class not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const UpdateSubjectDocs = {
  operation: ApiOperation({
    summary: 'Update a subject',
    description:
      'Update subject details (name, code, color, description) for the authenticated library user\'s platform. ' +
      'Only provided fields will be updated. Subject code must be unique within the platform if changed. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the updated subject with class information.',
  }),

  body: ApiBody({
    description: 'Subject update data (all fields optional)',
    type: UpdateSubjectDto,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error or subject code already exists',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found or subject not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const UpdateSubjectThumbnailDocs = {
  operation: ApiOperation({
    summary: 'Update subject thumbnail',
    description:
      'Update the thumbnail image for a subject. The new thumbnail will replace the existing one in storage. ' +
      'The old thumbnail will be automatically deleted after successful update. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the updated subject with class information.',
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'Thumbnail image file (JPEG, PNG, GIF, WEBP - max 5MB)',
    schema: {
      type: 'object',
      properties: {
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Thumbnail image file',
        },
      },
    },
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Subject thumbnail updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - invalid file type or file size exceeds limit',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found or subject not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

