import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  Param,
  Sse,
} from '@nestjs/common';
import { GeneralMaterialsService } from './general-materials.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CreateGeneralMaterialDto } from './dto/create-general-material.dto';
import { QueryGeneralMaterialsDto } from './dto/query-general-materials.dto';

import { CreateChapterWithFileDto } from './dto/create-chapter-with-file.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import {
  GetGeneralMaterialsDashboardDocs,
  GetAllGeneralMaterialsDocs,
  CreateGeneralMaterialDocs,
  StartGeneralMaterialUploadDocs,
  GeneralMaterialUploadProgressSseDocs,
  GeneralMaterialUploadProgressPollDocs,
} from './docs/general-materials.docs';

@ApiTags('Library General Materials')
@Controller('library/general-materials')
export class GeneralMaterialsController {
  constructor(
    private readonly generalMaterialsService: GeneralMaterialsService,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  // 1) Dashboard endpoint
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetGeneralMaterialsDashboardDocs.operation
  @GetGeneralMaterialsDashboardDocs.response200
  @GetGeneralMaterialsDashboardDocs.response401
  @GetGeneralMaterialsDashboardDocs.response404
  @GetGeneralMaterialsDashboardDocs.response500
  async getDashboard(@Request() req: any) {
    return await this.generalMaterialsService.getDashboard(req.user);
  }

  // 2) Get all available library classes (for dropdown selection)
  @Get('classes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async getAllClasses(@Request() req: any) {
    return await this.generalMaterialsService.getAllLibraryClasses();
  }

  // 3) All general materials with pagination/filter/search
  @Get('all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetAllGeneralMaterialsDocs.operation
  @GetAllGeneralMaterialsDocs.response200
  @GetAllGeneralMaterialsDocs.response401
  @GetAllGeneralMaterialsDocs.response404
  @GetAllGeneralMaterialsDocs.response500
  async getAll(
    @Request() req: any,
    @Query() query: QueryGeneralMaterialsDto,
  ) {
    return await this.generalMaterialsService.getAllGeneralMaterials(req.user, query);
  }

  // 4.1) Get chapters for a material (must come before :materialId to avoid route conflicts)
  @Get(':materialId/chapters')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async getMaterialChapters(
    @Request() req: any,
    @Param('materialId') materialId: string,
  ) {
    return await this.generalMaterialsService.getMaterialChapters(req.user, materialId);
  }

  // 4.2) Get single general material by ID
  @Get(':materialId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async getMaterialById(
    @Request() req: any,
    @Param('materialId') materialId: string,
  ) {
    return await this.generalMaterialsService.getGeneralMaterialById(req.user, materialId);
  }

  // 6) Create chapter with file upload (combined endpoint) - MUST come before generic @Post()
  @Post(':materialId/chapters/with-file')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async createChapterWithFile(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @Body() payload: CreateChapterWithFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.generalMaterialsService.createChapterWithFile(req.user, materialId, payload, file);
  }

  // 6.1) Start chapter upload with progress tracking (recommended for large files)
  @Post(':materialId/chapters/upload/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async startChapterUpload(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @Body() payload: CreateChapterWithFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.generalMaterialsService.startChapterUploadSession(req.user, materialId, payload, file);
  }

  // 5) Create new general material (full file upload)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @CreateGeneralMaterialDocs.consumes
  @CreateGeneralMaterialDocs.operation
  @CreateGeneralMaterialDocs.body
  @CreateGeneralMaterialDocs.response201
  @CreateGeneralMaterialDocs.response400
  @CreateGeneralMaterialDocs.response401
  @CreateGeneralMaterialDocs.response404
  @CreateGeneralMaterialDocs.response500
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  // async createGeneralMaterial(
  //   @Request() req: any,
  //   @Body() payload: CreateGeneralMaterialDto,
  //   @UploadedFiles()
  //   files: {
  //     file?: Express.Multer.File[];
  //     thumbnail?: Express.Multer.File[];
  //   },
  // ) {
  //   const materialFile = files.file?.[0];
  //   const thumbnailFile = files.thumbnail?.[0];
  //   return await this.generalMaterialsService.createGeneralMaterial(req.user, payload, materialFile, thumbnailFile);
  // }

  // 8) Start general material upload with progress tracking
  @Post('upload/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  @StartGeneralMaterialUploadDocs.consumes
  @StartGeneralMaterialUploadDocs.operation
  @StartGeneralMaterialUploadDocs.body
  @StartGeneralMaterialUploadDocs.response202
  @StartGeneralMaterialUploadDocs.response400
  @StartGeneralMaterialUploadDocs.response401
  @StartGeneralMaterialUploadDocs.response404
  @StartGeneralMaterialUploadDocs.response500
  async startGeneralMaterialUpload(
    @Request() req: any,
    @Body() payload: CreateGeneralMaterialDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const materialFile = files.file?.[0];
    const thumbnailFile = files.thumbnail?.[0];
    return await this.generalMaterialsService.startGeneralMaterialUploadSession(payload, materialFile, thumbnailFile, req.user);
  }

  // 9) Upload progress (SSE)
  @Get('upload-progress/:sessionId')
  @Sse('upload-progress/:sessionId')
  @GeneralMaterialUploadProgressSseDocs.operation
  getUploadProgressSse(@Param('sessionId') sessionId: string): Observable<MessageEvent> {
    return new Observable((observer) => {
      const current = this.uploadProgressService.getCurrentProgress(sessionId);
      if (current) {
        observer.next({ data: JSON.stringify(current) } as MessageEvent);
      }
      const unsubscribe = this.uploadProgressService.subscribeToProgress(sessionId, (progress) => {
        observer.next({ data: JSON.stringify(progress) } as MessageEvent);
        if (progress.stage === 'completed' || progress.stage === 'error') {
          observer.complete();
        }
      });
      return () => unsubscribe();
    });
  }

  // 10) Upload progress (polling)
  @Get('upload-progress/:sessionId/poll')
  @GeneralMaterialUploadProgressPollDocs.operation
  @GeneralMaterialUploadProgressPollDocs.response200
  @GeneralMaterialUploadProgressPollDocs.response400
  @GeneralMaterialUploadProgressPollDocs.response500
  async getUploadProgressPoll(@Param('sessionId') sessionId: string) {
    return await this.generalMaterialsService.getUploadProgress(sessionId);
  }

  // 11) Retry processing for a chapter (by chapter.id) - waits for completion
  @Post(':chapterId/retry-processing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async retryProcessing(
    @Request() req: any,
    @Param('chapterId') chapterId: string, // Chapter.id (frontend sends chapter ID)
  ) {
    return await this.generalMaterialsService.retryProcessing(req.user, chapterId);
  }

  // 12) Delete a chapter (soft delete - sets status to deleted)
  @Delete(':materialId/chapters/:chapterId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async deleteChapter(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return await this.generalMaterialsService.deleteChapter(req.user, materialId, chapterId);
  }
}
