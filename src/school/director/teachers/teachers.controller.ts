import { Controller, Get, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetTeachersDashboardDocs } from 'src/docs/teachers.docs';

@ApiTags('Teachers')
@Controller('director/teachers')
@UseGuards(JwtGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) {}

    @Get('dashboard')
    @GetTeachersDashboardDocs.bearerAuth
    @GetTeachersDashboardDocs.operation
    @GetTeachersDashboardDocs.response200
    @GetTeachersDashboardDocs.response401
    fetchTeachersDashboard(@GetUser() user: User) {
        return this.teachersService.fetchTeachersDashboard({
            school_id: user.school_id
        });
    }
}
