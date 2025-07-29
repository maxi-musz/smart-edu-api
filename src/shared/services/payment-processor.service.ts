import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletTransactionType, WalletTransactionStatus } from '@prisma/client';
import * as colors from 'colors';

export interface PaymentData {
  student_id: string;
  class_id: string;
  amount: number;
  payment_for: string;
  payment_type: 'full' | 'partial';
  transaction_type: 'credit' | 'debit';
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: any;
    walletTransaction: any;
    walletBalance: number;
    financeSummary: any;
  };
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class PaymentProcessorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Process a student payment with full validation and error handling
   * @param paymentData - Payment information
   * @returns Payment processing result
   */
  async processStudentPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    console.log(colors.cyan('🔄 Processing student payment...'));
    console.log(colors.gray(`Amount: ₦${paymentData.amount.toLocaleString()}`));
    console.log(colors.gray(`Student: ${paymentData.student_id}`));
    console.log(colors.gray(`Payment for: ${paymentData.payment_for}`));

    try {
      // Step 1: Validate payment data
      const validation = await this.validatePayment(paymentData);
      if (!validation.isValid) {
        throw new BadRequestException({
          success: false,
          message: 'Payment validation failed',
          errors: validation.errors,
          statusCode: 400
        });
      }

      // Step 2: Process payment in database transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Get student and school information
        const student = await prisma.user.findFirst({
          where: { id: paymentData.student_id },
          include: {
            school: {
              include: {
                wallet: true,
                finance: true
              }
            }
          }
        });

        if (!student) {
          throw new NotFoundException('Student not found');
        }

        if (student.role !== 'student') {
          throw new BadRequestException('User is not a student');
        }

        const school = student.school;
        if (!school) {
          throw new NotFoundException('School not found');
        }

        // Ensure wallet exists
        let wallet = school.wallet;
        if (!wallet) {
          console.log(colors.yellow('⚠️ Creating wallet for school...'));
          wallet = await prisma.wallet.create({
            data: {
              school_id: school.id,
              balance: 0,
              currency: 'NGN',
              wallet_type: 'SCHOOL_WALLET',
              is_active: true
            }
          });
        }

        // Ensure finance record exists
        let finance = school.finance;
        if (!finance) {
          console.log(colors.yellow('⚠️ Creating finance record for school...'));
          finance = await prisma.finance.create({
            data: {
              school_id: school.id,
              total_revenue: 0,
              outstanding_fee: 0,
              amount_withdrawn: 0
            }
          });
        }

        // Generate unique reference if not provided
        const reference = paymentData.reference || this.generatePaymentReference();

        // Step 3: Create payment record
        console.log(colors.blue('📝 Creating payment record...'));
        const payment = await prisma.payment.create({
          data: {
            finance_id: finance.id,
            student_id: paymentData.student_id,
            class_id: paymentData.class_id,
            payment_for: paymentData.payment_for,
            amount: paymentData.amount,
            payment_type: paymentData.payment_type,
            transaction_type: paymentData.transaction_type,
            payment_date: new Date()
          }
        });

        // Step 4: Create wallet transaction
        console.log(colors.blue('💰 Creating wallet transaction...'));
        const walletTransaction = await prisma.walletTransaction.create({
          data: {
            wallet_id: wallet.id,
            transaction_type: this.mapPaymentTypeToWalletType(paymentData.transaction_type),
            amount: paymentData.amount,
            description: `${paymentData.payment_for} - ${student.first_name} ${student.last_name}`,
            reference: reference,
            status: 'COMPLETED',
            processed_at: new Date(),
            metadata: {
              payment_id: payment.id,
              student_id: paymentData.student_id,
              class_id: paymentData.class_id,
              payment_type: paymentData.payment_type,
              original_data: paymentData.metadata || {}
            }
          }
        });

        // Step 5: Update wallet balance
        console.log(colors.blue('💳 Updating wallet balance...'));
        const updatedWallet = await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: paymentData.transaction_type === 'credit' ? paymentData.amount : -paymentData.amount
            },
            last_updated: new Date()
          }
        });

        // Step 6: Update finance summary
        console.log(colors.blue('📊 Updating finance summary...'));
        const updatedFinance = await prisma.finance.update({
          where: { id: finance.id },
          data: {
            total_revenue: {
              increment: paymentData.transaction_type === 'credit' ? paymentData.amount : 0
            },
            outstanding_fee: {
              increment: paymentData.transaction_type === 'debit' ? paymentData.amount : 0
            }
          }
        });

        console.log(colors.green('✅ Payment processed successfully!'));

        return {
          payment,
          walletTransaction,
          walletBalance: updatedWallet.balance,
          financeSummary: updatedFinance
        };

      }, {
        maxWait: 5000,
        timeout: 15000
      });

      return {
        success: true,
        message: 'Payment processed successfully',
        data: result
      };

    } catch (error) {
      console.log(colors.red('❌ Payment processing failed:'), error.message);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Payment processing failed',
        error: error.message,
        statusCode: 500
      });
    }
  }

  /**
   * Validate payment data before processing
   * @param paymentData - Payment information to validate
   * @returns Validation result
   */
  async validatePayment(paymentData: PaymentData): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!paymentData.student_id) errors.push('Student ID is required');
    if (!paymentData.class_id) errors.push('Class ID is required');
    if (!paymentData.amount) errors.push('Amount is required');
    if (!paymentData.payment_for) errors.push('Payment purpose is required');
    if (!paymentData.payment_type) errors.push('Payment type is required');
    if (!paymentData.transaction_type) errors.push('Transaction type is required');

    // Amount validation
    if (paymentData.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (paymentData.amount > 1000000) {
      warnings.push('Amount seems unusually high');
    }

    // Check if student exists
    try {
      const student = await this.prisma.user.findFirst({
        where: { id: paymentData.student_id }
      });

      if (!student) {
        errors.push('Student not found');
      } else if (student.role !== 'student') {
        errors.push('User is not a student');
      }
    } catch (error) {
      errors.push('Unable to validate student');
    }

    // Check if class exists
    try {
      const classRecord = await this.prisma.class.findFirst({
        where: { id: paymentData.class_id }
      });

      if (!classRecord) {
        errors.push('Class not found');
      }
    } catch (error) {
      errors.push('Unable to validate class');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get payment history for a student
   * @param studentId - Student ID
   * @param limit - Number of records to return
   * @param offset - Number of records to skip
   * @returns Payment history
   */
  async getStudentPaymentHistory(
    studentId: string,
    limit: number = 10,
    offset: number = 0
  ) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { student_id: studentId },
        include: {
          class: true,
          finance: {
            include: {
              school: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await this.prisma.payment.count({
        where: { student_id: studentId }
      });

      return {
        success: true,
        data: {
          payments,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch payment history');
    }
  }

  /**
   * Get wallet transaction history for a school
   * @param schoolId - School ID
   * @param limit - Number of records to return
   * @param offset - Number of records to skip
   * @returns Wallet transaction history
   */
  async getSchoolWalletHistory(
    schoolId: string,
    limit: number = 10,
    offset: number = 0
  ) {
    try {
      const wallet = await this.prisma.wallet.findFirst({
        where: { school_id: schoolId }
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found for school');
      }

      const transactions = await this.prisma.walletTransaction.findMany({
        where: { wallet_id: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await this.prisma.walletTransaction.count({
        where: { wallet_id: wallet.id }
      });

      return {
        success: true,
        data: {
          wallet,
          transactions,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch wallet history');
    }
  }

  /**
   * Get school financial summary
   * @param schoolId - School ID
   * @returns Financial summary
   */
  async getSchoolFinancialSummary(schoolId: string) {
    try {
      const [wallet, finance, recentTransactions] = await Promise.all([
        this.prisma.wallet.findFirst({
          where: { school_id: schoolId }
        }),
        this.prisma.finance.findFirst({
          where: { school_id: schoolId }
        }),
        this.prisma.walletTransaction.findMany({
          where: {
            wallet: { school_id: schoolId },
            status: 'COMPLETED'
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      return {
        success: true,
        data: {
          wallet,
          finance,
          recentTransactions,
          summary: {
            currentBalance: wallet?.balance || 0,
            totalRevenue: finance?.total_revenue || 0,
            outstandingFees: finance?.outstanding_fee || 0,
            totalTransactions: recentTransactions.length
          }
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch financial summary');
    }
  }

  /**
   * Map payment transaction type to wallet transaction type
   * @param transactionType - Payment transaction type
   * @returns Wallet transaction type
   */
  private mapPaymentTypeToWalletType(transactionType: 'credit' | 'debit'): WalletTransactionType {
    switch (transactionType) {
      case 'credit':
        return 'CREDIT';
      case 'debit':
        return 'DEBIT';
      default:
        return 'FEE_PAYMENT';
    }
  }

  /**
   * Generate unique payment reference
   * @returns Payment reference
   */
  private generatePaymentReference(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAY-${timestamp}-${random}`;
  }
} 