import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { AcademicSessionResponseDto } from './dto/academic-session-response.dto';
import { IAcademicSessionFilters, IAcademicSessionQueryOptions } from './interfaces/academic-session.interface';
import { ApiResponse } from '../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class AcademicSessionService {
  private readonly logger = new Logger(AcademicSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new academic session
   */
  async create(createDto: CreateAcademicSessionDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Creating academic session for school: ${createDto.school_id}`));

    try {
      // Validate that school exists
      const school = await this.prisma.school.findUnique({
        where: { id: createDto.school_id }
      });

      if (!school) {
        return new ApiResponse(false, 'School not found', null);
      }

      // Check if session with same academic year and term already exists
      const existingSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: createDto.school_id,
          academic_year: createDto.academic_year,
          term: createDto.term
        }
      });

      if (existingSession) {
        return new ApiResponse(false, 'Academic session with this year and term already exists', null);
      }

      // If this session is marked as current, deactivate other current sessions
      if (createDto.is_current) {
        await this.prisma.academicSession.updateMany({
          where: {
            school_id: createDto.school_id,
            is_current: true
          },
          data: {
            is_current: false
          }
        });
      }

      const academicSession = await this.prisma.academicSession.create({
        data: {
          school_id: createDto.school_id,
          academic_year: createDto.academic_year,
          start_year: createDto.start_year,
          end_year: createDto.end_year,
          term: createDto.term,
          start_date: new Date(createDto.start_date),
          end_date: new Date(createDto.end_date),
          status: createDto.status || 'active',
          is_current: createDto.is_current || false
        }
      });

      this.logger.log(colors.green(`✅ Academic session created: ${academicSession.academic_year} - ${academicSession.term}`));

      return new ApiResponse(
        true,
        'Academic session created successfully',
        academicSession
      );

    } catch (error) {
      this.logger.error(colors.red(`Error creating academic session: ${error.message}`));
      return new ApiResponse(false, 'Failed to create academic session', null);
    }
  }

  /**
   * Get all academic sessions with pagination and filtering
   */
  async findAll(
    filters: IAcademicSessionFilters = {},
    options: IAcademicSessionQueryOptions = {}
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('Fetching academic sessions with filters'));

    try {
      const {
        page = 1,
        limit = 10,
        search,
        sort_by = 'createdAt',
        sort_order = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (filters.school_id) {
        whereClause.school_id = filters.school_id;
      }

      if (filters.academic_year) {
        whereClause.academic_year = {
          contains: filters.academic_year,
          mode: 'insensitive'
        };
      }

      if (filters.start_year) {
        whereClause.start_year = filters.start_year;
      }

      if (filters.end_year) {
        whereClause.end_year = filters.end_year;
      }

      if (filters.term) {
        whereClause.term = filters.term;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.is_current !== undefined) {
        whereClause.is_current = filters.is_current;
      }

      // Add search functionality
      if (search) {
        whereClause.OR = [
          { academic_year: { contains: search, mode: 'insensitive' } },
          { term: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const total = await this.prisma.academicSession.count({
        where: whereClause
      });

      // Get academic sessions
      const academicSessions = await this.prisma.academicSession.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [sort_by]: sort_order
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true
            }
          }
        }
      });

      const total_pages = Math.ceil(total / limit);

      this.logger.log(colors.green(`✅ Found ${academicSessions.length} academic sessions`));

      return new ApiResponse(
        true,
        'Academic sessions retrieved successfully',
        {
          data: academicSessions,
          pagination: {
            page,
            limit,
            total,
            total_pages
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching academic sessions: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch academic sessions', null);
    }
  }

  /**
   * Get academic session by ID
   */
  async findOne(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Fetching academic session: ${id}`));

    try {
      const academicSession = await this.prisma.academicSession.findUnique({
        where: { id },
        include: {
          school: {
            select: {
              id: true,
              school_name: true
            }
          }
        }
      });

      if (!academicSession) {
        return new ApiResponse(false, 'Academic session not found', null);
      }

      this.logger.log(colors.green(`✅ Academic session found: ${academicSession.academic_year}`));

      return new ApiResponse(
        true,
        'Academic session retrieved successfully',
        academicSession
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching academic session: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch academic session', null);
    }
  }

  /**
   * Update academic session
   */
  async update(id: string, updateDto: UpdateAcademicSessionDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Updating academic session: ${id}`));

    try {
      // Check if academic session exists
      const existingSession = await this.prisma.academicSession.findUnique({
        where: { id }
      });

      if (!existingSession) {
        return new ApiResponse(false, 'Academic session not found', null);
      }

      // If updating to current session, deactivate other current sessions
      if (updateDto.is_current) {
        await this.prisma.academicSession.updateMany({
          where: {
            school_id: existingSession.school_id,
            is_current: true,
            id: { not: id }
          },
          data: {
            is_current: false
          }
        });
      }

      // Check for duplicate academic year and term if being updated
      if (updateDto.academic_year || updateDto.term) {
        const duplicateSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: existingSession.school_id,
            academic_year: updateDto.academic_year || existingSession.academic_year,
            term: updateDto.term || existingSession.term,
            id: { not: id }
          }
        });

        if (duplicateSession) {
          return new ApiResponse(false, 'Academic session with this year and term already exists', null);
        }
      }

      const updatedSession = await this.prisma.academicSession.update({
        where: { id },
        data: {
          ...(updateDto.academic_year && { academic_year: updateDto.academic_year }),
          ...(updateDto.start_year && { start_year: updateDto.start_year }),
          ...(updateDto.end_year && { end_year: updateDto.end_year }),
          ...(updateDto.term && { term: updateDto.term }),
          ...(updateDto.start_date && { start_date: new Date(updateDto.start_date) }),
          ...(updateDto.end_date && { end_date: new Date(updateDto.end_date) }),
          ...(updateDto.status && { status: updateDto.status }),
          ...(updateDto.is_current !== undefined && { is_current: updateDto.is_current })
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true
            }
          }
        }
      });

      this.logger.log(colors.green(`✅ Academic session updated: ${updatedSession.academic_year}`));

      return new ApiResponse(
        true,
        'Academic session updated successfully',
        updatedSession
      );

    } catch (error) {
      this.logger.error(colors.red(`Error updating academic session: ${error.message}`));
      return new ApiResponse(false, 'Failed to update academic session', null);
    }
  }

  /**
   * Delete academic session
   */
  async remove(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Deleting academic session: ${id}`));

    try {
      // Check if academic session exists
      const existingSession = await this.prisma.academicSession.findUnique({
        where: { id }
      });

      if (!existingSession) {
        return new ApiResponse(false, 'Academic session not found', null);
      }

      // Check if session has related data
      const relatedData = await this.prisma.academicSession.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              classes: true,
              subjects: true,
              payments: true,
              performances: true,
              schedules: true,
              notifications: true
            }
          }
        }
      });

      if (relatedData && (relatedData._count.students > 0 || 
          relatedData._count.teachers > 0 || 
          relatedData._count.classes > 0 ||
          relatedData._count.subjects > 0 ||
          relatedData._count.payments > 0 ||
          relatedData._count.performances > 0 ||
          relatedData._count.schedules > 0 ||
          relatedData._count.notifications > 0)) {
        return new ApiResponse(false, 'Cannot delete academic session with related data. Please remove related data first.', null);
      }

      await this.prisma.academicSession.delete({
        where: { id }
      });

      this.logger.log(colors.green(`✅ Academic session deleted: ${existingSession.academic_year}`));

      return new ApiResponse(
        true,
        'Academic session deleted successfully',
        null
      );

    } catch (error) {
      this.logger.error(colors.red(`Error deleting academic session: ${error.message}`));
      return new ApiResponse(false, 'Failed to delete academic session', null);
    }
  }

  /**
   * Get current academic session for a school
   */
  async getCurrentSession(schoolId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.green(`Getting current academic session for school: ${schoolId}`));

    try {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true,
          status: 'active'
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true
            }
          }
        }
      });

      if (!currentSession) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      this.logger.log(colors.green(`✅ Current session: ${currentSession.academic_year} - ${currentSession.term}`));

      return new ApiResponse(
        true,
        'Current academic session retrieved successfully',
        currentSession
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching current academic session: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch current academic session', null);
    }
  }

  /**
   * Helper method to get current session ID (for use in other services)
   */
  async getCurrentSessionId(schoolId: string): Promise<string | null> {
    try {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true,
          status: 'active'
        },
        select: { id: true }
      });

      return currentSession?.id || null;
    } catch (error) {
      this.logger.error(colors.red(`Error getting current session ID: ${error.message}`));
      return null;
    }
  }

  /**
   * Transition to new academic year
   */
  async transitionToNewAcademicYear(
    schoolId: string, 
    newSessionData: {
      academic_year: string;
      start_year: number;
      end_year: number;
      term: 'first' | 'second' | 'third';
      start_date: string;
      end_date: string;
    }
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Transitioning to new academic year for school: ${schoolId}`));

    try {
      // Deactivate current session
      await this.prisma.academicSession.updateMany({
        where: {
          school_id: schoolId,
          is_current: true
        },
        data: {
          is_current: false,
          status: 'completed'
        }
      });

      // Create new session
      const newSession = await this.prisma.academicSession.create({
        data: {
          school_id: schoolId,
          academic_year: newSessionData.academic_year,
          start_year: newSessionData.start_year,
          end_year: newSessionData.end_year,
          term: newSessionData.term,
          start_date: new Date(newSessionData.start_date),
          end_date: new Date(newSessionData.end_date),
          status: 'active',
          is_current: true
        }
      });

      this.logger.log(colors.green(`✅ Transitioned to new academic year: ${newSession.academic_year}`));

      return new ApiResponse(
        true,
        'Successfully transitioned to new academic year',
        newSession
      );

    } catch (error) {
      this.logger.error(colors.red(`Error transitioning to new academic year: ${error.message}`));
      return new ApiResponse(false, 'Failed to transition to new academic year', null);
    }
  }

  /**
   * Get academic sessions by year range
   */
  async getSessionsByYearRange(
    schoolId: string, 
    startYear: number, 
    endYear: number
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Getting sessions for year range: ${startYear}-${endYear}`));

    try {
      const sessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: schoolId,
          start_year: { gte: startYear },
          end_year: { lte: endYear }
        },
        orderBy: [
          { start_year: 'asc' },
          { term: 'asc' }
        ]
      });

      this.logger.log(colors.green(`✅ Found ${sessions.length} sessions in range`));

      return new ApiResponse(
        true,
        'Academic sessions retrieved successfully',
        sessions
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching sessions by year range: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch academic sessions', null);
    }
  }

  /**
   * Get classes in order for a school and academic session
   */
  async getClassesInOrder(schoolId: string, academicSessionId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Getting classes in order for school: ${schoolId}`));

    try {
      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: schoolId,
          academic_session_id: academicSessionId
        },
        orderBy: {
          classId: 'asc'
        },
        include: {
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
        }
      });

      this.logger.log(colors.green(`✅ Found ${classes.length} classes in order`));

      return new ApiResponse(
        true,
        'Classes retrieved in order successfully',
        classes
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching classes in order: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch classes in order', null);
    }
  }

  /**
   * Get next class in sequence for student promotion
   */
  async getNextClass(currentClassId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Getting next class for current class: ${currentClassId}`));

    try {
      const currentClass = await this.prisma.class.findUnique({
        where: { id: currentClassId },
        select: {
          classId: true,
          schoolId: true,
          academic_session_id: true
        }
      });

      if (!currentClass) {
        return new ApiResponse(false, 'Current class not found', null);
      }

      const nextClass = await this.prisma.class.findFirst({
        where: {
          schoolId: currentClass.schoolId,
          academic_session_id: currentClass.academic_session_id,
          classId: {
            gt: currentClass.classId
          }
        },
        orderBy: {
          classId: 'asc'
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!nextClass) {
        return new ApiResponse(false, 'No next class available (student is in the highest class)', null);
      }

      this.logger.log(colors.green(`✅ Next class found: ${nextClass.name} (classId: ${nextClass.classId})`));

      return new ApiResponse(
        true,
        'Next class found successfully',
        nextClass
      );

    } catch (error) {
      this.logger.error(colors.red(`Error getting next class: ${error.message}`));
      return new ApiResponse(false, 'Failed to get next class', null);
    }
  }

  /**
   * Get previous class in sequence for student demotion
   */
  async getPreviousClass(currentClassId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Getting previous class for current class: ${currentClassId}`));

    try {
      const currentClass = await this.prisma.class.findUnique({
        where: { id: currentClassId },
        select: {
          classId: true,
          schoolId: true,
          academic_session_id: true
        }
      });

      if (!currentClass) {
        return new ApiResponse(false, 'Current class not found', null);
      }

      const previousClass = await this.prisma.class.findFirst({
        where: {
          schoolId: currentClass.schoolId,
          academic_session_id: currentClass.academic_session_id,
          classId: {
            lt: currentClass.classId
          }
        },
        orderBy: {
          classId: 'desc'
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!previousClass) {
        return new ApiResponse(false, 'No previous class available (student is in the lowest class)', null);
      }

      this.logger.log(colors.green(`✅ Previous class found: ${previousClass.name} (classId: ${previousClass.classId})`));

      return new ApiResponse(
        true,
        'Previous class found successfully',
        previousClass
      );

    } catch (error) {
      this.logger.error(colors.red(`Error getting previous class: ${error.message}`));
      return new ApiResponse(false, 'Failed to get previous class', null);
    }
  }

  /**
   * Promote student to next class
   */
  async promoteStudent(studentId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Promoting student: ${studentId}`));

    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!student) {
        return new ApiResponse(false, 'Student not found', null);
      }

      if (!student.current_class_id) {
        return new ApiResponse(false, 'Student is not assigned to any class', null);
      }

      // Get next class
      const nextClassResponse = await this.getNextClass(student.current_class_id);
      if (!nextClassResponse.success) {
        return nextClassResponse;
      }

      const nextClass = nextClassResponse.data;

      // Update student's class
      const updatedStudent = await this.prisma.student.update({
        where: { id: studentId },
        data: {
          current_class_id: nextClass.id
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      this.logger.log(colors.green(`✅ Student ${student.user.first_name} ${student.user.last_name} promoted to ${nextClass.name}`));

      return new ApiResponse(
        true,
        `Student promoted successfully to ${nextClass.name}`,
        updatedStudent
      );

    } catch (error) {
      this.logger.error(colors.red(`Error promoting student: ${error.message}`));
      return new ApiResponse(false, 'Failed to promote student', null);
    }
  }

  /**
   * Demote student to previous class
   */
  async demoteStudent(studentId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Demoting student: ${studentId}`));

    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!student) {
        return new ApiResponse(false, 'Student not found', null);
      }

      if (!student.current_class_id) {
        return new ApiResponse(false, 'Student is not assigned to any class', null);
      }

      // Get previous class
      const previousClassResponse = await this.getPreviousClass(student.current_class_id);
      if (!previousClassResponse.success) {
        return previousClassResponse;
      }

      const previousClass = previousClassResponse.data;

      // Update student's class
      const updatedStudent = await this.prisma.student.update({
        where: { id: studentId },
        data: {
          current_class_id: previousClass.id
        },
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      this.logger.log(colors.green(`✅ Student ${student.user.first_name} ${student.user.last_name} demoted to ${previousClass.name}`));

      return new ApiResponse(
        true,
        `Student demoted successfully to ${previousClass.name}`,
        updatedStudent
      );

    } catch (error) {
      this.logger.error(colors.red(`Error demoting student: ${error.message}`));
      return new ApiResponse(false, 'Failed to demote student', null);
    }
  }
}
