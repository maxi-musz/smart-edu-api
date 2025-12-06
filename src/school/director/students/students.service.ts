import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { AcademicTerm, UserStatus, User, DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { AddStudentToClassDto, EnrollNewStudentDto, UpdateStudentDto } from './dto/auth.dto';
import { ApiResponse } from '../../../shared/helper-functions/response';
import { generateUniqueStudentId } from './helper-functions';
import * as argon from 'argon2';
import { generateStrongPassword } from '../../../shared/helper-functions/password-generator';
import { sendNewStudentEnrollmentNotification, sendStudentWelcomeEmail, sendClassTeacherNotification } from '../../../common/mailer/send-enrollment-notifications';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';

export interface FetchStudentsDashboardDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    class_id?: string;
    sort_by?: 'cgpa' | 'position' | 'name' | 'createdAt';
    sort_order?: 'asc' | 'desc';
}

interface StudentPerformance {
    cgpa: number;
    term_average: number;
    improvement_rate: number;
    attendance_rate: number;
    position: number;
}

interface StudentWithDetails extends User {
    student_id: string;
    current_class: string;
    next_class: string;
    next_class_time: string | null;
    next_class_teacher: string | null;
    performance: StudentPerformance;
}

@Injectable()
export class StudentsService {
    private readonly logger = new Logger(StudentsService.name);
    constructor(
        private prisma: PrismaService,
        private readonly academicSessionService: AcademicSessionService
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

    private async calculatePerformanceMetrics(studentId: string, classId: string): Promise<Omit<StudentPerformance, 'position'>> {
        const performances = await this.prisma.studentPerformance.findMany({
            where: { 
                student_id: studentId,
                class_id: classId
            },
            orderBy: [
                { year: 'desc' },
                { term: 'desc' }
            ],
            take: 3 // Last 3 terms
        });

        if (performances.length === 0) {
            return {
                cgpa: 0,
                term_average: 0,
                improvement_rate: 0,
                attendance_rate: 0
            };
        }

        const cgpa = Number((performances.reduce((sum, perf) => 
            sum + (perf.total_score / perf.max_score), 0) / performances.length * 4).toFixed(2));

        const termAverage = Number((performances[0].total_score / performances[0].max_score * 100).toFixed(2));
        
        // Calculate improvement rate (comparing current term with previous term)
        const improvementRate = performances.length > 1 ? 
            Number((((performances[0].total_score / performances[0].max_score) - 
                    (performances[1].total_score / performances[1].max_score)) * 100).toFixed(2)) : 0;

        return {
            cgpa,
            term_average: termAverage,
            improvement_rate: improvementRate,
            attendance_rate: 0 // TODO: Implement attendance tracking
        };
    }

    private async calculateClassPosition(classId: string, studentId: string, currentSession?: any): Promise<number> {
        // If no session provided, fetch it (fallback for other calls)
        if (!currentSession) {
            const school = await this.prisma.school.findFirst({
                where: {
                    classes: {
                        some: { id: classId }
                    }
                },
                select: {
                    id: true
                }
            });

            if (!school) return 0;

            const currentSessionResponse = await this.academicSessionService.getCurrentSession(school.id);
            if (!currentSessionResponse.success) {
                return 0;
            }
            currentSession = currentSessionResponse.data;
        }
        const termNumber = currentSession.term === AcademicTerm.first ? 1 :
                          currentSession.term === AcademicTerm.second ? 2 : 3;

        const performances = await this.prisma.studentPerformance.findMany({
            where: {
                class_id: classId,
                year: currentSession.start_year,
                term: termNumber
            },
            orderBy: {
                total_score: 'desc'
            }
        });

        const position = performances.findIndex(p => p.student_id === studentId) + 1;
        return position || 0;
    }

    async fetchStudentsDashboard(schoolId: string, dto: FetchStudentsDashboardDto = {}) {
        this.logger.log(colors.cyan("Fetching students dashboard data"));
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            class_id,
            sort_by = 'createdAt',
            sort_order = 'desc'
        } = dto;

        // Log only what frontend is sending
        if (search) {
            this.logger.log(colors.green(`Frontend search: "${search}"`));
        }
        if (status) {
            this.logger.log(colors.green(`Frontend status filter: "${status}"`));
        }
        if (class_id) {
            this.logger.log(colors.green(`Frontend class filter: "${class_id}"`));
        }
        if (!search && !status && !class_id) {
            this.logger.log(colors.blue("Frontend fetching all data - no filters"));
        }

        // 🚀 FIX: Get current session ONCE and reuse it to prevent N+1 queries
        const currentSessionResponse = await this.academicSessionService.getCurrentSession(schoolId);
        const currentSession = currentSessionResponse.success ? currentSessionResponse.data : null;

        const skip = (page - 1) * limit;

        // Basic details
        const totalStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student"
            }
        });

        this.logger.log(colors.blue(`Total students: ${totalStudents}`));

        const activeStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student",
                status: "active"
            }
        });

        // Students list with pagination, filtering, and sorting
        const students = await this.prisma.user.findMany({
            where: {
                school_id: schoolId,
                role: "student",
                ...(status && { status }),
                ...(class_id && {
                    student: {
                        current_class_id: class_id
                    }
                }),
                ...(search && {
                    OR: [
                        { first_name: { contains: search, mode: 'insensitive' } },
                        { last_name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                })
            },
            include: {
                student: {
                    include: {
                        current_class: true
                    }
                }
            },
            orderBy: {
                [sort_by === 'name' ? 'first_name' : sort_by]: sort_order
            },
            skip,
            take: limit
        });

        // Get next class and performance metrics for each student
        const studentsWithDetails: StudentWithDetails[] = await Promise.all(students.map(async (student) => {
            const currentClass = student.student?.current_class;
            if (!currentClass) {
                return {
                    ...student,
                    student_id: `smh/${new Date().getFullYear()}/${String(student.id).padStart(3, '0')}`,
                    current_class: 'Not Enrolled',
                    next_class: 'No classes',
                    next_class_time: null,
                    next_class_teacher: null,
                    performance: {
                        cgpa: 0,
                        term_average: 0,
                        improvement_rate: 0,
                        attendance_rate: 0,
                        position: 0
                    }
                } as StudentWithDetails;
            }

            const nextClass = await this.prisma.timetableEntry.findFirst({
                where: {
                    class_id: currentClass.id,
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
                    subject: true,
                    teacher: {
                      select: {
                        first_name: true,
                        last_name: true
                      }
                    },
                    timeSlot: true
                },
            });

            return {
                ...student,
                student_id: `smh/${new Date().getFullYear()}/${String(student.id).padStart(3, '0')}`,
                current_class: currentClass.name,
                next_class: nextClass?.subject.name || 'No classes',
                next_class_time: nextClass?.timeSlot.startTime || null,
                next_class_teacher: nextClass ? `${nextClass.teacher.first_name} ${nextClass.teacher.last_name}` : null,
                performance: {
                    ...(await this.calculatePerformanceMetrics(student.id, currentClass.id)),
                    position: await this.calculateClassPosition(currentClass.id, student.id, currentSession)
                }
            };
        }));

        // Fetch available classes for the school
        const availableClasses = await this.prisma.class.findMany({
            where: { schoolId },
            select: {
                id: true,
                name: true,
                classTeacherId: true,
                classTeacher: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        students: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        this.logger.log(colors.blue("Students dashboard data fetched successfully"));
        return ResponseHelper.success(
            "Students dashboard data fetched successfully",
            {
                basic_details: {
                    totalStudents,
                    activeStudents,
                    totalClasses: await this.prisma.class.count({ where: { schoolId } })
                },
                pagination: {
                    total_pages: Math.ceil(totalStudents / limit),
                    current_page: page,
                    total_results: totalStudents,
                    results_per_page: limit
                },
                
                available_classes: availableClasses.map(cls => ({
                    id: cls.id,
                    name: cls.name,
                    class_teacher: cls.classTeacher ? {
                        id: cls.classTeacher.id,
                        name: `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}`,
                        email: cls.classTeacher.email
                    } : null,
                    student_count: cls._count.students
                })),
                students: studentsWithDetails,
            }
        );
    }

    // Other methods for student management

    async addStudentToClass(user: User, dto: AddStudentToClassDto) {
        this.logger.log(colors.cyan(`Adding student to class - Student: ${dto.student_id}, Class: ${dto.class_id}`));
    
        try {
          // Verify that the teacher is managing the class
          const managedClass = await this.prisma.class.findFirst({
            where: {
              id: dto.class_id,
              classTeacherId: user.id,
              schoolId: user.school_id
            }
          });
    
          if (!managedClass) {
            this.logger.log(colors.red(`Teacher is not managing class: ${dto.class_id}`));
            return new ApiResponse(false, 'You can only add students to classes you manage', null);
          }
    
          // Verify that the student exists and belongs to the same school
          const student = await this.prisma.user.findFirst({
            where: {
              id: dto.student_id,
              role: 'student',
              school_id: user.school_id
            }
          });
    
          if (!student) {
            this.logger.log(colors.red(`Student not found: ${dto.student_id}`));
            return new ApiResponse(false, 'Student not found or does not belong to your school', null);
          }
    
          // Check if student is already enrolled in this class
          const existingEnrollment = await this.prisma.student.findFirst({
            where: {
              user_id: dto.student_id,
              current_class_id: dto.class_id
            }
          });
    
          if (existingEnrollment) {
            this.logger.log(colors.yellow(`Student already enrolled in class: ${dto.class_id}`));
            return new ApiResponse(false, 'Student is already enrolled in this class', null);
          }
    
          // Add student to the class
          const updatedStudent = await this.prisma.student.update({
            where: {
              user_id: dto.student_id
            },
            data: {
              current_class_id: dto.class_id
            },
            include: {
              current_class: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
    
          this.logger.log(colors.green(`Student ${student.first_name} ${student.last_name} added to class ${managedClass.name} successfully`));
    
          return new ApiResponse(
            true,
            `Student ${student.first_name} ${student.last_name} added to class ${managedClass.name} successfully`,
            {
              student: {
                id: updatedStudent.user_id,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email
              },
              class: {
                id: managedClass.id,
                name: managedClass.name
              },
              enrolled_class: updatedStudent.current_class
            }
          );
    
        } catch (error) {
          this.logger.error(colors.red(`Error adding student to class: ${error.message}`));
          return new ApiResponse(false, 'Failed to add student to class', null);
        }
      }
    
      ////////////////////////////////////////////////////////////////////////// FETCH ALL AVAILABLE CLASSES
      // GET - /api/v1/teachers/available-classes
      async getAvailableClasses(user: User) {
        this.logger.log(colors.cyan(`Fetching available classes for teacher: ${user.email}`));
    
        try {
          // Fetch all classes in the school with their class teachers
          const availableClasses = await this.prisma.class.findMany({
            where: {
              schoolId: user.school_id
            },
            include: {
              classTeacher: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  display_picture: true
                }
              },
              _count: {
                select: {
                  students: true,
                  subjects: true
                }
              }
            },
            orderBy: {
              name: 'asc'
            }
          });
    
          // Format the response
          const formattedClasses = availableClasses.map(cls => ({
            id: cls.id,
            name: cls.name,
            class_teacher: cls.classTeacher ? {
              id: cls.classTeacher.id,
              name: `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}`,
              email: cls.classTeacher.email,
              display_picture: cls.classTeacher.display_picture
            } : null,
            student_count: cls._count.students,
            subject_count: cls._count.subjects
          }));
    
          this.logger.log(colors.green(`Found ${formattedClasses.length} available classes`));
    
          return new ApiResponse(
            true,
            'Available classes fetched successfully',
            {
              classes: formattedClasses,
              summary: {
                total_classes: formattedClasses.length,
                classes_with_teachers: formattedClasses.filter(cls => cls.class_teacher !== null).length,
                classes_without_teachers: formattedClasses.filter(cls => cls.class_teacher === null).length
              }
            }
          );
    
        } catch (error) {
          this.logger.error(colors.red(`Error fetching available classes: ${error.message}`));
          return new ApiResponse(false, 'Failed to fetch available classes', null);
        }
      }

      // Enroll existing student to a class
      async enrollStudentToClass(user: User, dto: AddStudentToClassDto) {
        this.logger.log(colors.cyan(`Enrolling student to class - Student: ${dto.student_id}, Class: ${dto.class_id}`));

        try {
          // Verify that the teacher is managing the class
          const managedClass = await this.prisma.class.findFirst({
            where: {
              id: dto.class_id,
              classTeacherId: user.id,
              schoolId: user.school_id
            }
          });

          if (!managedClass) {
            this.logger.log(colors.red(`Teacher is not managing class: ${dto.class_id}`));
            return new ApiResponse(false, 'You can only enroll students to classes you manage', null);
          }

          // Verify that the student exists and belongs to the same school
          const student = await this.prisma.user.findFirst({
            where: {
              id: dto.student_id,
              role: 'student',
              school_id: user.school_id
            }
          });

          if (!student) {
            this.logger.log(colors.red(`Student not found: ${dto.student_id}`));
            return new ApiResponse(false, 'Student not found or does not belong to your school', null);
          }

          // Check if student is already enrolled in this class
          const existingEnrollment = await this.prisma.student.findFirst({
            where: {
              user_id: dto.student_id,
              current_class_id: dto.class_id
            }
          });

          if (existingEnrollment) {
            this.logger.log(colors.yellow(`Student already enrolled in class: ${dto.class_id}`));
            return new ApiResponse(false, 'Student is already enrolled in this class', null);
          }

          // Enroll student to the class
          const updatedStudent = await this.prisma.student.update({
            where: {
              user_id: dto.student_id
            },
            data: {
              current_class_id: dto.class_id
            }
          });

          this.logger.log(colors.green(`Student ${student.first_name} ${student.last_name} enrolled in class ${managedClass.name} successfully`));

          return new ApiResponse(true, 'Student enrolled in class successfully', {
            student: {
              id: updatedStudent.user_id,
              name: `${student.first_name} ${student.last_name}`,
            }
          });
        } catch (error) {
          this.logger.error(colors.red(`Error enrolling student to class: ${error.message}`));
          return new ApiResponse(false, 'Failed to enroll student to class', null);
        }
      }

      // Enroll a completely new student
      async enrollNewStudent(user: User, dto: EnrollNewStudentDto) {
        this.logger.log(colors.blue(`Enrolling new student, Dto: ${JSON.stringify(dto)}`));

        try {
          // 1. Validate required fields
          if (!dto.first_name || !dto.last_name || !dto.email || !dto.phone_number) {
            return new ApiResponse(false, 'Missing required fields', null);
          }

          // 2. Get full user data with school_id
          const fullUser = await this.prisma.user.findFirst({
            where: { id: user.id },
            select: { id: true, school_id: true, first_name: true, last_name: true }
          });

          if (!fullUser || !fullUser.school_id) {
            this.logger.error(colors.red("User not found or missing school_id"));
            return new ApiResponse(false, 'User not found or invalid school data', 400);
          }

          // 3. Check if student already exists
          const existingStudent = await this.prisma.user.findFirst({
            where: { email: dto.email }
          });
          if (existingStudent) {
            this.logger.error(colors.red("A student with this email already exists"));
            return new ApiResponse(false, 'A student with this email already exists', 409);
          }

          // 4. Verify class exists and belongs to the school (only if class_id is provided)
          let classExists: any = null;
          if (dto.class_id) {
            classExists = await this.prisma.class.findFirst({
              where: {
                id: dto.class_id,
                schoolId: fullUser.school_id,
              },
            });

            if (!classExists) {
              this.logger.log(colors.red(`Specified class not found or doesn't belong to school`));
              return new ApiResponse(false, 'Specified class not found or access denied', 404);
            }
            this.logger.log(colors.green(`✅ Class verified: ${classExists.name}`));
          } else {
            this.logger.log(colors.yellow(`⚠️ No class specified - student will be enrolled without a class`));
          }

          // 5. Generate strong password if not provided
          const generatedPassword = "Maximus123"
          // const generatedPassword = dto.password || generateStrongPassword(dto.first_name, dto.last_name, dto.email, dto.phone_number);
          const hashedPassword = await argon.hash(generatedPassword);

          // 6. Get current academic session for the school
          const currentSessionResponse = await this.academicSessionService.getCurrentSession(fullUser.school_id);
          if (!currentSessionResponse.success) {
            return new ApiResponse(
              false,
              'No current academic session found for the school',
              null
            );
          }

          // 7. Execute everything in a transaction
          let result:any;
          try {
            result = await this.prisma.$transaction(async (tx) => {
              // Create new user
              const newUser = await tx.user.create({
                data: {
                  first_name: dto.first_name,
                  last_name: dto.last_name,
                  email: dto.email,
                  phone_number: dto.phone_number,
                  display_picture: dto.display_picture,
                  gender: dto.gender,
                  status: UserStatus.active,
                  role: 'student',
                  password: hashedPassword,
                  school_id: fullUser.school_id
                }
              });

              // Create student record with retry mechanism for unique constraint
              let student;
              let retryCount = 0;
              const maxRetries = 3;

              while (retryCount < maxRetries) {
                try {
                  student = await tx.student.create({
                    data: {
                      school_id: fullUser.school_id,
                      user_id: newUser.id,
                      student_id: await generateUniqueStudentId(this.prisma),
                      admission_number: dto.admission_number,
                      date_of_birth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
                      admission_date: new Date(),
                      current_class_id: dto.class_id,
                      guardian_name: dto.guardian_name,
                      guardian_phone: dto.guardian_phone,
                      guardian_email: dto.guardian_email,
                      address: dto.address,
                      emergency_contact: dto.emergency_contact,
                      blood_group: dto.blood_group,
                      medical_conditions: dto.medical_conditions,
                      allergies: dto.allergies,
                      previous_school: dto.previous_school,
                      academic_level: dto.academic_level,
                      parent_id: dto.parent_id,
                      status: UserStatus.active,
                      academic_session_id: currentSessionResponse.data.id
                    }
                  });
                  break; // Success, exit the retry loop
                } catch (error: any) {
                  if (error.code === 'P2002' && error.meta?.target?.includes('student_id')) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                      this.logger.error(colors.red(`Failed to create student after ${maxRetries} retries due to duplicate student_id`));
                      throw error;
                    }
                    this.logger.warn(colors.yellow(`Duplicate student_id detected, retrying... (${retryCount}/${maxRetries})`));
                    // Small delay before retry
                    await new Promise(resolve => setTimeout(resolve, 100));
                  } else {
                    throw error; // Re-throw if it's not a duplicate key error
                  }
                }
              }

              // Student is already enrolled to the class via current_class_id in student record

              return { newUser, student };
            });
          } catch (error) {
            this.logger.error(colors.red(`❌ Failed to create student: ${error.message}`), error);
            return new ApiResponse(false, `Failed to create student: ${error.message}`, 500);
          }

          // Send email notifications
          try {
            // Get school name
            const school = await this.prisma.school.findFirst({
              where: { id: fullUser.school_id },
              select: { school_name: true }
            });

            // Get class teacher information (only if class exists)
            const classTeacher = classExists?.classTeacherId ? await this.prisma.teacher.findFirst({
              where: { id: classExists.classTeacherId },
              select: { first_name: true, last_name: true, email: true }
            }) : null;

            // Send notification to school directors
            await sendNewStudentEnrollmentNotification({
              studentName: `${dto.first_name} ${dto.last_name}`,
              studentEmail: dto.email,
              schoolName: school?.school_name || 'Your School',
              studentId: result.student.student_id,
              className: classExists?.name || 'No Class Assigned',
              studentDetails: {
                guardianName: dto.guardian_name,
                guardianPhone: dto.guardian_phone,
                guardianEmail: dto.guardian_email,
                address: dto.address,
                academicLevel: dto.academic_level,
                previousSchool: dto.previous_school
              }
            });

            // Send welcome email to student
            await sendStudentWelcomeEmail({
              studentName: `${dto.first_name} ${dto.last_name}`,
              studentEmail: dto.email,
              schoolName: school?.school_name || 'Your School',
              studentId: result.student.student_id,
              className: classExists?.name || 'No Class Assigned',
              classTeacher: classTeacher ? `${classTeacher.first_name} ${classTeacher.last_name}` : undefined,
              loginCredentials: {
                email: dto.email,
                password: generatedPassword
              }
            });

            // Send notification to class teacher (if class exists and has a teacher)
            if (classExists && classTeacher) {
              await sendClassTeacherNotification({
                teacherEmail: classTeacher.email,
                teacherName: `${classTeacher.first_name} ${classTeacher.last_name}`,
                className: classExists.name,
                schoolName: school?.school_name || 'Your School',
                studentName: `${dto.first_name} ${dto.last_name}`,
                studentId: result.student.student_id,
                studentEmail: dto.email,
                studentDetails: {
                  guardianName: dto.guardian_name,
                  guardianPhone: dto.guardian_phone,
                  guardianEmail: dto.guardian_email,
                  academicLevel: dto.academic_level,
                  previousSchool: dto.previous_school
                }
              });
            }

            this.logger.log(colors.green(`✅ Enrollment notification emails sent successfully`));
          } catch (emailError) {
            this.logger.error(colors.red(`❌ Failed to send enrollment notification emails: ${emailError.message}`));
            // Don't fail the entire operation if email fails
          }

          this.logger.log(colors.green(`✅ New student enrolled successfully: ${dto.first_name} ${dto.last_name}`));

          return new ApiResponse(true, 'Student enrolled successfully', { 
            student: {
              id: result.student.id,
              user_id: result.newUser.id,
              student_id: result.student.student_id,
              name: `${dto.first_name} ${dto.last_name}`,
              email: dto.email,
              class: classExists?.name || null,
              generatedPassword: !dto.password ? generatedPassword : undefined // Only return if auto-generated
            }
          });

        } catch (error) {
          this.logger.error(colors.red('Error enrolling new student: '), error);
          return new ApiResponse(false, 'Failed to enroll new student', null);
        }
      }

      // Update student information
      async updateStudent(studentId: string, dto: UpdateStudentDto, user: any) {
        // JWT payload has 'sub' as the user ID, not 'id'
        const userId = (user as any).sub || user.id;
        this.logger.log(colors.cyan(`Updating student with ID: ${studentId} by user: ${userId}`));

        try {
          // 1. Get full user data with school_id
          const schoolAdmin = await this.prisma.user.findFirst({
            where: { id: userId },
            select: { id: true, school_id: true, first_name: true, last_name: true }
          });

          this.logger.log(colors.cyan(`school admin user data: ${JSON.stringify(schoolAdmin)}`));

          if (!schoolAdmin || !schoolAdmin.school_id) {
            this.logger.error(colors.red("User not found or missing school_id"));
            return new ApiResponse(false, 'User not found or invalid school data', 400);
          }

          // 2. Debug: Check if studentId is actually a student record ID or user_id
          // Try finding by student record ID first
          let studentWithoutSchoolFilter = await this.prisma.student.findUnique({
            where: { id: studentId },
            select: {
              id: true,
              school_id: true,
              user_id: true,
              student_id: true
            }
          });

          this.logger.log(colors.yellow(`🔍 Debug - Student lookup by ID (${studentId}): ${JSON.stringify(studentWithoutSchoolFilter)}`));

          // If not found by ID, try finding by user_id (maybe frontend is passing user_id instead)
          if (!studentWithoutSchoolFilter) {
            this.logger.log(colors.yellow(`🔍 Debug - Student not found by ID, trying user_id lookup...`));
            studentWithoutSchoolFilter = await this.prisma.student.findUnique({
              where: { user_id: studentId },
              select: {
                id: true,
                school_id: true,
                user_id: true,
                student_id: true
              }
            });
            this.logger.log(colors.yellow(`🔍 Debug - Student lookup by user_id (${studentId}): ${JSON.stringify(studentWithoutSchoolFilter)}`));
          }

          if (!studentWithoutSchoolFilter) {
            this.logger.error(colors.red(`Student with ID/user_id ${studentId} does not exist in database`));
            return new ApiResponse(false, 'Student not found', 404);
          }

          // Check the student's user record to verify school_id (user record is source of truth)
          const studentUser = await this.prisma.user.findUnique({
            where: { id: studentWithoutSchoolFilter.user_id },
            select: { id: true, school_id: true }
          });

          this.logger.log(colors.yellow(`🔍 Debug - Student's user record: ${JSON.stringify(studentUser)}`));
          this.logger.log(colors.yellow(`🔍 Debug - Student record school_id: ${studentWithoutSchoolFilter.school_id}, Student user school_id: ${studentUser?.school_id}, Admin school_id: ${schoolAdmin.school_id}`));

          // Verify school access - check both student record and user record school_id
          const studentSchoolId = studentUser?.school_id || studentWithoutSchoolFilter.school_id;
          
          if (studentSchoolId !== schoolAdmin.school_id) {
            this.logger.error(colors.red(`Student belongs to different school. Student school: ${studentSchoolId}, Admin school: ${schoolAdmin.school_id}`));
            return new ApiResponse(false, 'Student does not belong to your school', 403);
          }

          // If student record has wrong school_id, log a warning (data inconsistency)
          if (studentWithoutSchoolFilter.school_id !== schoolAdmin.school_id && studentUser?.school_id === schoolAdmin.school_id) {
            this.logger.warn(colors.yellow(`⚠️ Data inconsistency: Student record has school_id ${studentWithoutSchoolFilter.school_id} but user has school_id ${studentUser.school_id}. Using user's school_id.`));
          }

          // 3. Now get full student data with includes (use the actual student record ID)
          // We've already verified school access above, so just fetch by ID
          const actualStudentId = studentWithoutSchoolFilter.id;
          const existingStudent = await this.prisma.student.findUnique({
            where: { 
              id: actualStudentId
            },
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone_number: true,
                  display_picture: true,
                  gender: true,
                  status: true,
                  school_id: true
                }
              },
              school: {
                select: { school_name: true }
              }
            }
          });

          if (!existingStudent) {
            this.logger.error(colors.red(`Student record not found: ${actualStudentId}`));
            return new ApiResponse(false, 'Student not found', 404);
          }

          // Double-check: Verify the user's school_id matches (final verification)
          if (existingStudent.user.school_id !== schoolAdmin.school_id) {
            this.logger.error(colors.red(`Access denied: Student user belongs to different school. Student user school: ${existingStudent.user.school_id}, Admin school: ${schoolAdmin.school_id}`));
            return new ApiResponse(false, 'Student does not belong to your school', 403);
          }

          // 4. Check if email is being updated and if it's already taken
          if (dto.email && dto.email !== existingStudent.user.email) {
            const emailExists = await this.prisma.user.findFirst({
              where: { 
                email: dto.email,
                id: { not: existingStudent.user.id }
              }
            });
            
            if (emailExists) {
              this.logger.error(colors.red(`Email already exists: ${dto.email}`));
              return new ApiResponse(false, 'Email already exists', 409);
            }
          }

          // 5. Check if class transfer is requested and validate the new class
          if (dto.class_id && dto.class_id !== existingStudent.current_class_id) {
            const newClass = await this.prisma.class.findFirst({
              where: {
                id: dto.class_id,
                schoolId: schoolAdmin.school_id
              }
            });

            if (!newClass) {
              this.logger.error(colors.red(`New class not found: ${dto.class_id}`));
              return new ApiResponse(false, 'New class not found or access denied', 404);
            }
          }

          // 5. Build update data objects
          const userUpdateData: any = {};
          const studentUpdateData: any = {};
          
          // User fields
          if (dto.first_name !== undefined) userUpdateData.first_name = dto.first_name;
          if (dto.last_name !== undefined) userUpdateData.last_name = dto.last_name;
          if (dto.email !== undefined) userUpdateData.email = dto.email;
          if (dto.phone_number !== undefined) userUpdateData.phone_number = dto.phone_number;
          if (dto.display_picture !== undefined) userUpdateData.display_picture = dto.display_picture;
          if (dto.gender !== undefined) userUpdateData.gender = dto.gender;
          if (dto.status !== undefined) userUpdateData.status = dto.status as UserStatus;

          // Student fields
          if (dto.date_of_birth !== undefined) studentUpdateData.date_of_birth = dto.date_of_birth ? new Date(dto.date_of_birth) : null;
          if (dto.admission_number !== undefined) studentUpdateData.admission_number = dto.admission_number;
          if (dto.guardian_name !== undefined) studentUpdateData.guardian_name = dto.guardian_name;
          if (dto.guardian_phone !== undefined) studentUpdateData.guardian_phone = dto.guardian_phone;
          if (dto.guardian_email !== undefined) studentUpdateData.guardian_email = dto.guardian_email;
          if (dto.address !== undefined) studentUpdateData.address = dto.address;
          if (dto.emergency_contact !== undefined) studentUpdateData.emergency_contact = dto.emergency_contact;
          if (dto.blood_group !== undefined) studentUpdateData.blood_group = dto.blood_group;
          if (dto.medical_conditions !== undefined) studentUpdateData.medical_conditions = dto.medical_conditions;
          if (dto.allergies !== undefined) studentUpdateData.allergies = dto.allergies;
          if (dto.previous_school !== undefined) studentUpdateData.previous_school = dto.previous_school;
          if (dto.academic_level !== undefined) studentUpdateData.academic_level = dto.academic_level;
          if (dto.parent_id !== undefined) studentUpdateData.parent_id = dto.parent_id;
          if (dto.class_id !== undefined) studentUpdateData.current_class_id = dto.class_id;

          // 6. Update user record
          let updatedUser = existingStudent.user;
          if (Object.keys(userUpdateData).length > 0) {
            updatedUser = await this.prisma.user.update({
              where: { id: existingStudent.user.id },
              data: userUpdateData,
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                display_picture: true,
                gender: true,
                status: true,
                school_id: true
              }
            });
          }

          // 7. Update student record
          let updatedStudent = existingStudent;
          if (Object.keys(studentUpdateData).length > 0) {
            updatedStudent = await this.prisma.student.update({
              where: { id: existingStudent.id },
              data: studentUpdateData,
              include: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_number: true,
                    display_picture: true,
                    gender: true,
                    status: true,
                    school_id: true
                  }
                },
                school: {
                  select: { school_name: true }
                }
              }
            });
          }

          // 8. Handle class transfer if requested
          let classTransferInfo: { from: string; to: string; transferred: boolean } | null = null;
          if (dto.class_id && dto.class_id !== existingStudent.current_class_id) {
            // Class transfer is handled by updating the current_class_id in the student record
            // No need for separate disconnect/connect operations

            // Get class information for response
            const newClass = await this.prisma.class.findFirst({
              where: { id: dto.class_id },
              select: { name: true }
            });

            classTransferInfo = {
              from: existingStudent.current_class_id ? 'Previous Class' : 'No Class',
              to: newClass?.name || 'Unknown Class',
              transferred: true
            };
          }

          this.logger.log(colors.green(`✅ Student updated successfully: ${studentId}`));

          return new ApiResponse(true, 'Student updated successfully', {
            student: {
              id: updatedStudent.id,
              user_id: updatedStudent.user_id,
              student_id: updatedStudent.student_id,
              name: `${updatedStudent.user.first_name} ${updatedStudent.user.last_name}`,
              email: updatedStudent.user.email,
              phone_number: updatedStudent.user.phone_number,
              display_picture: updatedStudent.user.display_picture,
              gender: updatedStudent.user.gender,
              status: updatedStudent.user.status,
              current_class_id: updatedStudent.current_class_id,
              guardian_name: updatedStudent.guardian_name,
              guardian_phone: updatedStudent.guardian_phone,
              guardian_email: updatedStudent.guardian_email,
              address: updatedStudent.address,
              emergency_contact: updatedStudent.emergency_contact,
              blood_group: updatedStudent.blood_group,
              medical_conditions: updatedStudent.medical_conditions,
              allergies: updatedStudent.allergies,
              previous_school: updatedStudent.previous_school,
              academic_level: updatedStudent.academic_level,
              parent_id: updatedStudent.parent_id,
              date_of_birth: updatedStudent.date_of_birth,
              admission_number: updatedStudent.admission_number
            },
            updatedFields: {
              user: Object.keys(userUpdateData),
              student: Object.keys(studentUpdateData)
            },
            classTransfer: classTransferInfo
          });

        } catch (error) {
          this.logger.error(colors.red('Error updating student: '), error);
          return new ApiResponse(false, 'Failed to update student', null);
        }
      }
    } 