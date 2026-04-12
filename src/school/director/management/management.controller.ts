import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { ManagementService } from './management.service';
import {
  AssignStudentsClassDto,
  DirectorCreateAcademicSessionDto,
  DirectorUpdateAcademicSessionDto,
  ManagementDashboardQueryDto,
  PreviewProgressionDto,
  StudentIdsBodyDto,
} from './dto/management.dto';
import { AcademicSessionStatus, AcademicTerm } from '@prisma/client';

@ApiTags('Director Management')
@Controller('director/management')
@UseGuards(JwtGuard)
export class ManagementController {
  constructor(private readonly managementService: ManagementService) {}

  @Get('dashboard')
  getDashboard(
    @GetUser() user: { sub: string },
    @Query() query: ManagementDashboardQueryDto,
  ) {
    return this.managementService.getDashboard(user.sub, query);
  }

  @Get('sessions')
  listSessions(
    @GetUser() user: { sub: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('term') term?: AcademicTerm,
    @Query('status') status?: AcademicSessionStatus,
    @Query('is_current') is_current?: string,
  ) {
    const isCurrentParsed =
      is_current === 'true'
        ? true
        : is_current === 'false'
          ? false
          : undefined;
    return this.managementService.listSessions(
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
      term,
      status,
      isCurrentParsed,
    );
  }

  @Post('sessions')
  createSession(
    @GetUser() user: { sub: string },
    @Body() dto: DirectorCreateAcademicSessionDto,
  ) {
    return this.managementService.createSession(user.sub, dto);
  }

  @Patch('sessions/:id')
  updateSession(
    @GetUser() user: { sub: string },
    @Param('id') id: string,
    @Body() dto: DirectorUpdateAcademicSessionDto,
  ) {
    return this.managementService.updateSession(user.sub, id, dto);
  }

  @Delete('sessions/:id')
  deleteSession(@GetUser() user: { sub: string }, @Param('id') id: string) {
    return this.managementService.deleteSession(user.sub, id);
  }

  @Post('sessions/:id/set-current')
  setCurrentSession(
    @GetUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.managementService.setCurrentSession(user.sub, id);
  }

  @Get('class-ladder')
  getClassLadder(@GetUser() user: { sub: string }) {
    return this.managementService.getClassLadder(user.sub);
  }

  @Post('students/assign-class')
  assignClass(
    @GetUser() user: { sub: string },
    @Body() dto: AssignStudentsClassDto,
  ) {
    return this.managementService.assignStudentsToClass(user.sub, dto);
  }

  @Post('students/preview-progression')
  previewProgression(
    @GetUser() user: { sub: string },
    @Body() dto: PreviewProgressionDto,
  ) {
    return this.managementService.previewProgression(user.sub, dto);
  }

  @Post('students/promote-next')
  promoteNext(
    @GetUser() user: { sub: string },
    @Body() dto: StudentIdsBodyDto,
  ) {
    return this.managementService.promoteStudentsNext(user.sub, dto);
  }

  @Post('students/demote-previous')
  demotePrevious(
    @GetUser() user: { sub: string },
    @Body() dto: StudentIdsBodyDto,
  ) {
    return this.managementService.demoteStudentsPrevious(user.sub, dto);
  }
}
