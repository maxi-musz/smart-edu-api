import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { TemEndpointService } from './tem-endpoint.service';

@Controller('temp-endpoint')
export class TemEndpointController {
  constructor(private readonly temEndpointService: TemEndpointService) {}

  /**
   * Upload TWO Excel files:
   *
   *   1. "file" — the main file with columns:
   *        file_number, smart_edu_email, password
   *      (used to update each student's password in the DB)
   *
   *   2. "personalFile" — the personal email file with columns:
   *        file_number, personal_email
   *      (used to look up each student's personal email by file_number)
   *
   * Returns a downloadable Excel with:
   *   S/N, Smart Edu Email, File Number, Personal Email, Password
   */
  @Post('bulk-update-passwords')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'personalFile', maxCount: 1 },
    ]),
  )
  async bulkUpdatePasswords(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      personalFile?: Express.Multer.File[];
    },
    @Res() res: Response,
  ) {
    if (!files?.file?.[0] || !files?.personalFile?.[0]) {
      throw new BadRequestException({
        success: false,
        message:
          'Two files are required: "file" (smart-edu-email + password Excel) and "personalFile" (file-number + personal-email Excel).',
        statusCode: 400,
      });
    }

    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    for (const f of [files.file[0], files.personalFile[0]]) {
      if (!validMimeTypes.includes(f.mimetype)) {
        throw new BadRequestException({
          success: false,
          message: `Invalid file type for "${f.fieldname}". Please upload .xlsx or .xls files.`,
          statusCode: 400,
        });
      }
    }

    const { excelBuffer, summary } =
      await this.temEndpointService.bulkUpdatePasswordsAndGenerateReport(
        files.file[0].buffer,
        files.personalFile[0].buffer,
      );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="updated-credentials.xlsx"',
      'X-Summary-Total': String(summary.total),
      'X-Summary-Updated': String(summary.updated),
      'X-Summary-Not-Found': String(summary.notFound),
      'X-Summary-Failed': String(summary.failed),
    });

    res.send(excelBuffer);
  }

  /**
   * Upload the "updated-credentials.xlsx" Excel + a PDF user guide.
   *
   * For each row in the Excel, sends a credentials email to the personal email
   * with the Smart Edu Email, Password, and the PDF attached.
   *
   * Form fields:
   *   - "file"  → the credentials Excel (S/N, Smart Edu Email, File Number, Personal Email, Password)
   *   - "guide" → the PDF instruction guide to attach
   */
  @Post('send-credentials-email')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'guide', maxCount: 1 },
    ]),
  )
  async sendCredentialsEmail(
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      guide?: Express.Multer.File[];
    },
  ) {
    if (!files?.file?.[0] || !files?.guide?.[0]) {
      throw new BadRequestException({
        success: false,
        message:
          'Two files are required: "file" (the credentials Excel) and "guide" (the PDF instruction guide).',
        statusCode: 400,
      });
    }

    const excelFile = files.file[0];
    const guideFile = files.guide[0];

    // Validate Excel
    const validExcelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validExcelTypes.includes(excelFile.mimetype)) {
      throw new BadRequestException({
        success: false,
        message:
          'Invalid file type for "file". Please upload an .xlsx or .xls file.',
        statusCode: 400,
      });
    }

    // Validate PDF
    if (guideFile.mimetype !== 'application/pdf') {
      throw new BadRequestException({
        success: false,
        message: 'Invalid file type for "guide". Please upload a PDF file.',
        statusCode: 400,
      });
    }

    const result = await this.temEndpointService.sendCredentialsEmail(
      excelFile.buffer,
      guideFile.buffer,
      guideFile.originalname || 'SmartEdu-Hub-User-Guide.pdf',
    );

    return {
      success: true,
      message: `Credentials email: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed out of ${result.total}.`,
      data: result,
      statusCode: 200,
    };
  }
}
