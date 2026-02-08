import { Body, Controller, Get, Patch, Post, HttpCode, HttpStatus, Param, Request, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import {
  GetAllSchoolsDocs,
  GetSchoolByIdDocs,
  ApproveSchoolDocs,
  OnboardSchoolDocs,
  OnboardClassesDocs,
  OnboardTeachersDocs,
  OnboardStudentsDocs,
  CreateSubjectDocs,
  EditSubjectDocs,
} from './docs/schools.docs';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { FileValidationInterceptor } from '../../shared/interceptors/file-validation.interceptor';
import {
  OnboardSchoolDto,
  OnboardClassesDto,
  OnboardTeachersDto,
  OnboardStudentsDto,
} from '../../school/director/students/dto/auth.dto';
import { CreateSubjectDto, EditSubjectDto } from '../../shared/dto/subject.dto';

@ApiTags('Library Schools')
@Controller('library/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Post('onboard-school')
  @HttpCode(HttpStatus.CREATED)
  @OnboardSchoolDocs.bearerAuth
  @OnboardSchoolDocs.operation
  @OnboardSchoolDocs.consumes
  @OnboardSchoolDocs.body
  @OnboardSchoolDocs.response201
  @OnboardSchoolDocs.response400
  @OnboardSchoolDocs.response401
  @OnboardSchoolDocs.response403
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cac_or_approval_letter', maxCount: 1 },
      { name: 'utility_bill', maxCount: 1 },
      { name: 'tax_cert', maxCount: 1 },
      { name: 'school_icon', maxCount: 1 },
    ]),
    FileValidationInterceptor,
  )
  async onboardSchool(
    @Body() dto: OnboardSchoolDto,
    @UploadedFiles() files: {
      cac_or_approval_letter?: Express.Multer.File[];
      utility_bill?: Express.Multer.File[];
      tax_cert?: Express.Multer.File[];
      school_icon?: Express.Multer.File[];
    },
    @Request() req: { libraryUser: { id: string } },
  ) {
    const fileArray = [
      files.cac_or_approval_letter?.[0],
      files.utility_bill?.[0],
      files.tax_cert?.[0],
    ].filter((file): file is Express.Multer.File => file !== undefined);
    const schoolIcon = files.school_icon?.[0];
    return this.schoolsService.onboardSchool(dto, fileArray, schoolIcon, req.libraryUser);
  }

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Post(':schoolId/onboard-classes')
  @HttpCode(HttpStatus.CREATED)
  @OnboardClassesDocs.bearerAuth
  @OnboardClassesDocs.operation
  @OnboardClassesDocs.response201
  @OnboardClassesDocs.response400
  @OnboardClassesDocs.response401
  @OnboardClassesDocs.response403
  @OnboardClassesDocs.response404
  onboardClasses(
    @Param('schoolId') schoolId: string,
    @Body() dto: OnboardClassesDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.schoolsService.onboardClasses(schoolId, dto, req.libraryUser);
  }

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Post(':schoolId/onboard-teachers')
  @HttpCode(HttpStatus.CREATED)
  @OnboardTeachersDocs.bearerAuth
  @OnboardTeachersDocs.operation
  @OnboardTeachersDocs.response201
  @OnboardTeachersDocs.response400
  @OnboardTeachersDocs.response401
  @OnboardTeachersDocs.response403
  @OnboardTeachersDocs.response404
  onboardTeachers(
    @Param('schoolId') schoolId: string,
    @Body() dto: OnboardTeachersDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.schoolsService.onboardTeachers(schoolId, dto, req.libraryUser);
  }

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Post(':schoolId/onboard-students')
  @HttpCode(HttpStatus.CREATED)
  @OnboardStudentsDocs.bearerAuth
  @OnboardStudentsDocs.operation
  @OnboardStudentsDocs.response201
  @OnboardStudentsDocs.response400
  @OnboardStudentsDocs.response401
  @OnboardStudentsDocs.response403
  @OnboardStudentsDocs.response404
  onboardStudents(
    @Param('schoolId') schoolId: string,
    @Body() dto: OnboardStudentsDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.schoolsService.onboardStudents(schoolId, dto, req.libraryUser);
  }

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Post(':schoolId/create-subject')
  @HttpCode(HttpStatus.CREATED)
  @CreateSubjectDocs.bearerAuth
  @CreateSubjectDocs.operation
  @CreateSubjectDocs.response201
  @CreateSubjectDocs.response400
  @CreateSubjectDocs.response401
  @CreateSubjectDocs.response403
  @CreateSubjectDocs.response404
  createSubject(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSubjectDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.schoolsService.createSubject(schoolId, dto, req.libraryUser);
  }

  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @Patch(':schoolId/subjects/:subjectId')
  @HttpCode(HttpStatus.OK)
  @EditSubjectDocs.bearerAuth
  @EditSubjectDocs.operation
  @EditSubjectDocs.response200
  @EditSubjectDocs.response400
  @EditSubjectDocs.response401
  @EditSubjectDocs.response403
  @EditSubjectDocs.response404
  editSubject(
    @Param('schoolId') schoolId: string,
    @Param('subjectId') subjectId: string,
    @Body() dto: EditSubjectDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.schoolsService.editSubject(schoolId, subjectId, dto, req.libraryUser);
  }

  @Get('getallschools')
  @HttpCode(HttpStatus.OK)
  @GetAllSchoolsDocs.operation
  @GetAllSchoolsDocs.response200
  @GetAllSchoolsDocs.response500
  async getAllSchools() {
    return this.schoolsService.getAllSchools();
  }

  @Get('getschoolbyid/:id')
  @HttpCode(HttpStatus.OK)
  @GetSchoolByIdDocs.operation
  @GetSchoolByIdDocs.response200
  @GetSchoolByIdDocs.response404
  @GetSchoolByIdDocs.response500
  async getSchoolById(@Param('id') id: string) {
    return this.schoolsService.getSchoolById(id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApproveSchoolDocs.operation
  @ApproveSchoolDocs.response200
  @ApproveSchoolDocs.response400
  @ApproveSchoolDocs.response404
  @ApproveSchoolDocs.response500
  async approveSchool(@Param('id') id: string) {
    return this.schoolsService.approveSchool(id);
  }
}

