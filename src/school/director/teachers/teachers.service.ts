import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { DayOfWeek, UserStatus } from '@prisma/client';
import * as argon from 'argon2';
import { AddNewTeacherDto } from './teacher.dto';
import { generateStrongPassword } from 'src/shared/helper-functions/password-generator';
import { sendTeacherOnboardEmail } from 'src/common/mailer/send-congratulatory-emails';

@Injectable()
export class TeachersService {
    private readonly logger = new Logger(TeachersService.name);

    constructor(
        private readonly prisma: PrismaService
    ) {}

    // Helper to get current DayOfWeek enum string
    private getCurrentDayOfWeek(): DayOfWeek {
      const dayIndex = new Date().getDay();
      const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
      return days[dayIndex];
    }

    // Helper to get current time in HH:MM format
    private getCurrentTimeHHMM(): string {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    ////////////////////////////////////////////////////// Fetch classes and subjects for teacher creation
    async fetchClassesAndSubjects(dto: { school_id: string }) {
        this.logger.log(colors.cyan("Fetching classes and subjects for teacher creation..."));

        try {
            const { school_id } = dto;

            // Fetch all classes and subjects in parallel
            const [classes, subjects] = await Promise.all([
                this.prisma.class.findMany({
                    where: { schoolId: school_id },
                    select: {
                        id: true,
                        name: true,
                        classTeacherId: true,
                        classTeacher: {
                            select: {
                                id: true,
                                first_name: true,
                                last_name: true
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                }),
                this.prisma.subject.findMany({
                    where: { schoolId: school_id },
                    select: {
                        id: true,
                        name: true,
                        description: true
                    },
                    orderBy: { name: 'asc' }
                })
            ]);

            // Format the response
            const formattedClasses = classes.map(cls => ({
                id: cls.id,
                name: cls.name,
                hasClassTeacher: !!cls.classTeacherId,
                classTeacher: cls.classTeacher ? `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}` : null
            }));

            const formattedSubjects = subjects.map(subject => ({
                id: subject.id,
                name: subject.name,
                description: subject.description
            }));

            return ResponseHelper.success(
                "Classes and subjects fetched successfully",
                {
                    totalClasses: classes.length,
                    totalSubjects: subjects.length,
                    classes: formattedClasses,
                    subjects: formattedSubjects,
                    
                }
            );

        } catch (error) {
            this.logger.error(colors.red("Error fetching classes and subjects: "), error);
            throw error;
        }
    }

    ////////////////////////////////////////////////////// Teachers dashboard
    async fetchTeachersDashboard(dto: { school_id: string }) {
        this.logger.log(colors.cyan("Fetching teacher tab..."));

        try {
            const { school_id } = dto;

            // Get basic stats
            const [totalTeachers, activeTeachers, maleTeachers, femaleTeachers, teachers] = await Promise.all([
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        status: "active"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        gender: "male"
                    }
                }),
                this.prisma.user.count({
                    where: { 
                        school_id,
                        role: "teacher",
                        gender: "female"
                    }
                }),
                this.prisma.user.findMany({
                    where: {
                        school_id,
                        role: "teacher"
                    },
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        display_picture: true,
                        status: true,
                        subjectsTeaching: {
                            include: {
                                subject: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        classesManaging: {
                            select: {
                                name: true
                            }
                        }
                    }
                })
            ]);

            // Get next classes for each teacher
            const teachersWithNextClass = await Promise.all(
                teachers.map(async (teacher) => {
                    const nextClass = await this.prisma.timetableEntry.findFirst({
                        where: {
                            teacher_id: teacher.id,
                            day_of_week: this.getCurrentDayOfWeek(),
                            timeSlot: {
                                startTime: {
                                    gt: this.getCurrentTimeHHMM()
                                }
                            },
                            isActive: true,
                        },
                        orderBy: {
                            timeSlot: { order: 'asc' }
                        },
                        include: {
                            class: {
                                select: {
                                    name: true
                                }
                            },
                            subject: {
                                select: {
                                    name: true
                                }
                            },
                            timeSlot: true,
                        }
                    });

                    return {
                        ...teacher,
                        subjectsTeaching: teacher.subjectsTeaching.map(ts => ts.subject.name),
                        nextClass: nextClass ? {
                            className: nextClass.class.name,
                            subject: nextClass.subject.name,
                            startTime: nextClass.timeSlot.startTime,
                            endTime: nextClass.timeSlot.endTime
                        } : null
                    };
                })
            );

            const formattedResponse = {
                basic_details: {
                    totalTeachers,
                    activeTeachers,
                    maleTeachers,
                    femaleTeachers
                },
                teachers: teachersWithNextClass.map(teacher => ({
                    id: teacher.id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    display_picture: teacher.display_picture,
                    contact: {
                        phone: teacher.phone_number,
                        email: teacher.email
                    },
                    totalSubjects: teacher.subjectsTeaching.length,
                    classTeacher: teacher.classesManaging[0]?.name || 'None',
                    nextClass: teacher.nextClass,
                    status: teacher.status
                }))
            };

            return ResponseHelper.success(
                "Teachers dashboard data fetched successfully",
                formattedResponse
            );

        } catch (error) {
            console.log(colors.red("Error fetching teachers dashboard data: "), error);
            throw error;
        }
    }

    // Add new teacher
    async addNewTeacher(dto: AddNewTeacherDto & { user: any }) {
        const { first_name, last_name, email, phone_number, display_picture, status, subjectsTeaching, classesManaging, password, user } = dto;

        // 1. Validate required fields
        if (!first_name || !last_name || !email || !phone_number) {
            return ResponseHelper.error('Missing required fields', 400);
        }

        // Validate user and get full user data
        this.logger.log(colors.yellow(`User object: ${JSON.stringify(user, null, 2)}`));
        
        if (!user || !user.sub) {
            this.logger.error(colors.red("Invalid user data or missing user ID"));
            return ResponseHelper.error('Invalid user authentication data', 400);
        }

        // Fetch full user data from database
        const fullUser = await this.prisma.user.findFirst({
            where: { id: user.sub },
            select: { id: true, school_id: true, email: true }
        });

        if (!fullUser || !fullUser.school_id) {
            this.logger.error(colors.red("User not found or missing school_id"));
            return ResponseHelper.error('User not found or invalid school data', 400);
        }

        // 2. Check if teacher already exists
        const existing = await this.prisma.user.findFirst({
            where: { email }
        });
        if (existing) {
            this.logger.error(colors.red("A user with this email already exists"));
            return ResponseHelper.error('A user with this email already exists', 409);
        }

        // 3. Generate strong password if not provided
        const generatedPassword = password || generateStrongPassword(first_name, last_name, email, phone_number);
        const hashedPassword = await argon.hash(generatedPassword);

        // 4. Get school name for email
        this.logger.log(colors.cyan(`Creating teacher for school_id: ${fullUser.school_id}`));
        
        const school = await this.prisma.school.findFirst({
            where: { id: fullUser.school_id },
            select: { school_name: true }
        });

        // 5. Create teacher
        const teacher = await this.prisma.user.create({
            data: {
                first_name,
                last_name,
                email,
                phone_number,
                display_picture,
                status: (status as UserStatus) || UserStatus.active,
                role: 'teacher',
                password: hashedPassword,
                school_id: fullUser.school_id
            }
        });

        // 6. Assign subjects
        if (subjectsTeaching && Array.isArray(subjectsTeaching)) {
            for (const subjectId of subjectsTeaching) {
                await this.prisma.teacherSubject.create({
                    data: {
                        teacherId: teacher.id,
                        subjectId: subjectId
                    }
                });
            }
        }

        // 7. Assign classes
        if (classesManaging && Array.isArray(classesManaging)) {
            for (const classId of classesManaging) {
                await this.prisma.class.update({
                    where: { id: classId },
                    data: { classTeacherId: teacher.id }
                });
            }
        }

        // 8. Send congratulatory email to teacher
        try {
            await sendTeacherOnboardEmail({
                firstName: first_name,
                lastName: last_name,
                email,
                phone: phone_number,
                schoolName: school?.school_name || 'Your School'
            });
            this.logger.log(colors.green(`✅ Welcome email sent to teacher: ${email}`));
        } catch (emailError) {
            this.logger.error(colors.red(`❌ Failed to send welcome email to teacher: ${email}`), emailError);
            // Don't fail the entire operation if email fails
        }

        return ResponseHelper.success('Teacher added successfully', { 
            teacher,
            generatedPassword: !password ? generatedPassword : undefined // Only return if auto-generated
        });
    }

    // Get teacher by ID
    async getTeacherById(id: string) {
        try {
            const teacher = await this.prisma.user.findFirst({
                where: { 
                    id,
                    role: 'teacher'
                },
                include: {
                    subjectsTeaching: {
                        include: {
                            subject: true
                        }
                    },
                    classesManaging: true
                }
            });

            if (!teacher) {
                return ResponseHelper.error('Teacher not found', 404);
            }

            return ResponseHelper.success('Teacher details retrieved successfully', teacher);
        } catch (error) {
            console.log(colors.red('Error fetching teacher: '), error);
            throw error;
        }
    }

    // Update teacher
    async updateTeacher(id: string, dto: AddNewTeacherDto) {
        try {
            const { first_name, last_name, email, phone_number, display_picture, status, subjectsTeaching, classesManaging } = dto;

            // Check if teacher exists
            const existingTeacher = await this.prisma.user.findFirst({
                where: { id, role: 'teacher' }
            });

            if (!existingTeacher) {
                return ResponseHelper.error('Teacher not found', 404);
            }

            // Update teacher
            const updatedTeacher = await this.prisma.user.update({
                where: { id },
                data: {
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    display_picture,
                    status: (status as UserStatus) || UserStatus.active
                }
            });

            // Update subject assignments if provided
            if (subjectsTeaching && Array.isArray(subjectsTeaching)) {
                // Remove existing assignments
                await this.prisma.teacherSubject.deleteMany({
                    where: { teacherId: id }
                });

                // Add new assignments
                for (const subjectId of subjectsTeaching) {
                    await this.prisma.teacherSubject.create({
                        data: {
                            teacherId: id,
                            subjectId: subjectId
                        }
                    });
                }
            }

            // Update class assignments if provided
            if (classesManaging && Array.isArray(classesManaging)) {
                // Remove existing class assignments
                await this.prisma.class.updateMany({
                    where: { classTeacherId: id },
                    data: { classTeacherId: null }
                });

                // Add new class assignments
                for (const classId of classesManaging) {
                    await this.prisma.class.update({
                        where: { id: classId },
                        data: { classTeacherId: id }
                    });
                }
            }

            return ResponseHelper.success('Teacher updated successfully', { teacher: updatedTeacher });
        } catch (error) {
            console.log(colors.red('Error updating teacher: '), error);
            throw error;
        }
    }

    // Delete teacher
    async deleteTeacher(id: string) {
        try {
            const teacher = await this.prisma.user.findFirst({
                where: { id, role: 'teacher' }
            });

            if (!teacher) {
                return ResponseHelper.error('Teacher not found', 404);
            }

            // Soft delete - update status to inactive
            await this.prisma.user.update({
                where: { id },
                data: { status: UserStatus.inactive }
            });

            return ResponseHelper.success('Teacher deleted successfully');
        } catch (error) {
            console.log(colors.red('Error deleting teacher: '), error);
            throw error;
        }
    }

    // Get all teachers with pagination
    async getAllTeachers(dto: { page: number; limit: number; status?: string; school_id: string }) {
        try {
            const { page, limit, status, school_id } = dto;
            const skip = (page - 1) * limit;

            const where: any = {
                school_id,
                role: 'teacher'
            };

            if (status) {
                where.status = status;
            }

            const [teachers, total] = await Promise.all([
                this.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        status: true,
                        subjectsTeaching: {
                            include: {
                                subject: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        },
                        classesManaging: {
                            select: {
                                name: true
                            }
                        }
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                this.prisma.user.count({ where })
            ]);

            const formattedTeachers = teachers.map(teacher => ({
                id: teacher.id,
                name: `${teacher.first_name} ${teacher.last_name}`,
                email: teacher.email,
                phone_number: teacher.phone_number,
                status: teacher.status,
                totalSubjects: teacher.subjectsTeaching.length,
                classTeacher: teacher.classesManaging[0]?.name || 'None'
            }));

            return ResponseHelper.success('Teachers list retrieved successfully', {
                teachers: formattedTeachers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.log(colors.red('Error fetching teachers: '), error);
            throw error;
        }
    }

    // Assign subjects to teacher
    async assignSubjects(teacherId: string, subjectIds: string[]) {
        try {
            // Check if teacher exists
            const teacher = await this.prisma.user.findFirst({
                where: { id: teacherId, role: 'teacher' }
            });

            if (!teacher) {
                return ResponseHelper.error('Teacher not found', 404);
            }

            // Remove existing assignments
            await this.prisma.teacherSubject.deleteMany({
                where: { teacherId }
            });

            // Add new assignments
            const assignments: any[] = [];
            for (const subjectId of subjectIds) {
                const assignment = await this.prisma.teacherSubject.create({
                    data: {
                        teacherId,
                        subjectId
                    },
                    include: {
                        subject: true
                    }
                });
                assignments.push(assignment);
            }

            return ResponseHelper.success('Subjects assigned successfully', {
                teacherId,
                assignedSubjects: assignments.map((a: any) => ({
                    id: a.subject.id,
                    name: a.subject.name
                }))
            });
        } catch (error) {
            console.log(colors.red('Error assigning subjects: '), error);
            throw error;
        }
    }

    // Assign class to teacher
    async assignClass(teacherId: string, classId: string) {
        try {
            // Check if teacher exists
            const teacher = await this.prisma.user.findFirst({
                where: { id: teacherId, role: 'teacher' }
            });

            if (!teacher) {
                return ResponseHelper.error('Teacher not found', 404);
            }

            // Check if class exists
            const classRecord = await this.prisma.class.findFirst({
                where: { id: classId }
            });

            if (!classRecord) {
                return ResponseHelper.error('Class not found', 404);
            }

            // Assign class to teacher
            const updatedClass = await this.prisma.class.update({
                where: { id: classId },
                data: { classTeacherId: teacherId }
            });

            return ResponseHelper.success('Class assigned successfully', {
                teacherId,
                classId,
                className: updatedClass.name
            });
        } catch (error) {
            console.log(colors.red('Error assigning class: '), error);
            throw error;
        }
    }
}
