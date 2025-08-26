import { Body, Controller, Post, UseInterceptors, UploadedFiles, Get, HttpCode, UseGuards, Request, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { OnboardSchoolDto, RequestPasswordResetDTO, SignInDto, OnboardClassesDto, OnboardTeachersDto, OnboardStudentsDto, OnboardDirectorsDto, OnboardDataDto, RequestLoginOtpDTO, VerifyEmailOTPDto, RefreshTokenDto, RequestEmailVerificationDto, VerifyOTPAndResetPasswordDto } from 'src/school/director/students/dto/auth.dto';
import { BulkOnboardDto, BulkOnboardResponseDto } from 'src/shared/dto/bulk-onboard.dto';
import { FileValidationInterceptor } from 'src/shared/interceptors/file-validation.interceptor';
import { ApiTags } from '@nestjs/swagger';
import { JwtGuard } from './guard';
import { GetUser } from './decorator';
import { AuthControllerDocs } from './auth.controller.docs';

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
    @AuthControllerDocs.onboardSchool.operation
    @AuthControllerDocs.onboardSchool.consumes
    @AuthControllerDocs.onboardSchool.body
    @AuthControllerDocs.onboardSchool.response201
    @AuthControllerDocs.onboardSchool.response400
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
    @AuthControllerDocs.directorLoginOtp.operation
    @AuthControllerDocs.directorLoginOtp.response200
    signUp(@Body() dto: RequestLoginOtpDTO) {
        return this.authService.directorRequestLoginOtp(dto)
    }

    // Verify login OTP for director
    // POST /api/v1/auth/director-verify-login-otp
    // Public endpoint
    @Post("director-verify-login-otp")
    @AuthControllerDocs.verifyLoginOtp.operation
    @AuthControllerDocs.verifyLoginOtp.response200
    verifyEmailOTPAndSignIn(@Body() dto: VerifyEmailOTPDto) {
        return this.authService.verifyEmailOTPAndSignIn(dto)
    }

    // Sign in with email and password
    // POST /api/v1/auth/sign-in
    // Public endpoint
    @Post("sign-in")
    @HttpCode(200)
    @AuthControllerDocs.signIn.operation
    @AuthControllerDocs.signIn.response200
    @AuthControllerDocs.signIn.response200OtpRequired
    @AuthControllerDocs.signIn.response200EmailNotVerified
    signIn(@Body() dto: SignInDto) {
        return this.authService.signIn(dto);
    }

    // Request password reset OTP
    // POST /api/v1/auth/request-password-reset-otp
    // Public endpoint
    @Post("request-password-reset-otp")
    @HttpCode(200)
    @AuthControllerDocs.requestPasswordResetOtp.operation
    @AuthControllerDocs.requestPasswordResetOtp.response200
    requestPasswordResetOTP(@Body() dto: RequestPasswordResetDTO) {
        return this.authService.requestPasswordResetOTP(dto)
    }

    // Verify OTP and reset password (combined)
    // POST /api/v1/auth/verify-otp-and-reset-password
    // Public endpoint
    @Post("verify-otp-and-reset-password")
    @HttpCode(200)
    verifyOTPAndResetPassword(@Body() dto: VerifyOTPAndResetPasswordDto) {
        return this.authService.verifyOTPAndResetPassword(dto)
    }

    // Request email verification code
    // POST /api/v1/auth/request-email-verification
    // Public endpoint
    @Post("request-email-verification")
    @HttpCode(200)
    requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
        return this.authService.requestEmailVerification(dto.email);
    }

    // Logout user
    // POST /api/v1/auth/logout
    // Protected endpoint
    @Post("logout")
    @HttpCode(200)
    @UseGuards(JwtGuard)
    logout(@GetUser() user: any) {
        return this.authService.logout(user.sub);
    }

    // Onboard classes
    // POST /api/v1/auth/onboard-classes
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-classes")
    @HttpCode(201)
    @AuthControllerDocs.onboardClasses.bearerAuth
    @AuthControllerDocs.onboardClasses.operation
    @AuthControllerDocs.onboardClasses.response201
    onboardClasses(@Body() dto: OnboardClassesDto, @Request() req: any) {
        return this.authService.onboardClasses(dto, req.user);
    }

    // Onboard teachers
    // POST /api/v1/auth/onboard-teachers
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-teachers")
    @HttpCode(201)
    @AuthControllerDocs.onboardTeachers.bearerAuth
    @AuthControllerDocs.onboardTeachers.operation
    @AuthControllerDocs.onboardTeachers.response201
    onboardTeachers(@Body() dto: OnboardTeachersDto, @Request() req: any) {
        return this.authService.onboardTeachers(dto, req.user);
    }

    // Onboard students
    // POST /api/v1/auth/onboard-students
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-students")
    @HttpCode(201)
    @AuthControllerDocs.onboardStudents.bearerAuth
    @AuthControllerDocs.onboardStudents.operation
    @AuthControllerDocs.onboardStudents.response201
    onboardStudents(@Body() dto: OnboardStudentsDto, @Request() req: any) {
        return this.authService.onboardStudents(dto, req.user);
    }

    // Onboard directors
    // POST /api/v1/auth/onboard-directors
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-directors")
    @HttpCode(201)
    @AuthControllerDocs.onboardDirectors.bearerAuth
    @AuthControllerDocs.onboardDirectors.operation
    @AuthControllerDocs.onboardDirectors.response201
    onboardDirectors(@Body() dto: OnboardDirectorsDto, @Request() req: any) {
        return this.authService.onboardDirectors(dto, req.user);
    }

    // Onboard all data
    // POST /api/v1/auth/onboard-data
    // Protected endpoint
    @UseGuards(JwtGuard)
    @Post("onboard-data")
    @HttpCode(201)
    @AuthControllerDocs.onboardData.bearerAuth
    @AuthControllerDocs.onboardData.operation
    @AuthControllerDocs.onboardData.response201
    onboardData(@Body() dto: OnboardDataDto, @Request() req: any) {
        return this.authService.onboardData(dto, req.user);
    }

    // Bulk onboard from Excel file
    // POST /api/v1/auth/bulk-onboard
    // Protected endpoint
        @UseGuards(JwtGuard)
    @Post("bulk-onboard")
    @HttpCode(201)
    @AuthControllerDocs.bulkOnboardFromExcel.operation
    @AuthControllerDocs.bulkOnboardFromExcel.consumes
    @AuthControllerDocs.bulkOnboardFromExcel.body
    @AuthControllerDocs.bulkOnboardFromExcel.bearerAuth
    @AuthControllerDocs.bulkOnboardFromExcel.response201
    @AuthControllerDocs.bulkOnboardFromExcel.response400
    @AuthControllerDocs.bulkOnboardFromExcel.response401
    @AuthControllerDocs.bulkOnboardFromExcel.response500
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
    @AuthControllerDocs.downloadExcelTemplate.operation
    @AuthControllerDocs.downloadExcelTemplate.bearerAuth
    @AuthControllerDocs.downloadExcelTemplate.response200
    @AuthControllerDocs.downloadExcelTemplate.response401
    async downloadExcelTemplate(@Res() res: Response) {
        const templateBuffer = await this.authService.downloadExcelTemplate();
        
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="bulk-onboard-template.xlsx"',
            'Content-Length': templateBuffer.length,
        });
        
        res.send(templateBuffer);
    }

    // Refresh access token
    // POST /api/v1/auth/refresh-token
    // Public endpoint
    @Post("refresh-token")
    @HttpCode(200)
    refreshToken(@Body() dto: RefreshTokenDto) {
        return this.authService.refreshToken(dto.refresh_token);
    }
}
 