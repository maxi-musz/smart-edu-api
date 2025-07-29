import { Body, Controller, Post, UseInterceptors, UploadedFiles, Get, HttpCode, UseGuards, Request, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { OnboardSchoolDto, RequestPasswordResetDTO, ResetPasswordDTO, SignInDto, VerifyresetOtp, OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto, OnboardDataDto, RequestLoginOtpDTO, VerifyEmailOTPDto } from 'src/shared/dto/auth.dto';
import { BulkOnboardDto, BulkOnboardResponseDto } from 'src/shared/dto/bulk-onboard.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from './guard';
import { 
  OnboardSchoolDocs, 
  DirectorLoginOtpDocs, 
  VerifyLoginOtpDocs, 
  SignInDocs, 
  RequestPasswordResetDocs, 
  VerifyPasswordResetDocs, 
  ResetPasswordDocs,
  OnboardClassesDocs,
  OnboardTeachersDocs,
  OnboardStudentsDocs,
  OnboardDirectorsDocs,
  OnboardDataDocs
} from 'src/docs/auth.docs';
import { BulkOnboardDocs, DownloadTemplateDocs } from 'src/docs/bulk-onboard.docs';

interface ErrorResponse {
    success: false;
    message: string;
    error: any;
    statusCode: number;
}

interface SuccessResponse {
    success: true;
    message: string;
    data: any;
    length?: number;
    meta?: any;
    statusCode: number;
}

type ApiResponse = ErrorResponse | SuccessResponse;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // Onboard new school 
    // POST /api/v1/auth/onboard-school
    // Protected endpoint
    @Post('onboard-school')
    @OnboardSchoolDocs.operation
    @OnboardSchoolDocs.consumes
    @OnboardSchoolDocs.body
    @OnboardSchoolDocs.response201
    @OnboardSchoolDocs.response400
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'cac_or_approval_letter', maxCount: 1 },
            { name: 'utility_bill', maxCount: 1 },
            { name: 'tax_cert', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    async onboardSchool(
        @Body() dto: OnboardSchoolDto,
        @UploadedFiles() files: {
            cac_or_approval_letter?: Express.Multer.File[],
            utility_bill?: Express.Multer.File[],
            tax_cert?: Express.Multer.File[]
        }
    ): Promise<ApiResponse> {
        const fileArray = [
            files.cac_or_approval_letter?.[0],
            files.utility_bill?.[0],
            files.tax_cert?.[0]
        ].filter((file): file is Express.Multer.File => file !== undefined);

        return this.authService.onboardSchool(dto, fileArray) as Promise<ApiResponse>;
    }

    // Request login OTP for director
    // POST /api/v1/auth/director-login-otp
    // Public endpoint
    @Post('director-login-otp')
    @DirectorLoginOtpDocs.operation
    @DirectorLoginOtpDocs.response200
    signUp(@Body() dto: RequestLoginOtpDTO) {
        return this.authService.directorRequestLoginOtp(dto)
    }

    // Verify login OTP for director
    // POST /api/v1/auth/director-verify-login-otp
    // Public endpoint
    @Post("director-verify-login-otp")
    @VerifyLoginOtpDocs.operation
    @VerifyLoginOtpDocs.response200
    verifyEmailOTPAndSignIn(@Body() dto: VerifyEmailOTPDto) {
        return this.authService.verifyEmailOTPAndSignIn(dto)
    }

    // Sign in with email and password
    // POST /api/v1/auth/sign-in
    // Public endpoint
    @Post("sign-in")
    @HttpCode(200)
    @SignInDocs.operation
    @SignInDocs.response200
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }

    // Request password reset OTP
    // POST /api/v1/auth/request-password-reset-otp
    // Public endpoint
    @Post("request-password-reset-otp")
    @HttpCode(200)
    @RequestPasswordResetDocs.operation
    @RequestPasswordResetDocs.response200
    requestPasswordResetOTP(@Body() dto: RequestPasswordResetDTO) {
        return this.authService.requestPasswordResetOTP(dto)
    }

    // Verify password reset OTP
    // POST /api/v1/auth/verify-password-reset-otp
    // Public endpoint
    @Post("verify-password-reset-otp")
    @HttpCode(200)
    @VerifyPasswordResetDocs.operation
    @VerifyPasswordResetDocs.response200
    verifyResetPasswordOTP(@Body() dto: VerifyresetOtp) {
        return this.authService.verifyResetPasswordOTP(dto)
    }

    // Reset password
    // POST /api/v1/auth/reset-password
    // Public endpoint
    @Post("reset-password")
    @HttpCode(200)
    @ResetPasswordDocs.operation
    @ResetPasswordDocs.response200
    resetPassword(@Body() dto: ResetPasswordDTO) {
        return this.authService.resetPassword(dto)
    }

    // Onboard classes
    // POST /api/v1/auth/onboard-classes
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-classes")
    @HttpCode(201)
    @OnboardClassesDocs.bearerAuth
    @OnboardClassesDocs.operation
    @OnboardClassesDocs.response201
    onboardClasses(@Body() dto: OnboardClassesDto, @Request() req: any) {
        return this.authService.onboardClasses(dto, req.user);
    }

    // Onboard teachers
    // POST /api/v1/auth/onboard-teachers
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-teachers")
    @HttpCode(201)
    @OnboardTeachersDocs.bearerAuth
    @OnboardTeachersDocs.operation
    @OnboardTeachersDocs.response201
    onboardTeachers(@Body() dto: OnboardTeachersDto, @Request() req: any) {
        return this.authService.onboardTeachers(dto, req.user);
    }

    // Onboard students
    // POST /api/v1/auth/onboard-students
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-students")
    @HttpCode(201)
    @OnboardStudentsDocs.bearerAuth
    @OnboardStudentsDocs.operation
    @OnboardStudentsDocs.response201
    onboardStudents(@Body() dto: OnboardStudentsDto, @Request() req: any) {
        return this.authService.onboardStudents(dto, req.user);
    }

    // Onboard directors
    // POST /api/v1/auth/onboard-directors
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-directors")
    @HttpCode(201)
    @OnboardDirectorsDocs.bearerAuth
    @OnboardDirectorsDocs.operation
    @OnboardDirectorsDocs.response201
    onboardDirectors(@Body() dto: OnboardDirectorsDto, @Request() req: any) {
        return this.authService.onboardDirectors(dto, req.user);
    }

    // Onboard all data
    // POST /api/v1/auth/onboard-data
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-data")
    @HttpCode(201)
    @OnboardDataDocs.bearerAuth
    @OnboardDataDocs.operation
    @OnboardDataDocs.response201
    onboardData(@Body() dto: OnboardDataDto, @Request() req: any) {
        return this.authService.onboardData(dto, req.user);
    }

    // Bulk onboard from Excel file
    // POST /api/v1/auth/bulk-onboard
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("bulk-onboard")
    @HttpCode(201)
    @BulkOnboardDocs.operation
    @BulkOnboardDocs.consumes
    @BulkOnboardDocs.body
    @BulkOnboardDocs.bearerAuth
    @BulkOnboardDocs.response201
    @BulkOnboardDocs.response400
    @BulkOnboardDocs.response401
    @BulkOnboardDocs.response500
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'excel_file', maxCount: 1 }
        ]),
        FileValidationInterceptor
    )
    async bulkOnboardFromExcel(
        @UploadedFiles() files: { excel_file?: Express.Multer.File[] },
        @Request() req: any
    ): Promise<BulkOnboardResponseDto> {
        const file = files.excel_file?.[0];
        if (!file) {
            throw new BadRequestException('Excel file is required');
        }
        return this.authService.bulkOnboardFromExcel(file, req.user);
    }

    // Download Excel template
    // GET /api/v1/auth/download-template
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Get("download-template")
    @DownloadTemplateDocs.operation
    @DownloadTemplateDocs.bearerAuth
    @DownloadTemplateDocs.response200
    @DownloadTemplateDocs.response401
    async downloadExcelTemplate(@Res() res: Response) {
        const templateBuffer = await this.authService.downloadExcelTemplate();
        
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="bulk-onboard-template.xlsx"',
            'Content-Length': templateBuffer.length,
        });
        
        res.send(templateBuffer);
    }
}
 