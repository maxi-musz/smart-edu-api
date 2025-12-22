import {
  Controller,
  Get,
  Post,
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
import { CreateGeneralMaterialChapterDto } from './dto/create-general-material-chapter.dto';
import { UploadChapterFileDto } from './dto/upload-chapter-file.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import {
  GetGeneralMaterialsDashboardDocs,
  GetAllGeneralMaterialsDocs,
  CreateGeneralMaterialDocs,
  CreateGeneralMaterialChapterDocs,
  UploadChapterFileDocs,
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

  // 2) All general materials with pagination/filter/search
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

  // 2.1) Get chapters for a material (must come before :materialId to avoid route conflicts)
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

  // 2.2) Get single general material by ID
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

  // 3) Create new general material (full file upload)
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
  async createGeneralMaterial(
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
    return await this.generalMaterialsService.createGeneralMaterial(req.user, payload, materialFile, thumbnailFile);
  }

  // 4) Create chapter for a general material
  @Post(':materialId/chapters')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @CreateGeneralMaterialChapterDocs.operation
  @CreateGeneralMaterialChapterDocs.body
  @CreateGeneralMaterialChapterDocs.response201
  @CreateGeneralMaterialChapterDocs.response400
  @CreateGeneralMaterialChapterDocs.response401
  @CreateGeneralMaterialChapterDocs.response404
  @CreateGeneralMaterialChapterDocs.response500
  async createGeneralMaterialChapter(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @Body() payload: CreateGeneralMaterialChapterDto,
  ) {
    return await this.generalMaterialsService.createGeneralMaterialChapter(req.user, materialId, payload);
  }

  // 5) Upload file for a chapter
  @Post(':materialId/chapters/:chapterId/files')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UploadChapterFileDocs.consumes
  @UploadChapterFileDocs.operation
  @UploadChapterFileDocs.body
  @UploadChapterFileDocs.response201
  @UploadChapterFileDocs.response400
  @UploadChapterFileDocs.response401
  @UploadChapterFileDocs.response404
  @UploadChapterFileDocs.response500
  @UseInterceptors(FileInterceptor('file'))
  async uploadChapterFile(
    @Request() req: any,
    @Param('materialId') materialId: string,
    @Param('chapterId') chapterId: string,
    @Body() payload: UploadChapterFileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.generalMaterialsService.uploadChapterFile(req.user, materialId, chapterId, payload, file);
  }

  // 6) Start general material upload with progress tracking
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

  // 6) Upload progress (SSE)
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

  // 7) Upload progress (polling)
  @Get('upload-progress/:sessionId/poll')
  @GeneralMaterialUploadProgressPollDocs.operation
  @GeneralMaterialUploadProgressPollDocs.response200
  @GeneralMaterialUploadProgressPollDocs.response400
  @GeneralMaterialUploadProgressPollDocs.response500
  async getUploadProgressPoll(@Param('sessionId') sessionId: string) {
    return await this.generalMaterialsService.getUploadProgress(sessionId);
  }
}
