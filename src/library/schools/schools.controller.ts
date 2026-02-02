import { Controller, Get, Patch, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { GetAllSchoolsDocs, GetSchoolByIdDocs, ApproveSchoolDocs } from './docs/schools.docs';

@ApiTags('Library Schools')
@Controller('library/schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

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

