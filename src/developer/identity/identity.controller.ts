import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { LoginDeveloperDto, RegisterDeveloperDto } from './dto';
import { RegisterDeveloperDocs } from './docs/developer-identity.docs';
import { LoginDeveloperDocs } from './docs/developer-login.docs';

@ApiTags('Developer - Identity')
@Controller('developer/identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RegisterDeveloperDocs.operation
  @RegisterDeveloperDocs.response201
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async registerDeveloper(@Body() dto: RegisterDeveloperDto) {
    return this.identityService.registerDeveloper(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LoginDeveloperDocs.operation
  @LoginDeveloperDocs.response200
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async loginDeveloper(@Body() dto: LoginDeveloperDto) {
    return this.identityService.loginDeveloper(dto);
  }
}


