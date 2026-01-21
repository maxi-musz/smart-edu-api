import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@prisma/client';
import { ApiResponse } from '../../../shared/helper-functions/response';
import { AttendanceOverviewDto, ClassInfoDto, AcademicSessionInfoDto } from './dto/attendance-overview.dto';
import { StudentsForClassDto, StudentInfoDto, ClassInfoForStudentsDto } from './dto/student-list.dto';
import { PaginationMetaDto } from './dto/pagination.dto';
import { AttendanceForDateDto, AttendanceRecordDto } from './dto/attendance-date.dto';
import { SubmitAttendanceDto, AttendanceRecordStatus, UpdateAttendanceDto } from './dto/submit-attendance.dto';
import { StudentAttendanceDto, StudentAttendanceSummaryDto, StudentAttendanceRecordDto } from './dto/student-attendance.dto';

@Injectable()
export class AttendanceTeacherService {
  private readonly logger = new Logger(AttendanceTeacherService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get session details and classes assigned to teacher
   */
  async getSessionDetailsAndClasses(user: User): Promise<ApiResponse<AttendanceOverviewDto | null>> {
    let roleRaw: any = (user as any)?.role;
    let effectiveSchoolId: string | undefined = (user as any)?.school_id;
    const payloadKeys = Object.keys(user as any || {});
    this.logger.log(`Fetching session details and classes for user: ${user['email'] || (user as any)?.email}, role: ${roleRaw}, payloadKeys=${JSON.stringify(payloadKeys)}`);

    // If role or school_id isn't present in JWT payload, fetch from DB
    if (!roleRaw || !effectiveSchoolId) {
      try {
        const fullUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: (user as any)?.id || (user as any)?.sub || '' },
              { email: (user as any)?.email || '' }
            ]
          },
          select: { id: true, role: true, school_id: true, email: true }
        });
        if (fullUser) {
          roleRaw = roleRaw || fullUser.role;
          effectiveSchoolId = effectiveSchoolId || fullUser.school_id;
          this.logger.log(`Resolved user from DB. email=${fullUser.email}, role=${fullUser.role}, school_id=${fullUser.school_id}`);
        } else {
          this.logger.warn(`Unable to resolve full user from DB using sub/id/email. sub=${(user as any)?.sub}, email=${(user as any)?.email}`);
        }
      } catch (e) {
        this.logger.error(`Error resolving full user from DB: ${e.message}`);
      }
    }

    const roleNormalized = typeof roleRaw === 'string' ? roleRaw.toLowerCase() : String(roleRaw || '').toLowerCase();

    try {
      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: (user as any)?.id || (user as any)?.sub },
            { email: (user as any)?.email }
          ],
          school_id: effectiveSchoolId
        },
        include: {
          academicSession: true
        }
      });

      if (!teacher) {
        // Allow school directors to access this endpoint without a Teacher record
        const isDirector = ['school_director', 'school-director', 'director', 'schooldirector'].includes(roleNormalized);
        if (isDirector) {
          this.logger.warn(`No teacher record for director ${user.email}. Falling back to director view. role=${roleRaw}`);

          // Fetch academic sessions for the director's school
          const allSessions = await this.prisma.academicSession.findMany({
            where: { school_id: effectiveSchoolId! },
            orderBy: [
              { start_year: 'desc' },
              { term: 'desc' }
            ],
            take: 3
          });

          if (allSessions.length === 0) {
            this.logger.error(`No academic sessions found for school: ${effectiveSchoolId}`);
            return new ApiResponse<null>(false, 'No academic sessions found', null);
          }

          const currentSession = allSessions.find(session => session.is_current);
          if (!currentSession) {
            this.logger.error(`No current academic session found for school: ${effectiveSchoolId}`);
            return new ApiResponse<null>(false, 'No current academic session found', null);
          }

          const academicSessions: AcademicSessionInfoDto[] = allSessions.map(session => ({
            academic_year: session.academic_year,
            term: session.term,
            term_start_date: session.start_date.toISOString().split('T')[0],
            term_end_date: session.end_date.toISOString().split('T')[0],
            current_date: new Date().toISOString().split('T')[0],
            is_current: session.is_current
          }));

          // For directors, return all classes in the school for the current session
          const classes = await this.prisma.class.findMany({
            where: {
              schoolId: effectiveSchoolId!,
              academic_session_id: currentSession.id
            },
            include: {
              students: {
                where: { status: 'active' }
              },
              classTeacher: true,
              schedules: {
                where: { isActive: true },
                select: { room: true },
                take: 1
              }
            }
          });

          const classes_managing: ClassInfoDto[] = classes.map(c => ({
            id: c.id,
            name: c.name,
            code: c.name,
            subject: 'Class Teacher',
            teacher_name: c.classTeacher ? `${c.classTeacher.first_name} ${c.classTeacher.last_name}` : 'Unassigned',
            room: c.schedules[0]?.room || 'TBD',
            total_students: c.students.length
          }));

          const data: AttendanceOverviewDto = {
            classes_managing,
            academic_sessions: academicSessions
          };

          this.logger.log(`✅ Session details and classes retrieved successfully. Classes: ${classes_managing.length}`);
          return new ApiResponse(true, 'Session details retrieved successfully', data);
        }

        this.logger.error(`Teacher not found for userrr: ${user.email}, role=${roleRaw}`);
        return new ApiResponse<null>(false, 'Teacher not found', null);
      }

      // Get all academic sessions for the school (latest 3 or all if less than 3)
      const allSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: teacher.school_id
        },
        orderBy: [
          { start_year: 'desc' },
          { term: 'desc' }
        ],
        take: 3
      });

      if (allSessions.length === 0) {
        this.logger.error(`No academic sessions found for school: ${teacher.school_id}`);
        return new ApiResponse<null>(false, 'No academic sessions found', null);
      }

      // Find current session
      const currentSession = allSessions.find(session => session.is_current);
      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher.school_id}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Get classes where teacher is the class teacher
      const managedClasses = await this.prisma.class.findMany({
        where: {
          schoolId: teacher.school_id,
          academic_session_id: currentSession.id,
          classTeacherId: teacher.id
        },
        include: {
          students: {
            where: {
              status: 'active'
            }
          },
          schedules: {
            where: {
              teacher_id: teacher.id,
              isActive: true
            },
            select: {
              room: true
            },
            take: 1
          }
        }
      });

      // Transform classes data
      const classes_managing: ClassInfoDto[] = [];

      // Process classes where teacher is the class teacher
      for (const classItem of managedClasses) {
        const room = classItem.schedules[0]?.room || 'TBD';
        
        classes_managing.push({
          id: classItem.id,
          name: classItem.name,
          code: classItem.name,
          subject: 'Class Teacher', // Teacher is the class teacher
          teacher_name: `${teacher.first_name} ${teacher.last_name}`,
          room: room,
          total_students: classItem.students.length
        });
      }

      // Prepare academic sessions info
      const academicSessions: AcademicSessionInfoDto[] = allSessions.map(session => ({
        academic_year: session.academic_year,
        term: session.term,
        term_start_date: session.start_date.toISOString().split('T')[0],
        term_end_date: session.end_date.toISOString().split('T')[0],
        current_date: new Date().toISOString().split('T')[0],
        is_current: session.is_current
      }));

      const data: AttendanceOverviewDto = {
        classes_managing,
        academic_sessions: academicSessions
      };

      this.logger.log(`✅ Session details and classes retrieved successfully. Classes: ${classes_managing.length}`);
      return new ApiResponse(true, 'Session details and classes retrieved successfully', data);

    } catch (error) {
      this.logger.error(`Error fetching session details and classes: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to fetch session details and classes', null);
    }
  }

  /**
   * Get all students for a selected class with pagination
   */
  async getStudentsForClass(
    user: User, 
    classId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ApiResponse<StudentsForClassDto | null>> {
    const roleRaw: any = (user as any)?.role;
    const roleNormalized = typeof roleRaw === 'string' ? roleRaw.toLowerCase() : String(roleRaw || '').toLowerCase();
    this.logger.log(`Fetching students for class ${classId} by user: ${user.email}, role: ${roleRaw} (page: ${page}, limit: ${limit})`);

    try {
      // Get teacher record (if applicable)
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        }
      });

      const isDirector = ['school_director', 'school-director', 'director', 'schooldirector'].includes(roleNormalized);
      const isAdmin = ['admin', 'school_admin', 'school-admin', 'schooladmin'].includes(roleNormalized);
      if (!teacher && !(isDirector || isAdmin)) {
        if ((user as any)?.school_id) {
          this.logger.warn(`{getattendanceforclass} No teacher record for ${user.email} (role=${roleRaw}). Proceeding with school-level access using school_id=${(user as any).school_id}`);
        } else {
          this.logger.error(`{getattendanceforclass} Teacher not found and no school_id context for user: ${user.email}, role=${roleRaw}`);
          return new ApiResponse<null>(false, 'Teacher not found', null);
        }
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher?.school_id || user.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher?.school_id || user.school_id}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Verify that the teacher is the class teacher for this class and get total count
      const classInfo = await this.prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: teacher?.school_id || user.school_id,
          academic_session_id: currentSession.id,
          ...(teacher && !isDirector ? { classTeacherId: teacher.id } : {})
        },
        include: {
          students: {
            where: {
              status: 'active'
            },
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true,
                  phone_number: true,
                  display_picture: true,
                  gender: true
                }
              }
            },
            orderBy: {
              user: {
                first_name: 'asc'
              }
            }
          },
          classTeacher: true,
          schedules: {
            where: {
              ...(teacher ? { teacher_id: teacher.id } : {}),
              isActive: true
            },
            select: {
              room: true
            },
            take: 1
          }
        }
      });

      if (!classInfo) {
        this.logger.error(`Class not found or teacher is not the class teacher for class: ${classId}`);
        return new ApiResponse<null>(false, 'Class not found or you are not authorized to view this class', null);
      }

      // Get total count of active students
      const totalStudents = classInfo.students.length;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalStudents / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      // Get paginated students
      const paginatedStudents = classInfo.students.slice(skip, skip + limit);

      // Transform students data
      const students: StudentInfoDto[] = paginatedStudents.map((student, index) => ({
        id: student.id,
        user_id: student.user_id,
        name: `${student.user.first_name} ${student.user.last_name}`,
        first_name: student.user.first_name,
        last_name: student.user.last_name,
        display_picture: student.user.display_picture ? JSON.stringify(student.user.display_picture) : null,
        email: student.user.email,
        phone_number: student.user.phone_number,
        gender: student.user.gender,
        student_id: student.student_id,
        admission_number: student.admission_number,
        roll_number: String(skip + index + 1).padStart(3, '0'), // Generate roll number based on global order
        status: student.status
      }));

      // Prepare class info
      const classInfoForStudents: ClassInfoForStudentsDto = {
        id: classInfo.id,
        name: classInfo.name,
        code: classInfo.name,
        subject: 'Class Teacher',
        teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : (classInfo as any).classTeacher ? `${(classInfo as any).classTeacher.first_name} ${(classInfo as any).classTeacher.last_name}` : 'Unassigned',
        room: classInfo.schedules[0]?.room || 'TBD'
      };

      // Prepare pagination metadata
      const pagination: PaginationMetaDto = {
        current_page: page,
        per_page: limit,
        total: totalStudents,
        total_pages: totalPages,
        has_next: hasNext,
        has_previous: hasPrevious
      };

      const data: StudentsForClassDto = {
        class_info: classInfoForStudents,
        pagination,
        students,
      };

      this.logger.log(`✅ Students retrieved successfully for class ${classId}. Count: ${students.length}`);
      return new ApiResponse(true, 'Students retrieved successfully', data);

    } catch (error) {
      this.logger.error(`Error fetching students for class ${classId}: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to fetch students for class', null);
    }
  }

  /**
   * Get attendance for a specific date
   */
  async getAttendanceForDate(
    user: User, 
    classId: string, 
    date: string
  ): Promise<ApiResponse<AttendanceForDateDto | null>> {
    let roleRaw: any = (user as any)?.role;
    let effectiveSchoolId: string | undefined = (user as any)?.school_id;
    const payloadKeys = Object.keys(user as any || {});
    this.logger.log(`Fetching attendance for class ${classId} on date ${date} by user: ${(user as any)?.email}, role=${roleRaw}, payloadKeys=${JSON.stringify(payloadKeys)}`);

    if (!roleRaw || !effectiveSchoolId) {
      try {
        const fullUser = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: (user as any)?.id || (user as any)?.sub || '' },
              { email: (user as any)?.email || '' }
            ]
          },
          select: { id: true, role: true, school_id: true, email: true }
        });
        if (fullUser) {
          roleRaw = roleRaw || fullUser.role;
          effectiveSchoolId = effectiveSchoolId || fullUser.school_id;
          this.logger.log(`Resolved user from DB for attendance date. email=${fullUser.email}, role=${fullUser.role}, school_id=${fullUser.school_id}`);
        }
      } catch (e) {
        this.logger.error(`Error resolving full user from DB (attendance date): ${e.message}`);
      }
    }

    const roleNormalized = typeof roleRaw === 'string' ? roleRaw.toLowerCase() : String(roleRaw || '').toLowerCase();
    const isDirector = ['school_director', 'school-director', 'director', 'schooldirector'].includes(roleNormalized);
    const isAdmin = ['admin', 'school_admin', 'school-admin', 'schooladmin'].includes(roleNormalized);
    this.logger.log(`Role flags for attendance-by-date: isDirector=${isDirector}, isAdmin=${isAdmin}, roleRaw=${roleRaw}`);

    try {
      // Validate date format
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        this.logger.error(`Invalid date format: ${date}`);
        return new ApiResponse<null>(false, 'Invalid date format. Please use YYYY-MM-DD format', null);
      }

      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: (user as any)?.id || (user as any)?.sub },
            { email: (user as any)?.email }
          ],
          school_id: effectiveSchoolId
        }
      });

      if (!teacher && !(isDirector || isAdmin)) {
        // Proceed for non-teachers when role is missing but we have a valid school context
        if (effectiveSchoolId) {
          this.logger.warn(`No teacher record and role not privileged for ${((user as any)?.email)}. Proceeding with school-level access using school_id=${effectiveSchoolId}.`);
        } else {
          this.logger.error(`Teacher not found and no school_id context for user: ${(user as any)?.email}, role=${roleRaw}`);
          return new ApiResponse<null>(false, 'Teacher not found', null);
        }
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher?.school_id || effectiveSchoolId!,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher?.school_id || effectiveSchoolId}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Verify that the teacher is the class teacher for this class
      const classInfo = await this.prisma.class.findFirst({
        where: {
          id: classId,
          schoolId: teacher?.school_id || effectiveSchoolId!,
          academic_session_id: currentSession.id,
          ...(teacher && !(isDirector || isAdmin) ? { classTeacherId: teacher.id } : {})
        },
        include: {
          students: {
            where: {
              status: 'active'
            },
            include: {
              user: {
                select: {
                  first_name: true,
                  last_name: true
                }
              }
            },
            orderBy: {
              user: {
                first_name: 'asc'
              }
            }
          }
        }
      });

      if (!classInfo) {
        this.logger.error(`Class not found or teacher is not the class teacher for class: ${classId}`);
        return new ApiResponse<null>(false, 'Class not found or you are not authorized to view this class', null);
      }

      // Query attendance session for this date
      const attendanceSession = await this.prisma.attendanceSession.findFirst({
        where: {
          class_id: classId,
          date: attendanceDate,
          school_id: teacher?.school_id || effectiveSchoolId!,
          academic_session_id: currentSession.id
        },
        include: {
          records: {
            include: {
              student: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          }
        }
      });

      let attendanceRecords: AttendanceRecordDto[];
      let attendanceStatus: 'pending' | 'submitted' | 'approved';

      if (attendanceSession) {
        // Get student information for the records
        const studentIds = attendanceSession.records.map(record => record.student_id);
        const students = await this.prisma.student.findMany({
          where: {
            user_id: { in: studentIds },
            current_class_id: classId,
            status: 'active'
          },
          select: {
            id: true,
            user_id: true,
            student_id: true
          }
        });

        // Create a mapping of user_id to student data
        const studentMap = new Map(
          students.map(student => [student.user_id, student])
        );

        // Convert database records to DTO format
        attendanceRecords = attendanceSession.records.map(record => {
          const studentData = studentMap.get(record.student_id);
          return {
            id: studentData?.id || record.student_id, // Database ID
            student_id: studentData?.student_id || 'N/A', // Student ID (admission number)
            is_present: record.status === 'PRESENT',
            marked_at: record.marked_at?.toISOString() || null,
            marked_by: record.marked_by || teacher?.id || ''
          };
        });

        // Map session status to response status
        switch (attendanceSession.status) {
          case 'PENDING':
            attendanceStatus = 'pending';
            break;
          case 'SUBMITTED':
            attendanceStatus = 'submitted';
            break;
          case 'APPROVED':
            attendanceStatus = 'approved';
            break;
          default:
            attendanceStatus = 'pending';
        }
      } else {
        // No attendance session found - return pending status with empty records
        attendanceRecords = [];
        attendanceStatus = 'pending';
      }

      const data: AttendanceForDateDto = {
        date: date,
        class_id: classId,
        attendance_status: attendanceStatus,
        attendance_records: attendanceRecords,
        // Add status information for UI
        is_marked: !!attendanceSession,
        submitted_at: attendanceSession?.submitted_at?.toISOString() || null,
        total_students: attendanceSession?.total_students || 0,
        present_count: attendanceSession?.present_count || 0,
        absent_count: attendanceSession?.absent_count || 0,
        late_count: attendanceSession?.late_count || 0,
        attendance_rate: attendanceSession?.attendance_rate || 0
      };

      const isMarked = !!attendanceSession;
      const presentCount = attendanceSession?.present_count || 0;
      const absentCount = attendanceSession?.absent_count || 0;
      const totalStudents = attendanceSession?.total_students || 0;
      
      this.logger.log(
        `✅ Attendance retrieved successfully for class ${classId} on ${date}. ` +
        `Status: ${attendanceStatus}, ` +
        `Marked: ${isMarked ? 'Yes' : 'No'}, ` +
        `Present: ${presentCount}, ` +
        `Absent: ${absentCount}${totalStudents > 0 ? ` (Total: ${totalStudents})` : ''}`
      );
      
      // Log the complete data structure being returned to frontend
      this.logger.log('═══════════════════════════════════════════════════════════════');
      this.logger.log('📤 DATA BEING SENT TO FRONTEND:');
      this.logger.log('═══════════════════════════════════════════════════════════════');
      console.log(JSON.stringify(data, null, 2));
      this.logger.log('═══════════════════════════════════════════════════════════════');
      
      return new ApiResponse(true, 'Attendance retrieved successfully', data);

    } catch (error) {
      this.logger.error(`Error fetching attendance for class ${classId} on ${date}: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to fetch attendance for date', null);
    }
  }

  /**
   * Submit attendance for a class
   */
  async submitAttendance(
    user: User, 
    submitData: SubmitAttendanceDto
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Submitting attendance for class ${submitData.class_id} on ${submitData.date} by teacher: ${user.email}`);

    try {
      // Validate date format
      const attendanceDate = new Date(submitData.date);
      if (isNaN(attendanceDate.getTime())) {
        this.logger.error(`Invalid date format: ${submitData.date}`);
        return new ApiResponse<null>(false, 'Invalid date format. Please use YYYY-MM-DD format', null);
      }

      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        }
      });

      if (!teacher) {
        this.logger.error(`Teacher not found for user: ${user.email}`);
        return new ApiResponse<null>(false, 'Teacher not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher.school_id}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Verify that the teacher is the class teacher for this class
      const classInfo = await this.prisma.class.findFirst({
        where: {
          id: submitData.class_id,
          schoolId: teacher.school_id,
          academic_session_id: currentSession.id,
          classTeacherId: teacher.id
        },
        include: {
          students: {
            where: {
              status: 'active'
            }
          }
        }
      });

      if (!classInfo) {
        this.logger.error(`Class not found or teacher is not the class teacher for class: ${submitData.class_id}`);
        return new ApiResponse<null>(false, 'Class not found or you are not authorized to manage this class', null);
      }

      // Check if attendance session already exists for this date
      const existingSession = await this.prisma.attendanceSession.findFirst({
        where: {
          class_id: submitData.class_id,
          date: attendanceDate,
          session_type: (submitData.session_type || 'DAILY') as any
        }
      });

      if (existingSession) {
        this.logger.error(`Attendance session already exists for class ${submitData.class_id} on ${submitData.date}`);
        return new ApiResponse<null>(false, 'Attendance for this date has already been submitted', null);
      }

      // Validate that all student IDs in the request exist in the class
      const studentIds = submitData.attendance_records.map(record => record.student_id);
      const validStudents = classInfo.students.filter(student => studentIds.includes(student.id));
      
      if (validStudents.length !== submitData.attendance_records.length) {
        this.logger.error(`Some student IDs are invalid for class ${submitData.class_id}`);
        return new ApiResponse<null>(false, 'Some student IDs are invalid for this class', null);
      }

      // Create a mapping of student.id to user_id for the foreign key reference
      const studentIdToUserIdMap = new Map(
        validStudents.map(student => [student.id, student.user_id])
      );

      // Use transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Create attendance session
        const attendanceSession = await tx.attendanceSession.create({
          data: {
            school_id: teacher.school_id,
            academic_session_id: currentSession.id,
            class_id: submitData.class_id,
            teacher_id: teacher.id,
            date: attendanceDate,
            session_type: (submitData.session_type || 'DAILY') as any,
            status: 'SUBMITTED',
            notes: submitData.notes,
            submitted_at: new Date()
          }
        });

        // Create attendance records
        const attendanceRecords = await Promise.all(
          submitData.attendance_records.map(record => 
            tx.attendanceRecord.create({
              data: {
                attendance_session_id: attendanceSession.id,
                student_id: studentIdToUserIdMap.get(record.student_id)!, // Use user_id, not student.id
                school_id: teacher.school_id,
                academic_session_id: currentSession.id,
                class_id: submitData.class_id,
                status: record.status as any,
                marked_at: new Date(),
                marked_by: user.id,
                reason: record.reason,
                is_excused: record.is_excused || false,
                excuse_note: record.excuse_note
              }
            })
          )
        );

        // Calculate attendance statistics
        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
        const excusedCount = attendanceRecords.filter(r => r.is_excused).length;
        const totalStudents = attendanceRecords.length;
        const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

        // Update attendance session with calculated statistics
        const updatedSession = await tx.attendanceSession.update({
          where: { id: attendanceSession.id },
          data: {
            total_students: totalStudents,
            present_count: presentCount,
            absent_count: absentCount,
            late_count: lateCount,
            excused_count: excusedCount,
            attendance_rate: attendanceRate
          }
        });

        return {
          session: updatedSession,
          records: attendanceRecords
        };
      });

      const responseData = {
        session_id: result.session.id,
        class_id: submitData.class_id,
        date: submitData.date,
        status: result.session.status,
        total_students: result.session.total_students,
        present_count: result.session.present_count,
        absent_count: result.session.absent_count,
        late_count: result.session.late_count,
        excused_count: result.session.excused_count,
        attendance_rate: result.session.attendance_rate
      };

      this.logger.log(`✅ Attendance submitted successfully for class ${submitData.class_id} on ${submitData.date}. Rate: ${result.session.attendance_rate}%`);
      return new ApiResponse(true, 'Attendance submitted successfully', responseData);

    } catch (error) {
      this.logger.error(`Error submitting attendance for class ${submitData.class_id} on ${submitData.date}: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to submit attendance', null);
    }
  }

  /**
   * Update attendance for specific students (partial update)
   */
  async updateAttendance(
    user: User, 
    updateData: UpdateAttendanceDto
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Updating attendance for class ${updateData.class_id} on ${updateData.date} by teacher: ${user.email}`);

    try {
      // Validate date format
      const attendanceDate = new Date(updateData.date);
      if (isNaN(attendanceDate.getTime())) {
        this.logger.error(`Invalid date format: ${updateData.date}`);
        return new ApiResponse<null>(false, 'Invalid date format. Please use YYYY-MM-DD format', null);
      }

      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        }
      });

      if (!teacher) {
        this.logger.error(`Teacher not found for user: ${user.email}`);
        return new ApiResponse<null>(false, 'Teacher not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher.school_id}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Verify that the teacher is the class teacher for this class
      const classInfo = await this.prisma.class.findFirst({
        where: {
          id: updateData.class_id,
          schoolId: teacher.school_id,
          academic_session_id: currentSession.id,
          classTeacherId: teacher.id
        }
      });

      if (!classInfo) {
        this.logger.error(`Class not found or teacher is not the class teacher for class: ${updateData.class_id}`);
        return new ApiResponse<null>(false, 'Class not found or you are not authorized to manage this class', null);
      }

      // Check if attendance session exists for this date
      const existingSession = await this.prisma.attendanceSession.findFirst({
        where: {
          class_id: updateData.class_id,
          date: attendanceDate,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id
        }
      });

      if (!existingSession) {
        this.logger.error(`No attendance session found for class ${updateData.class_id} on ${updateData.date}`);
        return new ApiResponse<null>(false, 'No attendance session found for this date. Please submit attendance first.', null);
      }

      // Validate that all student IDs in the request exist in the class
      const studentIds = updateData.attendance_records.map(record => record.student_id);
      const validStudents = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          current_class_id: updateData.class_id,
          status: 'active'
        }
      });
      
      if (validStudents.length !== updateData.attendance_records.length) {
        this.logger.error(`Some student IDs are invalid for class ${updateData.class_id}`);
        return new ApiResponse<null>(false, 'Some student IDs are invalid for this class', null);
      }

      // Create a mapping of student.id to user_id for the foreign key reference
      const studentIdToUserIdMap = new Map(
        validStudents.map(student => [student.id, student.user_id])
      );

      // Use transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Update only the specific attendance records sent
        const updatedRecords = await Promise.all(
          updateData.attendance_records.map(record => 
            tx.attendanceRecord.updateMany({
              where: {
                attendance_session_id: existingSession.id,
                student_id: studentIdToUserIdMap.get(record.student_id)! // Use user_id, not student.id
              },
              data: {
                status: record.status as any,
                reason: record.reason,
                is_excused: record.is_excused || false,
                excuse_note: record.excuse_note,
                marked_at: new Date(),
                marked_by: user.id
              }
            })
          )
        );

        // Recalculate attendance statistics for the entire session
        const allRecords = await tx.attendanceRecord.findMany({
          where: {
            attendance_session_id: existingSession.id
          }
        });

        const presentCount = allRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = allRecords.filter(r => r.status === 'ABSENT').length;
        const lateCount = allRecords.filter(r => r.status === 'LATE').length;
        const excusedCount = allRecords.filter(r => r.is_excused).length;
        const totalStudents = allRecords.length;
        const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

        // Update attendance session with recalculated statistics
        const updatedSession = await tx.attendanceSession.update({
          where: { id: existingSession.id },
          data: {
            total_students: totalStudents,
            present_count: presentCount,
            absent_count: absentCount,
            late_count: lateCount,
            excused_count: excusedCount,
            attendance_rate: attendanceRate,
            notes: updateData.notes || existingSession.notes
          }
        });

        return {
          session: updatedSession,
          updatedRecords: updatedRecords
        };
      });

      const responseData = {
        session_id: result.session.id,
        class_id: updateData.class_id,
        date: updateData.date,
        status: result.session.status,
        total_students: result.session.total_students,
        present_count: result.session.present_count,
        absent_count: result.session.absent_count,
        late_count: result.session.late_count,
        excused_count: result.session.excused_count,
        attendance_rate: result.session.attendance_rate,
        updated_students: updateData.attendance_records.length
      };

      this.logger.log(`✅ Attendance updated successfully for class ${updateData.class_id} on ${updateData.date}. Updated ${updateData.attendance_records.length} students. Rate: ${result.session.attendance_rate}%`);
      return new ApiResponse(true, 'Attendance updated successfully', responseData);

    } catch (error) {
      this.logger.error(`Error updating attendance for class ${updateData.class_id} on ${updateData.date}: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to update attendance', null);
    }
  }

  /**
   * Get student attendance for a specific month
   */
  async getStudentAttendance(
    user: User,
    studentId: string,
    year?: number,
    month?: number
  ): Promise<ApiResponse<StudentAttendanceDto | null>> {
    this.logger.log(`Fetching attendance for student ${studentId} by teacher: ${user.email}`);

    try {
      // Default to current month if not provided
      const currentDate = new Date();
      const targetYear = year || currentDate.getFullYear();
      const targetMonth = month || (currentDate.getMonth() + 1);

      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        }
      });

      if (!teacher) {
        this.logger.error(`Teacher not found for user: ${user.email}`);
        return new ApiResponse<null>(false, 'Teacher not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(`No current academic session found for school: ${teacher.school_id}`);
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      // Verify student exists and get their class
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          status: 'active'
        },
        include: {
          current_class: true
        }
      });

      if (!student) {
        this.logger.error(`Student not found: ${studentId}`);
        return new ApiResponse<null>(false, 'Student not found', null);
      }

      // Verify teacher is the class teacher for this student's class
      if (!student.current_class || student.current_class.classTeacherId !== teacher.id) {
        // this.logger.error(`Teacher is not authorized to view attendance for student: ${studentId}`);
        return new ApiResponse<null>(false, 'You are not authorized to view this student\'s attendance', null);
      }

      // Calculate date range for the month (using UTC to avoid timezone issues)
      const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
      const endDate = new Date(Date.UTC(targetYear, targetMonth, 0)); // Last day of the month

      // Get all attendance records for this student in the specified month
      const attendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          student_id: student.user_id, // Use user_id for foreign key
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          attendanceSession: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        include: {
          attendanceSession: {
            select: {
              date: true,
              status: true
            }
          }
        },
        orderBy: {
          attendanceSession: {
            date: 'desc'
          }
        }
      });

      // Get all attendance sessions for this class in the month (to calculate total school days)
      const classAttendanceSessions = await this.prisma.attendanceSession.findMany({
        where: {
          class_id: student.current_class_id!,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          date: true,
          status: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      // Get term attendance sessions (from start of term to end of month)
      const termStartDate = new Date(currentSession.start_date);
      const termAttendanceSessions = await this.prisma.attendanceSession.findMany({
        where: {
          class_id: student.current_class_id!,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          date: {
            gte: termStartDate,
            lte: endDate
          }
        },
        select: {
          date: true,
          status: true
        }
      });

      // Get term attendance records for this student
      const termAttendanceRecords = await this.prisma.attendanceRecord.findMany({
        where: {
          student_id: student.user_id,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          attendanceSession: {
            date: {
              gte: termStartDate,
              lte: endDate
            }
          }
        },
        include: {
          attendanceSession: {
            select: {
              date: true,
              status: true
            }
          }
        }
      });

      // Calculate statistics
      const totalSchoolDaysThisMonth = classAttendanceSessions.length;
      const totalPresentThisMonth = attendanceRecords.filter(record => record.status === 'PRESENT').length;
      const totalSchoolDaysThisTerm = termAttendanceSessions.length;
      const totalPresentThisTerm = termAttendanceRecords.filter(record => record.status === 'PRESENT').length;

      // Find last absent date
      const lastAbsentRecord = attendanceRecords
        .filter(record => record.status === 'ABSENT')
        .sort((a, b) => new Date(b.attendanceSession.date).getTime() - new Date(a.attendanceSession.date).getTime())[0];
      
      const lastAbsentDate = lastAbsentRecord ? lastAbsentRecord.attendanceSession.date.toISOString().split('T')[0] : null;

      // Create summary
      const summary: StudentAttendanceSummaryDto = {
        totalSchoolDaysThisMonth,
        totalPresentThisMonth,
        totalSchoolDaysThisTerm,
        totalPresentThisTerm,
        lastAbsentDate
      };

      // Create records array with all days in the month up to today
      const records: StudentAttendanceRecordDto[] = [];
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Generate all days in the month up to today (or end of month, whichever is earlier)
      let maxDay = endDate.getDate();
      
      // If we're in the same month and year, only go up to today
      if (today.getFullYear() === targetYear && today.getMonth() + 1 === targetMonth) {
        maxDay = today.getDate();
      }
      
      for (let day = 1; day <= maxDay; day++) {
        const currentDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
        const dateString = currentDate.toISOString().split('T')[0];
        
        
        // Skip future dates (but include today)
        if (dateString > todayString) {
          // this.logger.log(`Debug - Skipping future date: ${dateString} (today: ${todayString})`);
          continue;
        }
        
        // Check if it's weekend
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        // Find attendance record for this date
        const attendanceRecord = attendanceRecords.find(record => 
          record.attendanceSession.date.toISOString().split('T')[0] === dateString
        );

        // Find attendance session for this date
        const attendanceSession = classAttendanceSessions.find(session => 
          session.date.toISOString().split('T')[0] === dateString
        );

        let status: string;
        let isExcused: boolean = false;
        let reason: string | null = null;
        let markedAt: string | null = null;
        let markedBy: string | null = null;

        if (isWeekend) {
          status = 'WEEKEND';
        } else if (attendanceRecord) {
          status = attendanceRecord.status;
          isExcused = attendanceRecord.is_excused;
          reason = attendanceRecord.reason;
          markedAt = attendanceRecord.marked_at?.toISOString() || null;
          markedBy = attendanceRecord.marked_by;
        } else if (attendanceSession) {
          // There was a school day but no record for this student (shouldn't happen normally)
          status = 'ABSENT';
        } else {
          // No school day - this could be a holiday or non-school day
          status = 'HOLIDAY';
        }

        records.push({
          date: dateString,
          status,
          isExcused,
          reason,
          markedAt,
          markedBy
        });
      }

      // Reverse the records so today appears first
      const reversedRecords = records.reverse();

      const data: StudentAttendanceDto = {
        summary,
        records: reversedRecords
      };

      this.logger.log(`✅ Student attendance retrieved successfully for student ${studentId}. Month: ${targetMonth}/${targetYear}, Present: ${totalPresentThisMonth}/${totalSchoolDaysThisMonth}`);
      return new ApiResponse(true, 'Student attendance retrieved successfully', data);

    } catch (error) {
      this.logger.error(`Error fetching student attendance for student ${studentId}: ${error.message}`, error.stack);
      return new ApiResponse<null>(false, 'Failed to fetch student attendance', null);
    }
  }

}
