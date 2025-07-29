import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export const GetStudentsDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get students dashboard',
    description: 'Fetch students dashboard data including statistics and overview for the authenticated director'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Students dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Students dashboard data fetched successfully' },
        data: {
          type: 'object',
          properties: {
            total_students: { type: 'number', example: 150 },
            students_by_class: { type: 'object' },
            recent_enrollments: { type: 'array' },
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