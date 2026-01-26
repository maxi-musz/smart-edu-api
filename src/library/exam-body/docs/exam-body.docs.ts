import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const LibraryExamBodyDocs = {
  findAll: {
    operation: ApiOperation({
      summary: 'List exam bodies for library owners',
      description:
        'Returns active exam bodies with their subjects and years for the authenticated library user.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Exam bodies retrieved successfully',
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
  findOne: {
    operation: ApiOperation({
      summary: 'Get a single exam body',
      description:
        'Returns an exam body with its subjects and years for the authenticated library user.',
    }),
    param: ApiParam({
      name: 'id',
      description: 'Exam body ID',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Exam body retrieved successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Exam body not found',
    }),
  },
};
