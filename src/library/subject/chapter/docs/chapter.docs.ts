import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateChapterDto, UpdateChapterDto } from '../dto/chapter.dto';

export const CreateChapterDocs = {
  operation: ApiOperation({
    summary: 'Create a new chapter',
    description:
      'Create a new chapter under a specific library subject for the authenticated library user\'s platform. ' +
      'The chapter will be associated with the user\'s platform and the specified subject. ' +
      'Chapters are used to organize topics within a subject, similar to how Udemy organizes course content. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the created chapter with subject information.',
  }),

  body: ApiBody({
    description: 'Chapter creation data',
    type: CreateChapterDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Chapter created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
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

export const UpdateChapterDocs = {
  operation: ApiOperation({
    summary: 'Update a chapter',
    description:
      'Update chapter details (title, description, order, is_active) for the authenticated library user\'s platform. ' +
      'Only provided fields will be updated. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the updated chapter with subject information.',
  }),

  body: ApiBody({
    description: 'Chapter update data (all fields optional)',
    type: UpdateChapterDto,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Chapter updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found or chapter not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

