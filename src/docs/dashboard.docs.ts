import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export const GetDirectorDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get director dashboard data',
    description: 'Fetch comprehensive dashboard data for the authenticated director including statistics, recent activities, and school overview'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Dashboard data fetched successfully' },
        data: {
          type: 'object',
          properties: {
            total_students: { type: 'number', example: 150 },
            total_teachers: { type: 'number', example: 25 },
            total_classes: { type: 'number', example: 12 },
            recent_activities: { type: 'array' },
            school_stats: { type: 'object' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
}; 