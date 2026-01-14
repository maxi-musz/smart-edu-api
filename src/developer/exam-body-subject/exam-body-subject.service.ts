import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { CreateExamBodySubjectDto, UpdateExamBodySubjectDto } from './dto';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class ExamBodySubjectService {
  private readonly logger = new Logger(ExamBodySubjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(examBodyId: string, createDto: CreateExamBodySubjectDto, iconFile?: Express.Multer.File) {
    this.logger.log(colors.cyan(`📝 Creating subject: ${createDto.name} for exam body: ${examBodyId}`));

    try {
      const examBody = await this.prisma.examBody.findUnique({ where: { id: examBodyId } });
      if (!examBody) {
        throw new NotFoundException('Exam body not found');
      }

      // Auto-generate code from name
      const code = this.generateCode(createDto.name);

      const existing = await this.prisma.examBodySubject.findFirst({
        where: { examBodyId, code: code },
      });

      if (existing) {
        throw new ConflictException(`Subject with code "${code}" already exists for this exam body`);
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
          this.logger.log(colors.green(`✅ Icon uploaded: ${uploadResult.url}`));
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
            ...(iconUrl && { iconUrl }),
          },
          include: { examBody: true },
        });
        this.logger.log(colors.green(`✅ Subject created: ${subject.name}`));
      } catch (dbError: any) {
        if (uploadResult) {
          this.logger.error(colors.red(`❌ DB error. Cleaning up uploaded icon...`));
          try {
            await this.storageService.deleteFile(uploadResult.key);
            this.logger.log(colors.yellow(`🗑️  Icon deleted: ${uploadResult.key}`));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete icon: ${deleteError.message}`));
          }
        }
        throw dbError;
      }

      return ResponseHelper.success('Subject created successfully', subject);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating subject: ${error.message}`));
      throw error;
    }
  }

  async findAll(examBodyId: string) {
    this.logger.log(colors.cyan(`📚 Fetching subjects for exam body: ${examBodyId}`));

    const subjects = await this.prisma.examBodySubject.findMany({
      where: { examBodyId },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
      orderBy: { order: 'asc' },
    });

    this.logger.log(colors.green(`✅ Found ${subjects.length} subjects`));
    return ResponseHelper.success('Subjects retrieved successfully', subjects);
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

    return ResponseHelper.success('Subject retrieved successfully', subject);
  }

  async update(id: string, updateDto: UpdateExamBodySubjectDto, iconFile?: Express.Multer.File) {
    this.logger.log(colors.cyan(`📝 Updating subject: ${id}`));

    const existing = await this.prisma.examBodySubject.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    // If name is being updated, regenerate code
    let code: string | undefined;
    if (updateDto.name) {
      code = this.generateCode(updateDto.name);
      
      // Check if new code conflicts with another subject
      const conflict = await this.prisma.examBodySubject.findFirst({
        where: { examBodyId: existing.examBodyId, code: code, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException(`Subject with code "${code}" (generated from "${updateDto.name}") already exists`);
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
        this.logger.log(colors.green(`✅ New icon uploaded: ${newUploadResult.url}`));
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
      this.logger.log(colors.green(`✅ Subject updated: ${subject.name}`));
    } catch (dbError: any) {
      if (newUploadResult) {
        this.logger.error(colors.red(`❌ DB error. Cleaning up uploaded icon...`));
        try {
          await this.storageService.deleteFile(newUploadResult.key);
          this.logger.log(colors.yellow(`🗑️  Icon deleted: ${newUploadResult.key}`));
        } catch (deleteError: any) {
          this.logger.error(colors.red(`❌ Failed to delete icon: ${deleteError.message}`));
        }
      }
      throw dbError;
    }

    return ResponseHelper.success('Subject updated successfully', subject);
  }

  async remove(id: string) {
    const subject = await this.prisma.examBodySubject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.prisma.examBodySubject.delete({ where: { id } });
    this.logger.log(colors.green(`✅ Subject deleted: ${subject.name}`));

    return ResponseHelper.success('Subject deleted successfully', { id });
  }

  private generateCode(name: string): string {
    // Convert to uppercase and replace spaces with underscores
    return name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  }
}

