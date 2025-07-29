import { ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

// Time Slot Management Documentation
export const CreateTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Create a new time slot',
    description: 'Create a new time slot for the school timetable'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    })
  ]
};

export const GetTimeSlotsDocs = {
  operation: ApiOperation({
    summary: 'Get all time slots',
    description: 'Fetch all time slots for the authenticated director\'s school'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    })
  ]
};

export const UpdateTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Update a time slot',
    description: 'Update an existing time slot for the school timetable'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Time slot ID',
    example: 'timeslot-uuid'
  }),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    }),
    ApiResponse({
      status: 404,
      description: 'Time slot not found'
    })
  ]
};

export const DeleteTimeSlotDocs = {
  operation: ApiOperation({
    summary: 'Delete a time slot',
    description: 'Delete an existing time slot from the school timetable'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  param: ApiParam({
    name: 'id',
    description: 'Time slot ID',
    example: 'timeslot-uuid'
  }),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    }),
    ApiResponse({
      status: 404,
      description: 'Time slot not found'
    })
  ]
};

// Timetable Documentation
export const GetTimetableDocs = {
  operation: ApiOperation({
    summary: 'Get timetable schedules',
    description: 'Fetch timetable schedules for a specific class'
  }),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
    })
  ]
};

export const CreateTimetableDocs = {
  operation: ApiOperation({
    summary: 'Create a timetable entry',
    description: 'Add a new schedule entry to the school timetable'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  responses: [
    ApiResponse({
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
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data provided'
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token'
    })
  ]
}; 