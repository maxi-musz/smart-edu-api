import { Injectable, Logger } from '@nestjs/common';
import * as colors from 'colors';
import { ApiResponse } from '../../shared/helper-functions/response';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import { LoginDeveloperDto, RegisterDeveloperDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async registerDeveloper(dto: RegisterDeveloperDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Registering new developer: ${dto.email}`));

    try {
      // Check for existing developer by email
      const existing = await this.prisma.developer.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        this.logger.warn(colors.yellow(`⚠️ Developer with email already exists: ${dto.email}`));
        return ResponseHelper.error('Developer with this email already exists', null, 400) as any;
      }

      // Hash password
      const passwordHash = await argon2.hash(dto.password);

      // Persist developer
      const created = await this.prisma.developer.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: passwordHash,
          note: dto.note ?? null,
        },
      });

      // Never expose password hash
      const safeDeveloper = {
        id: created.id,
        name: created.name,
        email: created.email,
        note: created.note,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      return ResponseHelper.created('Developer registered successfully', safeDeveloper) as ApiResponse<any>;
    } catch (error) {
      this.logger.error(colors.red(`❌ Error registering developer: ${error.message}`));
      return ResponseHelper.error('Failed to register developer', error?.message ?? error, 500) as any;
    }
  }

  async loginDeveloper(dto: LoginDeveloperDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Logging in developer: ${dto.email}`));

    try {
      const developer = await this.prisma.developer.findUnique({
        where: { email: dto.email },
      });

      if (!developer) {
        this.logger.warn(colors.yellow(`⚠️ Developer not found: ${dto.email}`));
        return ResponseHelper.error('Developer not found', null, 404) as any;
      }

      const passwordMatches = await argon2.verify(developer.password, dto.password);
      if (!passwordMatches) {
        this.logger.warn(colors.yellow(`⚠️ Invalid developer credentials for: ${dto.email}`));
        return ResponseHelper.error('Invalid credentials', null, 400) as any;
      }

      const formattedDeveloper = {
        id: developer.id,
        name: developer.name,
        email: developer.email,
        role: developer.role,
        note: developer.note,
        createdAt: developer.createdAt,
        updatedAt: developer.updatedAt,
      };

      // Generate JWTs similar to school auth, with developer-specific payload
      const payload = {
        sub: developer.id,
        id: developer.id,
        email: developer.email,
        role: developer.role,
      };

      const secret = this.config.get('JWT_SECRET');
      const accessTokenExpiresIn = this.config.get('JWT_EXPIRES_IN') || '15m';
      const refreshTokenExpiresIn = this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d';

      const access_token = await this.jwt.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
        secret,
      });

      const refresh_token = await this.jwt.signAsync(payload, {
        expiresIn: refreshTokenExpiresIn,
        secret,
      });

      const authPayload = {
        access_token,
        refresh_token,
        developer: formattedDeveloper,
      };

      return ResponseHelper.success('Developer signed in successfully', authPayload) as ApiResponse<any>;
    } catch (error) {
      this.logger.error(colors.red(`❌ Error logging in developer: ${error.message}`));
      return ResponseHelper.error('Failed to login developer', error?.message ?? error, 500) as any;
    }
  }
}


