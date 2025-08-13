import { Controller, Get, UseGuards, Query } from '@nestjs/common';
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
    fetchStudentsDashboard(
        @GetUser() user: User,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('class_id') class_id?: string,
        @Query('classId') classId?: string,
        @Query('sort_by') sort_by: string = 'createdAt',
        @Query('sort_order') sort_order: string = 'desc'
    ) {
        return this.studentsService.fetchStudentsDashboard(user.school_id, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search,
            status: status as any,
            class_id: class_id || classId, // Support both class_id and classId
            sort_by: sort_by as any,
            sort_order: sort_order as any
        });
    }
} 