import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LibraryUserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Resolves who "owns" the platform subscription revenue wallet.
 *
 * 1. `PLATFORM_WALLET_OWNER_ID` in env (explicit override).
 * 2. Otherwise: first `LibraryPlatform`, then prefer a library `admin` user, else the earliest
 *    `LibraryResourceUser` on that platform (single-library deployments).
 *
 * `owner_id` on `Wallet` is not a FK; it may be a main-app `User.id` or a `LibraryResourceUser.id`.
 */
export async function resolvePlatformWalletOwnerId(
  prisma: PrismaService,
  config: ConfigService,
): Promise<string> {
  const fromEnv = (config.get<string>('PLATFORM_WALLET_OWNER_ID') || '').trim();
  if (fromEnv) {
    return fromEnv;
  }

  const platform = await prisma.libraryPlatform.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });

  if (!platform) {
    throw new BadRequestException(
      'PLATFORM_WALLET_OWNER_ID is not set and there is no content library (LibraryPlatform). ' +
        'Create a library or set PLATFORM_WALLET_OWNER_ID to record platform revenue.',
    );
  }

  const admin = await prisma.libraryResourceUser.findFirst({
    where: { platformId: platform.id, role: LibraryUserRole.admin },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (admin) {
    return admin.id;
  }

  const firstUser = await prisma.libraryResourceUser.findFirst({
    where: { platformId: platform.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!firstUser) {
    throw new BadRequestException(
      'PLATFORM_WALLET_OWNER_ID is not set and the library has no staff users. ' +
        'Add a library user or set PLATFORM_WALLET_OWNER_ID.',
    );
  }

  return firstUser.id;
}
