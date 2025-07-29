import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export const GetAllClassesDocs = {
  operation: ApiOperation({
    summary: 'Get all classes',
    description: 'Fetch all classes for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Classes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Classes fetched successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'class-uuid' },
              name: { type: 'string', example: 'JSS 1A' },
              school_id: { type: 'string', example: 'school-uuid' },
              created_at: { type: 'string', example: '2024-01-01T00:00:00Z' },
              updated_at: { type: 'string', example: '2024-01-01T00:00:00Z' }
            }
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