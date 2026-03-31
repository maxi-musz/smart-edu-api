import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TempEndpointService } from './temp-endpoint.service';
import {
  DeleteAllLibraryAiBooksDocs,
  TempEndpointPingDocs,
} from './docs/temp-endpoint.docs';
import { DeleteAllLibraryAiBooksDto } from './dto/delete-all-library-ai-books.dto';

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

  @Post('delete-all-library-ai-books')
  @HttpCode(HttpStatus.OK)
  @DeleteAllLibraryAiBooksDocs.operation
  @ApiBody({ type: DeleteAllLibraryAiBooksDto })
  @DeleteAllLibraryAiBooksDocs.response200
  @ApiResponse({ status: 400, description: 'Invalid confirm token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async deleteAllLibraryAiBooks(@Body() body: DeleteAllLibraryAiBooksDto) {
    const data =
      await this.tempEndpointService.deleteAllLibraryOwnerAiBooks(body.confirm);
    return {
      success: true,
      message:
        'All library general materials (AI books) and related data removed.',
      data,
    };
  }
}
