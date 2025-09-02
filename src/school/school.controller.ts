import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from './auth/guard/jwt.guard';

@ApiTags('School')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('school')
export class SchoolController {
  constructor() {}

  @Get('health')
  @ApiOperation({ summary: 'School module health check' })
  async healthCheck() {
    return {
      status: 'ok',
      message: 'School module is running',
      timestamp: new Date().toISOString(),
    };
  }
}
