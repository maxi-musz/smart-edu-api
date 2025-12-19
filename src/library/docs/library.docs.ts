import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetLibraryDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get library owner dashboard',
    description:
      'Retrieve comprehensive dashboard data for a library platform including all content (videos and materials), ' +
      'statistics, and the current user\'s activity. This provides a complete overview of the entire library, ' +
      'not just the logged-in user\'s content. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains library info, statistics, all content, and user activity.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Library dashboard retrieved successfully',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Library user or platform not found',
  }),
};

