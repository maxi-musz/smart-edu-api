import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Teacher-facing result endpoints (scores, reports, etc.) — scaffold for upcoming routes.
 */
@Injectable()
export class TeacherResultService {
  private readonly logger = new Logger(TeacherResultService.name);

  constructor(private readonly prisma: PrismaService) {}
}
