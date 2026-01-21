import { Body, Controller, Get, Patch, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetSchoolOwnerProfileDocs } from 'src/docs/director/profiles';
import { UpdateSchoolOwnerProfileDto } from './dto/update-school-owner-profile.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';

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

  /**
   * Update school owner profile
   * PATCH /api/v1/director/profiles
   * Protected endpoint
   */
  @Patch()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'display_picture', maxCount: 1 },
      { name: 'school_logo', maxCount: 1 }
    ]),
    FileValidationInterceptor
  )
  async updateSchoolOwnerProfile(
    @GetUser() user: User,
    @Body() dto: UpdateSchoolOwnerProfileDto,
    @UploadedFiles() files: {
      display_picture?: Express.Multer.File[],
      school_logo?: Express.Multer.File[]
    }
  ) {
    return this.profilesService.updateSchoolOwnerProfile(
      user,
      dto,
      files.display_picture?.[0],
      files.school_logo?.[0]
    );
  }
}
