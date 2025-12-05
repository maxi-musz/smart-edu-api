import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetSchoolOwnerProfileDocs } from 'src/docs/director/profiles';

@ApiTags('Profiles')
@Controller('director/profiles')
@UseGuards(JwtGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  /**
   * Get school owner profile
   * GET /api/v1/director/profiles
   * Protected endpoint
   */
  @Get()
  @GetSchoolOwnerProfileDocs.bearerAuth
  @GetSchoolOwnerProfileDocs.operation
  @GetSchoolOwnerProfileDocs.response200
  @GetSchoolOwnerProfileDocs.response401
  @GetSchoolOwnerProfileDocs.response404
  async getSchoolOwnerProfile(@GetUser() user: User) {
    return this.profilesService.getSchoolOwnerProfile(user);
  }
}
