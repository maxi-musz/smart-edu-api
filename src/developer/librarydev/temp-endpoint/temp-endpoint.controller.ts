import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LibraryJwtGuard } from '../../../library/library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../../../library/library-auth/guard/library-owner.guard';
import { TempEndpointService } from './temp-endpoint.service';
import {
  DeleteAllLibraryAiBooksDocs,
  TempEndpointPingDocs,
} from './docs/temp-endpoint.docs';

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

  @Delete('delete-all-library-ai-books')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @ApiBearerAuth()
  @DeleteAllLibraryAiBooksDocs.operation
  @DeleteAllLibraryAiBooksDocs.response200
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin or manager only' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async deleteAllLibraryAiBooks() {
    const data =
      await this.tempEndpointService.deleteAllLibraryOwnerAiBooks();
    return {
      success: true,
      message:
        'All library general materials (AI books) and related data removed.',
      data,
    };
  }
}
