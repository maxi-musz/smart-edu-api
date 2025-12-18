import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const CreateLibraryClassDevDocs = {
  operation: ApiOperation({
    summary: 'Create a library class (developer only)',
    description:
      'Create a canonical library class in the Smart Edu public library. ' +
      'Individual schools will later attach to these classes instead of defining their own.',
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Library class created successfully',
  }),
};

export const ListLibraryClassDevDocs = {
  operation: ApiOperation({
    summary: 'List library classes (developer only)',
    description: 'Fetch all canonical library classes available in the public library.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library classes retrieved successfully',
  }),
};

export const GetLibraryClassDevDocs = {
  operation: ApiOperation({
    summary: 'Get a single library class (developer only)',
    description: 'Fetch a library class by its ID, including attached subjects.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library class retrieved successfully',
  }),
};

export const UpdateLibraryClassDevDocs = {
  operation: ApiOperation({
    summary: 'Update a library class (developer only)',
    description: 'Update name or order of a library class.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library class updated successfully',
  }),
};

export const DeleteLibraryClassDevDocs = {
  operation: ApiOperation({
    summary: 'Delete a library class (developer only)',
    description: 'Delete a library class by its ID.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library class deleted successfully',
  }),
};


