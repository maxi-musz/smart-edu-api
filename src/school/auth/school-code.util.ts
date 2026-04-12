import { PrismaService } from 'src/prisma/prisma.service';

/** Exactly 6 digits, zero-padded (000000–999999). */
export function randomSixDigitCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

/** Allocate a unique `School.school_code` value. */
export async function allocateUniqueSchoolCode(
  prisma: Pick<PrismaService, 'school'>,
): Promise<string> {
  for (let i = 0; i < 80; i++) {
    const code = randomSixDigitCode();
    const taken = await prisma.school.findFirst({
      where: { school_code: code },
      select: { id: true },
    });
    if (!taken) {
      return code;
    }
  }
  throw new Error('Could not allocate a unique 6-digit school code');
}
