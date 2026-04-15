import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DirectorResultService } from './director-result.service';
import { JwtGuard } from '../../school/auth/guard/jwt.guard';
import { GetUser } from '../../school/auth/decorator/get-user-decorator';
import { ReleaseResultsForStudentsDto } from './dto/release-results.dto';
import {
  DocReleaseWholeSchool,
  DocReleaseStudent,
  DocReleaseClass,
  DocReleaseStudents,
  DocUnreleaseWholeSchool,
  DocUnreleaseStudent,
  DocUnreleaseStudents,
  DocUnreleaseClass,
  DocGetResultsDashboard,
  DocFetchResultDashboardAlias,
} from './docs';

@ApiTags('Director - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/results')
export class DirectorResultController {
  constructor(private readonly directorResultService: DirectorResultService) {}

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @DocReleaseWholeSchool()
  async releaseResults(@GetUser() user: any) {
    return this.directorResultService.releaseResults(user.school_id, user.sub);
  }

  @Post('release/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @DocReleaseStudent()
  async releaseResultsForStudent(
    @GetUser() user: any,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId?: string,
  ) {
    return this.directorResultService.releaseResultsForStudent(
      user.school_id,
      user.sub,
      studentId,
      sessionId,
    );
  }

  @Post('release/class/:classId')
  @HttpCode(HttpStatus.OK)
  @DocReleaseClass()
  async releaseResultsForClass(
    @GetUser() user: any,
    @Param('classId') classId: string,
    @Query('session_id') sessionId?: string,
  ) {
    return this.directorResultService.releaseResultsForClass(
      user.school_id,
      user.sub,
      classId,
      sessionId,
    );
  }

  @Post('release/students')
  @HttpCode(HttpStatus.OK)
  @DocReleaseStudents()
  async releaseResultsForStudents(
    @GetUser() user: any,
    @Body() dto: ReleaseResultsForStudentsDto,
  ) {
    return this.directorResultService.releaseResultsForStudents(
      user.school_id,
      user.sub,
      dto.studentIds,
      dto.sessionId,
    );
  }

  @Post('unrelease')
  @HttpCode(HttpStatus.OK)
  @DocUnreleaseWholeSchool()
  async unreleaseResults(
    @GetUser() user: any,
    @Query('session_id') sessionId?: string,
  ) {
    return this.directorResultService.unreleaseResults(
      user.school_id,
      user.sub,
      sessionId,
    );
  }

  @Post('unrelease/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @DocUnreleaseStudent()
  async unreleaseResultsForStudent(
    @GetUser() user: any,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId?: string,
  ) {
    return this.directorResultService.unreleaseResultsForStudent(
      user.school_id,
      user.sub,
      studentId,
      sessionId,
    );
  }

  @Post('unrelease/students')
  @HttpCode(HttpStatus.OK)
  @DocUnreleaseStudents()
  async unreleaseResultsForStudents(
    @GetUser() user: any,
    @Body() dto: ReleaseResultsForStudentsDto,
  ) {
    return this.directorResultService.unreleaseResultsForStudents(
      user.school_id,
      user.sub,
      dto.studentIds,
      dto.sessionId,
    );
  }

  @Post('unrelease/class/:classId')
  @HttpCode(HttpStatus.OK)
  @DocUnreleaseClass()
  async unreleaseResultsForClass(
    @GetUser() user: any,
    @Param('classId') classId: string,
    @Query('session_id') sessionId?: string,
  ) {
    return this.directorResultService.unreleaseResultsForClass(
      user.school_id,
      user.sub,
      classId,
      sessionId,
    );
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @DocGetResultsDashboard()
  async getResultsDashboard(
    @GetUser() user: any,
    @Query('session_id') sessionId?: string,
    @Query('class_id') classId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('student_status') studentStatus?: string,
  ) {
    return this.directorResultService.getResultsDashboard(user.sub, {
      sessionId,
      classId,
      page,
      limit,
      search: search ?? q,
      studentStatus,
    });
  }

  /** Same payload as GET dashboard — alias for clients that use this route name. */
  @Get('fetch-result-dashboard')
  @HttpCode(HttpStatus.OK)
  @DocFetchResultDashboardAlias()
  async fetchResultDashboard(
    @GetUser() user: any,
    @Query('session_id') sessionId?: string,
    @Query('class_id') classId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('student_status') studentStatus?: string,
  ) {
    return this.directorResultService.getResultsDashboard(user.sub, {
      sessionId,
      classId,
      page,
      limit,
      search: search ?? q,
      studentStatus,
    });
  }
}
