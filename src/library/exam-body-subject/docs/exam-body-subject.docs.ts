import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateLibraryExamBodySubjectDto, UpdateLibraryExamBodySubjectDto } from '../dto';

export const LibraryExamBodySubjectDocs = {
  create: {
    operation: ApiOperation({
      summary: 'Create exam body subject (library)',
      description: 'Creates a subject under an exam body. Icon is optional.',
    }),
    body: ApiBody({
      description: 'Subject creation payload',
      type: CreateLibraryExamBodySubjectDto,
    }),
    response201: ApiResponse({
      status: 201,
      description: 'Subject created successfully',
    }),
    response400: ApiResponse({
      status: 400,
      description: 'Bad request - invalid data',
    }),
    response401: ApiResponse({
      status: 401,
      description: 'Unauthorized - invalid or missing JWT token',
    }),
    response403: ApiResponse({
      status: 403,
      description: 'Forbidden - insufficient permissions',
    }),
  },
  findAll: {
    operation: ApiOperation({
      summary: 'List subjects for an exam body (library)',
      description: 'Returns subjects under an exam body.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Subjects retrieved successfully',
    }),
  },
  findOne: {
    operation: ApiOperation({
      summary: 'Get a subject (library)',
      description: 'Returns a subject by ID.',
    }),
    param: ApiParam({
      name: 'id',
      description: 'Subject ID',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Subject retrieved successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Subject not found',
    }),
  },
  update: {
    operation: ApiOperation({
      summary: 'Update exam body subject (library)',
      description: 'Updates a subject under an exam body. Icon is optional.',
    }),
    body: ApiBody({
      description: 'Subject update payload',
      type: UpdateLibraryExamBodySubjectDto,
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Subject updated successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Subject not found',
    }),
  },
  remove: {
    operation: ApiOperation({
      summary: 'Delete exam body subject (library)',
      description: 'Deletes a subject by ID.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Subject deleted successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Subject not found',
    }),
  },
};
