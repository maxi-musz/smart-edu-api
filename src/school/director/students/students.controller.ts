import { Controller, Get, UseGuards, Query, HttpCode, HttpStatus, Post, Body, Patch, Param } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { StudentsDocs } from './api-docs/students.docs';
import { AddStudentToClassDto, EnrollNewStudentDto, UpdateStudentDto } from './dto/auth.dto';

@ApiTags('Students')
@Controller('director/students')
@UseGuards(JwtGuard)
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) {}

    @Get('dashboard')
    @StudentsDocs.bearerAuth
    @StudentsDocs.operation
    @StudentsDocs.response200
    @StudentsDocs.response401
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

    @Post('enroll-student')
    @HttpCode(HttpStatus.CREATED)
    @StudentsDocs.bearerAuth
    @StudentsDocs.enrollStudentOperation
    @StudentsDocs.enrollStudentResponse201
    @StudentsDocs.enrollStudentResponse400
    @StudentsDocs.response401
    @StudentsDocs.enrollStudentResponse403
    @StudentsDocs.enrollStudentResponse404
    addStudentToClass(@GetUser() user: User, @Body() dto: AddStudentToClassDto) {
        return this.studentsService.addStudentToClass(user, dto);
    }

    @Post('enroll-new-student')
    @HttpCode(HttpStatus.CREATED)
    @StudentsDocs.bearerAuth
    enrollNewStudent(@GetUser() user: User, @Body() dto: EnrollNewStudentDto) {
        return this.studentsService.enrollNewStudent(user, dto);
    }

    @Get('available-classes')
    @HttpCode(HttpStatus.OK)
    @StudentsDocs.bearerAuth
    @StudentsDocs.availableClassesOperation
    @StudentsDocs.availableClassesResponse200
    @StudentsDocs.response401
    getAvailableClasses(@GetUser() user: User) {
        return this.studentsService.getAvailableClasses(user);
    }

    @Patch(':studentId')
    @HttpCode(HttpStatus.OK)
    @StudentsDocs.bearerAuth
    updateStudent(
        @GetUser() user: User,
        @Param('studentId') studentId: string,
        @Body() dto: UpdateStudentDto
    ) {
        return this.studentsService.updateStudent(studentId, dto, user);
    }
}