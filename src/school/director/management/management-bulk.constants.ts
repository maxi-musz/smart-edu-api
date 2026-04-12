/**
 * Max students per promote/demote/assign/preview HTTP request.
 * Keeps Prisma transactions and payloads bounded; align web chunking with this value.
 */
export const MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST = 400;
