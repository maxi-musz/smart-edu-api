import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllSchools(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[LIBRARY SCHOOLS] Fetching comprehensive dashboard data for all schools'));

    try {
      // Fetch all schools with basic info
      const schools = await this.prisma.school.findMany({
      select: {
        id: true,
        school_name: true,
        school_email: true,
        school_phone: true,
        school_address: true,
        school_type: true,
        school_ownership: true,
        status: true,
        school_icon: true,
        platformId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate overall statistics
    const [
      totalSchools,
      schoolsByStatus,
      schoolsByType,
      schoolsByOwnership,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalSubjects,
      totalParents,
      totalUsers,
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.school.groupBy({
        by: ['school_type'],
        _count: true,
      }),
      this.prisma.school.groupBy({
        by: ['school_ownership'],
        _count: true,
      }),
      this.prisma.teacher.count(),
      this.prisma.student.count(),
      this.prisma.class.count(),
      this.prisma.subject.count(),
      this.prisma.parent.count(),
      this.prisma.user.count(),
    ]);

    // Fetch detailed breakdown for each school
    const schoolsWithDetails = await Promise.all(
      schools.map(async (school) => {
        const [
          teacherCount,
          studentCount,
          classCount,
          subjectCount,
          parentCount,
          userCount,
          academicSessionCount,
          assessmentCount,
          assignmentCount,
          activeAcademicSession,
          subscriptionPlan,
        ] = await Promise.all([
          this.prisma.teacher.count({ where: { school_id: school.id } }),
          this.prisma.student.count({ where: { school_id: school.id } }),
          this.prisma.class.count({ where: { schoolId: school.id } }),
          this.prisma.subject.count({ where: { schoolId: school.id } }),
          this.prisma.parent.count({ where: { school_id: school.id } }),
          this.prisma.user.count({ where: { school_id: school.id } }),
          this.prisma.academicSession.count({ where: { school_id: school.id } }),
          this.prisma.assessment.count({ where: { school_id: school.id } }),
          this.prisma.assignment.count({ where: { school_id: school.id } }),
          this.prisma.academicSession.findFirst({
            where: { school_id: school.id, is_current: true },
            select: {
              id: true,
              academic_year: true,
              term: true,
              status: true,
            },
          }),
          this.prisma.platformSubscriptionPlan.findUnique({
            where: { school_id: school.id },
            select: {
              plan_type: true,
              name: true,
              status: true,
              is_active: true,
            },
          }),
        ]);

        return {
          ...school,
          breakdown: {
            teachers: {
              total: teacherCount,
            },
            students: {
              total: studentCount,
            },
            classes: {
              total: classCount,
            },
            subjects: {
              total: subjectCount,
            },
            parents: {
              total: parentCount,
            },
            users: {
              total: userCount,
            },
            academicSessions: {
              total: academicSessionCount,
              current: activeAcademicSession,
            },
            content: {
              assessments: assessmentCount,
              assignments: assignmentCount,
            },
            subscription: subscriptionPlan || null,
          },
        };
      }),
    );

    // Format statistics
    const statistics = {
      overview: {
        totalSchools,
        totalTeachers,
        totalStudents,
        totalClasses,
        totalSubjects,
        totalParents,
        totalUsers,
      },
      schoolsByStatus: schoolsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      schoolsByType: schoolsByType.reduce(
        (acc, item) => {
          acc[item.school_type] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      schoolsByOwnership: schoolsByOwnership.reduce(
        (acc, item) => {
          acc[item.school_ownership] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

      this.logger.log(colors.green(`Successfully retrieved dashboard data for ${schools.length} schools`));

      return new ApiResponse(true, 'All schools dashboard data retrieved successfully', {
        statistics,
        schools: schoolsWithDetails,
        total: schools.length,
      });
    } catch (error) {
      this.logger.error(colors.red(`Error fetching all schools: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve schools dashboard data');
    }
  }

  async getSchoolById(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY SCHOOLS] Fetching detailed data for school: ${id}`));

    try {
      // Fetch school basic info
      const school = await this.prisma.school.findUnique({
        where: { id },
        select: {
          id: true,
          school_name: true,
          school_email: true,
          school_phone: true,
          school_address: true,
          school_type: true,
          school_ownership: true,
          status: true,
          school_icon: true,
          platformId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!school) {
        this.logger.error(colors.red(`School not found: ${id}`));
        throw new NotFoundException('School not found');
      }

      // Fetch comprehensive breakdown data
      const [
        teacherCount,
        studentCount,
        classCount,
        subjectCount,
        parentCount,
        userCount,
        academicSessionCount,
        assessmentCount,
        assignmentCount,
        activeAcademicSession,
        subscriptionPlan,
        teachers,
        students,
        classes,
        subjects,
        academicSessions,
        recentAssessments,
        recentAssignments,
      ] = await Promise.all([
        this.prisma.teacher.count({ where: { school_id: school.id } }),
        this.prisma.student.count({ where: { school_id: school.id } }),
        this.prisma.class.count({ where: { schoolId: school.id } }),
        this.prisma.subject.count({ where: { schoolId: school.id } }),
        this.prisma.parent.count({ where: { school_id: school.id } }),
        this.prisma.user.count({ where: { school_id: school.id } }),
        this.prisma.academicSession.count({ where: { school_id: school.id } }),
        this.prisma.assessment.count({ where: { school_id: school.id } }),
        this.prisma.assignment.count({ where: { school_id: school.id } }),
        this.prisma.academicSession.findFirst({
          where: { school_id: school.id, is_current: true },
          select: {
            id: true,
            academic_year: true,
            term: true,
            status: true,
            start_date: true,
            end_date: true,
          },
        }),
        this.prisma.platformSubscriptionPlan.findUnique({
          where: { school_id: school.id },
          select: {
            plan_type: true,
            name: true,
            status: true,
            is_active: true,
            cost: true,
            currency: true,
            billing_cycle: true,
          },
        }),
        this.prisma.teacher.findMany({
          where: { school_id: school.id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            teacher_id: true,
            status: true,
            role: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.student.findMany({
          where: { school_id: school.id },
          select: {
            id: true,
            student_id: true,
            admission_number: true,
            current_class_id: true,
            status: true,
            admission_date: true,
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          take: 10,
          orderBy: { admission_date: 'desc' },
        }),
        this.prisma.class.findMany({
          where: { schoolId: school.id },
          select: {
            id: true,
            name: true,
            classId: true,
            createdAt: true,
          },
          orderBy: { classId: 'asc' },
        }),
        this.prisma.subject.findMany({
          where: { schoolId: school.id },
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.academicSession.findMany({
          where: { school_id: school.id },
          select: {
            id: true,
            academic_year: true,
            term: true,
            status: true,
            is_current: true,
            start_date: true,
            end_date: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.assessment.findMany({
          where: { school_id: school.id },
          select: {
            id: true,
            title: true,
            status: true,
            assessment_type: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.assignment.findMany({
          where: { school_id: school.id },
          select: {
            id: true,
            title: true,
            status: true,
            assignment_type: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Calculate additional statistics
      const statistics = {
        overview: {
          teachers: teacherCount,
          students: studentCount,
          classes: classCount,
          subjects: subjectCount,
          parents: parentCount,
          users: userCount,
        },
        academic: {
          totalSessions: academicSessionCount,
          currentSession: activeAcademicSession,
        },
        content: {
          assessments: assessmentCount,
          assignments: assignmentCount,
        },
        subscription: subscriptionPlan || null,
      };

      const responseData = {
        school: {
          ...school,
          statistics,
        },
        details: {
          teachers: {
            total: teacherCount,
            recent: teachers,
          },
          students: {
            total: studentCount,
            recent: students,
          },
          classes: {
            total: classCount,
            list: classes,
          },
          subjects: {
            total: subjectCount,
            list: subjects,
          },
          academicSessions: {
            total: academicSessionCount,
            current: activeAcademicSession,
            all: academicSessions,
          },
          recentContent: {
            assessments: recentAssessments,
            assignments: recentAssignments,
          },
        },
      };

      this.logger.log(colors.green(`Successfully retrieved detailed data for school: ${school.school_name}`));

      return new ApiResponse(true, 'School details retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching school details: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve school details');
    }
  }
}

