import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../school/auth/guard';

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
}
