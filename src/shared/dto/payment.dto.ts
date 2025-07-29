import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsPositive, IsObject } from 'class-validator';

export enum PaymentType {
  FULL = 'full',
  PARTIAL = 'partial'
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'student-uuid-123'
  })
  @IsString()
  student_id: string;

  @ApiProperty({
    description: 'Class ID',
    example: 'class-uuid-456'
  })
  @IsString()
  class_id: string;

  @ApiProperty({
    description: 'Payment amount in Naira',
    example: 50000,
    minimum: 1
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Purpose of payment',
    example: 'Tuition Fee',
    enum: ['Tuition Fee', 'Exam Fee', 'Library Fee', 'Transport Fee', 'Other']
  })
  @IsString()
  payment_for: string;

  @ApiProperty({
    description: 'Type of payment',
    example: 'full',
    enum: PaymentType
  })
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty({
    description: 'Transaction type',
    example: 'credit',
    enum: TransactionType
  })
  @IsEnum(TransactionType)
  transaction_type: TransactionType;

  @ApiProperty({
    description: 'Payment reference (optional)',
    example: 'PAY-2024-001',
    required: false
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: 'Additional payment metadata',
    example: { term: 'first', academic_year: '2024/2025' },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PaymentHistoryDto {
  @ApiProperty({
    description: 'Student ID',
    example: 'student-uuid-123'
  })
  @IsString()
  student_id: string;

  @ApiProperty({
    description: 'Number of records to return',
    example: 10,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Number of records to skip',
    example: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class WalletHistoryDto {
  @ApiProperty({
    description: 'School ID',
    example: 'school-uuid-123'
  })
  @IsString()
  school_id: string;

  @ApiProperty({
    description: 'Number of records to return',
    example: 10,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Number of records to skip',
    example: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Payment processed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Payment data',
    example: {
      payment: {
        id: 'payment-uuid',
        amount: 50000,
        payment_for: 'Tuition Fee',
        status: 'completed'
      },
      walletTransaction: {
        id: 'transaction-uuid',
        amount: 50000,
        transaction_type: 'FEE_PAYMENT',
        status: 'COMPLETED'
      },
      walletBalance: 150000,
      financeSummary: {
        total_revenue: 150000,
        outstanding_fee: 0
      }
    }
  })
  data: {
    payment: any;
    walletTransaction: any;
    walletBalance: number;
    financeSummary: any;
  };
}

export class PaymentHistoryResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Payment history data',
    example: {
      payments: [
        {
          id: 'payment-uuid',
          amount: 50000,
          payment_for: 'Tuition Fee',
          payment_date: '2024-01-15T10:30:00Z'
        }
      ],
      pagination: {
        total: 25,
        limit: 10,
        offset: 0,
        hasMore: true
      }
    }
  })
  data: {
    payments: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export class WalletHistoryResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Wallet history data',
    example: {
      wallet: {
        id: 'wallet-uuid',
        balance: 150000,
        currency: 'NGN'
      },
      transactions: [
        {
          id: 'transaction-uuid',
          amount: 50000,
          transaction_type: 'FEE_PAYMENT',
          description: 'Tuition Fee - John Doe',
          status: 'COMPLETED'
        }
      ],
      pagination: {
        total: 50,
        limit: 10,
        offset: 0,
        hasMore: true
      }
    }
  })
  data: {
    wallet: any;
    transactions: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export class FinancialSummaryResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Financial summary data',
    example: {
      wallet: {
        id: 'wallet-uuid',
        balance: 150000,
        currency: 'NGN'
      },
      finance: {
        total_revenue: 150000,
        outstanding_fee: 0,
        amount_withdrawn: 0
      },
      recentTransactions: [
        {
          id: 'transaction-uuid',
          amount: 50000,
          transaction_type: 'FEE_PAYMENT',
          description: 'Tuition Fee - John Doe'
        }
      ],
      summary: {
        currentBalance: 150000,
        totalRevenue: 150000,
        outstandingFees: 0,
        totalTransactions: 5
      }
    }
  })
  data: {
    wallet: any;
    finance: any;
    recentTransactions: any[];
    summary: {
      currentBalance: number;
      totalRevenue: number;
      outstandingFees: number;
      totalTransactions: number;
    };
  };
} 