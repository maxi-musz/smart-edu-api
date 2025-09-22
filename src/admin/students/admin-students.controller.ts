import { Controller, Get, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtGuard } from '../../school/auth/guard';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse as StdResponse } from '../../shared/helper-functions/response';

@ApiTags('Admin - Students')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('admin/students')
export class AdminStudentsController {
  @Get('class-result.pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Download class result PDF' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'classId', required: true })
  @ApiResponse({ status: 200, description: 'Class result PDF generated' })
  @ApiResponse({ status: 400, description: 'Missing required query params' })
  async getClassResultPdf(
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
  ) {
    if (!schoolId || !classId) {
      return new StdResponse<null>(false, 'Missing schoolId or classId', null);
    }

    // TODO: Implement real PDF generation/stream.
    return new StdResponse(true, 'Endpoint resolved. PDF generation pending implementation', {
      schoolId,
      classId,
    } as any);
  }
}


