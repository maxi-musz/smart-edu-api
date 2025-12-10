import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeacherProfileResponseDto } from '../dto/teacher-profile-response.dto';

export const GetTeacherProfileDocs = {
  operation: ApiOperation({
    summary: 'Get teacher profile',
    description: 'Retrieve comprehensive teacher profile including personal information, school details, subjects teaching, classes managing, token usage, upload counts, subscription plan, and statistics'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Teacher profile retrieved successfully',
    type: TeacherProfileResponseDto
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Teacher profile not found'
  })
};

