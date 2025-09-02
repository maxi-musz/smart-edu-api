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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new subject' })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Academic session not found' })
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
  @ApiOperation({ 
    summary: 'Get all subjects for a school with pagination, filtering, and search',
    description: 'Retrieve subjects with support for pagination, search, filtering by academic session, color, and active status, and sorting by various fields.'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, code, or description', example: 'math' })
  @ApiQuery({ name: 'academicSessionId', required: false, description: 'Filter by academic session ID', example: 'session-uuid' })
  @ApiQuery({ name: 'color', required: false, description: 'Filter by subject color', example: '#FF5733' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', example: true })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (name, code, createdAt, updatedAt)', example: 'name' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (asc, desc)', example: 'asc' })
  @ApiResponse({
    status: 200,
    description: 'Subjects retrieved successfully',
    type: PaginatedSubjectsResponseDto,
  })
  async getAllSubjects(
    @GetUser() user: any,
    @Query() query: QuerySubjectsDto,
  ): Promise<PaginatedSubjectsResponseDto> {
    return this.subjectsService.getAllSubjects(user.school_id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subject by ID' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({
    status: 200,
    description: 'Subject retrieved successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getSubjectById(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.getSubjectById(id, user.school_id);
  }

  @Get(':id/comprehensive')
  @ApiOperation({ 
    summary: 'Get comprehensive subject data with topics, videos, and materials',
    description: 'Retrieve detailed subject information including paginated topics with their associated videos and materials, plus comprehensive statistics.'
  })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number for topics (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Topics per page (default: 10, max: 100)', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Search in topic title or description', example: 'grammar' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by topic status', example: 'active' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by content type', example: 'all' })
  @ApiQuery({ name: 'orderBy', required: false, description: 'Order topics by field', example: 'order' })
  @ApiQuery({ name: 'orderDirection', required: false, description: 'Sort order', example: 'asc' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive subject data retrieved successfully',
    type: ComprehensiveSubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async getComprehensiveSubjectById(
    @Param('id') id: string,
    @GetUser() user: any,
    @Query() query: ComprehensiveSubjectQueryDto,
  ): Promise<ComprehensiveSubjectResponseDto> {
    return this.subjectsService.getComprehensiveSubjectById(id, user.school_id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
    type: SubjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @GetUser() user: any,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.updateSubject(id, updateSubjectDto, user.school_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 204, description: 'Subject deleted successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete subject with topics' })
  async deleteSubject(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<void> {
    return this.subjectsService.deleteSubject(id, user.school_id);
  }

  @Post(':id/assign-teacher')
  @ApiOperation({ summary: 'Assign a teacher to a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Teacher assigned successfully' })
  @ApiResponse({ status: 404, description: 'Subject or teacher not found' })
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
  @ApiOperation({ summary: 'Remove a teacher from a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({ status: 204, description: 'Teacher removed successfully' })
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
  @ApiOperation({ summary: 'Get all teachers assigned to a subject' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiResponse({
    status: 200,
    description: 'Teachers retrieved successfully',
    type: 'array',
  })
  async getTeachersForSubject(
    @Param('id') subjectId: string,
    @GetUser() user: any,
  ): Promise<any[]> {
    return this.subjectsService.getTeachersForSubject(subjectId, user.school_id);
  }
}
