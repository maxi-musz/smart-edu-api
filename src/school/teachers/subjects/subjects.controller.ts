import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { PaginatedSubjectsResponseDto } from './dto/paginated-subjects-response.dto';
import { ComprehensiveSubjectQueryDto } from './dto/comprehensive-subject-query.dto';
import { ComprehensiveSubjectResponseDto } from './dto/comprehensive-subject-response.dto';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';

@ApiTags('Teachers - Subjects')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  async createSubject(
    @Body() createSubjectDto: CreateSubjectDto,
    @GetUser() user: any,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.createSubject(
      createSubjectDto,
      user.school_id,
      user.id,
    );
  }

  @Get()
  async getAllSubjects(
    @GetUser() user: any,
    @Query() query: QuerySubjectsDto,
  ): Promise<PaginatedSubjectsResponseDto> {
    return this.subjectsService.getAllSubjects(user.school_id, query);
  }

  @Get(':id')
  async getSubjectById(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.getSubjectById(id, user.school_id);
  }

  @Get(':id/comprehensive')
  async getComprehensiveSubjectById(
    @Param('id') id: string,
    @GetUser() user: any,
    @Query() query: ComprehensiveSubjectQueryDto,
  ): Promise<ComprehensiveSubjectResponseDto> {
    return this.subjectsService.getComprehensiveSubjectById(id, user.school_id, query);
  }

  @Patch(':id')
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @GetUser() user: any,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.updateSubject(id, updateSubjectDto, user.school_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubject(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<void> {
    return this.subjectsService.deleteSubject(id, user.school_id);
  }

  @Post(':id/assign-teacher')
  async assignTeacherToSubject(
    @Param('id') subjectId: string,
    @Body('teacherId') teacherId: string,
    @GetUser() user: any,
  ): Promise<void> {
    return this.subjectsService.assignTeacherToSubject(
      subjectId,
      teacherId,
      user.school_id,
    );
  }

  @Delete(':id/remove-teacher')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTeacherFromSubject(
    @Param('id') subjectId: string,
    @Body('teacherId') teacherId: string,
    @GetUser() user: any,
  ): Promise<void> {
    return this.subjectsService.removeTeacherFromSubject(
      subjectId,
      teacherId,
      user.school_id,
    );
  }

  @Get(':id/teachers')
  async getTeachersForSubject(
    @Param('id') subjectId: string,
    @GetUser() user: any,
  ): Promise<any[]> {
    return this.subjectsService.getTeachersForSubject(subjectId, user.school_id);
  }
}
