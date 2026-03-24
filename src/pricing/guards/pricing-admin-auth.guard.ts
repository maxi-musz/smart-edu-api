import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LibraryUserRole, Roles, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Accepts either:
 * - **School JWT** (`school_id` in payload) — `User.role` must be `super_admin`
 * - **Library JWT** (`platform_id` in payload) — `LibraryResourceUser.role` must be `admin`
 *
 * Both issuers use the same `JWT_SECRET`; payloads differ, so school `JwtGuard` alone rejects library tokens.
 */
@Injectable()
export class PricingAdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = auth.slice(7).trim();

    let payload: {
      sub?: string;
      email?: string;
      school_id?: string;
      platform_id?: string;
      exp?: number;
    };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp != null && payload.exp < now) {
      throw new UnauthorizedException('Token has expired');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token structure');
    }

    if (payload.school_id) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true, status: true },
      });
      if (!user || user.status !== UserStatus.active) {
        throw new ForbiddenException('User not found or inactive');
      }
      if (user.role !== Roles.super_admin) {
        throw new ForbiddenException('Super admin access required');
      }
      req.user = payload;
      return true;
    }

    if (payload.platform_id) {
      const libUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: payload.sub },
        select: { role: true, status: true },
      });
      if (!libUser || libUser.status !== UserStatus.active) {
        throw new ForbiddenException('Library user not found or inactive');
      }
      if (libUser.role !== LibraryUserRole.admin) {
        throw new ForbiddenException('Library admin access required');
      }
      req.user = payload;
      return true;
    }

    throw new UnauthorizedException(
      'Invalid token structure: expected school or library session',
    );
  }
}
