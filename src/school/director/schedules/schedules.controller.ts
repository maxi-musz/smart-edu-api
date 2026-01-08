import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger, ValidationPipe, Patch } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateTimetableDTO, getTimeTableDTO, TimeSlotDTO, UpdateTimeSlotDTO } from 'src/shared/dto/schedules.dto';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateTimeSlotDocs,
  GetTimeSlotsDocs,
  GetTimetableOptionsDocs,
  UpdateTimeSlotDocs,
  DeleteTimeSlotDocs,
  GetTimetableSchedulesDocs,
  CreateTimetableDocs,
  GetSubjectsWithTeachersDocs,
} from './docs/schedules.docs';

@ApiTags('Schedules')
@Controller('director/schedules')
@UseGuards(JwtGuard)
export class SchedulesController {
  private readonly logger = new Logger(SchedulesController.name);

  constructor(private readonly schedulesService: SchedulesService) {}

  // Time Slot Management Endpoints
  @Post('create-time-slot')
  @ApiBearerAuth('JWT-auth')
  @CreateTimeSlotDocs.operation
  @CreateTimeSlotDocs.response201
  @CreateTimeSlotDocs.response400
  @CreateTimeSlotDocs.response401
  async createTimeSlot(
    @GetUser() user: User,
    @Body(ValidationPipe) dto: TimeSlotDTO
  ) {
    return this.schedulesService.createTimeSlot(user, dto);
  }

  @Get('time-slots')
  @ApiBearerAuth('JWT-auth')
  @GetTimeSlotsDocs.operation
  @GetTimeSlotsDocs.response200
  @GetTimeSlotsDocs.response401
  async getTimeSlots(@GetUser() user: User) {
    return this.schedulesService.getTimeSlots(user);
  }

  @Get('timetable-options')
  @ApiBearerAuth('JWT-auth')
  @GetTimetableOptionsDocs.operation
  @GetTimetableOptionsDocs.response200
  @GetTimetableOptionsDocs.response401
  async getTimetableOptions(@GetUser() user: User) {
    return this.schedulesService.getTimetableOptions(user.school_id);
  }

  @Patch('time-slots/:id')
  @ApiBearerAuth('JWT-auth')
  @UpdateTimeSlotDocs.operation
  @UpdateTimeSlotDocs.param
  @UpdateTimeSlotDocs.response200
  @UpdateTimeSlotDocs.response400
  @UpdateTimeSlotDocs.response401
  @UpdateTimeSlotDocs.response404
  async updateTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateTimeSlotDTO
  ) {
    return this.schedulesService.updateTimeSlot(user, id, dto);
  }

  @Delete('time-slots/:id')
  @ApiBearerAuth('JWT-auth')
  @DeleteTimeSlotDocs.operation
  @DeleteTimeSlotDocs.param
  @DeleteTimeSlotDocs.response200
  @DeleteTimeSlotDocs.response401
  @DeleteTimeSlotDocs.response404
  async deleteTimeSlot(
    @GetUser() user: User,
    @Param('id') id: string
  ) {
    return this.schedulesService.deleteTimeSlot(user, id);
  }

  // Existing endpoints
  @Post('timetable')
  @GetTimetableSchedulesDocs.operation
  @GetTimetableSchedulesDocs.response200
  @GetTimetableSchedulesDocs.response400
  async getTimetableSchedules(@GetUser() user: User, @Body(ValidationPipe) dto: getTimeTableDTO) {
    return this.schedulesService.getTimetable(dto, user);
  }

  @Post("create-timetable")
  @ApiBearerAuth('JWT-auth')
  @CreateTimetableDocs.operation
  @CreateTimetableDocs.response201
  @CreateTimetableDocs.response400
  @CreateTimetableDocs.response401
  async addScheduleToTimetable(
    @GetUser() user: User, 
    @Body(ValidationPipe) dto: CreateTimetableDTO
  ) {
    return this.schedulesService.addScheduleToTimetable(dto, user);
  }

  @Get('subjects-with-teachers')
  @ApiBearerAuth('JWT-auth')
  @GetSubjectsWithTeachersDocs.operation
  @GetSubjectsWithTeachersDocs.response200
  @GetSubjectsWithTeachersDocs.response401
  async getSubjectsWithTeachers(@GetUser() user: User) {
    return this.schedulesService.getSubjectsWithTeachers(user);
  }
}