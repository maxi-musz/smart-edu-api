import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddStudentToClassDto } from '../director/students/dto/auth.dto';

@ApiTags('Teachers')
@Controller('teachers')
@UseGuards(JwtGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  /**
   * Get teacher profile
   * GET /api/v1/teachers/profile
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get teacher profile',
    description: 'Fetch the profile of the authenticated teacher with their assignments'
  })
  @ApiResponse({
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
            display_picture: { type: 'string', example: 'https://example.com/profile.jpg' },
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
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Teacher profile not found'
  })
  getTeacherProfile(@GetUser() user: User) {
    return this.teachersService.getTeacherProfile(user);
  }

  /**
   * Get teacher timetable
   * GET /api/v1/teachers/timetable
   */
  @Get('timetable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get teacher timetable',
    description: 'Fetch the timetable of the authenticated teacher'
  })
  @ApiResponse({
    status: 200,
    description: 'Teacher timetable retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Teacher timetable fetched successfully' },
        data: {
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
                  label: { type: 'string', example: 'First Period' },
                  order: { type: 'number', example: 1 }
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
                      class: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'class-uuid' },
                          name: { type: 'string', example: 'Class 10A' }
                        }
                      },
                      subject: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: 'subject-uuid' },
                          name: { type: 'string', example: 'Mathematics' },
                          code: { type: 'string', example: 'MATH101' },
                          color: { type: 'string', example: '#FF5733' }
                        }
                      },
                      room: { type: 'string', example: 'Room 101' }
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
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  getTeacherTimetable(@GetUser() user: User) {
    return this.teachersService.getTeacherTimetable(user);
  }

  /**
   * Get teacher dashboard
   * GET /api/v1/teachers/dashboard
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get teacher dashboard',
    description: 'Fetch the dashboard of the authenticated teacher with managed class and 3-day schedule'
  })
  @ApiResponse({
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
                              from: { type: 'string', example: '08:30' },
                              to: { type: 'string', example: '10:30' },
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
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'No class assigned to manage'
  })
  getTeacherDashboard(@GetUser() user: User) {
    return this.teachersService.getTeacherDashboard(user);
  }

 
}