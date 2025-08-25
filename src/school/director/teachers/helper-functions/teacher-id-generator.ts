import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Generates a unique teacher ID in the format SMHT-YY-XXX
 * where YY is the last 2 digits of the current year
 * and XXX is a sequential number starting from 001
 * 
 * @param prisma - PrismaService instance
 * @returns Promise<string> - Unique teacher ID
 */
export async function generateUniqueTeacherId(prisma: PrismaService): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2); // Get last 2 digits of year
    
    // Find the highest existing teacher ID for this year
    const existingTeachers = await prisma.teacher.findMany({
        where: {
            teacher_id: {
                startsWith: `SMHT-${yearPrefix}-`
            }
        },
        select: {
            teacher_id: true
        },
        orderBy: {
            teacher_id: 'desc'
        },
        take: 1
    });

    let sequenceNumber = 1;
    
    if (existingTeachers.length > 0) {
        // Extract the sequence number from the last teacher ID
        const lastTeacherId = existingTeachers[0].teacher_id;
        const match = lastTeacherId.match(/SMHT-\d{2}-(\d+)/);
        if (match) {
            sequenceNumber = parseInt(match[1]) + 1;
        }
    }

    // Format: SMHT-YY-001, SMHT-YY-002, etc.
    const formattedSequence = sequenceNumber.toString().padStart(3, '0');
    return `SMHT-${yearPrefix}-${formattedSequence}`;
}
