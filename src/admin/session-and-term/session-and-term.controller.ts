import { Controller, Post, Body, Patch, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { SessionAndTermService } from './session-and-term.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto, UpdateTermDto } from './dto/update-academic-session.dto';
import { SessionAndTermDocs } from './api-docs/session-and-term.docs';
import { JwtGuard } from '../../school/auth/guard/jwt.guard';

@ApiTags('Admin - Session and Term Management')
@UseGuards(JwtGuard)
@Controller('admin/session-and-term')
export class SessionAndTermController {
  constructor(private readonly sessionAndTermService: SessionAndTermService) {}

  /**
   * Create a new academic session for a school
   * POST /api/v1/admin/session-and-term/academic-session
   */
  @Post('academic-session')
  @HttpCode(HttpStatus.CREATED)
  @SessionAndTermDocs.bearerAuth
  @SessionAndTermDocs.createOperation
  @SessionAndTermDocs.createResponse201
  @SessionAndTermDocs.createResponse400
  @SessionAndTermDocs.createResponse401
  @SessionAndTermDocs.createResponse500
  async createAcademicSession(@Body() createDto: CreateAcademicSessionDto) {
    return this.sessionAndTermService.createAcademicSession(createDto);
  }

  /**
   * Update an academic session (all terms in the session)
   * PATCH /api/v1/admin/session-and-term/academic-session/:sessionId
   */
  @Patch('academic-session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @SessionAndTermDocs.bearerAuth
  @SessionAndTermDocs.updateSessionOperation
  @ApiParam({ name: 'sessionId', description: 'Academic session ID (any term ID from the session)' })
  @SessionAndTermDocs.updateSessionResponse200
  @SessionAndTermDocs.updateSessionResponse400
  @SessionAndTermDocs.updateSessionResponse404
  @SessionAndTermDocs.updateSessionResponse401
  @SessionAndTermDocs.updateSessionResponse500
  async updateAcademicSession(
    @Param('sessionId') sessionId: string,
    @Body() updateDto: UpdateAcademicSessionDto
  ) {
    return this.sessionAndTermService.updateAcademicSession(sessionId, updateDto);
  }

  /**
   * Update a specific term
   * PATCH /api/v1/admin/session-and-term/term/:termId
   */
  @Patch('term/:termId')
  @HttpCode(HttpStatus.OK)
  @SessionAndTermDocs.bearerAuth
  @SessionAndTermDocs.updateTermOperation
  @ApiParam({ name: 'termId', description: 'Term ID (academic session ID)' })
  @SessionAndTermDocs.updateTermResponse200
  @SessionAndTermDocs.updateTermResponse400
  @SessionAndTermDocs.updateTermResponse404
  @SessionAndTermDocs.updateTermResponse401
  @SessionAndTermDocs.updateTermResponse500
  async updateTerm(
    @Param('termId') termId: string,
    @Body() updateDto: UpdateTermDto
  ) {
    return this.sessionAndTermService.updateTerm(termId, updateDto);
  }
}

