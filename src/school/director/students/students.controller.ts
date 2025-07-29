import { Controller, Get, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetStudentsDashboardDocs } from 'src/docs/director/students';

@ApiTags('Students')
@Controller('director/students')
@UseGuards(JwtGuard)
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) {}

    @Get('dashboard')
    @GetStudentsDashboardDocs.bearerAuth
    @GetStudentsDashboardDocs.operation
    @GetStudentsDashboardDocs.response200
    @GetStudentsDashboardDocs.response401
    fetchStudentsDashboard(@GetUser() user: User) {
        return this.studentsService.fetchStudentsDashboard(user.school_id);
    }
} 