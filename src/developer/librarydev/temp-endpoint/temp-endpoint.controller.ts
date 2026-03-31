import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { TempEndpointService } from './temp-endpoint.service';
import { TempEndpointPingDocs } from './docs/temp-endpoint.docs';

@ApiTags('Developer - Library Temp Endpoint')
@Controller('developer/librarydev/temp-endpoint')
export class TempEndpointController {
  constructor(private readonly tempEndpointService: TempEndpointService) {}

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @TempEndpointPingDocs.operation
  @TempEndpointPingDocs.response200
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  ping() {
    return this.tempEndpointService.ping();
  }
}
