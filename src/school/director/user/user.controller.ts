import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserDocs } from './docs';
import { StudentProfileResponseDto } from './dto/student-profile.dto';
import { MobileStudentProfileResponseDto } from './dto/mobile-student-profile.dto';

@ApiTags('User')
@Controller('user')
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

    @Get('student-profile')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get student profile',
        description: 'Retrieve comprehensive student profile including academic, personal, guardian, and performance information'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Student profile retrieved successfully',
        type: StudentProfileResponseDto
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Unauthorized - Invalid or missing JWT token' 
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Student not found or student record not found' 
    })
    @ApiResponse({ 
        status: 500, 
        description: 'Internal server error' 
    })
    getStudentProfile(@GetUser() user: User) {
        return this.userService.getStudentProfile(user);
    }

    @Get('mobile-student-profile')
    @ApiBearerAuth()
    @ApiOperation({ 
        summary: 'Get mobile student profile',
        description: 'Retrieve comprehensive student profile in mobile app format with general info, academic info, settings, and support info'
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Profile retrieved successfully',
        type: MobileStudentProfileResponseDto
    })
    @ApiResponse({ 
        status: 401, 
        description: 'Unauthorized - Invalid or missing JWT token' 
    })
    @ApiResponse({ 
        status: 404, 
        description: 'Student not found or student record not found' 
    })
    @ApiResponse({ 
        status: 500, 
        description: 'Internal server error' 
    })
    getMobileStudentProfile(@GetUser() user: User) {
        return this.userService.getMobileStudentProfile(user);
    }
}
