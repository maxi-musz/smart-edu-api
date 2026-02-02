import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as colors from 'colors';

/** Minimum permission level considered "elevated" (e.g. can manage library users). */
const ELEVATED_PERMISSION_LEVEL = 10;

/** Permission code that grants library user management. */
const MANAGE_LIBRARY_USERS_PERMISSION = 'manage_library_users';

@Injectable()
export class LibraryElevatedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.sub) {
      console.log(colors.red('Library Elevated Guard - No library user payload'));
      throw new UnauthorizedException('Library authentication required');
    }

    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        role: true,
        status: true,
        platformId: true,
        permissionLevel: true,
        permissions: true,
      },
    });

    if (!libraryUser || libraryUser.status !== 'active') {
      console.log(colors.red('Library Elevated Guard - Library user not found or inactive'));
      throw new UnauthorizedException('Library user not found or inactive');
    }

    const hasElevatedLevel =
      libraryUser.permissionLevel != null && libraryUser.permissionLevel >= ELEVATED_PERMISSION_LEVEL;
    const hasManagePermission =
      Array.isArray(libraryUser.permissions) &&
      libraryUser.permissions.includes(MANAGE_LIBRARY_USERS_PERMISSION);

    if (!hasElevatedLevel && !hasManagePermission) {
      console.log(
        colors.red(
          `Library Elevated Guard - Access denied (permissionLevel=${libraryUser.permissionLevel}, permissions=${JSON.stringify(libraryUser.permissions)})`,
        ),
      );
      throw new ForbiddenException('Insufficient permissions: elevated access or manage_library_users required');
    }

    request.libraryUser = libraryUser;
    return true;
  }
}
