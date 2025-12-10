import { Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtGuard } from '../school/auth/guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User Profile')
@Controller('user')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile details' })
  @ApiResponse({ 
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
  })
  async getUserProfile(@Request() req: any) {
    return this.userService.getUserProfile(req.user);
  }

  /**
   * Update user profile picture (works for all roles: student, teacher, director)
   * POST /api/v1/user/picture
   * Protected endpoint
   */
  @Post('picture')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('picture'))
  @ApiOperation({
    summary: 'Update user profile picture',
    description: 'Upload and update user profile picture. Works for all roles (student, teacher, director). The new picture will replace the existing one. If the update fails, the uploaded file will be automatically deleted from storage.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type, file too large, or upload failed'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async updateProfilePicture(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.userService.updateProfilePicture(req.user, file);
  }
}
