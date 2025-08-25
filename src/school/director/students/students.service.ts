import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { AcademicTerm, UserStatus, User, DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { AddStudentToClassDto } from './dto/auth.dto';
import { ApiResponse } from '../../../shared/helper-functions/response';

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
    constructor(private prisma: PrismaService) {}

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

    private async calculateClassPosition(classId: string, studentId: string): Promise<number> {
        const school = await this.prisma.school.findFirst({
            where: {
                classes: {
                    some: { id: classId }
                }
            },
            select: {
                current_term: true,
                current_year: true
            }
        });

        if (!school) return 0;

        const termNumber = school.current_term === AcademicTerm.first ? 1 :
                          school.current_term === AcademicTerm.second ? 2 : 3;

        const performances = await this.prisma.studentPerformance.findMany({
            where: {
                class_id: classId,
                year: school.current_year,
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
        // this.logger.log(colors.yellow("Fetching students dashboard data"));
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
            this.logger.log(colors.red("Frontend fetching all data - no filters"));
        }

        const skip = (page - 1) * limit;

        // Basic details
        const totalStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student"
            }
        });

        const activeStudents = await this.prisma.user.count({
            where: {
                school_id: schoolId,
                role: "student",
                status: UserStatus.active
            }
        });

        // Students list with pagination, filtering, and sorting
        const students = await this.prisma.user.findMany({
            where: {
                school_id: schoolId,
                role: "student",
                ...(status && { status }),
                ...(class_id && {
                    classesEnrolled: {
                        some: { id: class_id }
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
                classesEnrolled: true
            },
            orderBy: {
                [sort_by === 'name' ? 'first_name' : sort_by]: sort_order
            },
            skip,
            take: limit
        });

        // Get next class and performance metrics for each student
        const studentsWithDetails: StudentWithDetails[] = await Promise.all(students.map(async (student) => {
            const currentClass = student.classesEnrolled[0];
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
                    position: await this.calculateClassPosition(currentClass.id, student.id)
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

        this.logger.log(colors.green("Students dashboard data fetched successfully"));
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
          const existingEnrollment = await this.prisma.user.findFirst({
            where: {
              id: dto.student_id,
              classesEnrolled: {
                some: {
                  id: dto.class_id
                }
              }
            }
          });
    
          if (existingEnrollment) {
            this.logger.log(colors.yellow(`Student already enrolled in class: ${dto.class_id}`));
            return new ApiResponse(false, 'Student is already enrolled in this class', null);
          }
    
          // Add student to the class
          const updatedStudent = await this.prisma.user.update({
            where: {
              id: dto.student_id
            },
            data: {
              classesEnrolled: {
                connect: {
                  id: dto.class_id
                }
              }
            },
            include: {
              classesEnrolled: {
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
                id: updatedStudent.id,
                name: `${updatedStudent.first_name} ${updatedStudent.last_name}`,
                email: updatedStudent.email
              },
              class: {
                id: managedClass.id,
                name: managedClass.name
              },
              enrolled_classes: updatedStudent.classesEnrolled
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
} 