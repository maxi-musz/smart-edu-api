import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TimeSlotDTO, UpdateTimeSlotDTO, CreateTimetableDTO, getTimeTableDTO } from 'src/shared/dto/schedules.dto';

export const CreateTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Create a new time slot',
    description: 'Create a new time slot for the school timetable',
  }),

  response201: ApiResponse({
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
            school_id: { type: 'string', example: 'school-uuid' },
          },
        },
        statusCode: { type: 'number', example: 201 },
      },
    },
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),
};

export const GetTimeSlotsDocs = {
  operation: ApiOperation({
    summary: 'Get all time slots',
    description: 'Fetch all time slots for the authenticated director\'s school',
  }),

  response200: ApiResponse({
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
              isActive: { type: 'boolean', example: true },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),
};

export const GetTimetableOptionsDocs = {
  operation: ApiOperation({
    summary: 'Get timetable options',
    description: 'Fetch all available classes, teachers, subjects, and time slots for creating timetables',
  }),

  response200: ApiResponse({
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
                  name: { type: 'string', example: 'jss1' },
                },
              },
            },
            teachers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'teacher-uuid' },
                  name: { type: 'string', example: 'John Smith' },
                },
              },
            },
            subjects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'subject-uuid' },
                  name: { type: 'string', example: 'Mathematics' },
                  code: { type: 'string', example: 'MATH101' },
                  color: { type: 'string', example: '#3B82F6' },
                },
              },
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
                  endTime: { type: 'string', example: '08:45' },
                },
              },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),
};

export const UpdateTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Update a time slot',
    description: 'Update an existing time slot for the school timetable',
  }),

  param: ApiParam({
    name: 'id',
    description: 'Time slot ID',
    example: 'timeslot-uuid',
  }),

  response200: ApiResponse({
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
            isActive: { type: 'boolean', example: true },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Time slot not found',
  }),
};

export const DeleteTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Delete a time slot',
    description: 'Delete an existing time slot from the school timetable',
  }),

  param: ApiParam({
    name: 'id',
    description: 'Time slot ID',
    example: 'timeslot-uuid',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Time slot deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Time slot deleted successfully' },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Time slot not found',
  }),
};

export const GetTimetableSchedulesDocs = {
  operation: ApiOperation({
    summary: 'Get timetable schedules',
    description: 'Fetch timetable schedules for a specific class',
  }),

  response200: ApiResponse({
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
              notes: { type: 'string', example: 'Bring textbooks' },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  }),
};

export const CreateTimetableDocs = {
  operation: ApiOperation({
    summary: 'Create a timetable entry',
    description: 'Add a new schedule entry to the school timetable',
  }),

  response201: ApiResponse({
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
            notes: { type: 'string', example: 'Bring textbooks' },
          },
        },
        statusCode: { type: 'number', example: 201 },
      },
    },
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),
};

export const GetSubjectsWithTeachersDocs = {
  operation: ApiOperation({
    summary: 'Get subjects with teachers',
    description: 'Fetch all subjects with their assigned teachers for the school',
  }),

  response200: ApiResponse({
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
                      name: { type: 'string', example: 'Class 10A' },
                    },
                  },
                  teachers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'teacher-uuid' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@school.com' },
                        display_picture: { type: 'string', example: 'https://example.com/profile.jpg' },
                      },
                    },
                  },
                },
              },
            },
            summary: {
              type: 'object',
              properties: {
                total_subjects: { type: 'number', example: 10 },
                subjects_with_teachers: { type: 'number', example: 8 },
                subjects_without_teachers: { type: 'number', example: 2 },
              },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  }),
};

