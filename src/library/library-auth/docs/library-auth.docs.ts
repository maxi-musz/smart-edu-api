import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const LibraryAuthDocs = {
  signIn: {
    operation: ApiOperation({
      summary: 'Sign in as a public library user',
      description:
        'Authenticate a public library user (e.g. library owner/manager) using email and password. ' +
        'Returns the authenticated library user (without password) wrapped in { success, message, data }.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Library user signed in successfully',
    }),
  },
};


