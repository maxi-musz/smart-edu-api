import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import * as argon from 'argon2';
import { LibrarySignInDto } from './dto/library-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LibraryAuthService {
  private readonly logger = new Logger(LibraryAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signToken(
    userId: string,
    email: string,
    platformId: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = {
      sub: userId,
      email,
      platform_id: platformId,
    };

    const secret = this.config.get('JWT_SECRET');
    const accessTokenExpiresIn = this.config.get('JWT_EXPIRES_IN') || '15m';
    const refreshTokenExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';

    try {
      const accessToken = await this.jwt.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
        secret: secret,
      });

      const refreshToken = await this.jwt.signAsync(payload, {
        expiresIn: refreshTokenExpiresIn,
        secret: secret,
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    } catch (error) {
      this.logger.error(colors.red('Error generating tokens:'), error);
      throw error;
    }
  }

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

    // Generate tokens
    const { access_token, refresh_token } = await this.signToken(
      user.id,
      user.email,
      user.platformId,
    );

    this.logger.log(colors.green('Library user signed in successfully'));

    return new ApiResponse(true, 'Library user signed in successfully', {
      access_token,
      refresh_token,
      user: safeUser,
    });
  }
}


