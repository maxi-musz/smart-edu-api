import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { PaymentProcessorService } from 'src/shared/services/payment-processor.service';
import { 
  ProcessPaymentDto, 
  PaymentHistoryDto, 
  WalletHistoryDto,
  PaymentResponseDto,
  PaymentHistoryResponseDto,
  WalletHistoryResponseDto,
  FinancialSummaryResponseDto
} from 'src/shared/dto/payment.dto';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';

@ApiTags('Payment Processing')
@Controller('payments')
@UseGuards(JwtGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentController {
  constructor(private paymentProcessorService: PaymentProcessorService) {}

  /**
   * Process a student payment
   * POST /api/v1/payments/process
   */
  @Post('process')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Process student payment',
    description: 'Process a student payment and update wallet balance and finance summary'
  })
  @ApiResponse({
    status: 201,
    description: 'Payment processed successfully',
    type: PaymentResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid payment data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Student or class not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async processPayment(
    @Body() paymentData: ProcessPaymentDto,
    @Request() req: any
  ): Promise<PaymentResponseDto> {
    try {
      const result = await this.paymentProcessorService.processStudentPayment(paymentData);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment history for a student
   * GET /api/v1/payments/student-history
   */
  @Get('student-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get student payment history',
    description: 'Retrieve payment history for a specific student with pagination'
  })
  @ApiQuery({
    name: 'student_id',
    description: 'Student ID',
    example: 'student-uuid-123'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records to return',
    example: 10,
    required: false
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of records to skip',
    example: 0,
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    type: PaymentHistoryResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getStudentPaymentHistory(
    @Query('student_id') studentId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0
  ): Promise<PaymentHistoryResponseDto> {
    try {
      const result = await this.paymentProcessorService.getStudentPaymentHistory(
        studentId,
        limit,
        offset
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get wallet transaction history for a school
   * GET /api/v1/payments/wallet-history
   */
  @Get('wallet-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school wallet history',
    description: 'Retrieve wallet transaction history for a school with pagination'
  })
  @ApiQuery({
    name: 'school_id',
    description: 'School ID',
    example: 'school-uuid-123'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records to return',
    example: 10,
    required: false
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of records to skip',
    example: 0,
    required: false
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet history retrieved successfully',
    type: WalletHistoryResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found for school'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getWalletHistory(
    @Query('school_id') schoolId: string,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0
  ): Promise<WalletHistoryResponseDto> {
    try {
      const result = await this.paymentProcessorService.getSchoolWalletHistory(
        schoolId,
        limit,
        offset
      );
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get school financial summary
   * GET /api/v1/payments/financial-summary
   */
  @Get('financial-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get school financial summary',
    description: 'Retrieve comprehensive financial summary including wallet balance, finance data, and recent transactions'
  })
  @ApiQuery({
    name: 'school_id',
    description: 'School ID',
    example: 'school-uuid-123'
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
    type: FinancialSummaryResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getFinancialSummary(
    @Query('school_id') schoolId: string
  ): Promise<FinancialSummaryResponseDto> {
    try {
      const result = await this.paymentProcessorService.getSchoolFinancialSummary(schoolId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user's school financial summary
   * GET /api/v1/payments/my-financial-summary
   */
  @Get('my-financial-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user school financial summary',
    description: 'Retrieve financial summary for the authenticated user\'s school'
  })
  @ApiResponse({
    status: 200,
    description: 'Financial summary retrieved successfully',
    type: FinancialSummaryResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getMyFinancialSummary(
    @Request() req: any
  ): Promise<FinancialSummaryResponseDto> {
    try {
      // Get school ID from authenticated user
      const user = req.user;
      const schoolId = user.school_id;

      if (!schoolId) {
        throw new Error('User is not associated with a school');
      }

      const result = await this.paymentProcessorService.getSchoolFinancialSummary(schoolId);
      return result;
    } catch (error) {
      throw error;
    }
  }
} 