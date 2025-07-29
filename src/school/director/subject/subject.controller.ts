import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { CreateSubjectDto, EditSubjectDto } from 'src/shared/dto/subject.dto';
import { ApiTags } from '@nestjs/swagger';
import { GetAllSubjectsDocs, CreateSubjectDocs, EditSubjectDocs } from 'src/docs/director/subjects';

@ApiTags('Subjects')
@Controller('director/subjects')
@UseGuards(JwtGuard)
export class SubjectController {
    constructor(private readonly subjectService: SubjectService) {}

    @Get('fetch-all-subjects')
    @GetAllSubjectsDocs.bearerAuth
    @GetAllSubjectsDocs.operation
    @GetAllSubjectsDocs.response200
    @GetAllSubjectsDocs.response401
    fetchAllSubjects(@GetUser() user: User) {
        return this.subjectService.fetchAllSubjects(user);
    }

    @Post('create-subject')
    @CreateSubjectDocs.bearerAuth
    @CreateSubjectDocs.operation
    @CreateSubjectDocs.response201
    @CreateSubjectDocs.response400
    @CreateSubjectDocs.response401
    createSubject(
        @GetUser() user: User,
        @Body() dto: CreateSubjectDto
    ) {
        return this.subjectService.createSubject(user, dto);
    }

    @Put('edit-subject/:id')
    @EditSubjectDocs.bearerAuth
    @EditSubjectDocs.operation
    @EditSubjectDocs.param
    @EditSubjectDocs.response200
    @EditSubjectDocs.response400
    @EditSubjectDocs.response401
    @EditSubjectDocs.response404
    editSubject(
        @GetUser() user: User,
        @Param('id') subjectId: string,
        @Body() data: EditSubjectDto
    ) {
        return this.subjectService.editSubject(user, subjectId, data);
    }
}
