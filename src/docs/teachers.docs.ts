import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export const GetTeachersDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get teachers dashboard',
    description: 'Fetch teachers dashboard data including statistics and overview for the authenticated director'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Teachers dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teachers dashboard data fetched successfully' },
        data: {
          type: 'object',
          properties: {
            total_teachers: { type: 'number', example: 25 },
            teachers_by_subject: { type: 'object' },
            recent_hires: { type: 'array' },
            performance_stats: { type: 'object' }
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