import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class StudentsDocs {
  ////////////////////////////////////////////////////////////////////////// FETCH STUDENTS DASHBOARD
  static get bearerAuth() {
    return ApiBearerAuth('JWT-auth');
  }

  static get operation() {
    return ApiOperation({
      summary: 'Get students dashboard',
      description: 'Fetch students dashboard with pagination, filtering, and search capabilities'
    });
  }

  static get response200() {
    return ApiResponse({
      status: 200,
      description: 'Students dashboard retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Students dashboard data fetched successfully' },
          data: {
            type: 'object',
            properties: {
              basic_details: {
                type: 'object',
                properties: {
                  totalStudents: { type: 'number', example: 150 },
                  activeStudents: { type: 'number', example: 145 },
                  totalClasses: { type: 'number', example: 8 }
                }
              },
              pagination: {
                type: 'object',
                properties: {
                  total_pages: { type: 'number', example: 15 },
                  current_page: { type: 'number', example: 1 },
                  total_results: { type: 'number', example: 150 },
                  results_per_page: { type: 'number', example: 10 }
                }
              },
              available_classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' },
                    class_teacher: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'teacher-uuid' },
                        name: { type: 'string', example: 'John Smith' },
                        email: { type: 'string', example: 'john.smith@school.com' }
                      }
                    },
                    student_count: { type: 'number', example: 25 }
                  }
                }
              },
              students: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'student-uuid' },
                    student_id: { type: 'string', example: 'smh/2024/001' },
                    first_name: { type: 'string', example: 'John' },
                    last_name: { type: 'string', example: 'Doe' },
                    email: { type: 'string', example: 'john.doe@school.com' },
                    phone_number: { type: 'string', example: '+1234567890' },
                    gender: { type: 'string', example: 'male' },
                    status: { type: 'string', example: 'active' },
                    current_class: { type: 'string', example: 'Class 10A' },
                    next_class: { type: 'string', example: 'Mathematics' },
                    next_class_time: { type: 'string', example: '08:30' },
                    next_class_teacher: { type: 'string', example: 'John Smith' },
                    performance: {
                      type: 'object',
                      properties: {
                        cgpa: { type: 'number', example: 3.8 },
                        term_average: { type: 'number', example: 85.5 },
                        improvement_rate: { type: 'number', example: 2.3 },
                        attendance_rate: { type: 'number', example: 95.0 },
                        position: { type: 'number', example: 5 }
                      }
                    }
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

  static get response401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    });
  }

  ////////////////////////////////////////////////////////////////////////// ENROLL STUDENT TO CLASS
  static get enrollStudentOperation() {
    return ApiOperation({
      summary: 'Enroll student to class',
      description: 'Enroll a student to a class that the authenticated director manages'
    });
  }

  static get enrollStudentResponse201() {
    return ApiResponse({
      status: 201,
      description: 'Student enrolled to class successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Student John Doe enrolled to class Class 10A successfully' },
          data: {
            type: 'object',
            properties: {
              student: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'student-uuid' },
                  name: { type: 'string', example: 'John Doe' },
                  email: { type: 'string', example: 'john@school.com' }
                }
              },
              class: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'class-uuid' },
                  name: { type: 'string', example: 'Class 10A' }
                }
              },
              enrolled_classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' }
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

  static get enrollStudentResponse400() {
    return ApiResponse({
      status: 400,
      description: 'Bad Request - Student already enrolled or invalid data'
    });
  }

  static get enrollStudentResponse403() {
    return ApiResponse({
      status: 403,
      description: 'Forbidden - Director does not manage the specified class'
    });
  }

  static get enrollStudentResponse404() {
    return ApiResponse({
      status: 404,
      description: 'Not Found - Student or class not found'
    });
  }

  ////////////////////////////////////////////////////////////////////////// GET AVAILABLE CLASSES
  static get availableClassesOperation() {
    return ApiOperation({
      summary: 'Get available classes',
      description: 'Fetch all available classes in the school with their class teachers'
    });
  }

  static get availableClassesResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Available classes retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Available classes fetched successfully' },
          data: {
            type: 'object',
            properties: {
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' },
                    class_teacher: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'teacher-uuid' },
                        name: { type: 'string', example: 'John Smith' },
                        email: { type: 'string', example: 'john.smith@school.com' },
                        display_picture: { type: 'string', example: 'https://example.com/profile.jpg' }
                      }
                    },
                    student_count: { type: 'number', example: 25 },
                    subject_count: { type: 'number', example: 8 }
                  }
                }
              },
              summary: {
                type: 'object',
                properties: {
                  total_classes: { type: 'number', example: 5 },
                  classes_with_teachers: { type: 'number', example: 4 },
                  classes_without_teachers: { type: 'number', example: 1 }
                }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }
}
