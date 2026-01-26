import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as colors from 'colors';

@Injectable()
export class LibraryOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.sub) {
      console.log(colors.red('Library Owner Guard - No library user payload'));
      throw new UnauthorizedException('Library authentication required');
    }

    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        role: true,
        status: true,
        platformId: true,
      },
    });

    if (!libraryUser || libraryUser.status !== 'active') {
      console.log(colors.red('Library Owner Guard - Library user not found or inactive'));
      throw new UnauthorizedException('Library user not found or inactive');
    }

    const allowedRoles = ['admin', 'manager'];
    if (!allowedRoles.includes(libraryUser.role)) {
      console.log(colors.red(`Library Owner Guard - Access denied for role: ${libraryUser.role}`));
      throw new ForbiddenException('Insufficient permissions');
    }

    request.libraryUser = libraryUser;
    return true;
  }
}
