import { PrismaService } from 'src/prisma/prisma.service';

export async function generateUniqueStudentId(prisma: PrismaService): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    
    // Get the highest sequence number for the current year
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
        const match = lastStudentId.match(/STUD\/\d{2}\/(\d+)/);
        if (match) {
            sequenceNumber = parseInt(match[1]) + 1;
        }
    }

    // Generate the student ID
    const formattedSequence = sequenceNumber.toString().padStart(3, '0');
    const studentId = `STUD/${yearPrefix}/${formattedSequence}`;

    // Double-check uniqueness to prevent race conditions
    const existingStudent = await prisma.student.findUnique({
        where: { student_id: studentId }
    });

    if (existingStudent) {
        // If ID already exists, try the next sequence number
        const retrySequence = sequenceNumber + 1;
        const retryFormattedSequence = retrySequence.toString().padStart(3, '0');
        return `STUD/${yearPrefix}/${retryFormattedSequence}`;
    }

    return studentId;
}
