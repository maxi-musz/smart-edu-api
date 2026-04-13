import { FINANCE_CONSTANTS } from './finance.constants';

export function nairaToKobo(amount: number): number {
  return Math.round(amount * FINANCE_CONSTANTS.KOBO_MULTIPLIER);
}

export function koboToNaira(amount: number): number {
  return amount / FINANCE_CONSTANTS.KOBO_MULTIPLIER;
}

export function generateReceiptNumber(
  schoolCode: string,
  sequentialNumber: number,
): string {
  const year = new Date().getFullYear();
  const seq = String(sequentialNumber).padStart(6, '0');
  return `${FINANCE_CONSTANTS.RECEIPT_PREFIX}-${schoolCode}-${year}-${seq}`;
}

export function generatePaystackReference(prefix = 'PSK'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
}

export function normalizePagination(
  page?: number,
  limit?: number,
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, page || FINANCE_CONSTANTS.PAGINATION_DEFAULT_PAGE);
  const l = Math.min(
    FINANCE_CONSTANTS.PAGINATION_MAX_LIMIT,
    Math.max(1, limit || FINANCE_CONSTANTS.PAGINATION_DEFAULT_LIMIT),
  );
  return { page: p, limit: l, skip: (p - 1) * l };
}
