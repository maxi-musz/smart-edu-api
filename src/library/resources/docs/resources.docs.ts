import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetResourcesDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get library resources dashboard',
    description:
      'Retrieve comprehensive dashboard data for library resources filtered by the authenticated user\'s platform. ' +
      'This endpoint provides a complete overview of resources (classes, subjects, topics, videos, and materials) ' +
      'for the specific library platform that the logged-in user belongs to. ' +
      'Includes all library classes with their associated subjects and resource counts, all videos and materials with ' +
      'uploader information, and comprehensive statistics for dashboard UI. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains platform info, statistics, library classes with breakdowns, ' +
      'all resources, subjects, and topics for the user\'s platform.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Resources dashboard retrieved successfully',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Library user or platform not found',
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to retrieve resources dashboard data',
  }),
};

export const GetResourcesByClassDocs = {
  operation: ApiOperation({
    summary: 'Get library resources by class',
    description:
      'Retrieve all resources (subjects, topics, videos, and materials) for a specific library class, ' +
      'filtered by the authenticated user\'s platform. ' +
      'Returns all subjects that belong to the specified class and the user\'s platform, ' +
      'along with all topics for each subject, and all videos and materials for each topic. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains platform info, class info, ' +
      'subjects with their topics, videos, and materials, and statistics.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Class resources retrieved successfully',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Library user, platform, or class not found',
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to retrieve class resources',
  }),
};

