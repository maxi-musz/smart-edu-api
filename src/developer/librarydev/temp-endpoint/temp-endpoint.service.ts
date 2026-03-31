import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from '../../../prisma/prisma.service';
import { PineconeService } from '../../../explore/chat/services/pinecone.service';
import { S3Service } from '../../../shared/services/s3.service';
import { DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM } from './dto/delete-all-library-ai-books.dto';

const LOG = '[TEMP][LIBRARY-AI-BOOKS]';

export interface DeleteAllLibraryAiBooksResult {
  libraryGeneralMaterialsFound: number;
  libraryGeneralMaterialsDeleted: number;
  pdfMaterialsDeleted: number;
  pinecone: { attempted: number; failures: string[] };
  s3: { attempted: number; failures: string[] };
  relatedRows: {
    libraryChatContexts: number;
    libraryChatMessages: number;
    libraryChatConversations: number;
    libraryPurchases: number;
    schoolChatContexts: number;
    schoolChatConversations: number;
    schoolChatMessages: number;
    schoolChatAnalytics: number;
    documentChunksDeleted: number;
    materialProcessingsDeleted: number;
  };
}

/**
 * Throwaway / one-off maintenance actions for library dev.
 * Add methods here as needed; remove or gate them after use.
 */
@Injectable()
export class TempEndpointService {
  private readonly logger = new Logger(TempEndpointService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pineconeService: PineconeService,
    private readonly s3Service: S3Service,
  ) {}

  ping(): { ok: boolean; module: string } {
    return { ok: true, module: 'temp-endpoint' };
  }

  /**
   * Removes all LibraryGeneralMaterial (library “AI books”), chapters, files,
   * library chat + purchases, linked PDFMaterial pipeline (Pinecone, DocumentChunk,
   * MaterialProcessing, school Chat* rows), and best-effort S3 keys.
   */
  async deleteAllLibraryOwnerAiBooks(
    confirm: string,
  ): Promise<DeleteAllLibraryAiBooksResult> {
    if (confirm !== DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM) {
      throw new BadRequestException(
        `Invalid confirm token. Must be "${DELETE_ALL_LIBRARY_AI_BOOKS_CONFIRM}".`,
      );
    }

    this.logger.log(
      colors.cyan(
        `${LOG} Starting purge of all library AI books (LibraryGeneralMaterial + related data)…`,
      ),
    );

    const materials = await this.prisma.libraryGeneralMaterial.findMany({
      select: {
        id: true,
        s3Key: true,
        thumbnailS3Key: true,
      },
    });

    const materialIds = materials.map((m) => m.id);
    const result: DeleteAllLibraryAiBooksResult = {
      libraryGeneralMaterialsFound: materialIds.length,
      libraryGeneralMaterialsDeleted: 0,
      pdfMaterialsDeleted: 0,
      pinecone: { attempted: 0, failures: [] },
      s3: { attempted: 0, failures: [] },
      relatedRows: {
        libraryChatContexts: 0,
        libraryChatMessages: 0,
        libraryChatConversations: 0,
        libraryPurchases: 0,
        schoolChatContexts: 0,
        schoolChatConversations: 0,
        schoolChatMessages: 0,
        schoolChatAnalytics: 0,
        documentChunksDeleted: 0,
        materialProcessingsDeleted: 0,
      },
    };

    if (materialIds.length === 0) {
      this.logger.warn(
        colors.yellow(
          `${LOG} No LibraryGeneralMaterial rows found — nothing to delete. Exiting.`,
        ),
      );
      return result;
    }

    this.logger.log(
      colors.white(
        `${LOG} Loaded ${materialIds.length} book(s) (LibraryGeneralMaterial). Resolving chapters and linked PDFMaterial rows…`,
      ),
    );

    const chapters = await this.prisma.libraryGeneralMaterialChapter.findMany({
      where: { materialId: { in: materialIds } },
      select: { id: true },
    });
    const chapterIds = chapters.map((c) => c.id);

    const chapterFiles = await this.prisma.libraryGeneralMaterialChapterFile.findMany({
      where: { chapterId: { in: chapterIds } },
      select: { s3Key: true },
    });

    const materialIdOrChapterId = [...materialIds, ...chapterIds];
    const pdfMaterials = await this.prisma.pDFMaterial.findMany({
      where: { materialId: { in: materialIdOrChapterId } },
      select: { id: true },
    });
    const pdfIds = pdfMaterials.map((p) => p.id);

    this.logger.log(
      colors.white(
        `${LOG} Scope: ${chapterIds.length} chapter(s), ${chapterFiles.length} chapter file row(s), ${pdfIds.length} PDFMaterial row(s) (book + chapter pipeline).`,
      ),
    );

    // --- Library-specific chat & commerce (no FK cascade on material) ---
    this.logger.log(
      colors.cyan(
        `${LOG} Deleting library chat & purchase rows (contexts, messages, conversations, purchases)…`,
      ),
    );

    const ctxDel = await this.prisma.libraryGeneralMaterialChatContext.deleteMany({
      where: { materialId: { in: materialIds } },
    });
    result.relatedRows.libraryChatContexts = ctxDel.count;

    const msgDel = await this.prisma.libraryGeneralMaterialChatMessage.deleteMany({
      where: { materialId: { in: materialIds } },
    });
    result.relatedRows.libraryChatMessages = msgDel.count;

    const convDel =
      await this.prisma.libraryGeneralMaterialChatConversation.deleteMany({
        where: { materialId: { in: materialIds } },
      });
    result.relatedRows.libraryChatConversations = convDel.count;

    const purDel = await this.prisma.libraryGeneralMaterialPurchase.deleteMany({
      where: { materialId: { in: materialIds } },
    });
    result.relatedRows.libraryPurchases = purDel.count;

    this.logger.log(
      colors.green(
        `${LOG} Library app tables cleaned: contexts ${ctxDel.count}, messages ${msgDel.count}, conversations ${convDel.count}, purchases ${purDel.count}.`,
      ),
    );

    // --- School / explore chat tables keyed by PDFMaterial.id ---
    if (pdfIds.length > 0) {
      this.logger.log(
        colors.cyan(
          `${LOG} Deleting school / explore Chat* rows tied to ${pdfIds.length} PDFMaterial id(s)…`,
        ),
      );

      const ctxByChunk = await this.prisma.chatContext.deleteMany({
        where: { chunk: { material_id: { in: pdfIds } } },
      });
      result.relatedRows.schoolChatContexts = ctxByChunk.count;

      const schoolConvDel = await this.prisma.chatConversation.deleteMany({
        where: { material_id: { in: pdfIds } },
      });
      result.relatedRows.schoolChatConversations = schoolConvDel.count;

      const schoolMsgDel = await this.prisma.chatMessage.deleteMany({
        where: { material_id: { in: pdfIds } },
      });
      result.relatedRows.schoolChatMessages = schoolMsgDel.count;

      const analyticsDel = await this.prisma.chatAnalytics.deleteMany({
        where: { material_id: { in: pdfIds } },
      });
      result.relatedRows.schoolChatAnalytics = analyticsDel.count;

      this.logger.log(
        colors.green(
          `${LOG} School chat DB cleaned: ChatContext ${ctxByChunk.count}, ChatConversation ${schoolConvDel.count}, ChatMessage ${schoolMsgDel.count}, ChatAnalytics ${analyticsDel.count}.`,
        ),
      );

      // Pinecone vectors (metadata.material_id = PDFMaterial.id)
      this.logger.log(
        colors.cyan(
          `${LOG} Clearing Pinecone vectors (one deleteMany per PDFMaterial id, ${pdfIds.length} total)…`,
        ),
      );

      let pineconeOk = 0;
      for (const id of pdfIds) {
        result.pinecone.attempted += 1;
        try {
          await this.pineconeService.deleteChunksByMaterial(id);
          pineconeOk += 1;
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          result.pinecone.failures.push(`${id}: ${msg}`);
          this.logger.error(
            colors.red(
              `${LOG} Pinecone delete failed for PDFMaterial ${id}: ${msg}`,
            ),
          );
        }
      }

      this.logger.log(
        colors.green(
          `${LOG} Pinecone pass finished: ${pineconeOk}/${pdfIds.length} succeeded, ${result.pinecone.failures.length} failed.`,
        ),
      );

      this.logger.log(
        colors.cyan(
          `${LOG} Deleting DocumentChunk + MaterialProcessing rows for PDFMaterial ids…`,
        ),
      );

      const dc = await this.prisma.documentChunk.deleteMany({
        where: { material_id: { in: pdfIds } },
      });
      result.relatedRows.documentChunksDeleted = dc.count;

      const mp = await this.prisma.materialProcessing.deleteMany({
        where: { material_id: { in: pdfIds } },
      });
      result.relatedRows.materialProcessingsDeleted = mp.count;

      this.logger.log(
        colors.green(
          `${LOG} DocumentChunk removed: ${dc.count}, MaterialProcessing removed: ${mp.count}.`,
        ),
      );

      this.logger.log(
        colors.cyan(`${LOG} Deleting PDFMaterial rows (${pdfIds.length})…`),
      );

      const pdfDel = await this.prisma.pDFMaterial.deleteMany({
        where: { id: { in: pdfIds } },
      });
      result.pdfMaterialsDeleted = pdfDel.count;

      this.logger.log(
        colors.green(
          `${LOG} PDFMaterial deleted: ${pdfDel.count} row(s).`,
        ),
      );
    } else {
      this.logger.log(
        colors.yellow(
          `${LOG} No PDFMaterial rows linked to these books — skipping school chat, Pinecone, DocumentChunk, and PDFMaterial deletion.`,
        ),
      );
    }

    // --- S3 (best effort; DB rows removed even if S3 fails) ---
    this.logger.log(
      colors.cyan(
        `${LOG} Deleting objects from S3 (main files, thumbnails, chapter files — best effort)…`,
      ),
    );

    const s3Keys = new Set<string>();
    for (const m of materials) {
      if (m.s3Key) s3Keys.add(m.s3Key);
      if (m.thumbnailS3Key) s3Keys.add(m.thumbnailS3Key);
    }
    for (const f of chapterFiles) {
      if (f.s3Key) s3Keys.add(f.s3Key);
    }

    this.logger.log(
      colors.white(
        `${LOG} S3: ${s3Keys.size} unique key(s) queued for deletion.`,
      ),
    );

    let s3Ok = 0;
    for (const key of s3Keys) {
      result.s3.attempted += 1;
      try {
        await this.s3Service.deleteFile(key);
        s3Ok += 1;
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        result.s3.failures.push(`${key}: ${msg}`);
        this.logger.warn(
          colors.yellow(`${LOG} S3 delete failed for key "${key}": ${msg}`),
        );
      }
    }

    this.logger.log(
      colors.green(
        `${LOG} S3 pass finished: ${s3Ok}/${s3Keys.size} succeeded, ${result.s3.failures.length} failed.`,
      ),
    );

    this.logger.log(
      colors.cyan(
        `${LOG} Deleting LibraryGeneralMaterial rows (cascades chapters, files, library chunks, processing, class links)…`,
      ),
    );

    const matDel = await this.prisma.libraryGeneralMaterial.deleteMany({
      where: { id: { in: materialIds } },
    });
    result.libraryGeneralMaterialsDeleted = matDel.count;

    this.logger.log(
      colors.green(
        `${LOG} LibraryGeneralMaterial deleted: ${matDel.count} row(s).`,
      ),
    );

    this.logger.log(
      colors.cyan(
        '────────────────────────────────────────────────────────────',
      ),
    );
    this.logger.log(
      colors.green.bold(
        `${LOG} Process completed — summary`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • Books removed: ${result.libraryGeneralMaterialsDeleted} (found ${result.libraryGeneralMaterialsFound})`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • PDFMaterial removed: ${result.pdfMaterialsDeleted}`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • Library chat: contexts ${result.relatedRows.libraryChatContexts}, messages ${result.relatedRows.libraryChatMessages}, conversations ${result.relatedRows.libraryChatConversations}, purchases ${result.relatedRows.libraryPurchases}`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • School chat DB: contexts ${result.relatedRows.schoolChatContexts}, conversations ${result.relatedRows.schoolChatConversations}, messages ${result.relatedRows.schoolChatMessages}, analytics ${result.relatedRows.schoolChatAnalytics}`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • Document pipeline: DocumentChunk ${result.relatedRows.documentChunksDeleted}, MaterialProcessing ${result.relatedRows.materialProcessingsDeleted}`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • Pinecone: ${result.pinecone.attempted} attempt(s), ${result.pinecone.failures.length} failure(s)`,
      ),
    );
    this.logger.log(
      colors.white(
        `  • S3: ${result.s3.attempted} attempt(s), ${result.s3.failures.length} failure(s)`,
      ),
    );
    this.logger.log(
      colors.cyan(
        '────────────────────────────────────────────────────────────',
      ),
    );

    if (
      result.pinecone.failures.length > 0 ||
      result.s3.failures.length > 0
    ) {
      this.logger.warn(
        colors.yellow(
          `${LOG} Completed with some non-fatal errors — inspect response.data.pinecone.failures and data.s3.failures.`,
        ),
      );
    }

    return result;
  }
}
