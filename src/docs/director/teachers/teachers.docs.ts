import { ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AddNewTeacherDto } from 'src/school/director/teachers/teacher.dto';

// Get Teachers Dashboard Documentation
export const GetTeachersDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get teachers dashboard',
    description: 'Retrieve comprehensive teachers dashboard with statistics, teacher list, and next class schedules'
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
            basic_details: {
              type: 'object',
              properties: {
                totalTeachers: { type: 'number', example: 25 },
                activeTeachers: { type: 'number', example: 23 },
                maleTeachers: { type: 'number', example: 12 },
                femaleTeachers: { type: 'number', example: 11 }
              }
            },
            teachers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'teacher-uuid-123' },
                  name: { type: 'string', example: 'John Doe' },
                  display_picture: { type: 'string', example: 'https://example.com/photo.jpg' },
                  contact: {
                    type: 'object',
                    properties: {
                      phone: { type: 'string', example: '08012345678' },
                      email: { type: 'string', example: 'john.doe@school.com' }
                    }
                  },
                  totalSubjects: { type: 'number', example: 3 },
                  classTeacher: { type: 'string', example: 'Primary 5A' },
                  nextClass: {
                    type: 'object',
                    properties: {
                      className: { type: 'string', example: 'Primary 5A' },
                      subject: { type: 'string', example: 'Mathematics' },
                      startTime: { type: 'string', example: '09:00' },
                      endTime: { type: 'string', example: '10:00' }
                    }
                  },
                  status: { type: 'string', example: 'active' }
                }
              }
            }
          }
        }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Get Classes and Subjects Documentation
export const GetClassesAndSubjectsDocs = {
  operation: ApiOperation({
    summary: 'Get classes and subjects for teacher creation',
    description: 'Fetch all available classes and subjects for creating a new teacher with proper assignments'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Classes and subjects fetched successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Classes and subjects fetched successfully' },
        data: {
          type: 'object',
          properties: {
            classes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'class-uuid-123' },
                  name: { type: 'string', example: 'Primary 5A' },
                  hasClassTeacher: { type: 'boolean', example: false },
                  classTeacher: { type: 'string', example: 'John Doe', nullable: true }
                }
              }
            },
            subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'subject-uuid-123' },
                  name: { type: 'string', example: 'Mathematics' },
                  description: { type: 'string', example: 'Advanced mathematics course', nullable: true }
                }
              }
            },
            totalClasses: { type: 'number', example: 12 },
            totalSubjects: { type: 'number', example: 8 }
          }
        }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Add New Teacher Documentation
export const AddNewTeacherDocs = {
  operation: ApiOperation({
    summary: 'Add new teacher',
    description: 'Create a new teacher with strong password generation, welcome email sending, and subject/class assignments'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  body: ApiBody({
    description: 'Teacher data for creation',
    type: AddNewTeacherDto
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Teacher created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teacher added successfully' },
        data: {
          type: 'object',
          properties: {
            teacher: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'teacher-uuid-123' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john.doe@school.com' },
                phone_number: { type: 'string', example: '08012345678' },
                role: { type: 'string', example: 'teacher' },
                status: { type: 'string', example: 'active' },
                school_id: { type: 'string', example: 'school-uuid-456' },
                createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
              }
            },
            generatedPassword: { 
              type: 'string', 
              example: 'jd1234edu@5', 
              description: 'Auto-generated password (only returned if no password was provided)',
              nullable: true 
            }
          }
        }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Missing required fields or validation failed'
  }),
  response409: ApiResponse({
    status: 409,
    description: 'Conflict - Teacher with this email already exists'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Get Teacher by ID Documentation
export const GetTeacherByIdDocs = {
  operation: ApiOperation({
    summary: 'Get teacher by ID',
    description: 'Retrieve detailed information about a specific teacher'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 'teacher-uuid-123'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Teacher details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teacher details retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'teacher-uuid-123' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', example: 'john.doe@school.com' },
            phone_number: { type: 'string', example: '08012345678' },
            display_picture: { type: 'string', example: 'https://example.com/photo.jpg' },
            status: { type: 'string', example: 'active' },
            role: { type: 'string', example: 'teacher' },
            subjectsTeaching: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'subject-uuid-123' },
                  name: { type: 'string', example: 'Mathematics' }
                }
              }
            },
            classesManaging: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'class-uuid-123' },
                  name: { type: 'string', example: 'Primary 5A' }
                }
              }
            }
          }
        }
      }
    }
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher not found'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Update Teacher Documentation
export const UpdateTeacherDocs = {
  operation: ApiOperation({
    summary: 'Update teacher information',
    description: 'Update teacher details including personal info, subjects, and class assignments'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 'teacher-uuid-123'
  }),
  body: ApiBody({
    description: 'Updated teacher data',
    type: AddNewTeacherDto
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Teacher updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teacher updated successfully' },
        data: {
          type: 'object',
          properties: {
            teacher: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'teacher-uuid-123' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                email: { type: 'string', example: 'john.doe@school.com' },
                phone_number: { type: 'string', example: '08012345678' },
                status: { type: 'string', example: 'active' },
                updatedAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
              }
            }
          }
        }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher not found'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Delete Teacher Documentation
export const DeleteTeacherDocs = {
  operation: ApiOperation({
    summary: 'Delete teacher',
    description: 'Remove a teacher from the system (soft delete)'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 'teacher-uuid-123'
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Teacher deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teacher deleted successfully' }
      }
    }
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher not found'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Get All Teachers Documentation
export const GetAllTeachersDocs = {
  operation: ApiOperation({
    summary: 'Get all teachers',
    description: 'Retrieve paginated list of all teachers with optional filtering'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  query: ApiQuery({
    name: 'page',
    description: 'Page number',
    example: 1,
    required: false
  }),
  queryLimit: ApiQuery({
    name: 'limit',
    description: 'Number of records per page',
    example: 10,
    required: false
  }),
  queryStatus: ApiQuery({
    name: 'status',
    description: 'Filter by teacher status',
    example: 'active',
    required: false
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Teachers list retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teachers list retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            teachers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'teacher-uuid-123' },
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john.doe@school.com' },
                  phone_number: { type: 'string', example: '08012345678' },
                  status: { type: 'string', example: 'active' },
                  totalSubjects: { type: 'number', example: 3 },
                  classTeacher: { type: 'string', example: 'Primary 5A' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 3 }
              }
            }
          }
        }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Assign Subjects to Teacher Documentation
export const AssignSubjectsDocs = {
  operation: ApiOperation({
    summary: 'Assign subjects to teacher',
    description: 'Assign multiple subjects to a specific teacher'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 'teacher-uuid-123'
  }),
  body: ApiBody({
    description: 'Subject IDs to assign',
    schema: {
      type: 'object',
      properties: {
        subjectIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['subject-uuid-1', 'subject-uuid-2']
        }
      }
    }
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Subjects assigned successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subjects assigned successfully' },
        data: {
          type: 'object',
          properties: {
            teacherId: { type: 'string', example: 'teacher-uuid-123' },
            assignedSubjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'subject-uuid-1' },
                  name: { type: 'string', example: 'Mathematics' }
                }
              }
            }
          }
        }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid subject IDs'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher not found'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Assign Class to Teacher Documentation
export const AssignClassDocs = {
  operation: ApiOperation({
    summary: 'Assign class to teacher',
    description: 'Assign a class to a teacher as class teacher'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Teacher ID',
    example: 'teacher-uuid-123'
  }),
  body: ApiBody({
    description: 'Class ID to assign',
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'string', example: 'class-uuid-123' }
      }
    }
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Class assigned successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Class assigned successfully' },
        data: {
          type: 'object',
          properties: {
            teacherId: { type: 'string', example: 'teacher-uuid-123' },
            classId: { type: 'string', example: 'class-uuid-123' },
            className: { type: 'string', example: 'Primary 5A' }
          }
        }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid class ID'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher or class not found'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
}; 