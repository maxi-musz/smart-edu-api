import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Developer')
@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview() {
    const result = await this.developerService.getOverview();
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


