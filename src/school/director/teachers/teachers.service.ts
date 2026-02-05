import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { DayOfWeek, UserStatus, User, Gender } from '@prisma/client';
import * as argon from 'argon2';
import { AddNewTeacherDto, UpdateTeacherDto } from './teacher.dto';
import { generateStrongPassword } from 'src/shared/helper-functions/password-generator';
import { sendTeacherOnboardEmail } from 'src/common/mailer/send-congratulatory-emails';
import { sendAssignmentNotifications, sendSubjectRoleEmail, sendClassManagementEmail } from 'src/common/mailer/send-assignment-notifications';
import { sendDirectorNotifications } from 'src/common/mailer/send-director-notifications';
import { generateUniqueTeacherId } from './helper-functions';
import { AcademicSessionService } from 'src/academic-session/academic-session.service';
import { PushNotificationsService } from 'src/push-notifications/push-notifications.service';

export interface FetchTeachersDashboardDto {
    user: User;
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    gender?: 'male' | 'female';
    class_id?: string;
    sort_by?: 'name' | 'createdAt' | 'status';
    sort_order?: 'asc' | 'desc';
}

@Injectable()
export class TeachersService {
    private readonly logger = new Logger(TeachersService.name);

      constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
    private readonly pushNotificationsService: PushNotificationsService
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

    // Helper method to clean up orphaned users
    private async cleanupOrphanedUsers(email: string) {
        try {
            // Find users with this email that don't have corresponding teacher records
            const orphanedUsers = await this.prisma.user.findMany({
                where: {
                    email,
                    role: 'teacher',
                    teacher: null // No corresponding teacher record
                }
            });

            if (orphanedUsers.length > 0) {
                this.logger.log(colors.yellow(`Found ${orphanedUsers.length} orphaned user(s) for email: ${email}`));
                
                // Delete orphaned users
                await this.prisma.user.deleteMany({
                    where: {
                        id: { in: orphanedUsers.map(u => u.id) }
                    }
                });
                
                this.logger.log(colors.green(`✅ Cleaned up ${orphanedUsers.length} orphaned user(s) for email: ${email}`));
            }
        } catch (error) {
            this.logger.error(colors.red(`❌ Failed to cleanup orphaned users for email: ${email}`), error);
        }
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

            this.logger.log(colors.green(`Total of ${classes.length} classes and ${subjects.length} subjects fetched successfully`));
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
    async fetchTeachersDashboard(dto: FetchTeachersDashboardDto) {
        this.logger.log(colors.cyan("Fetching teacher dashboard for school director..."));

        try {
            const { user, page = 1, limit = 10, search, status, gender, class_id, sort_by, sort_order } = dto;
            const skip = (page - 1) * limit;

            // Get school_id from the user
            const school_id = user.school_id;

            // Log only what frontend is sending
            if (search) {
                this.logger.log(colors.green(`Frontend search: "${search}"`));
            }
            if (status) {
                this.logger.log(colors.green(`Frontend status filter: "${status}"`));
            }
            if (gender) {
                this.logger.log(colors.green(`Frontend gender filter: "${gender}"`));
            }
            if (class_id) {
                this.logger.log(colors.green(`Frontend class filter: "${class_id}"`));
            }
            if (!search && !status && !gender && !class_id) {
                this.logger.log(colors.blue("Frontend fetching all data - no filters"));
            }

            const where: any = {
                school_id: school_id
            };

            if (search) {
                where.OR = [
                    { first_name: { contains: search, mode: 'insensitive' } },
                    { last_name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone_number: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (status) {
                where.status = status;
            }



            if (class_id) {
                where.classesManaging = {
                    some: { id: class_id }
                };
            }

            const orderBy: any = {};
            if (sort_by) {
                orderBy[sort_by] = sort_order === 'desc' ? 'desc' : 'asc';
            } else {
                orderBy.createdAt = 'desc';
            }

            const [totalTeachers, activeTeachers, maleTeachers, femaleTeachers, filteredTeachersCount, teachers] = await Promise.all([
                this.prisma.teacher.count({
                    where: { 
                        school_id: school_id
                    }
                }),
                this.prisma.teacher.count({
                    where: { 
                        school_id: school_id,
                        status: "active"
                    }
                }),
                this.prisma.teacher.count({
                    where: { 
                        school_id: school_id,
                        user: {
                            gender: "male"
                        }
                    }
                }),
                this.prisma.teacher.count({
                    where: { 
                        school_id: school_id,
                        user: {
                            gender: "female"
                        }
                    }
                }),
                this.prisma.teacher.count({
                    where
                }),
                this.prisma.teacher.findMany({
                    where,
                    take: limit,
                    skip,
                    orderBy,
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
                pagination: {
                    total_pages: Math.ceil(filteredTeachersCount / limit),
                    current_page: page,
                    total_results: filteredTeachersCount,
                    results_per_page: limit
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

            this.logger.log(colors.green(`Teachers dashboard data fetched successfully, total of ${totalTeachers} teachers`));
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
    async enrollNewTeacher(dto: AddNewTeacherDto & { user: any }) {
        this.logger.log(colors.cyan("Enrolling new teacher..."));
        const { first_name, last_name, email, phone_number, display_picture, status, subjectsTeaching, classesManaging, password, user, gender } = dto;

        // 1. Validate required fields
        if (!first_name || !last_name || !email || !phone_number) {
            this.logger.error(colors.red("Missing required fields"));
            return ResponseHelper.error('Missing required fields', 400);
        }
        
        if (!user || !user.sub) {
            this.logger.error(colors.red("Invalid user data or missing user ID"));
            return ResponseHelper.error('Invalid user authentication data', 400);
        }

        //Fetch full user data from database
        const loggedInUser = await this.prisma.user.findFirst({
            where: { id: user.sub },
            select: { id: true, school_id: true, email: true, first_name: true, last_name: true }
        });

        if (!loggedInUser || !loggedInUser.school_id) {
            this.logger.error(colors.red("User not found or missing school_id"));
            return ResponseHelper.error('User not found or invalid school data', 400);
        }

        // 2. Clean up any orphaned users from previous failed attempts
        await this.cleanupOrphanedUsers(email);

        // 3. Check if teacher already exists
        const existing = await this.prisma.teacher.findFirst({
            where: { email }
        });
        if (existing) {
            this.logger.error(colors.red("A teacher with this email already exists"));
            return ResponseHelper.error('A teacher with this email already exists', 409);
        }

        // 4. Generate strong password if not provided
        const generatedPassword = password || generateStrongPassword(first_name, last_name, email, phone_number);
        const hashedPassword = await argon.hash(generatedPassword);

        // 5. Get school name for email
        this.logger.log(colors.cyan(`Enrolling new teacher for school_id: ${loggedInUser.school_id}`));
        
        const school = await this.prisma.school.findFirst({
            where: { id: loggedInUser.school_id },
            select: { school_name: true, id: true }
        });

        // 6. Get current academic session
        const currentSessionResponse = await this.academicSessionService.getCurrentSession(loggedInUser.school_id);
        if (!currentSessionResponse.success) {
            return ResponseHelper.error('No current academic session found for the school', 400);
        }
        const currentSession = currentSessionResponse.data;

        // 7. Execute everything in a transaction
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Create a new user 
                const newUser = await tx.user.create({
                    data: {
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        display_picture,
                        status: (status as UserStatus) || UserStatus.active,
                        role: 'teacher',
                        password: hashedPassword,
                        school_id: loggedInUser.school_id
                    }
                });

                // Create teacher
                const teacher = await tx.teacher.create({
                    data: {
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        display_picture,
                        teacher_id: await generateUniqueTeacherId(this.prisma),
                        school_id: loggedInUser.school_id,
                        academic_session_id: currentSession.id,
                        user_id: newUser.id,
                        role: 'teacher',
                        password: hashedPassword,
                        employee_number: null,
                        qualification: null,
                        specialization: null,
                        years_of_experience: null,
                        hire_date: new Date(),
                        salary: null,
                        department: null,
                        is_class_teacher: false,
                        status: (status as UserStatus) || UserStatus.active,
                        gender: gender as Gender
                    }
                });

                // Assign subjects
                if (subjectsTeaching && Array.isArray(subjectsTeaching)) {
                    for (const subjectId of subjectsTeaching) {
                        await tx.teacherSubject.create({
                            data: {
                                teacherId: teacher.id,
                                subjectId: subjectId
                            }
                        });
                    }
                }

                // Assign classes
                if (classesManaging && Array.isArray(classesManaging)) {
                    for (const classId of classesManaging) {
                        await tx.class.update({
                            where: { id: classId },
                            data: { classTeacherId: teacher.id }
                        });
                    }
                }

                return { newUser, teacher };
            });

            // 8. Send congratulatory email to teacher (outside transaction)
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

            // 9. Send assignment notifications if subjects or classes are assigned (outside transaction)
            try {
                const teacherName = `${first_name} ${last_name}`;
                const assignedBy = `${loggedInUser.first_name} ${loggedInUser.last_name}` || 'School Administrator';
                
                // Get subject names for notification
                const subjectNames: string[] = [];
                if (subjectsTeaching && Array.isArray(subjectsTeaching)) {
                    const subjects = await this.prisma.subject.findMany({
                        where: { id: { in: subjectsTeaching } },
                        select: { name: true }
                    });
                    subjectNames.push(...subjects.map(s => s.name));
                }

                // Get class names for notification
                const classNames: string[] = [];
                if (classesManaging && Array.isArray(classesManaging)) {
                    const classes = await this.prisma.class.findMany({
                        where: { id: { in: classesManaging } },
                        select: { name: true }
                    });
                    classNames.push(...classes.map(c => c.name));
                }

                if (subjectNames.length > 0 || classNames.length > 0) {
                    await sendAssignmentNotifications(
                        result.teacher.id,
                        email,
                        teacherName,
                        school?.school_name || 'Your School',
                        assignedBy,
                        subjectNames.length > 0 ? subjectNames : undefined,
                        undefined, // No removed subjects for new teacher
                        classNames.length > 0 ? classNames : undefined,
                        undefined  // No removed classes for new teacher
                    );
                    this.logger.log(colors.green(`✅ Assignment notifications sent to teacher: ${email}`));
                }

                // Send director notifications for new teacher
                try {
                    await sendDirectorNotifications(
                        this.prisma,
                        loggedInUser.school_id,
                        school?.school_name || 'Your School',
                        result.teacher.id,
                        teacherName,
                        email,
                        phone_number,
                        assignedBy,
                        subjectNames.length > 0 ? subjectNames : undefined,
                        undefined, // No removed subjects for new teacher
                        classNames.length > 0 ? classNames : undefined,
                        undefined, // No removed classes for new teacher
                        undefined, // No previous subjects for new teacher
                        undefined, // No previous classes for new teacher
                        true // isNewTeacher flag
                    );
                    this.logger.log(colors.green(`✅ Director notifications sent for new teacher: ${email}`));
                } catch (directorEmailError) {
                    this.logger.error(colors.red(`❌ Failed to send director notifications for new teacher: ${email}`), directorEmailError);
                    // Don't fail the entire operation if director email fails
                }
            } catch (assignmentEmailError) {
                this.logger.error(colors.red(`❌ Failed to send assignment notifications to teacher: ${email}`), assignmentEmailError);
                // Don't fail the entire operation if assignment email fails
            }

            // 8. Send push notification to the new teacher
            try {
              const pushResult = await this.pushNotificationsService.sendNotificationByType({
                title: 'Welcome to SmartEdu!',
                body: `Welcome ${first_name} ${last_name}! You have been successfully enrolled as a teacher.`,
                recipients: [result.newUser.id],
                schoolId: loggedInUser.school_id,
                data: {
                  type: 'teacher_enrollment',
                  teacherId: result.teacher.id,
                  screen: 'TeacherDashboard'
                }
              });

              if (pushResult.success) {
                this.logger.log(colors.green(`✅ Welcome push notification sent to new teacher`));
              } else {
                this.logger.warn(colors.yellow(`⚠️ Welcome push notification failed: ${pushResult.message}`));
              }
            } catch (pushError) {
              this.logger.error(colors.red(`❌ Push notification error: ${pushError.message}`), pushError);
              // Don't fail the enrollment if push fails
            }

            return ResponseHelper.success('Teacher added successfully', { 
                teacher: result.teacher,
                generatedPassword: !password ? generatedPassword : undefined // Only return if auto-generated
            });

        } catch (error) {
            this.logger.error(colors.red(`❌ Failed to create teacher: ${error.message}`), error);
            return ResponseHelper.error(`Failed to create teacher: ${error.message}`, 500);
        }
    }

    // Get teacher by ID
    async getTeacherById(id: string) {
        try {
            const teacher = await this.prisma.teacher.findFirst({
                where: { 
                    id
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
    async updateTeacher(id: string, dto: UpdateTeacherDto, user: any) {
        try {
            this.logger.log(colors.cyan(`Updating teacher with ID: ${id}`));

            // 1. Validate user and get full user data
            if (!user || !user.sub) {
                this.logger.error(colors.red("Invalid user data or missing user ID"));
                return ResponseHelper.error('Invalid user authentication data', 400);
            }

            const fullUser = await this.prisma.user.findFirst({
                where: { id: user.sub },
                select: { id: true, school_id: true, email: true, first_name: true, last_name: true }
            });

            if (!fullUser || !fullUser.school_id) {
                this.logger.error(colors.red("User not found or missing school_id"));
                return ResponseHelper.error('User not found or invalid school data', 400);
            }

            // 2. Check if teacher exists and belongs to the same school
            const existingTeacher = await this.prisma.teacher.findFirst({
                where: { 
                    id,
                    school_id: fullUser.school_id
                    // school_id: fullUser.school_id
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

            if (!existingTeacher) {
                this.logger.error(colors.red(`Teacher not found or doesn't belong to school: ${fullUser.school_id}`));
                return ResponseHelper.error('Teacher not found or access denied', 404);
            }

            // 3. Build update data object with only provided fields
            const updateData: any = {};
            
            if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
            if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
            if (dto.email !== undefined) updateData.email = dto.email;
            if (dto.phone_number !== undefined) updateData.phone_number = dto.phone_number;
            if (dto.display_picture !== undefined) updateData.display_picture = dto.display_picture;
            if (dto.status !== undefined) updateData.status = dto.status as UserStatus;

            // 4. Check if email is being updated and if it's already taken
            if (dto.email && dto.email !== existingTeacher.email) {
                const emailExists = await this.prisma.user.findFirst({
                    where: { 
                        email: dto.email,
                        id: { not: id } // Exclude current teacher
                    }
                });
                
                if (emailExists) {
                    this.logger.error(colors.red(`Email already exists: ${dto.email}`));
                    return ResponseHelper.error('Email already exists', 409);
                }
            }

            // 5. Update teacher with only provided fields
            const updatedTeacher = await this.prisma.teacher.update({
                where: { id },
                data: updateData,
                include: {
                    subjectsTeaching: {
                        include: {
                            subject: true
                        }
                    },
                    classesManaging: true
                }
            });

            // 6. Update subject assignments if provided
            let subjectsToAdd: string[] = [];
            let subjectsToRemove: string[] = [];
            
            if (dto.subjectsTeaching && Array.isArray(dto.subjectsTeaching)) {
                this.logger.log(colors.cyan(`Updating subject assignments for teacher: ${id}`));
                
                // Get existing subject assignments
                const existingSubjects = await this.prisma.teacherSubject.findMany({
                    where: { teacherId: id },
                    select: { subjectId: true }
                });
                
                const existingSubjectIds = existingSubjects.map(ts => ts.subjectId);
                const newSubjectIds = dto.subjectsTeaching;
                
                // Find subjects to add (new ones not in existing)
                subjectsToAdd = newSubjectIds.filter(subjectId => !existingSubjectIds.includes(subjectId));
                
                // Find subjects to remove (existing ones not in new list)
                subjectsToRemove = existingSubjectIds.filter(subjectId => !newSubjectIds.includes(subjectId));
                
                // Add new subject assignments
                if (subjectsToAdd.length > 0) {
                    this.logger.log(colors.cyan(`Adding ${subjectsToAdd.length} new subject assignments`));
                    for (const subjectId of subjectsToAdd) {
                        await this.prisma.teacherSubject.create({
                            data: {
                                teacherId: id,
                                subjectId: subjectId
                            }
                        });
                    }
                }
                
                // Remove subject assignments that are no longer needed
                if (subjectsToRemove.length > 0) {
                    this.logger.log(colors.cyan(`Removing ${subjectsToRemove.length} subject assignments`));
                    await this.prisma.teacherSubject.deleteMany({
                        where: {
                            teacherId: id,
                            subjectId: { in: subjectsToRemove }
                        }
                    });
                }
            }

            // 7. Update class assignments if provided
            let classesToAdd: string[] = [];
            let classesToRemove: string[] = [];
            
            if (dto.classesManaging && Array.isArray(dto.classesManaging)) {
                this.logger.log(colors.cyan(`Updating class assignments for teacher: ${id}`));
                
                // Get existing class assignments
                const existingClasses = await this.prisma.class.findMany({
                    where: { classTeacherId: id },
                    select: { id: true }
                });
                
                const existingClassIds = existingClasses.map(c => c.id);
                const newClassIds = dto.classesManaging;
                
                // Find classes to add (new ones not in existing)
                classesToAdd = newClassIds.filter(classId => !existingClassIds.includes(classId));
                
                // Find classes to remove (existing ones not in new list)
                classesToRemove = existingClassIds.filter(classId => !newClassIds.includes(classId));
                
                // Add new class assignments
                if (classesToAdd.length > 0) {
                    this.logger.log(colors.cyan(`Adding ${classesToAdd.length} new class assignments`));
                    for (const classId of classesToAdd) {
                        await this.prisma.class.update({
                            where: { id: classId },
                            data: { classTeacherId: id }
                        });
                    }
                }
                
                // Remove class assignments that are no longer needed
                if (classesToRemove.length > 0) {
                    this.logger.log(colors.cyan(`Removing ${classesToRemove.length} class assignments`));
                    await this.prisma.class.updateMany({
                        where: {
                            id: { in: classesToRemove },
                            classTeacherId: id
                        },
                        data: { classTeacherId: null }
                    });
                }
            }

            // Send assignment notifications if there are changes
            try {
                const teacherName = `${updatedTeacher.first_name} ${updatedTeacher.last_name}`;
                const assignedBy = `${fullUser.first_name} ${fullUser.last_name}` || 'School Administrator';
                
                // Get subject names for new assignments
                const newSubjectNames: string[] = [];
                if (subjectsToAdd && subjectsToAdd.length > 0) {
                    const subjects = await this.prisma.subject.findMany({
                        where: { id: { in: subjectsToAdd } },
                        select: { name: true }
                    });
                    newSubjectNames.push(...subjects.map(s => s.name));
                }

                // Get subject names for removed assignments
                const removedSubjectNames: string[] = [];
                if (subjectsToRemove && subjectsToRemove.length > 0) {
                    const subjects = await this.prisma.subject.findMany({
                        where: { id: { in: subjectsToRemove } },
                        select: { name: true }
                    });
                    removedSubjectNames.push(...subjects.map(s => s.name));
                }

                // Get class names for new assignments
                const newClassNames: string[] = [];
                if (classesToAdd && classesToAdd.length > 0) {
                    const classes = await this.prisma.class.findMany({
                        where: { id: { in: classesToAdd } },
                        select: { name: true }
                    });
                    newClassNames.push(...classes.map(c => c.name));
                }

                // Get class names for removed assignments
                const removedClassNames: string[] = [];
                if (classesToRemove && classesToRemove.length > 0) {
                    const classes = await this.prisma.class.findMany({
                        where: { id: { in: classesToRemove } },
                        select: { name: true }
                    });
                    removedClassNames.push(...classes.map(c => c.name));
                }

                // Get school name
                const school = await this.prisma.school.findFirst({
                    where: { id: fullUser.school_id },
                    select: { school_name: true }
                });

                // Get previous assignments for director notification
                const previousSubjectNames: string[] = [];
                const previousClassNames: string[] = [];
                
                if (existingTeacher.subjectsTeaching.length > 0) {
                    previousSubjectNames.push(...existingTeacher.subjectsTeaching.map(ts => ts.subject.name));
                }
                
                if (existingTeacher.classesManaging.length > 0) {
                    previousClassNames.push(...existingTeacher.classesManaging.map(c => c.name));
                }

                if (newSubjectNames.length > 0 || removedSubjectNames.length > 0 || 
                    newClassNames.length > 0 || removedClassNames.length > 0) {
                    await sendAssignmentNotifications(
                        id,
                        updatedTeacher.email,
                        teacherName,
                        school?.school_name || 'Your School',
                        assignedBy,
                        newSubjectNames.length > 0 ? newSubjectNames : undefined,
                        removedSubjectNames.length > 0 ? removedSubjectNames : undefined,
                        newClassNames.length > 0 ? newClassNames : undefined,
                        removedClassNames.length > 0 ? removedClassNames : undefined
                    );
                    this.logger.log(colors.green(`✅ Assignment update notifications sent to teacher: ${updatedTeacher.email}`));
                }

                // Send director notifications for assignment changes
                try {
                    await sendDirectorNotifications(
                        this.prisma,
                        fullUser.school_id,
                        school?.school_name || 'Your School',
                        id,
                        teacherName,
                        updatedTeacher.email,
                        updatedTeacher.phone_number,
                        assignedBy,
                        newSubjectNames.length > 0 ? newSubjectNames : undefined,
                        removedSubjectNames.length > 0 ? removedSubjectNames : undefined,
                        newClassNames.length > 0 ? newClassNames : undefined,
                        removedClassNames.length > 0 ? removedClassNames : undefined,
                        previousSubjectNames.length > 0 ? previousSubjectNames : undefined,
                        previousClassNames.length > 0 ? previousClassNames : undefined,
                        false // isNewTeacher flag
                    );
                    this.logger.log(colors.green(`✅ Director notifications sent for teacher assignment changes: ${updatedTeacher.email}`));
                } catch (directorEmailError) {
                    this.logger.error(colors.red(`❌ Failed to send director notifications for teacher assignment changes: ${updatedTeacher.email}`), directorEmailError);
                    // Don't fail the entire operation if director email fails
                }
            } catch (assignmentEmailError) {
                this.logger.error(colors.red(`❌ Failed to send assignment update notifications to teacher: ${updatedTeacher.email}`), assignmentEmailError);
                // Don't fail the entire operation if assignment email fails
            }

            this.logger.log(colors.green(`✅ Teacher updated successfully: ${id}`));
            return ResponseHelper.success('Teacher updated successfully', { 
                assignmentChanges: {
                    subjects: {
                        added: subjectsToAdd?.length || 0,
                        removed: subjectsToRemove?.length || 0
                    },
                    classes: {
                        added: classesToAdd?.length || 0,
                        removed: classesToRemove?.length || 0
                    }
                },
                teacher: updatedTeacher,
                updatedFields: Object.keys(updateData),
                updatedAssignments: {
                    subjects: dto.subjectsTeaching ? 'updated' : 'unchanged',
                    classes: dto.classesManaging ? 'updated' : 'unchanged'
                },
                
            });

        } catch (error) {
            this.logger.error(colors.red('Error updating teacher: '), error);
            throw error;
        }
    }

    // Delete teacher
    async deleteTeacher(id: string) {
        this.logger.log(colors.cyan(`Deleting teacher: ${id}`));
        try {
            // id coming from the route may be either the Teacher.id or the User.id.
            // We resolve the actual teacher record first, including its linked user.
            const teacher = await this.prisma.teacher.findFirst({
                where: {
                    OR: [
                        { id },           // treat as Teacher.id
                        { user_id: id },  // treat as User.id
                    ],
                },
                include: {
                    user: true,
                },
            });

            if (!teacher) {
                this.logger.error(colors.red(`Teacher not found: ${id}`));
                return ResponseHelper.error('Teacher not found', 404);
            }

            // hard delete the teacher, remove any assinged subjects to the teacher and remove the teacher from any class they are managing, this should be a prisma tx, all should pass or all should fail
            await this.prisma.$transaction(async (tx) => {
                const teacherId = teacher.id;
                const userId = teacher.user_id;

                // Remove subject assignments
                await tx.teacherSubject.deleteMany({ where: { teacherId } });

                // Detach from any classes they manage
                await tx.class.updateMany({
                    where: { classTeacherId: teacherId },
                    data: { classTeacherId: null },
                });

                // Delete teacher record
                await tx.teacher.delete({ where: { id: teacherId } });

                // Delete linked user account
                await tx.user.delete({ where: { id: userId } });
            });

            this.logger.log(colors.green(`Teacher deleted successfully: ${id}`));
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
                school_id
            };

            if (status) {
                where.status = status;
            }

            const [teachers, total] = await Promise.all([
                this.prisma.teacher.findMany({
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
                this.prisma.teacher.count({ where })
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
                where: { id: teacherId, role: 'teacher' },
                include: {
                    school: {
                        select: { school_name: true }
                    }
                }
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

            // Send teaching role notification
            try {
                const teacherName = `${teacher.first_name} ${teacher.last_name}`;
                const subjectNames = assignments.map(a => a.subject.name);
                
                await sendSubjectRoleEmail({
                    teacherName,
                    teacherEmail: teacher.email,
                    schoolName: teacher.school.school_name,
                    subjects: subjectNames,
                    assignedBy: 'School Administrator'
                });
                
                this.logger.log(colors.green(`✅ Teaching role notification sent to teacher: ${teacher.email}`));
            } catch (emailError) {
                this.logger.error(colors.red(`❌ Failed to send teaching role notification to teacher: ${teacher.email}`), emailError);
                // Don't fail the operation if email fails
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
                where: { id: teacherId, role: 'teacher' },
                include: {
                    school: {
                        select: { school_name: true }
                    }
                }
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

            // Send class management notification
            try {
                const teacherName = `${teacher.first_name} ${teacher.last_name}`;
                
                await sendClassManagementEmail({
                    teacherName,
                    teacherEmail: teacher.email,
                    schoolName: teacher.school.school_name,
                    classes: [updatedClass.name],
                    assignedBy: 'School Administrator'
                });
                
                this.logger.log(colors.green(`✅ Class management notification sent to teacher: ${teacher.email}`));
            } catch (emailError) {
                this.logger.error(colors.red(`❌ Failed to send class management notification to teacher: ${teacher.email}`), emailError);
                // Don't fail the operation if email fails
            }

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

    ////////////////////////////////////////////////////////////////////////// FETCH TEACHER CLASSES AND SUBJECTS
    // GET - /api/v1/director/teachers/:id/classes-subjects
    async fetchTeacherClassesAndSubjects(teacherId: string, user: User) {
        this.logger.log(colors.cyan(`Fetching classes and subjects for teacher: ${teacherId}`));

        try {
            // Verify the teacher exists and belongs to the same school
            const teacher = await this.prisma.teacher.findFirst({
                where: {
                    OR: [
                        { id: teacherId }, // Try as Teacher ID first
                        { user_id: teacherId } // Try as User ID
                    ],
                    school_id: user.school_id
                },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    display_picture: true,
                    user_id: true
                }
            });

            this.logger.log(colors.magenta(`Teacher ID: ${teacher?.id}`));

            if (!teacher) {
                this.logger.error(colors.red(`Teacher not found or doesn't belong to school: ${user.school_id}`));
                return ResponseHelper.error('Teacher not found or access denied', 404);
            }

            // Use the actual teacher ID for subsequent queries
            const actualTeacherId = teacher.id;

            // Fetch teacher's assigned subjects
            const assignedSubjects = await this.prisma.teacherSubject.findMany({
                where: { teacherId: actualTeacherId },
                include: {
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            color: true,
                            description: true,
                            classId: true,
                            Class: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    subject: {
                        name: 'asc'
                    }
                }
            });

            // Fetch teacher's managed classes
            const managedClasses = await this.prisma.class.findMany({
                where: { classTeacherId: actualTeacherId },
                select: {
                    id: true,
                    name: true,
                    _count: {
                        select: {
                            students: true,
                            subjects: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });

            // Get all available subjects (excluding the ones teacher is already assigned to)
            const allSubjects = await this.prisma.subject.findMany({
                where: {
                    schoolId: user.school_id,
                    id: {
                        notIn: assignedSubjects.map(ts => ts.subject.id)
                    }
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                    color: true,
                    description: true,
                    classId: true,
                    Class: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });

            // Get all available classes (excluding the ones teacher is already managing)
            const allClasses = await this.prisma.class.findMany({
                where: {
                    schoolId: user.school_id,
                    id: {
                        notIn: managedClasses.map(cls => cls.id)
                    }
                },
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
                    },
                    _count: {
                        select: {
                            students: true,
                            subjects: true
                        }
                    }
                },
                orderBy: { name: 'asc' }
            });

            this.logger.log(colors.green(`Successfully fetched data for teacher: ${teacher.first_name} ${teacher.last_name}`));

            return ResponseHelper.success(
                'Teacher classes and subjects fetched successfully',
                {
                    teacher: {
                        id: teacher.id,
                        name: `${teacher.first_name} ${teacher.last_name}`,
                        email: teacher.email,
                        display_picture: teacher.display_picture
                    },
                    assigned_subjects: assignedSubjects.map(ts => ({
                        id: ts.subject.id,
                        name: ts.subject.name,
                        code: ts.subject.code,
                        color: ts.subject.color,
                        description: ts.subject.description,
                        assigned_class: ts.subject.Class ? {
                            id: ts.subject.Class.id,
                            name: ts.subject.Class.name
                        } : null
                    })),
                    managed_classes: managedClasses.map(cls => ({
                        id: cls.id,
                        name: cls.name,
                        student_count: cls._count.students,
                        subject_count: cls._count.subjects
                    })),
                    available_subjects: allSubjects.map(subject => ({
                        id: subject.id,
                        name: subject.name,
                        code: subject.code,
                        color: subject.color,
                        description: subject.description,
                        assigned_class: subject.Class ? {
                            id: subject.Class.id,
                            name: subject.Class.name
                        } : null
                    })),
                    available_classes: allClasses.map(cls => ({
                        id: cls.id,
                        name: cls.name,
                        has_class_teacher: !!cls.classTeacherId,
                        class_teacher: cls.classTeacher ? `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}` : null,
                        student_count: cls._count.students,
                        subject_count: cls._count.subjects
                    })),
                    summary: {
                        total_assigned_subjects: assignedSubjects.length,
                        total_managed_classes: managedClasses.length,
                        total_available_subjects: allSubjects.length,
                        total_available_classes: allClasses.length
                    }
                }
            );

        } catch (error) {
            this.logger.error(colors.red(`Error fetching teacher classes and subjects: ${error.message}`));
            return ResponseHelper.error(
                'Failed to fetch teacher classes and subjects',
                null
            );
        }
    }
}
