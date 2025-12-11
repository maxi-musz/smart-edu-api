import { ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

export const GetUserProfileDocs = {
  operation: ApiOperation({ 
    summary: 'Get user profile details',
    description: 'Retrieve user profile information including general info, academic info, settings, and support information'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({ 
    status: 200, 
    description: 'Profile data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            general_info: { type: 'object' },
            academic_info: { type: 'object' },
            settings: { type: 'object' },
            support_info: { type: 'object' }
          }
        },
        statusCode: { type: 'number' }
      }
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'User profile not found'
  })
};

export const UpdateProfilePictureDocs = {
  operation: ApiOperation({
    summary: 'Update user profile picture',
    description: 'Upload and update user profile picture. Works for all roles (student, teacher, director). The new picture will replace the existing one. If the update fails, the uploaded file will be automatically deleted from storage.'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  consumes: ApiConsumes('multipart/form-data'),
  body: ApiBody({
    description: 'Profile picture file to upload',
    schema: {
      type: 'object',
      properties: {
        picture: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WEBP, max 5MB)'
        }
      },
      required: ['picture']
    }
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Profile picture updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile picture updated successfully' },
        data: {
          type: 'object',
          properties: {
            display_picture: {
              type: 'object',
              properties: {
                url: { type: 'string', example: 'https://storage.example.com/profile-pictures/...' },
                key: { type: 'string', example: 'profile-pictures/schools/.../profile_1234567890.jpg' },
                bucket: { type: 'string', example: 'my-bucket', nullable: true },
                etag: { type: 'string', example: 'etag-value', nullable: true },
                uploaded_at: { type: 'string', example: '2024-01-15T10:30:00.000Z' }
              }
            },
            url: { type: 'string', example: 'https://storage.example.com/profile-pictures/...' }
          }
        },
        statusCode: { type: 'number', example: 200 }
      }
    }
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type, file too large, or upload failed'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'User not found'
  })
};

