import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../school/auth/guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUserProfileDocs, UpdateProfilePictureDocs } from './docs/user.docs';

@ApiTags('User Profile')
@Controller('user')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Unified profile for all school JWT roles (student, teacher, director, parent, etc.).
   * Response includes `role`, `user`, `school` (with `subscription_plan` for limits/features), and `roleDetails`.
   * GET /api/v1/user/profile
   */
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @GetUserProfileDocs.bearerAuth
  @GetUserProfileDocs.operation
  @GetUserProfileDocs.response200
  @GetUserProfileDocs.response401
  @GetUserProfileDocs.response404
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
  @UpdateProfilePictureDocs.bearerAuth
  @UpdateProfilePictureDocs.operation
  @UpdateProfilePictureDocs.consumes
  @UpdateProfilePictureDocs.body
  @UpdateProfilePictureDocs.response200
  @UpdateProfilePictureDocs.response400
  @UpdateProfilePictureDocs.response401
  @UpdateProfilePictureDocs.response404
  async updateProfilePicture(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.updateProfilePicture(req.user, file);
  }
}
