import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, ValidationPipe, Patch } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateTimetableDTO, getTimeTableDTO, TimeSlotDTO, UpdateTimeSlotDTO } from 'src/shared/dto/schedules.dto';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Schedules')
@Controller('director/schedules')
@UseGuards(JwtGuard)
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  // Time Slot Management Endpoints
  @Post('create-time-slot')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Create a new time slot',
      description: 'Create a new time slot for the school timetable'
  })
  @ApiResponse({
      status: 201,
      description: 'Time slot created successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Time slot created successfully' },
              data: {
                  type: 'object',
                  properties: {
                      id: { type: 'string', example: 'timeslot-uuid' },
                      startTime: { type: 'string', example: '08:30' },
                      endTime: { type: 'string', example: '10:30' },
                      label: { type: 'string', example: 'First Period' },
                      order: { type: 'number', example: 1 },
                      school_id: { type: 'string', example: 'school-uuid' }
                  }
              },
              statusCode: { type: 'number', example: 201 }
          }
      }
  })
  @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
  })
  @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
  })
  async createTimeSlot(
    @GetUser() user: User,
    @Body(ValidationPipe) dto: TimeSlotDTO
  ) {
    return this.schedulesService.createTimeSlot(user, dto);
  }

  @Get('time-slots')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Get all time slots',
      description: 'Fetch all time slots for the authenticated director\'s school'
  })
  @ApiResponse({
      status: 200,
      description: 'Time slots retrieved successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Time slots fetched successfully' },
              data: {
                  type: 'array',
                  items: {
                      type: 'object',
                      properties: {
                          id: { type: 'string', example: 'timeslot-uuid' },
                          startTime: { type: 'string', example: '08:30' },
                          endTime: { type: 'string', example: '10:30' },
                          label: { type: 'string', example: 'First Period' },
                          order: { type: 'number', example: 1 },
                          isActive: { type: 'boolean', example: true }
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
  async getTimeSlots(@GetUser() user: User) {
    return this.schedulesService.getTimeSlots(user);
  }

  @Get('timetable-options')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Get timetable options',
      description: 'Fetch all available classes, teachers, subjects, and time slots for creating timetables'
  })
  @ApiResponse({
      status: 200,
      description: 'Timetable options retrieved successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Timetable options retrieved successfully' },
              data: {
                  type: 'object',
                  properties: {
                      classes: {
                          type: 'array',
                          items: {
                              type: 'object',
                              properties: {
                                  id: { type: 'string', example: 'class-uuid' },
                                  name: { type: 'string', example: 'jss1' }
                              }
                          }
                      },
                      teachers: {
                          type: 'array',
                          items: {
                              type: 'object',
                              properties: {
                                  id: { type: 'string', example: 'teacher-uuid' },
                                  name: { type: 'string', example: 'John Smith' }
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
                                  color: { type: 'string', example: '#3B82F6' }
                              }
                          }
                      },
                      timeSlots: {
                          type: 'array',
                          items: {
                              type: 'object',
                              properties: {
                                  id: { type: 'string', example: 'timeslot-uuid' },
                                  name: { type: 'string', example: '08:00 - 08:45' },
                                  label: { type: 'string', example: 'Period 1' },
                                  startTime: { type: 'string', example: '08:00' },
                                  endTime: { type: 'string', example: '08:45' }
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
  async getTimetableOptions(@GetUser() user: User) {
    return this.schedulesService.getTimetableOptions(user.school_id);
  }

  @Patch('time-slots/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Update a time slot',
      description: 'Update an existing time slot for the school timetable'
  })
  @ApiParam({
      name: 'id',
      description: 'Time slot ID',
      example: 'timeslot-uuid'
  })
  @ApiResponse({
      status: 200,
      description: 'Time slot updated successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Time slot updated successfully' },
              data: {
                  type: 'object',
                  properties: {
                      id: { type: 'string', example: 'timeslot-uuid' },
                      startTime: { type: 'string', example: '08:30' },
                      endTime: { type: 'string', example: '10:30' },
                      label: { type: 'string', example: 'First Period' },
                      order: { type: 'number', example: 1 },
                      isActive: { type: 'boolean', example: true }
                  }
              },
              statusCode: { type: 'number', example: 200 }
          }
      }
  })
  @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
  })
  @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
      status: 404,
      description: 'Time slot not found'
  })
  async updateTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateTimeSlotDTO
  ) {
    return this.schedulesService.updateTimeSlot(user, id, dto);
  }

  @Delete('time-slots/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Delete a time slot',
      description: 'Delete an existing time slot from the school timetable'
  })
  @ApiParam({
      name: 'id',
      description: 'Time slot ID',
      example: 'timeslot-uuid'
  })
  @ApiResponse({
      status: 200,
      description: 'Time slot deleted successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Time slot deleted successfully' },
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
      description: 'Time slot not found'
  })
  async deleteTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    return this.schedulesService.deleteTimeSlot(user, id);
  }

  // Existing endpoints
  @Post('timetable')
  @ApiOperation({
      summary: 'Get timetable schedules',
      description: 'Fetch timetable schedules for a specific class'
  })
  @ApiResponse({
      status: 200,
      description: 'Timetable schedules retrieved successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Timetable schedules fetched successfully' },
              data: {
                  type: 'array',
                  items: {
                      type: 'object',
                      properties: {
                          id: { type: 'string', example: 'timetable-uuid' },
                          class_id: { type: 'string', example: 'class-uuid' },
                          subject_id: { type: 'string', example: 'subject-uuid' },
                          teacher_id: { type: 'string', example: 'teacher-uuid' },
                          day_of_week: { type: 'string', example: 'MONDAY' },
                          room: { type: 'string', example: 'Room 101' },
                          notes: { type: 'string', example: 'Bring textbooks' }
                      }
                  }
              },
              statusCode: { type: 'number', example: 200 }
          }
      }
  })
  @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
  })
  async getTimetableSchedules(@Body(ValidationPipe) dto: getTimeTableDTO) {
    return this.schedulesService.getTimetable(dto);
  }

  @Post("create-timetable")
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Create a timetable entry',
      description: 'Add a new schedule entry to the school timetable'
  })
  @ApiResponse({
      status: 201,
      description: 'Timetable entry created successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Timetable entry created successfully' },
              data: {
                  type: 'object',
                  properties: {
                      id: { type: 'string', example: 'timetable-uuid' },
                      class_id: { type: 'string', example: 'class-uuid' },
                      subject_id: { type: 'string', example: 'subject-uuid' },
                      teacher_id: { type: 'string', example: 'teacher-uuid' },
                      day_of_week: { type: 'string', example: 'MONDAY' },
                      room: { type: 'string', example: 'Room 101' },
                      notes: { type: 'string', example: 'Bring textbooks' }
                  }
              },
              statusCode: { type: 'number', example: 201 }
          }
      }
  })
  @ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
  })
  @ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
  })
  async addScheduleToTimetable(
    @GetUser() user: User, 
    @Body(ValidationPipe) dto: CreateTimetableDTO
  ) {
    return this.schedulesService.addScheduleToTimetable(dto, user);
  }

  @Get('subjects-with-teachers')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
      summary: 'Get subjects with teachers',
      description: 'Fetch all subjects with their assigned teachers for the school'
  })
  @ApiResponse({
      status: 200,
      description: 'Subjects with teachers retrieved successfully',
      schema: {
          type: 'object',
          properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Subjects with teachers fetched successfully' },
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
                                  color: { type: 'string', example: '#FF5733' },
                                  description: { type: 'string', example: 'Advanced mathematics course' },
                                  assigned_class: {
                                      type: 'object',
                                      properties: {
                                          id: { type: 'string', example: 'class-uuid' },
                                          name: { type: 'string', example: 'Class 10A' }
                                      }
                                  },
                                  teachers: {
                                      type: 'array',
                                      items: {
                                          type: 'object',
                                          properties: {
                                              id: { type: 'string', example: 'teacher-uuid' },
                                              name: { type: 'string', example: 'John Doe' },
                                              email: { type: 'string', example: 'john@school.com' },
                                              display_picture: { type: 'string', example: 'https://example.com/profile.jpg' }
                                          }
                                      }
                                  }
                              }
                          }
                      },
                      summary: {
                          type: 'object',
                          properties: {
                              total_subjects: { type: 'number', example: 10 },
                              subjects_with_teachers: { type: 'number', example: 8 },
                              subjects_without_teachers: { type: 'number', example: 2 }
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
  async getSubjectsWithTeachers(@GetUser() user: User) {
    return this.schedulesService.getSubjectsWithTeachers(user);
  }
}