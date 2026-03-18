import { Injectable, Logger } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class DirectorAssessmentsService {
  private readonly logger = new Logger(DirectorAssessmentsService.name);

  constructor() {
    this.logger.log(
      colors.cyan(
        'DirectorAssessmentsService initialized (no logic implemented yet).',
      ),
    );
  }
}
