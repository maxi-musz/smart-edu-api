import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export class SessionAndTermDocs {
  static get bearerAuth() {
    return ApiBearerAuth('JWT-auth');
  }

  // Create Academic Session
  static get createOperation() {
    return ApiOperation({
      summary: 'Create a new academic session',
      description: 'Create a new academic session for a school. This endpoint automatically creates the specified number of terms (defaults to 3) for the academic year. Terms are evenly distributed across the academic year period. Schools can choose 1, 2, or 3 terms based on their preference.'
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
              academic_year: { type: 'string', example: '2024/2025' },
              terms: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'cmiu4ti1y0004mkcywi8w62s2' },
                    school_id: { type: 'string', example: 'cmiu4ti150000mkcyxggp8dik' },
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
                }
              }
            }
          },
          statusCode: { type: 'number', example: 201 }
        }
      }
    });
  }

  static get createResponse400() {
    return ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error or duplicate session',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { 
            type: 'string', 
            example: 'Academic session with this year already exists. Please delete existing sessions first.' 
          },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 400 }
        }
      }
    });
  }

  static get createResponse401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
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

  static get createResponse500() {
    return ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to create academic session: [error message]' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 500 }
        }
      }
    });
  }

  // Update Academic Session
  static get updateSessionOperation() {
    return ApiOperation({
      summary: 'Update an academic session',
      description: 'Update an academic session (all terms). Can update start_date, end_date, and set as active session. If is_current is set to true, the first term is automatically set as the active term.'
    });
  }

  static get updateSessionResponse200() {
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
              academic_year: { type: 'string', example: '2024/2025' },
              terms: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'cmiu4ti1y0004mkcywi8w62s2' },
                    school_id: { type: 'string', example: 'cmiu4ti150000mkcyxggp8dik' },
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
                }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  static get updateSessionResponse400() {
    return ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { 
            type: 'string', 
            example: 'Start date and end date must have at least 30 days between them' 
          },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 400 }
        }
      }
    });
  }

  static get updateSessionResponse404() {
    return ApiResponse({
      status: 404,
      description: 'Academic session not found',
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

  static get updateSessionResponse401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
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

  static get updateSessionResponse500() {
    return ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to update academic session: [error message]' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 500 }
        }
      }
    });
  }

  // Update Term
  static get updateTermOperation() {
    return ApiOperation({
      summary: 'Update a specific term',
      description: 'Update a specific term. Can update start_date, end_date, and set as active term. If is_current is set to true, all other terms in the session are deactivated.'
    });
  }

  static get updateTermResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Term updated successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Term updated successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'cmiu4ti1y0004mkcywi8w62s2' },
              school_id: { type: 'string', example: 'cmiu4ti150000mkcyxggp8dik' },
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
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  static get updateTermResponse400() {
    return ApiResponse({
      status: 400,
      description: 'Bad Request - Validation error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { 
            type: 'string', 
            example: 'Start date and end date must have at least 30 days between them' 
          },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 400 }
        }
      }
    });
  }

  static get updateTermResponse404() {
    return ApiResponse({
      status: 404,
      description: 'Term not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Term not found' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 404 }
        }
      }
    });
  }

  static get updateTermResponse401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
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

  static get updateTermResponse500() {
    return ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to update term: [error message]' },
          data: { type: 'null', example: null },
          statusCode: { type: 'number', example: 500 }
        }
      }
    });
  }
}

