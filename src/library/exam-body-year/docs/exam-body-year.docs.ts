import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateLibraryExamBodyYearDto, UpdateLibraryExamBodyYearDto } from '../dto';

export const LibraryExamBodyYearDocs = {
  create: {
    operation: ApiOperation({
      summary: 'Create exam body year (library)',
      description: 'Creates a year under an exam body.',
    }),
    body: ApiBody({
      description: 'Year creation payload',
      type: CreateLibraryExamBodyYearDto,
    }),
    response201: ApiResponse({
      status: 201,
      description: 'Year created successfully',
    }),
    response400: ApiResponse({
      status: 400,
      description: 'Bad request - invalid data',
    }),
  },
  findAll: {
    operation: ApiOperation({
      summary: 'List years for an exam body (library)',
      description: 'Returns years under an exam body.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Years retrieved successfully',
    }),
  },
  findOne: {
    operation: ApiOperation({
      summary: 'Get a year (library)',
      description: 'Returns a year by ID.',
    }),
    param: ApiParam({
      name: 'id',
      description: 'Year ID',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Year retrieved successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Year not found',
    }),
  },
  update: {
    operation: ApiOperation({
      summary: 'Update exam body year (library)',
      description: 'Updates a year under an exam body.',
    }),
    body: ApiBody({
      description: 'Year update payload',
      type: UpdateLibraryExamBodyYearDto,
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Year updated successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Year not found',
    }),
  },
  remove: {
    operation: ApiOperation({
      summary: 'Delete exam body year (library)',
      description: 'Deletes a year by ID.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Year deleted successfully',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Year not found',
    }),
  },
};
