import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ApiTags } from '@nestjs/swagger';
import { GetDirectorDashboardDocs } from 'src/docs/dashboard.docs';

@ApiTags('Dashboard')
@Controller('director/dashboard')
export class DashboardController {

    constructor(private readonly dashboardService: DashboardService) {}
    
    // get director dashboard
    // GET /api/v1/director/dashboard/fetch-dashboard-data
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Get('fetch-dashboard-data')
    @GetDirectorDashboardDocs.bearerAuth
    @GetDirectorDashboardDocs.operation
    @GetDirectorDashboardDocs.response200
    @GetDirectorDashboardDocs.response401
    getDirectorDashboard(@GetUser() user: User) {
        return this.dashboardService.getDirectorDashboard(user);
    }
}