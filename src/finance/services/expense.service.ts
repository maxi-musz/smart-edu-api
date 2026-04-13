import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditForType,
  AuditPerformedByType,
  WalletTransactionType,
  WalletTransactionStatus,
  ExpenseStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { AuditService } from 'src/audit/audit.service';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { CreateExpenseDto, ExpenseQueryDto } from '../dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateExpenseDto) {
    try {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });

      if (!currentSession) {
        throw new BadRequestException('No active academic session found');
      }

      const wallet = await this.prisma.wallet.findFirst({
        where: { school_id: schoolId, is_active: true },
      });

      if (!wallet) {
        throw new BadRequestException('School wallet not found');
      }

      const expense = await this.prisma.expense.create({
        data: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          wallet_id: wallet.id,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          amount: dto.amount,
          expense_date: new Date(dto.expense_date as string),
          receipt_url: dto.receipt_url,
          payment_method: dto.payment_method,
          recorded_by: userId,
          status: ExpenseStatus.PENDING,
        },
      });

      await this.auditService.log({
        auditForType: AuditForType.finance_expense_record,
        targetId: expense.id,
        schoolId,
        performedById: userId,
        performedByType: AuditPerformedByType.school_user,
        metadata: { title: dto.title, amount: dto.amount, category: dto.category },
      });

      return ResponseHelper.created('Expense recorded successfully', expense);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return ResponseHelper.error('Failed to record expense', error?.message);
    }
  }

  async findAll(schoolId: string, query: ExpenseQueryDto) {
    try {
      const { page, limit, skip } = normalizePagination(query.page, query.limit);

      const where: Record<string, unknown> = { school_id: schoolId };
      if (query.category) where.category = query.category;
      if (query.status) where.status = query.status;
      if (query.date_from || query.date_to) {
        where.expense_date = {
          ...(query.date_from && { gte: new Date(query.date_from) }),
          ...(query.date_to && { lte: new Date(query.date_to) }),
        };
      }

      const [expenses, total] = await this.prisma.$transaction([
        this.prisma.expense.findMany({
          where,
          skip,
          take: limit,
          orderBy: { expense_date: 'desc' },
          include: {
            academicSession: { select: { academic_year: true, term: true } },
          },
        }),
        this.prisma.expense.count({ where }),
      ]);

      return ResponseHelper.success(
        'Expenses retrieved successfully',
        expenses,
        paginationMeta(total, page, limit),
      );
    } catch (error) {
      return ResponseHelper.error('Failed to retrieve expenses', error?.message);
    }
  }

  async approve(schoolId: string, expenseId: string, userId: string) {
    try {
      const expense = await this.prisma.expense.findFirst({
        where: { id: expenseId, school_id: schoolId },
        include: { wallet: true },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      if (expense.status !== ExpenseStatus.PENDING) {
        throw new BadRequestException(`Expense is already ${expense.status.toLowerCase()}`);
      }

      if (expense.wallet.balance < expense.amount) {
        throw new BadRequestException('Insufficient wallet balance to approve this expense');
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const updatedExpense = await tx.expense.update({
          where: { id: expenseId },
          data: { status: ExpenseStatus.APPROVED, approved_by: userId },
        });

        const balanceBefore = expense.wallet.balance;
        const balanceAfter = balanceBefore - expense.amount;

        await tx.walletTransaction.create({
          data: {
            wallet_id: expense.wallet_id,
            transaction_type: WalletTransactionType.DEBIT,
            amount: expense.amount,
            description: `Expense: ${expense.title}`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            recorded_by: userId,
            processed_at: new Date(),
          },
        });

        await tx.wallet.update({
          where: { id: expense.wallet_id },
          data: {
            balance: balanceAfter,
            total_spent_all_time: { increment: expense.amount },
            last_updated: new Date(),
          },
        });

        return updatedExpense;
      });

      return ResponseHelper.success('Expense approved successfully', result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      return ResponseHelper.error('Failed to approve expense', error?.message);
    }
  }

  async reject(schoolId: string, expenseId: string, userId: string) {
    try {
      const expense = await this.prisma.expense.findFirst({
        where: { id: expenseId, school_id: schoolId },
      });

      if (!expense) {
        throw new NotFoundException('Expense not found');
      }

      if (expense.status !== ExpenseStatus.PENDING) {
        throw new BadRequestException(`Expense is already ${expense.status.toLowerCase()}`);
      }

      const updatedExpense = await this.prisma.expense.update({
        where: { id: expenseId },
        data: { status: ExpenseStatus.REJECTED, approved_by: userId },
      });

      return ResponseHelper.success('Expense rejected successfully', updatedExpense);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      return ResponseHelper.error('Failed to reject expense', error?.message);
    }
  }
}
