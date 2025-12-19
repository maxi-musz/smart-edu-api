import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetLibraryUserProfileDocs = {
  operation: ApiOperation({
    summary: 'Get library user profile',
    description:
      'Retrieve the authenticated library user profile information including user details and associated library platform. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the user profile.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library user profile retrieved successfully',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Library user not found',
  }),
};

