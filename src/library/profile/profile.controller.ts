import { Controller, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { GetLibraryUserProfileDocs } from './docs/profile.docs';

@ApiTags('Library Profile')
@Controller('library/profile')
@UseGuards(LibraryJwtGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('getuserprofile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @GetLibraryUserProfileDocs.operation
  @GetLibraryUserProfileDocs.response200
  @GetLibraryUserProfileDocs.response401
  @GetLibraryUserProfileDocs.response404
  async getUserProfile(@Request() req: any) {
    return this.profileService.getUserProfile(req.user);
  }
}

