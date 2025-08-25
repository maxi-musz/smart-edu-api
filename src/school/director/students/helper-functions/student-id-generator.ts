import { PrismaService } from 'src/prisma/prisma.service';

export async function generateUniqueStudentId(prisma: PrismaService): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    
    const existingStudents = await prisma.student.findMany({
        where: {
            student_id: {
                startsWith: `STUD/${yearPrefix}/`
            }
        },
        select: {
            student_id: true
        },
        orderBy: {
            student_id: 'desc'
        },
        take: 1
    });

    let sequenceNumber = 1;
    
    if (existingStudents.length > 0) {
        const lastStudentId = existingStudents[0].student_id;
        const match = lastStudentId.match(/STD\/\d{2}\/(\d+)/);
        if (match) {
            sequenceNumber = parseInt(match[1]) + 1;
        }
    }

    const formattedSequence = sequenceNumber.toString().padStart(3, '0');
    return `STD/${yearPrefix}/${formattedSequence}`;
}
