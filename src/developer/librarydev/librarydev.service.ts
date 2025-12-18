import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import { AddLibraryOwnerDto, CreateLibraryDevDto, UpdateLibraryDevDto } from './dto/librarydev.dto';
import * as argon from 'argon2';

@Injectable()
export class LibraryDevService {
  private readonly logger = new Logger(LibraryDevService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== Library CRUD (developer-only) =====

  async createLibrary(payload: CreateLibraryDevDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Onboarding new library: ${JSON.stringify(payload)}`));

    if (!payload.name || !payload.slug || !payload.email || !payload.password) {
      this.logger.error(colors.red('name, slug, email and password are required'));
      throw new BadRequestException('name, slug, email and password are required');
    }

    const existing = await this.prisma.libraryPlatform.findFirst({
      where: {
        OR: [{ name: payload.name }, { slug: payload.slug }],
      },
    });

    if (existing) {
      this.logger.error(colors.red('A library with this name or slug already exists'));
      throw new BadRequestException('A library with this name or slug already exists');
    }

    const emailLower = payload.email.toLowerCase();

    await this.ensureEmailIsUnique(emailLower);

    const hashedPassword = await argon.hash(payload.password);

    const result = await this.prisma.$transaction(async (tx) => {
      const library = await tx.libraryPlatform.create({
        data: {
          name: payload.name,
          slug: payload.slug,
          description: payload.description ?? null,
        },
      });

      await tx.libraryResourceUser.create({
        data: {
          platformId: library.id,
          email: emailLower,
          password: hashedPassword,
          first_name: payload.name,
          last_name: 'Owner',
          role: 'admin', // treated as library owner
          status: 'active',
        },
      });

      return library;
    });

    this.logger.log(colors.green('Library onboarded successfully'));

    return new ApiResponse(true, 'Library onboarded successfully', result);
  }

  async addLibraryOwner(payload: AddLibraryOwnerDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Adding library owner to platform: ${payload.libraryId}`));

    const emailLower = payload.email.toLowerCase();
    await this.ensureEmailIsUnique(emailLower);

    const library = await this.prisma.libraryPlatform.findUnique({
      where: { id: payload.libraryId },
    });

    if (!library) {
      throw new NotFoundException('Library not found');
    }

    const hashedPassword = await argon.hash(payload.password);

    const user = await this.prisma.libraryResourceUser.create({
      data: {
        platformId: library.id,
        email: emailLower,
        password: hashedPassword,
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone_number: payload.phoneNumber ?? null,
        role: (payload.role as any) || 'admin',
        userType: 'libraryresourceowner',
        status: 'active',
      },
    });

    // Do not return password in response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user as any;

    this.logger.log(colors.green('Library owner added successfully'));
    return new ApiResponse(true, 'Library owner added successfully', safeUser);
  }

  private async ensureEmailIsUnique(emailLower: string): Promise<void> {
    const [existingUser, existingTeacher, existingDeveloper, existingLibraryUser] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { email: emailLower } }),
      this.prisma.teacher.findFirst({ where: { email: emailLower } }),
      this.prisma.developer.findUnique({ where: { email: emailLower } }),
      this.prisma.libraryResourceUser.findUnique({ where: { email: emailLower } }),
    ]);

    if (existingUser || existingTeacher || existingDeveloper || existingLibraryUser) {
      this.logger.error(colors.red('Email is already in use on the platform'));
      throw new BadRequestException('Email is already in use on the platform');
    }
  }

  async updateLibrary(id: string, payload: UpdateLibraryDevDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Updating library: ${id}`));

    const existing = await this.prisma.libraryPlatform.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library not found');
    }

    if (payload.slug && payload.slug !== existing.slug) {
      const slugTaken = await this.prisma.libraryPlatform.findFirst({
        where: { slug: payload.slug },
      });
      if (slugTaken) {
        throw new BadRequestException('Slug already in use');
      }
    }

    const updatedLibrary = await this.prisma.libraryPlatform.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        slug: payload.slug ?? existing.slug,
        description: payload.description ?? existing.description,
      },
    });

    return new ApiResponse(true, 'Library updated successfully', updatedLibrary);
  }

  async deleteLibrary(id: string): Promise<ApiResponse<null>> {
    this.logger.log(colors.cyan(`[DEV] Deleting library: ${id}`));

    const existing = await this.prisma.libraryPlatform.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library not found');
    }

    await this.prisma.libraryPlatform.delete({
      where: { id },
    });

    return new ApiResponse(true, 'Library deleted successfully', null);
  }

  async listAllLibraries(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[DEV] Listing all libraries'));

    const libraries = await this.prisma.libraryPlatform.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse(true, 'Libraries retrieved successfully', libraries);
  }

  async getLibrary(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Getting library: ${id}`));

    const library = await this.prisma.libraryPlatform.findUnique({
      where: { id },
      include: {
        subjects: true,
        topics: true,
      },
    });

    if (!library) {
      throw new NotFoundException('Library not found');
    }

    return new ApiResponse(true, 'Library retrieved successfully', library);
  }
}


