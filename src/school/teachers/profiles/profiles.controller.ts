import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtGuard } from '../../auth/guard';
import { GetUser } from '../../auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetTeacherProfileDocs } from './docs/profiles.docs';

@ApiTags('Teachers - Profiles')
@Controller('teachers/profiles')
@UseGuards(JwtGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Get teacher profile
   * GET /api/v1/teachers/profiles
   * Protected endpoint
   */
  @Get()
  
  @HttpCode(HttpStatus.OK)
  @GetTeacherProfileDocs.bearerAuth
  @GetTeacherProfileDocs.operation
  @GetTeacherProfileDocs.response200
  @GetTeacherProfileDocs.response401
  @GetTeacherProfileDocs.response404
  async getTeacherProfile(@GetUser() user: User) {
    return this.profilesService.getTeacherProfile(user);
  }
}

