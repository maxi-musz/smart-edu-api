import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const CreateLibrarySubjectDevDocs = {
  operation: ApiOperation({
    summary: 'Create a library subject (developer only)',
    description:
      'Create a subject under a LibraryPlatform, optionally grouped under a LibraryClass. ' +
      'Platforms will later attach content to these canonical subjects.',
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Library subject created successfully',
  }),
};

export const ListLibrarySubjectDevDocs = {
  operation: ApiOperation({
    summary: 'List library subjects (developer only)',
    description:
      'Fetch all subjects for a LibraryPlatform, optionally filtered by LibraryClass.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library subjects retrieved successfully',
  }),
};

export const GetLibrarySubjectDevDocs = {
  operation: ApiOperation({
    summary: 'Get a single library subject (developer only)',
    description: 'Fetch a subject by ID, including its class and topics.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library subject retrieved successfully',
  }),
};

export const UpdateLibrarySubjectDevDocs = {
  operation: ApiOperation({
    summary: 'Update a library subject (developer only)',
    description: 'Update name, code, class binding, color or description of a subject.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library subject updated successfully',
  }),
};

export const DeleteLibrarySubjectDevDocs = {
  operation: ApiOperation({
    summary: 'Delete a library subject (developer only)',
    description: 'Delete a subject by its ID.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library subject deleted successfully',
  }),
};


