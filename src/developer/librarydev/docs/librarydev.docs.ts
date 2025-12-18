import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const CreateLibraryDevDocs = {
  operation: ApiOperation({
    summary: 'Onboard a new public library (developer only)',
    description:
      'Onboard a new Smart Edu public library. ' +
      'Requires a unique library name and slug. Returns the created library wrapped in { success, message, data }. ',
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Library onboarded successfully',
  }),
};

export const ListLibraryDevDocs = {
  operation: ApiOperation({
    summary: 'List all public libraries (developer only)',
    description:
      'Fetch all onboarded Smart Edu public libraries, ordered by most recently created. ' +
      'Response is wrapped in { success, message, data } where data is an array of libraries.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Libraries retrieved successfully',
  }),
};

export const GetLibraryDevDocs = {
  operation: ApiOperation({
    summary: 'Get a single public library (developer only)',
    description:
      'Fetch a single public library by its ID. ' +
      'Response is wrapped in { success, message, data } where data is the library object.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library retrieved successfully',
  }),
};

export const UpdateLibraryDevDocs = {
  operation: ApiOperation({
    summary: 'Update a public library (developer only)',
    description:
      'Update the name, slug or description of an existing public library. ' +
      'Response is wrapped in { success, message, data } where data is the updated library.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library updated successfully',
  }),
};

export const DeleteLibraryDevDocs = {
  operation: ApiOperation({
    summary: 'Delete a public library (developer only)',
    description:
      'Delete a public library by its ID. ' +
      'Response is wrapped in { success, message, data } where data is null.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library deleted successfully',
  }),
};
 
export const AddLibraryOwnerDocs = {
  operation: ApiOperation({
    summary: 'Add a library owner/manager (developer only)',
    description:
      'Create a new user under a specific public library platform. ' +
      'Requires a libraryId, unique email, password, firstName and lastName. ' +
      'Email must not already exist anywhere on the platform (User, Teacher, Developer or LibraryResourceUser). ' +
      'Response is wrapped in { success, message, data } where data is the created library user (without password).',
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Library owner added successfully',
  }),
};

