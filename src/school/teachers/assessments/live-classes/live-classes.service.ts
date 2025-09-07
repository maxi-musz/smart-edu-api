import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ResponseHelper } from '../../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class LiveClassesService {
  private readonly logger = new Logger(LiveClassesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // LIVE CLASS MANAGEMENT METHODS
  // ========================================
  
  // TODO: Implement live class methods:
  // - createLiveClass()
  // - getTopicLiveClasses()
  // - getLiveClassById()
  // - updateLiveClass()
  // - deleteLiveClass()
  // - startLiveClass()
  // - endLiveClass()
  // - joinLiveClass()
  // - getParticipants()
  // - getLiveClassAnalytics()
}
