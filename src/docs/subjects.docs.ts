import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

export const GetAllSubjectsDocs = {
  operation: ApiOperation({
    summary: 'Get all subjects',
    description: 'Fetch all subjects for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Subjects retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subjects fetched successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'subject-uuid' },
              subject_name: { type: 'string', example: 'Mathematics' },
              code: { type: 'string', example: 'MATH101' },
              color: { type: 'string', example: '#FF5733' },
              description: { type: 'string', example: 'Advanced mathematics' },
              school_id: { type: 'string', example: 'school-uuid' }
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

export const CreateSubjectDocs = {
  operation: ApiOperation({
    summary: 'Create a new subject',
    description: 'Create a new subject for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Subject created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subject created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'subject-uuid' },
            subject_name: { type: 'string', example: 'Mathematics' },
            code: { type: 'string', example: 'MATH101' },
            color: { type: 'string', example: '#FF5733' },
            description: { type: 'string', example: 'Advanced mathematics' },
            school_id: { type: 'string', example: 'school-uuid' }
          }
        },
        statusCode: { type: 'number', example: 201 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
};

export const EditSubjectDocs = {
  operation: ApiOperation({
    summary: 'Edit a subject',
    description: 'Edit an existing subject for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Subject ID',
    example: 'subject-uuid'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subject updated successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'subject-uuid' },
            subject_name: { type: 'string', example: 'Mathematics' },
            code: { type: 'string', example: 'MATH101' },
            color: { type: 'string', example: '#FF5733' },
            description: { type: 'string', example: 'Advanced mathematics' },
            school_id: { type: 'string', example: 'school-uuid' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Subject not found'
  })
}; 