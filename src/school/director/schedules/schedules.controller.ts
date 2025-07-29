import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, ValidationPipe } from '@nestjs/common';
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

  @Put('time-slots/:id')
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
  @Get('timetable')
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
}