import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import * as argon from 'argon2';
import { LibrarySignInDto } from './dto/library-auth.dto';

@Injectable()
export class LibraryAuthService {
  private readonly logger = new Logger(LibraryAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async signIn(payload: LibrarySignInDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY AUTH] Signing in library user with email: ${payload.email}`));

    const emailLower = payload.email.toLowerCase();

    const user = await this.prisma.libraryResourceUser.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      this.logger.error(colors.red('Invalid email or password'));
      throw new BadRequestException('Invalid email or password');
    }

    const passwordMatches = await argon.verify(user.password, payload.password);

    if (!passwordMatches) {
      this.logger.error(colors.red('Invalid email or password'));
      throw new BadRequestException('Invalid email or password');
    }

    const { password, ...safeUser } = user as any;

    return new ApiResponse(true, 'Library user signed in successfully', safeUser);
  }
}


