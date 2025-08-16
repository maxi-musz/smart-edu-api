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
          type: 'object',
          properties: {
            classes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'class-uuid' },
                  name: { type: 'string', example: 'JSS 1A' },
                  classTeacher: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string', example: 'teacher-uuid' },
                      first_name: { type: 'string', example: 'John' },
                      last_name: { type: 'string', example: 'Doe' },
                      display_picture: { type: 'string', example: 'https://example.com/profile.jpg', nullable: true }
                    }
                  }
                }
              }
            },
            teachers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'teacher-uuid' },
                  first_name: { type: 'string', example: 'John' },
                  last_name: { type: 'string', example: 'Doe' },
                  display_picture: { type: 'string', example: 'https://example.com/profile.jpg', nullable: true },
                  email: { type: 'string', example: 'john.doe@school.com' },
                  phone_number: { type: 'string', example: '+2348012345678' }
                }
              }
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

export const CreateClassDocs = {
  operation: ApiOperation({
    summary: 'Create a new class',
    description: 'Create a new class for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Class created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Class "JSS 1A" created successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'class-uuid' },
            name: { type: 'string', example: 'JSS 1A' },
            classTeacher: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'teacher-uuid' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                display_picture: { type: 'string', example: 'https://example.com/profile.jpg', nullable: true },
                email: { type: 'string', example: 'john.doe@school.com' },
                phone_number: { type: 'string', example: '+2348012345678' }
              }
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00Z' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad Request - Class name already exists or invalid teacher ID',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'A class with the name "JSS 1A" already exists in this school' },
        data: { type: 'null', example: null },
        statusCode: { type: 'number', example: 400 }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
};

export const EditClassDocs = {
  operation: ApiOperation({
    summary: 'Edit a class',
    description: 'Edit the name of an existing class for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Class updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Class updated successfully to "JSS 1B"' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'class-uuid' },
            name: { type: 'string', example: 'JSS 1B' },
            classTeacher: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'teacher-uuid' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                display_picture: { type: 'string', example: 'https://example.com/profile.jpg', nullable: true },
                email: { type: 'string', example: 'john.doe@school.com' },
                phone_number: { type: 'string', example: '+2348012345678' }
              }
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00Z' },
            updatedAt: { type: 'string', example: '2024-01-01T00:00:00Z' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad Request - Class not found or name already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'A class with the name "JSS 1B" already exists in this school' },
        data: { type: 'null', example: null },
        statusCode: { type: 'number', example: 400 }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
};