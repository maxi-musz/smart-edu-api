import { Controller, Get, Post, UseGuards, HttpCode, HttpStatus, Body, Query } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AddStudentToClassDto } from '../director/students/dto/auth.dto';
import { TeachersDocs } from './utils/api-docs/teachers.docs';

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
  @TeachersDocs.bearerAuth
  @TeachersDocs.profileOperation
  @TeachersDocs.profileResponse200
  @TeachersDocs.response401
  @TeachersDocs.response404
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
  @TeachersDocs.bearerAuth
  @TeachersDocs.dashboardOperation
  @TeachersDocs.dashboardResponse200
  @TeachersDocs.response401
  @TeachersDocs.response404
  getTeacherDashboard(@GetUser() user: User) {
    return this.teachersService.getTeacherDashboard(user);
  }

  /**
   * Get teacher's student tab with pagination
   * GET /api/v1/teachers/student-tab
   */
  @Get('student-tab')
  @HttpCode(HttpStatus.OK)
  @TeachersDocs.bearerAuth
  @TeachersDocs.studentTabOperation
  @TeachersDocs.studentTabQueries
  @TeachersDocs.studentTabResponse200
  @TeachersDocs.response401
  @TeachersDocs.response404
  getStudentTab(
    @GetUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('class_id') class_id?: string,
    @Query('sort_by') sort_by: string = 'createdAt',
    @Query('sort_order') sort_order: string = 'desc'
  ) {
    return this.teachersService.fetchStudentTabForTeacher(user, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      class_id,
      sort_by: sort_by as any,
      sort_order: sort_order as 'asc' | 'desc'
    });
  }

  /**
   * Get teacher's schedules tab
   * GET /api/v1/teachers/schedules-tab
   */
  @Get('schedules-tab')
  @HttpCode(HttpStatus.OK)
  @TeachersDocs.bearerAuth
  @TeachersDocs.schedulesTabOperation
  @TeachersDocs.schedulesTabResponse200
  @TeachersDocs.response401
  @TeachersDocs.response404
  getSchedulesTab(@GetUser() user: User) {
    return this.teachersService.fetchSchedulesTabForTeacher(user);
  }

  /**
   * Get teacher's subjects dashboard tab with pagination, search, and filtering
   * GET /api/v1/teachers/subjects-dashboard
   */
  @Get('subjects-dashboard')
  @HttpCode(HttpStatus.OK)
  @TeachersDocs.bearerAuth
  @TeachersDocs.subjectsTabOperation
  @TeachersDocs.subjectsTabQueries
  @TeachersDocs.subjectsTabResponse200
  @TeachersDocs.response401
  @TeachersDocs.response404
  getSubjectsTab(
    @GetUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '5',
    @Query('search') search?: string,
    @Query('academic_session_id') academic_session_id?: string,
    @Query('class_id') class_id?: string,
    @Query('sort_by') sort_by: string = 'name',
    @Query('sort_order') sort_order: string = 'asc'
  ) {
    return this.teachersService.fetchSubjectsTabForTeacher(user, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 5,
      search,
      academic_session_id,
      class_id,
      sort_by: sort_by as any,
      sort_order: sort_order as 'asc' | 'desc'
    });
  }
} 