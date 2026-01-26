import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { CreateLibraryExamBodySubjectDto, UpdateLibraryExamBodySubjectDto } from './dto';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryExamBodySubjectService {
  private readonly logger = new Logger(LibraryExamBodySubjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(examBodyId: string, createDto: CreateLibraryExamBodySubjectDto, iconFile?: Express.Multer.File) {
    this.logger.log(colors.cyan(`[LIBRARY EXAM BODY] Creating subject: ${createDto.name}`));

    const examBody = await this.prisma.examBody.findUnique({ where: { id: examBodyId } });
    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    const code = this.generateCode(createDto.name);

    // Check for duplicate by name or code (exam bodies like WAEC only have one Mathematics per year)
    const existing = await this.prisma.examBodySubject.findFirst({
      where: {
        examBodyId,
        OR: [
          { name: createDto.name },
          { code },
        ],
      },
    });

    if (existing) {
      const field = existing.name === createDto.name ? 'name' : 'code';
      throw new ConflictException(`Subject with ${field} "${field === 'name' ? createDto.name : code}" already exists for this exam body`);
    }

    // Auto-calculate order if not provided
    let order = createDto.order;
    if (order === undefined || order === null) {
      const lastSubject = await this.prisma.examBodySubject.findFirst({
        where: { examBodyId },
        orderBy: { order: 'desc' },
      });
      order = lastSubject ? lastSubject.order + 1 : 0;
    }

    let iconUrl: string | undefined;
    let uploadResult: { url: string; key: string } | undefined;

    if (iconFile) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedMimeTypes.includes(iconFile.mimetype)) {
        throw new BadRequestException('Invalid icon file type');
      }

      const maxSize = 2 * 1024 * 1024;
      if (iconFile.size > maxSize) {
        throw new BadRequestException('Icon file size exceeds 2MB limit');
      }

      try {
        const folder = `exam-bodies/subjects/icons`;
        const fileName = `${examBody.code}_${code}_${Date.now()}_${iconFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        uploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
        iconUrl = uploadResult.url;
      } catch (uploadError: any) {
        this.logger.error(colors.red(`❌ Failed to upload icon: ${uploadError.message}`));
        throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
      }
    }

    let subject: any;
    try {
      subject = await this.prisma.examBodySubject.create({
        data: {
          ...createDto,
          code,
          examBodyId,
          order,
          ...(iconUrl && { iconUrl }),
        },
        include: { examBody: true },
      });
    } catch (dbError: any) {
      if (uploadResult) {
        try {
          await this.storageService.deleteFile(uploadResult.key);
        } catch (deleteError: any) {
          this.logger.error(colors.red(`❌ Failed to delete icon: ${deleteError.message}`));
        }
      }
      throw dbError;
    }

    return new ApiResponse(true, 'Subject created successfully', subject);
  }

  async findAll(examBodyId: string) {
    const subjects = await this.prisma.examBodySubject.findMany({
      where: { examBodyId },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
      orderBy: { order: 'asc' },
    });

    return new ApiResponse(true, 'Subjects retrieved successfully', subjects);
  }

  async findOne(id: string) {
    const subject = await this.prisma.examBodySubject.findUnique({
      where: { id },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return new ApiResponse(true, 'Subject retrieved successfully', subject);
  }

  async update(id: string, updateDto: UpdateLibraryExamBodySubjectDto, iconFile?: Express.Multer.File) {
    const existing = await this.prisma.examBodySubject.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    let code: string | undefined;
    if (updateDto.name) {
      code = this.generateCode(updateDto.name);

      // Check for duplicate by name or code
      const conflict = await this.prisma.examBodySubject.findFirst({
        where: {
          examBodyId: existing.examBodyId,
          id: { not: id },
          OR: [
            { name: updateDto.name },
            { code: code },
          ],
        },
      });
      if (conflict) {
        const field = conflict.name === updateDto.name ? 'name' : 'code';
        throw new ConflictException(`Subject with ${field} "${field === 'name' ? updateDto.name : code}" already exists`);
      }
    }

    let newIconUrl: string | undefined;
    let newUploadResult: { url: string; key: string } | undefined;

    if (iconFile) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedMimeTypes.includes(iconFile.mimetype)) {
        throw new BadRequestException('Invalid icon file type');
      }

      const maxSize = 2 * 1024 * 1024;
      if (iconFile.size > maxSize) {
        throw new BadRequestException('Icon file size exceeds 2MB limit');
      }

      try {
        const folder = `exam-bodies/subjects/icons`;
        const fileName = `${existing.code}_${Date.now()}_${iconFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        newUploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
        newIconUrl = newUploadResult.url;
      } catch (uploadError: any) {
        throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
      }
    }

    let subject: any;
    try {
      subject = await this.prisma.examBodySubject.update({
        where: { id },
        data: {
          ...updateDto,
          ...(code && { code }),
          ...(newIconUrl && { iconUrl: newIconUrl }),
        },
        include: { examBody: true },
      });
    } catch (dbError: any) {
      if (newUploadResult) {
        try {
          await this.storageService.deleteFile(newUploadResult.key);
        } catch (deleteError: any) {
          this.logger.error(colors.red(`❌ Failed to delete icon: ${deleteError.message}`));
        }
      }
      throw dbError;
    }

    return new ApiResponse(true, 'Subject updated successfully', subject);
  }

  async remove(id: string) {
    const subject = await this.prisma.examBodySubject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.prisma.examBodySubject.delete({ where: { id } });

    return new ApiResponse(true, 'Subject deleted successfully', { id });
  }

  private generateCode(name: string): string {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
  }
}
