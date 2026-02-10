import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ResultService } from './result.service';
import { ResultDocs } from './docs/result.docs';
import { UniversalJwtGuard } from '../video/guards/universal-jwt.guard';

@ApiTags('Result')
@Controller('result')
@UseGuards(UniversalJwtGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Get('download-pdf')
  @ResultDocs.bearerAuth
  @ResultDocs.downloadPdfOperation
  @ResultDocs.downloadPdfQueries
  @ResultDocs.downloadPdfResponse200
  @ResultDocs.response400
  @ResultDocs.response401
  @ResultDocs.response403
  @ResultDocs.response404
  @ResultDocs.response500
  async downloadPdf(
    @Query('studentId') studentId: string,
    @Query('academicSessionId') academicSessionId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = (req as any).user;
    const pdf = await this.resultService.getResultPdf(
      user,
      studentId,
      academicSessionId,
    );
    const filename = `report-card-${studentId}-${academicSessionId}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(pdf.length));
    res.status(HttpStatus.OK).send(pdf);
  }
}
