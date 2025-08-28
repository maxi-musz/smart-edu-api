import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';

export class AcademicSessionDocs {
  static get bearerAuth() {
    return ApiBearerAuth('JWT-auth');
  }

  // Create academic session
  static get createOperation() {
    return ApiOperation({
      summary: 'Create academic session',
      description: 'Create a new academic session for a school'
    });
  }

  static get createResponse201() {
    return ApiResponse({
      status: 201,
      description: 'Academic session created successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Academic session created successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'session-uuid' },
              school_id: { type: 'string', example: 'school-uuid' },
              academic_year: { type: 'string', example: '2024/2025' },
              start_year: { type: 'number', example: 2024 },
              end_year: { type: 'number', example: 2025 },
              term: { type: 'string', example: 'first', enum: ['first', 'second', 'third'] },
              start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z' },
              end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z' },
              status: { type: 'string', example: 'active', enum: ['active', 'inactive', 'completed'] },
              is_current: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' }
            }
          },
          statusCode: { type: 'number', example: 201 }
        }
      }
    });
  }

  // Get all academic sessions
  static get findAllOperation() {
    return ApiOperation({
      summary: 'Get all academic sessions',
      description: 'Retrieve all academic sessions with pagination and filtering'
    });
  }

  static get findAllQueries() {
    return applyDecorators(
      ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
      ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
      ApiQuery({ name: 'search', required: false, type: String, example: '2024' }),
      ApiQuery({ name: 'school_id', required: false, type: String, example: 'school-uuid' }),
      ApiQuery({ name: 'term', required: false, enum: ['first', 'second', 'third'], example: 'first' }),
      ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'completed'], example: 'active' }),
      ApiQuery({ name: 'is_current', required: false, type: Boolean, example: true }),
      ApiQuery({ name: 'sort_by', required: false, type: String, example: 'createdAt' }),
      ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'], example: 'desc' })
    );
  }

  static get findAllResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Academic sessions retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Academic sessions retrieved successfully' },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'session-uuid' },
                school_id: { type: 'string', example: 'school-uuid' },
                academic_year: { type: 'string', example: '2024/2025' },
                start_year: { type: 'number', example: 2024 },
                end_year: { type: 'number', example: 2025 },
                term: { type: 'string', example: 'first' },
                start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z' },
                end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z' },
                status: { type: 'string', example: 'active' },
                is_current: { type: 'boolean', example: true },
                createdAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' }
              }
            }
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 25 },
              total_pages: { type: 'number', example: 3 }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Get academic session by ID
  static get findOneOperation() {
    return ApiOperation({
      summary: 'Get academic session by ID',
      description: 'Retrieve a specific academic session by its ID'
    });
  }

  static get findOneParam() {
    return ApiParam({
      name: 'id',
      description: 'Academic session ID',
      example: 'session-uuid'
    });
  }

  static get findOneResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Academic session retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Academic session retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'session-uuid' },
              school_id: { type: 'string', example: 'school-uuid' },
              academic_year: { type: 'string', example: '2024/2025' },
              start_year: { type: 'number', example: 2024 },
              end_year: { type: 'number', example: 2025 },
              term: { type: 'string', example: 'first' },
              start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z' },
              end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z' },
              status: { type: 'string', example: 'active' },
              is_current: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Update academic session
  static get updateOperation() {
    return ApiOperation({
      summary: 'Update academic session',
      description: 'Update an existing academic session'
    });
  }

  static get updateResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Academic session updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Academic session updated successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'session-uuid' },
              school_id: { type: 'string', example: 'school-uuid' },
              academic_year: { type: 'string', example: '2024/2025' },
              start_year: { type: 'number', example: 2024 },
              end_year: { type: 'number', example: 2025 },
              term: { type: 'string', example: 'first' },
              start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z' },
              end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z' },
              status: { type: 'string', example: 'active' },
              is_current: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Delete academic session
  static get deleteOperation() {
    return ApiOperation({
      summary: 'Delete academic session',
      description: 'Delete an academic session by ID'
    });
  }

  static get deleteResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Academic session deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Academic session deleted successfully' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Get current session
  static get getCurrentSessionOperation() {
    return ApiOperation({
      summary: 'Get current academic session',
      description: 'Get the current active academic session for a school'
    });
  }

  static get getCurrentSessionResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Current academic session retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Current academic session retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'session-uuid' },
              school_id: { type: 'string', example: 'school-uuid' },
              academic_year: { type: 'string', example: '2024/2025' },
              start_year: { type: 'number', example: 2024 },
              end_year: { type: 'number', example: 2025 },
              term: { type: 'string', example: 'first' },
              start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z' },
              end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z' },
              status: { type: 'string', example: 'active' },
              is_current: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z' }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Common error responses
  static get response400() {
    return ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid input data' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 400 }
        }
      }
    });
  }

  static get response401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing authentication token',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Unauthorized' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 401 }
        }
      }
    });
  }

  static get response404() {
    return ApiResponse({
      status: 404,
      description: 'Not found - Academic session not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Academic session not found' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 404 }
        }
      }
    });
  }

  static get response500() {
    return ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Internal server error' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 500 }
        }
      }
    });
  }
}
