import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class DeveloperService {
  private readonly logger = new Logger(DeveloperService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('Fetching developer overview stats'));

    const [schoolCount, userCount, libraryPlatformCount] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count(),
      this.prisma.libraryPlatform.count(),
    ]);

    const data = {
      schoolCount,
      userCount,
      libraryPlatformCount,
    };

    return new ApiResponse(true, 'Developer overview stats retrieved successfully', data);
  }
}


