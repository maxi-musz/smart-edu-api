import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../shared/helper-functions/response';
import { QueryAiBooksDto } from './dto/query-ai-books.dto';
import * as colors from 'colors';

@Injectable()
export class ExploreAiBooksService {
  private readonly logger = new Logger(ExploreAiBooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch AI book landing page data
   * Returns books with filtering, search, pagination, classes with counts, and platform info
   */
  async fetchAiBookLandingPageData(user: any, queryDto: QueryAiBooksDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[EXPLORE AI BOOKS] Fetching landing page data for user: ${user.email || user.sub}`));

    try {
      // Get the first library platform created (by createdAt)
      const firstPlatform = await this.prisma.libraryPlatform.findFirst({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      });

      // Try to get platformId from library user (optional - works for all users)
      const libraryUser = await this.prisma.libraryResourceUser.findFirst({
        where: { email: user.email },
        select: { id: true, platformId: true },
      });

      // Build base where clause
      const baseWhereClause: any = {
        isAiEnabled: true,
        isAvailable: true,
        status: 'published',
      };

      // Filter by platformId if library user exists, otherwise show all
      if (libraryUser?.platformId) {
        baseWhereClause.platformId = libraryUser.platformId;
      }

      // Build class filter
      const classFilter: any[] = [];
      if (queryDto.classId) {
        classFilter.push({ classId: queryDto.classId });
      }
      if (queryDto.classIds && queryDto.classIds.length > 0) {
        classFilter.push({ classId: { in: queryDto.classIds } });
      }

      // Build search filter
      if (queryDto.search) {
        baseWhereClause.OR = [
          { title: { contains: queryDto.search, mode: 'insensitive' } },
          { author: { contains: queryDto.search, mode: 'insensitive' } },
          { description: { contains: queryDto.search, mode: 'insensitive' } },
        ];
      }

      // Build final where clause with class filtering
      const whereClause: any = { ...baseWhereClause };
      if (classFilter.length > 0) {
        whereClause.classes = {
          some: {
            OR: classFilter,
          },
        };
      }

      // Pagination
      const page = queryDto.page || 1;
      const limit = queryDto.limit || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalItems = await this.prisma.libraryGeneralMaterial.count({
        where: whereClause,
      });

      // Fetch books with pagination - random order by default (no orderBy = random in Prisma)
      const books = await this.prisma.libraryGeneralMaterial.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          author: true,
          thumbnailS3Key: true,
          views: true,
          downloads: true,
          createdAt: true,
          classes: {
            select: {
              class: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
      });

      // Fetch all available classes with book counts
      const classesWithCounts = await this.prisma.libraryClass.findMany({
        select: {
          id: true,
          name: true,
          order: true,
          _count: {
            select: {
              materialClasses: {
                where: {
                  material: {
                    ...baseWhereClause,
                  },
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      });

      // Format response data
      const responseData = {
        platform: firstPlatform ? {
          id: firstPlatform.id,
          name: firstPlatform.name,
          slug: firstPlatform.slug,
          description: firstPlatform.description,
        } : null,
        books: books.map((book: any) => ({
          id: book.id,
          title: book.title,
          description: book.description,
          author: book.author,
          thumbnailS3Key: book.thumbnailS3Key,
          views: book.views,
          downloads: book.downloads,
          createdAt: book.createdAt,
          classes: book.classes?.map((mc: any) => mc.class) || [],
        })),
        classes: classesWithCounts.map((cls) => ({
          id: cls.id,
          name: cls.name,
          order: cls.order,
          totalBooks: cls._count.materialClasses,
        })),
        pagination: {
          page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit) || 1,
          hasNextPage: page < Math.ceil(totalItems / limit),
          hasPreviousPage: page > 1,
        },
      };

      this.logger.log(colors.green(`✅ Successfully fetched landing page data: ${totalItems} books, ${classesWithCounts.length} classes`));

      return new ApiResponse(true, 'AI book landing page data fetched successfully', responseData);
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error fetching landing page data: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all chapters for a book
   * Works for all authenticated users
   */
  async getBookChapters(user: any, bookId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[EXPLORE AI BOOKS] Fetching chapters for book: ${bookId} by user: ${user.email || user.sub}`));

    try {
      // Try to get platformId from library user (optional - works for all users)
      const libraryUser = await this.prisma.libraryResourceUser.findFirst({
        where: { email: user.email },
        select: { id: true, platformId: true },
      });

      // Build where clause for material lookup
      const materialWhere: any = {
        id: bookId,
        isAiEnabled: true,
        isAvailable: true,
        status: 'published',
      };

      // If library user exists, filter by their platform, otherwise show all
      if (libraryUser?.platformId) {
        materialWhere.platformId = libraryUser.platformId;
      }

      // Verify material exists
      const material = await this.prisma.libraryGeneralMaterial.findFirst({
        where: materialWhere,
        select: {
          id: true,
          title: true,
        },
      });

      if (!material) {
        this.logger.error(colors.red(`Book not found or not available: ${bookId}`));
        throw new NotFoundException('Book not found or not available');
      }

      // Build where clause for chapters
      const chapterWhere: any = {
        materialId: bookId,
        isProcessed: true,
        chapterStatus: 'active', // Only return active chapters (soft delete support)
      };

      // If library user exists, filter by their platform
      if (libraryUser?.platformId) {
        chapterWhere.platformId = libraryUser.platformId;
      }

      // Fetch chapters
      const chapters = await this.prisma.libraryGeneralMaterialChapter.findMany({
        where: chapterWhere,        
        select: {
          id: true,
          title: true,
          description: true,
          pageStart: true,
          pageEnd: true,
          order: true,
          isAiEnabled: true,
          isProcessed: true,
          chunkCount: true,
          createdAt: true,
          updatedAt: true,
          files: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              url: true,
              sizeBytes: true,
              title: true,
              description: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      this.logger.log(colors.green(`✅ Successfully fetched ${chapters.length} chapters for book: ${bookId}`));

      return new ApiResponse(true, 'Book chapters retrieved successfully', chapters);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching book chapters: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get a single chapter for a book
   * Works for all authenticated users
   */
  async getBookChapter(user: any, bookId: string, chapterId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[EXPLORE AI BOOKS] Fetching chapter ${chapterId} for book: ${bookId} by user: ${user.email || user.sub}`));

    try {
      // Try to get platformId from library user (optional - works for all users)
      const libraryUser = await this.prisma.libraryResourceUser.findFirst({
        where: { email: user.email },
        select: { id: true, platformId: true },
      });

      // Build where clause for material lookup
      const materialWhere: any = {
        id: bookId,
        isAiEnabled: true,
        isAvailable: true,
        status: 'published',
      };

      // If library user exists, filter by their platform, otherwise show all
      if (libraryUser?.platformId) {
        materialWhere.platformId = libraryUser.platformId;
      }

      // Verify material exists
      const material = await this.prisma.libraryGeneralMaterial.findFirst({
        where: materialWhere,
        select: {
          id: true,
          title: true,
        },
      });

      if (!material) {
        this.logger.error(colors.red(`Book not found or not available: ${bookId}`));
        throw new NotFoundException('Book not found or not available');
      }

      // Build where clause for chapter
      const chapterWhere: any = {
        id: chapterId,
        materialId: bookId,
      };

      // If library user exists, filter by their platform
      if (libraryUser?.platformId) {
        chapterWhere.platformId = libraryUser.platformId;
      }

      // Fetch chapter
      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: chapterWhere,
        select: {
          id: true,
          title: true,
          description: true,
          pageStart: true,
          pageEnd: true,
          order: true,
          isAiEnabled: true,
          isProcessed: true,
          chunkCount: true,
          createdAt: true,
          updatedAt: true,
          files: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              url: true,
              sizeBytes: true,
              title: true,
              description: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!chapter) {
        this.logger.error(colors.red(`Chapter not found: ${chapterId} for book: ${bookId}`));
        throw new NotFoundException('Chapter not found');
      }

      this.logger.log(colors.green(`✅ Successfully fetched chapter ${chapterId} for book: ${bookId}`));

      return new ApiResponse(true, 'Chapter retrieved successfully', chapter);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching chapter: ${error.message}`));
      throw error;
    }
  }
}
