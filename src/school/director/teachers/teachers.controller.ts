import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { AddNewTeacherDto, UpdateTeacherDto } from './teacher.dto';
import { 
  GetTeachersDashboardDocs, 
  GetClassesAndSubjectsDocs,
  AddNewTeacherDocs, 
  GetTeacherByIdDocs, 
  UpdateTeacherDocs, 
  DeleteTeacherDocs, 
  GetAllTeachersDocs, 
  AssignSubjectsDocs, 
  AssignClassDocs 
} from 'src/docs/director/teachers';

@ApiTags('Teachers')
@Controller('director/teachers')
@UseGuards(JwtGuard)
export class TeachersController {
    constructor(private readonly teachersService: TeachersService) {}

    /**
     * Get teachers dashboard
     * GET /api/v1/director/teachers/dashboard
     */
    @Get('dashboard')
    @HttpCode(HttpStatus.OK)
    @GetTeachersDashboardDocs.operation
    @GetTeachersDashboardDocs.bearerAuth
    @GetTeachersDashboardDocs.response200
    @GetTeachersDashboardDocs.response401
    @GetTeachersDashboardDocs.response500
    fetchTeachersDashboard(
        @GetUser() user: User,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('gender') gender?: string,
        @Query('class_id') class_id?: string,
        @Query('sort_by') sort_by: string = 'createdAt',
        @Query('sort_order') sort_order: string = 'desc'
    ) {
        return this.teachersService.fetchTeachersDashboard({
            user,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            search,
            status: status as any,
            gender: gender as any,
            class_id,
            sort_by: sort_by as any,
            sort_order: sort_order as any
        });
    }

    /**
     * Get classes and subjects for teacher creation
     * GET /api/v1/director/teachers/classes-subjects
     */
    @Get('classes-subjects')
    @HttpCode(HttpStatus.OK)
    @GetClassesAndSubjectsDocs.operation
    @GetClassesAndSubjectsDocs.bearerAuth
    @GetClassesAndSubjectsDocs.response200
    @GetClassesAndSubjectsDocs.response401
    @GetClassesAndSubjectsDocs.response500
    fetchClassesAndSubjects(@GetUser() user: User) {
        return this.teachersService.fetchClassesAndSubjects({
            school_id: user.school_id
        });
    }

    /**
     * Add new teacher
     * POST /api/v1/director/teachers
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @AddNewTeacherDocs.operation
    @AddNewTeacherDocs.bearerAuth
    @AddNewTeacherDocs.body
    @AddNewTeacherDocs.response201
    @AddNewTeacherDocs.response400
    @AddNewTeacherDocs.response409
    @AddNewTeacherDocs.response401
    @AddNewTeacherDocs.response500
    addNewTeacher(
        @Body() dto: AddNewTeacherDto,
        @GetUser() user: User
    ) {
        return this.teachersService.addNewTeacher({
            ...dto,
            user
        });
    }

    /**
     * Get teacher by ID
     * GET /api/v1/director/teachers/:id
     */
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    @GetTeacherByIdDocs.operation
    @GetTeacherByIdDocs.bearerAuth
    @GetTeacherByIdDocs.param
    @GetTeacherByIdDocs.response200
    @GetTeacherByIdDocs.response404
    @GetTeacherByIdDocs.response401
    @GetTeacherByIdDocs.response500
    getTeacherById(@Param('id') id: string) {
        return this.teachersService.getTeacherById(id);
    }

    /**
     * Update teacher
     * PUT /api/v1/director/teachers/:id
     */
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    @UpdateTeacherDocs.operation
    @UpdateTeacherDocs.bearerAuth
    @UpdateTeacherDocs.param
    @UpdateTeacherDocs.body
    @UpdateTeacherDocs.response200
    @UpdateTeacherDocs.response400
    @UpdateTeacherDocs.response404
    @UpdateTeacherDocs.response401
    @UpdateTeacherDocs.response500
    updateTeacher(
        @Param('id') id: string,
        @Body() dto: UpdateTeacherDto,
        @GetUser() user: User
    ) {
        return this.teachersService.updateTeacher(id, dto, user);
    }

    /**
     * Delete teacher
     * DELETE /api/v1/director/teachers/:id
     */
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @DeleteTeacherDocs.operation
    @DeleteTeacherDocs.bearerAuth
    @DeleteTeacherDocs.param
    @DeleteTeacherDocs.response200
    @DeleteTeacherDocs.response404
    @DeleteTeacherDocs.response401
    @DeleteTeacherDocs.response500
    deleteTeacher(@Param('id') id: string) {
        return this.teachersService.deleteTeacher(id);
    }

    /**
     * Get all teachers with pagination
     * GET /api/v1/director/teachers
     */
    @Get()
    @HttpCode(HttpStatus.OK)
    @GetAllTeachersDocs.operation
    @GetAllTeachersDocs.bearerAuth
    @GetAllTeachersDocs.query
    @GetAllTeachersDocs.queryLimit
    @GetAllTeachersDocs.queryStatus
    @GetAllTeachersDocs.response200
    @GetAllTeachersDocs.response401
    @GetAllTeachersDocs.response500
    getAllTeachers(
        @GetUser() user: User,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('status') status?: string
    ) {
        return this.teachersService.getAllTeachers({
            page,
            limit,
            status,
            school_id: user.school_id
        });
    }

    /**
     * Assign subjects to teacher
     * POST /api/v1/director/teachers/:id/subjects
     */
    @Post(':id/subjects')
    @HttpCode(HttpStatus.OK)
    @AssignSubjectsDocs.operation
    @AssignSubjectsDocs.bearerAuth
    @AssignSubjectsDocs.param
    @AssignSubjectsDocs.body
    @AssignSubjectsDocs.response200
    @AssignSubjectsDocs.response400
    @AssignSubjectsDocs.response404
    @AssignSubjectsDocs.response401
    @AssignSubjectsDocs.response500
    assignSubjects(
        @Param('id') id: string,
        @Body() body: { subjectIds: string[] }
    ) {
        return this.teachersService.assignSubjects(id, body.subjectIds);
    }

    /**
     * Assign class to teacher
     * POST /api/v1/director/teachers/:id/class
     */
    @Post(':id/class')
    @HttpCode(HttpStatus.OK)
    @AssignClassDocs.operation
    @AssignClassDocs.bearerAuth
    @AssignClassDocs.param
    @AssignClassDocs.body
    @AssignClassDocs.response200
    @AssignClassDocs.response400
    @AssignClassDocs.response404
    @AssignClassDocs.response401
    @AssignClassDocs.response500
    assignClass(
        @Param('id') id: string,
        @Body() body: { classId: string }
    ) {
        return this.teachersService.assignClass(id, body.classId);
    }

    /**
     * Get teacher classes and subjects
     * GET /api/v1/director/teachers/:id/classes-subjects
     */
    @Get(':id/classes-subjects')
    @HttpCode(HttpStatus.OK)
    fetchTeacherClassesAndSubjects(
        @Param('id') teacherId: string,
        @GetUser() user: User
    ) {
        return this.teachersService.fetchTeacherClassesAndSubjects(teacherId, user);
    }
}
