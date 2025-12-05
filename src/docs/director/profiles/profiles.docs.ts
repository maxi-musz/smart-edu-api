import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export const GetSchoolOwnerProfileDocs = {
  operation: ApiOperation({
    summary: 'Get school owner profile',
    description: 'Fetch complete profile information for the authenticated school owner/director including user details, school information, current academic session, settings, and statistics'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'School owner profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'School owner profile retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-uuid' },
                email: { type: 'string', example: 'director@school.com' },
                first_name: { type: 'string', example: 'John' },
                last_name: { type: 'string', example: 'Doe' },
                full_name: { type: 'string', example: 'John Doe' },
                phone_number: { type: 'string', example: '+1234567890' },
                display_picture: { type: 'object', nullable: true },
                gender: { type: 'string', example: 'male' },
                role: { type: 'string', example: 'school_director' },
                status: { type: 'string', example: 'active' },
                is_email_verified: { type: 'boolean', example: true },
                created_at: { type: 'string', example: 'Jan 1, 2024, 10:00 AM' },
                updated_at: { type: 'string', example: 'Jan 1, 2024, 10:00 AM' }
              }
            },
            school: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'school-uuid' },
                school_name: { type: 'string', example: 'ABC School' },
                school_email: { type: 'string', example: 'info@abcschool.com' },
                school_phone: { type: 'string', example: '+1234567890' },
                school_address: { type: 'string', example: '123 Main St' },
                school_type: { type: 'string', example: 'primary_and_secondary' },
                school_ownership: { type: 'string', example: 'private' },
                status: { type: 'string', example: 'approved' },
                created_at: { type: 'string', example: 'Jan 1, 2024, 10:00 AM' },
                updated_at: { type: 'string', example: 'Jan 1, 2024, 10:00 AM' }
              }
            },
            current_session: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string', example: 'session-uuid' },
                academic_year: { type: 'string', example: '2024/2025' },
                term: { type: 'string', example: 'first' },
                start_date: { type: 'string', example: 'Jan 1, 2024, 10:00 AM' },
                end_date: { type: 'string', example: 'Mar 31, 2024, 10:00 AM' },
                status: { type: 'string', example: 'active' }
              }
            },
            settings: {
              type: 'object',
              properties: {
                push_notifications: { type: 'boolean', example: true },
                email_notifications: { type: 'boolean', example: true },
                assessment_reminders: { type: 'boolean', example: true },
                grade_notifications: { type: 'boolean', example: true },
                announcement_notifications: { type: 'boolean', example: false },
                dark_mode: { type: 'boolean', example: false },
                sound_effects: { type: 'boolean', example: true },
                haptic_feedback: { type: 'boolean', example: true },
                auto_save: { type: 'boolean', example: true },
                offline_mode: { type: 'boolean', example: false },
                profile_visibility: { type: 'string', example: 'classmates' },
                show_contact_info: { type: 'boolean', example: true },
                show_academic_progress: { type: 'boolean', example: true },
                data_sharing: { type: 'boolean', example: false }
              }
            },
            stats: {
              type: 'object',
              properties: {
                total_teachers: { type: 'number', example: 25 },
                total_students: { type: 'number', example: 500 },
                total_classes: { type: 'number', example: 15 },
                total_subjects: { type: 'number', example: 20 }
              }
            }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'User or school not found'
  })
};

