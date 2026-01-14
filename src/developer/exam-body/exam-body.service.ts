import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { CreateExamBodyDto, UpdateExamBodyDto } from './dto';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class ExamBodyService {
  private readonly logger = new Logger(ExamBodyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(createDto: CreateExamBodyDto, iconFile?: Express.Multer.File) {
    this.logger.log(colors.cyan(`📝 Creating exam body: ${createDto.name}`));

    try {
      // Validate icon file (required)
      if (!iconFile) {
        throw new BadRequestException('Icon file is required for exam body');
      }

      // Validate file type (images only)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedMimeTypes.includes(iconFile.mimetype)) {
        throw new BadRequestException('Invalid icon file type. Allowed types: JPEG, PNG, GIF, WEBP, SVG');
      }

      // Validate file size (max 2MB for icons)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (iconFile.size > maxSize) {
        throw new BadRequestException('Icon file size exceeds 2MB limit');
      }

      // Auto-generate code from name
      const code = this.generateCode(createDto.name);

      // Check if name or code already exists
      const existing = await this.prisma.examBody.findFirst({
        where: {
          OR: [
            { name: createDto.name },
            { code: code },
          ],
        },
      });

      if (existing) {
        const field = existing.name === createDto.name ? 'name' : 'code';
        throw new ConflictException(`Exam body with ${field} "${field === 'name' ? createDto.name : code}" already exists`);
      }

      // Upload icon
      let uploadResult: { url: string; key: string };
      try {
        const folder = `exam-bodies/icons`;
        const fileName = `${code}_${Date.now()}_${iconFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        this.logger.log(colors.cyan(`📤 Uploading icon: ${iconFile.originalname}`));
        uploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
        
        this.logger.log(colors.green(`✅ Icon uploaded successfully: ${uploadResult.url}`));
      } catch (uploadError: any) {
        this.logger.error(colors.red(`❌ Failed to upload icon: ${uploadError.message}`));
        throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
      }

      // Create exam body with icon URL and auto-generated code
      let examBody: any;
      try {
        examBody = await this.prisma.examBody.create({
          data: {
            ...createDto,
            code,
            logoUrl: uploadResult.url,
          },
        });
        
        this.logger.log(colors.green(`✅ Exam body created: ${examBody.name} (ID: ${examBody.id})`));
      } catch (dbError: any) {
        // Database operation failed - clean up uploaded icon
        this.logger.error(colors.red(`❌ Database error after icon upload. Cleaning up uploaded icon...`));
        
        try {
          await this.storageService.deleteFile(uploadResult.key);
          this.logger.log(colors.yellow(`🗑️  Uploaded icon deleted: ${uploadResult.key}`));
        } catch (deleteError: any) {
          this.logger.error(colors.red(`❌ Failed to delete uploaded icon: ${deleteError.message}`));
          // Continue to throw the original DB error even if cleanup fails
        }
        
        throw dbError;
      }

      return ResponseHelper.success('Exam body created successfully', examBody);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating exam body: ${error.message}`));
      throw error;
    }
  }

  async findAll() {
    this.logger.log(colors.cyan('📚 Fetching all exam bodies'));

    try {
      const examBodies = await this.prisma.examBody.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      this.logger.log(colors.green(`✅ Found ${examBodies.length} exam bodies`));
      return ResponseHelper.success('Exam bodies retrieved successfully', examBodies);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching exam bodies: ${error.message}`));
      throw error;
    }
  }

  async findOne(id: string) {
    this.logger.log(colors.cyan(`🔍 Fetching exam body: ${id}`));

    try {
      const examBody = await this.prisma.examBody.findUnique({
        where: { id },
      });

      if (!examBody) {
        throw new NotFoundException(`Exam body with ID "${id}" not found`);
      }

      this.logger.log(colors.green(`✅ Exam body found: ${examBody.name}`));
      return ResponseHelper.success('Exam body retrieved successfully', examBody);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching exam body: ${error.message}`));
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateExamBodyDto, iconFile?: Express.Multer.File) {
    this.logger.log(colors.cyan(`📝 Updating exam body: ${id}`));

    try {
      // Check if exam body exists
      const existing = await this.prisma.examBody.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Exam body with ID "${id}" not found`);
      }

      // Check for conflicts if name or code is being updated
      if (updateDto.name || updateDto.code) {
        const conflict = await this.prisma.examBody.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  updateDto.name ? { name: updateDto.name } : {},
                  updateDto.code ? { code: updateDto.code } : {},
                ],
              },
            ],
          },
        });

        if (conflict) {
          const field = conflict.name === updateDto.name ? 'name' : 'code';
          throw new ConflictException(`Exam body with ${field} "${updateDto[field]}" already exists`);
        }
      }

      // Handle icon upload if provided
      let newUploadResult: { url: string; key: string } | undefined;
      if (iconFile) {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedMimeTypes.includes(iconFile.mimetype)) {
          throw new BadRequestException('Invalid icon file type. Allowed types: JPEG, PNG, GIF, WEBP, SVG');
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024;
        if (iconFile.size > maxSize) {
          throw new BadRequestException('Icon file size exceeds 2MB limit');
        }

        try {
          const folder = `exam-bodies/icons`;
          const fileName = `${existing.code}_${Date.now()}_${iconFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          this.logger.log(colors.cyan(`📤 Uploading new icon: ${iconFile.originalname}`));
          newUploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
          
          this.logger.log(colors.green(`✅ New icon uploaded successfully: ${newUploadResult.url}`));
        } catch (uploadError: any) {
          this.logger.error(colors.red(`❌ Failed to upload icon: ${uploadError.message}`));
          throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
        }
      }

      // Update exam body
      let examBody: any;
      try {
        examBody = await this.prisma.examBody.update({
          where: { id },
          data: {
            ...updateDto,
            ...(newUploadResult && { logoUrl: newUploadResult.url }),
          },
        });
        
        this.logger.log(colors.green(`✅ Exam body updated: ${examBody.name}`));
      } catch (dbError: any) {
        // Database operation failed - clean up newly uploaded icon if exists
        if (newUploadResult) {
          this.logger.error(colors.red(`❌ Database error after icon upload. Cleaning up uploaded icon...`));
          
          try {
            await this.storageService.deleteFile(newUploadResult.key);
            this.logger.log(colors.yellow(`🗑️  Uploaded icon deleted: ${newUploadResult.key}`));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete uploaded icon: ${deleteError.message}`));
            // Continue to throw the original DB error even if cleanup fails
          }
        }
        
        throw dbError;
      }

      return ResponseHelper.success('Exam body updated successfully', examBody);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating exam body: ${error.message}`));
      throw error;
    }
  }

  async remove(id: string) {
    this.logger.log(colors.cyan(`🗑️  Deleting exam body: ${id}`));

    try {
      const examBody = await this.prisma.examBody.findUnique({
        where: { id },
      });

      if (!examBody) {
        throw new NotFoundException(`Exam body with ID "${id}" not found`);
      }

      await this.prisma.examBody.delete({
        where: { id },
      });

      this.logger.log(colors.green(`✅ Exam body deleted: ${examBody.name}`));
      return ResponseHelper.success('Exam body deleted successfully', { id });
    } catch (error) {
      this.logger.error(colors.red(`❌ Error deleting exam body: ${error.message}`));
      throw error;
    }
  }

  private generateCode(name: string): string {
    // Convert to uppercase and replace spaces with underscores
    return name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  }
}

