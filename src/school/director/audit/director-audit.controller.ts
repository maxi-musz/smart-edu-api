import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { DirectorAuditService } from './director-audit.service';

@ApiTags('Director Audit')
@Controller('director/audit')
@UseGuards(JwtGuard)
export class DirectorAuditController {
  constructor(private readonly directorAuditService: DirectorAuditService) {}

  @Get('logs')
  listLogs(
    @GetUser() user: { sub: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('audit_for_type') audit_for_type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.directorAuditService.listAuditLogs(user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      audit_for_type,
      from,
      to,
    });
  }
}
