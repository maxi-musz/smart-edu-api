import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { UserDocs } from './docs';

@ApiTags('User')
@Controller('director/user')
@UseGuards(JwtGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('profile')
    @UserDocs.bearerAuth
    @UserDocs.operation
    @UserDocs.response200
    @UserDocs.response401
    @UserDocs.response404
    @UserDocs.response500
    getUserProfile(@GetUser() user: User) {
        return this.userService.getUserProfile(user);
    }
}
