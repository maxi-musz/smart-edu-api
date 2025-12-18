import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LibraryAuthService } from './library-auth.service';
import { LibrarySignInDto } from './dto/library-auth.dto';
import { LibraryAuthDocs } from './docs/library-auth.docs';

@ApiTags('Public Library Auth')
@Controller('library/auth')
export class LibraryAuthController {
  constructor(private readonly libraryAuthService: LibraryAuthService) {}

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @LibraryAuthDocs.signIn.operation
  @LibraryAuthDocs.signIn.response200
  async signIn(@Body() dto: LibrarySignInDto) {
    return this.libraryAuthService.signIn(dto);
  }
}

