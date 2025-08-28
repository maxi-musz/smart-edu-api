import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

export class TeachersDocs {
  static get bearerAuth() {
    return ApiBearerAuth('JWT-auth');
  }

  // Profile endpoint documentation
  static get profileOperation() {
    return ApiOperation({
      summary: 'Get teacher profile',
      description: 'Fetch the profile of the authenticated teacher with their assignments'
    });
  }

  static get profileResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Teacher profile retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Teacher profile fetched successfully' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'teacher-uuid' },
              name: { type: 'string', example: 'John Doe' },
              email: { type: 'string', example: 'john@school.com' },
              phone_number: { type: 'string', example: '+1234567890' },
              display_picture: { type: 'object', example: { secure_url: 'https://example.com/profile.jpg', public_id: 'profile_id' } },
              status: { type: 'string', example: 'active' },
              gender: { type: 'string', example: 'male' },
              assigned_subjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'subject-uuid' },
                    name: { type: 'string', example: 'Mathematics' },
                    code: { type: 'string', example: 'MATH101' },
                    color: { type: 'string', example: '#FF5733' },
                    description: { type: 'string', example: 'Advanced mathematics course' },
                    assigned_class: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'class-uuid' },
                        name: { type: 'string', example: 'Class 10A' }
                      }
                    }
                  }
                }
              },
              managed_classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' },
                    student_count: { type: 'number', example: 25 },
                    subject_count: { type: 'number', example: 8 }
                  }
                }
              },
              summary: {
                type: 'object',
                properties: {
                  total_subjects: { type: 'number', example: 3 },
                  total_classes: { type: 'number', example: 1 }
                }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Dashboard endpoint documentation
  static get dashboardOperation() {
    return ApiOperation({
      summary: 'Get teacher dashboard',
      description: 'Fetch teacher dashboard with managed class details and schedule information'
    });
  }

  static get dashboardResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Teacher dashboard retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Teacher dashboard fetched successfully' },
          data: {
            type: 'object',
            properties: {
              current_session: {
                type: 'object',
                properties: {
                  year: { type: 'number', example: 2024 },
                  term: { type: 'string', example: 'first', enum: ['first', 'second', 'third'] },
                  term_start_date: { type: 'string', format: 'date-time', example: '2024-09-01T00:00:00.000Z', nullable: true },
                  term_end_date: { type: 'string', format: 'date-time', example: '2024-12-20T00:00:00.000Z', nullable: true }
                }
              },
              managed_class: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'class-uuid' },
                  name: { type: 'string', example: 'Class 10A' },
                  students: {
                    type: 'object',
                    properties: {
                      total: { type: 'number', example: 25 },
                      males: { type: 'number', example: 12 },
                      females: { type: 'number', example: 13 }
                    }
                  }
                }
              },
              subjects_teaching: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'subject-uuid' },
                    name: { type: 'string', example: 'Mathematics' },
                    code: { type: 'string', example: 'MATH101' },
                    color: { type: 'string', example: '#3B82F6' },
                    description: { type: 'string', example: 'Advanced mathematics course' }
                  }
                }
              },
              recent_notifications: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'notification-uuid' },
                    title: { type: 'string', example: 'Staff Meeting' },
                    description: { type: 'string', example: 'Monthly staff meeting scheduled' },
                    type: { type: 'string', example: 'all', enum: ['all', 'teachers', 'students', 'school_director', 'admin'] },
                    comingUpOn: { type: 'string', format: 'date-time', example: '2024-08-28T10:00:00.000Z', nullable: true },
                    createdAt: { type: 'string', format: 'date-time', example: '2024-08-27T14:30:00.000Z' }
                  }
                }
              },
              class_schedules: {
                type: 'object',
                properties: {
                  today: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', example: 'MONDAY' },
                      schedule: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            subject: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'subject-uuid' },
                                name: { type: 'string', example: 'Mathematics' },
                                code: { type: 'string', example: 'MATH101' },
                                color: { type: 'string', example: '#FF5733' }
                              }
                            },
                            class: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'class-uuid' },
                                name: { type: 'string', example: 'Class 10A' }
                              }
                            },
                            time: {
                              type: 'object',
                              properties: {
                                from: { type: 'string', example: '08:00' },
                                to: { type: 'string', example: '09:00' },
                                label: { type: 'string', example: 'First Period' }
                              }
                            },
                            room: { type: 'string', example: 'Room 101' }
                          }
                        }
                      }
                    }
                  },
                  tomorrow: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', example: 'TUESDAY' },
                      schedule: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            subject: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'subject-uuid' },
                                name: { type: 'string', example: 'Physics' },
                                code: { type: 'string', example: 'PHY101' },
                                color: { type: 'string', example: '#3B82F6' }
                              }
                            },
                            class: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'class-uuid' },
                                name: { type: 'string', example: 'Class 10A' }
                              }
                            },
                            time: {
                              type: 'object',
                              properties: {
                                from: { type: 'string', example: '10:30' },
                                to: { type: 'string', example: '12:30' },
                                label: { type: 'string', example: 'Second Period' }
                              }
                            },
                            room: { type: 'string', example: 'Room 102' }
                          }
                        }
                      }
                    }
                  },
                  day_after_tomorrow: {
                    type: 'object',
                    properties: {
                      day: { type: 'string', example: 'WEDNESDAY' },
                      schedule: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            subject: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'subject-uuid' },
                                name: { type: 'string', example: 'Chemistry' },
                                code: { type: 'string', example: 'CHEM101' },
                                color: { type: 'string', example: '#10B981' }
                              }
                            },
                            class: {
                              type: 'object',
                              properties: {
                                id: { type: 'string', example: 'class-uuid' },
                                name: { type: 'string', example: 'Class 10A' }
                              }
                            },
                            time: {
                              type: 'object',
                              properties: {
                                from: { type: 'string', example: '14:30' },
                                to: { type: 'string', example: '16:30' },
                                label: { type: 'string', example: 'Fourth Period' }
                              }
                            },
                            room: { type: 'string', example: 'Room 103' }
                          }
                        }
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

  // Student Tab endpoint documentation
  static get studentTabOperation() {
    return ApiOperation({
      summary: 'Get teacher student tab',
      description: 'Fetch paginated list of students managed by the teacher, along with their classes and subjects'
    });
  }

  static get studentTabQueries() {
    return applyDecorators(
      ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)', example: '1' }),
      ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Number of items per page (default: 10)', example: '10' }),
      ApiQuery({ name: 'search', required: false, type: 'string', description: 'Search term for student name or email', example: 'john' }),
      ApiQuery({ name: 'class_id', required: false, type: 'string', description: 'Filter by specific class ID', example: 'class-uuid' }),
      ApiQuery({ name: 'sort_by', required: false, type: 'string', description: 'Sort field (default: createdAt)', example: 'name' }),
      ApiQuery({ name: 'sort_order', required: false, type: 'string', description: 'Sort order: asc or desc (default: desc)', example: 'desc' })
    );
  }

  static get studentTabResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Student tab retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Student tab fetched successfully' },
          data: {
            type: 'object',
            properties: {
              students: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'student-uuid' },
                        student_id: { type: 'string', example: 'STD/2024/001' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@school.com' },
                        display_picture: { type: 'object', example: { secure_url: 'https://example.com/image.jpg', public_id: 'image_id' } },
                        status: { type: 'string', example: 'active' },
                        gender: { type: 'string', example: 'male' },
                        class: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: 'class-uuid' },
                            name: { type: 'string', example: 'Class 10A' }
                          }
                        },
                        user_id: { type: 'string', example: 'user-uuid' }
                      }
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      current_page: { type: 'number', example: 1 },
                      total_items: { type: 'number', example: 25 },
                      total_pages: { type: 'number', example: 3 },
                      has_next: { type: 'boolean', example: true },
                      has_previous: { type: 'boolean', example: false },
                      results_per_page: { type: 'number', example: 10 }
                    }
                  }
                }
              },
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' },
                    student_count: { type: 'number', example: 25 },
                    subject_count: { type: 'number', example: 8 }
                  }
                }
              },
              subjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'subject-uuid' },
                    name: { type: 'string', example: 'Mathematics' },
                    code: { type: 'string', example: 'MATH101' },
                    color: { type: 'string', example: '#FF5733' },
                    description: { type: 'string', example: 'Advanced mathematics course' },
                    assigned_class: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'class-uuid' },
                        name: { type: 'string', example: 'Class 10A' }
                      }
                    }
                  }
                }
              },
              summary: {
                type: 'object',
                properties: {
                  total_students: { type: 'number', example: 25 },
                  total_classes: { type: 'number', example: 1 },
                  total_subjects: { type: 'number', example: 3 }
                }
              }
            }
          },
          statusCode: { type: 'number', example: 200 }
        }
      }
    });
  }

  // Schedules Tab endpoint documentation
  static get schedulesTabOperation() {
    return ApiOperation({
      summary: 'Get teacher schedules tab',
      description: 'Fetch teacher schedules with subjects, classes, and timetable data'
    });
  }

  static get schedulesTabResponse200() {
    return ApiResponse({
      status: 200,
      description: 'Schedules tab retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Schedules tab fetched successfully' },
          data: {
            type: 'object',
            properties: {
              subjects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'subject-uuid' },
                    name: { type: 'string', example: 'Mathematics' },
                    code: { type: 'string', example: 'MATH101' },
                    color: { type: 'string', example: '#FF5733' }
                  }
                }
              },
              classes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: 'class-uuid' },
                    name: { type: 'string', example: 'Class 10A' }
                  }
                }
              },
              timetable_data: {
                type: 'object',
                properties: {
                  timeSlots: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'timeslot-uuid' },
                        startTime: { type: 'string', example: '08:30' },
                        endTime: { type: 'string', example: '10:30' },
                        order: { type: 'number', example: 1 },
                        label: { type: 'string', example: 'First Period' }
                      }
                    }
                  },
                  schedule: {
                    type: 'object',
                    properties: {
                      MONDAY: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            timeSlotId: { type: 'string', example: 'timeslot-uuid' },
                            startTime: { type: 'string', example: '08:30' },
                            endTime: { type: 'string', example: '10:30' },
                            label: { type: 'string', example: 'First Period' },
                            subject: {
                              type: 'object',
                              nullable: true,
                              properties: {
                                id: { type: 'string', example: 'subject-uuid' },
                                name: { type: 'string', example: 'Mathematics' },
                                code: { type: 'string', example: 'MATH101' },
                                color: { type: 'string', example: '#FF5733' }
                              }
                            },
                            teacher: {
                              type: 'object',
                              nullable: true,
                              properties: {
                                id: { type: 'string', example: 'teacher-uuid' },
                                name: { type: 'string', example: 'John Doe' }
                              }
                            },
                            room: { type: 'string', example: 'Room 101' }
                          }
                        }
                      },
                      TUESDAY: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            timeSlotId: { type: 'string', example: 'timeslot-uuid' },
                            startTime: { type: 'string', example: '08:30' },
                            endTime: { type: 'string', example: '10:30' },
                            label: { type: 'string', example: 'First Period' },
                            subject: { type: 'object', nullable: true },
                            teacher: { type: 'object', nullable: true },
                            room: { type: 'string', nullable: true }
                          }
                        }
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

  // Common error responses
  static get response401() {
    return ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    });
  }

  static get response404() {
    return ApiResponse({
      status: 404,
      description: 'Resource not found'
    });
  }

  static get response500() {
    return ApiResponse({
      status: 500,
      description: 'Internal server error'
    });
  }
}
