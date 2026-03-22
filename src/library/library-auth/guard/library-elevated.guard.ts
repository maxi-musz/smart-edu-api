import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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
      console.log(
        colors.red('Library Elevated Guard - No library user payload'),
      );
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
      console.log(
        colors.red(
          'Library Elevated Guard - Library user not found or inactive',
        ),
      );
      throw new UnauthorizedException('Library user not found or inactive');
    }

    let hasElevatedLevel =
      libraryUser.permissionLevel != null &&
      libraryUser.permissionLevel >= ELEVATED_PERMISSION_LEVEL;
    let hasManagePermission =
      Array.isArray(libraryUser.permissions) &&
      libraryUser.permissions.includes(MANAGE_LIBRARY_USERS_PERMISSION);

    // When library has only 1–2 users, auto-attach first permission (and ensure manage_library_users) so they can manage others
    if (!hasElevatedLevel && !hasManagePermission && libraryUser.platformId) {
      const userCount = await this.prisma.libraryResourceUser.count({
        where: { platformId: libraryUser.platformId },
      });
      if (userCount <= 2) {
        const firstDef =
          await this.prisma.libraryPermissionDefinition.findFirst({
            orderBy: { id: 'asc' },
            select: { code: true },
          });
        const manageDef =
          await this.prisma.libraryPermissionDefinition.findUnique({
            where: { code: MANAGE_LIBRARY_USERS_PERMISSION },
            select: { code: true },
          });
        const current = libraryUser.permissions ?? [];
        const toAdd = new Set<string>();
        if (firstDef?.code && !current.includes(firstDef.code))
          toAdd.add(firstDef.code);
        if (manageDef?.code && !current.includes(manageDef.code))
          toAdd.add(manageDef.code);
        if (toAdd.size > 0) {
          const newPermissions = [...current, ...toAdd];
          const updated = await this.prisma.libraryResourceUser.update({
            where: { id: libraryUser.id },
            data: { permissions: newPermissions },
            select: {
              id: true,
              role: true,
              status: true,
              platformId: true,
              permissionLevel: true,
              permissions: true,
            },
          });
          console.log(
            colors.cyan(
              `Library Elevated Guard - Auto-granted permissions [${[...toAdd].join(', ')}] to user (platform has ${userCount} user(s))`,
            ),
          );
          Object.assign(libraryUser, updated);
          hasElevatedLevel =
            libraryUser.permissionLevel != null &&
            libraryUser.permissionLevel >= ELEVATED_PERMISSION_LEVEL;
          hasManagePermission =
            Array.isArray(libraryUser.permissions) &&
            libraryUser.permissions.includes(MANAGE_LIBRARY_USERS_PERMISSION);
        }
      }
    }

    if (!hasElevatedLevel && !hasManagePermission) {
      console.log(
        colors.red(
          `Library Elevated Guard - Access denied (permissionLevel=${libraryUser.permissionLevel}, permissions=${JSON.stringify(libraryUser.permissions)})`,
        ),
      );
      throw new ForbiddenException(
        'Insufficient permissions: elevated access or manage_library_users required',
      );
    }

    request.libraryUser = libraryUser;
    return true;
  }
}
