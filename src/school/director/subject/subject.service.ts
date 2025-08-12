import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { User } from '@prisma/client';
import { CreateSubjectDto, EditSubjectDto } from 'src/shared/dto/subject.dto';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(private prisma: PrismaService) {}

   ////////////////////////////////////////////////////////////////////////// FETCH ALL SUBJECT
  // GET -  /API/v1/director/subjects/fetch-all-subjects
  async fetchAllSubjects(
    user: User, 
    options: {
      page?: number;
      limit?: number;
      search?: string;
      classId?: string;
      groupByClass?: boolean;
    } = {}
  ) {
    const { page = 1, limit = 10, search, classId, groupByClass = false } = options;
    const skip = (page - 1) * limit;

    this.logger.log(colors.cyan(`Fetching subjects for school: ${user.school_id}`));

    // Build where clause
    const where: any = {
      schoolId: user.school_id,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search.toLowerCase() } },
        { code: { contains: search.toUpperCase() } },
        { description: { contains: search.toLowerCase() } },
      ];
    }

    // Add class filter
    if (classId) {
      where.classId = classId;
    }

    // If grouping by class, get all classes first
    if (groupByClass) {
      const classes = await this.prisma.class.findMany({
        where: { schoolId: user.school_id },
        select: {
          id: true,
          name: true,
          subjects: {
            where,
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              description: true,
              teacherSubjects: {
                select: {
                  teacher: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      email: true
                    }
                  }
                }
              }
            },
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Format response grouped by class
      const groupedSubjects = classes.map(cls => ({
        classId: cls.id,
        className: cls.name,
        subjectsCount: cls.subjects.length,
        subjects: cls.subjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          description: subject.description,
          teachers: subject.teacherSubjects.map(ts => ({
            id: ts.teacher.id,
            name: `${ts.teacher.first_name} ${ts.teacher.last_name}`,
            email: ts.teacher.email
          }))
        }))
      }));

      return new ApiResponse(
        true,
        `Found subjects grouped by class`,
        {
          groupedByClass: true,
          classes: groupedSubjects,
          totalClasses: classes.length,
          totalSubjects: classes.reduce((sum, cls) => sum + cls.subjects.length, 0)
        }
      );
    }

    // Regular paginated response
    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
          description: true,
          classId: true,
          Class: {
            select: {
              name: true
            }
          },
          teacherSubjects: {
            select: {
              teacher: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.subject.count({ where })
    ]);

    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      color: subject.color,
      description: subject.description,
      class: subject.Class ? {
        id: subject.classId,
        name: subject.Class.name
      } : null,
      teachers: subject.teacherSubjects.map(ts => ({
        id: ts.teacher.id,
        name: `${ts.teacher.first_name} ${ts.teacher.last_name}`,
        email: ts.teacher.email
      }))
    }));

    return new ApiResponse(
      true,
      `Found ${subjects.length} subjects`,
      {
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          search: search || null,
          classId: classId || null
        },
        subjects: formattedSubjects,
      }
    );
  }

   ////////////////////////////////////////////////////////////////////////// CREATE SUBJECT
  // PUT -  /API/v1/
  async createSubject(user: User, dto: CreateSubjectDto) {
    this.logger.log(colors.cyan(`Creating new subject: ${dto.subject_name}`));

    // Convert to lowercase
    const subjectName = dto.subject_name.toLowerCase();
    const description = dto.description?.toLowerCase();

    // get the school id 
    const existingSchool = await this.prisma.school.findFirst({
      where: {
        school_email: user.email
      }
    });

    if(!existingSchool) {
      console.log(colors.red("School not found"));
      return new ApiResponse(
        false,
        "School does not exist",
        null
      );
    }

    // Check if subject with same code already exists in the school
    if (dto.code) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: {
          schoolId: existingSchool.id,
          code: dto.code,
        },
      });

      if (existingSubject) {
        return new ApiResponse(
          false,
          `Subject with code ${dto.code} already exists in this school`,
          null
        );
      }
    }

    // If class is specified, verify it exists
    console.log("class: ", dto.class_taking_it);
    if (dto.class_taking_it) {
      const classExists = await this.prisma.class.findFirst({
        where: {
          id: dto.class_taking_it,
          schoolId: existingSchool.id,
        },
      });

      if (!classExists) {
        return new ApiResponse(
          false,
          'Specified class not found',
          null
        );
      }
    }

    // If teacher is specified, verify they exist and are a teacher
    if (dto.teacher_taking_it) {
      const teacherExists = await this.prisma.user.findFirst({
        where: {
          id: dto.teacher_taking_it,
          school_id: existingSchool.id,
          role: 'teacher',
        },
      });

      if (!teacherExists) {
        return new ApiResponse(
          false,
          'Specified teacher not found or is not a teacher',
          null
        );
      }
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: subjectName,
        code: dto.code,
        color: dto.color || '#3B82F6', // Default blue color
        description: description,
        schoolId: existingSchool.id,
        classId: dto.class_taking_it,
      },
    });

    // If teacher is specified, create the teacher-subject relationship
    if (dto.teacher_taking_it) {
      await this.prisma.teacherSubject.create({
        data: {
          teacherId: dto.teacher_taking_it,
          subjectId: subject.id,
        },
      });
    }

    return new ApiResponse(
      true,
      `Subject ${subjectName} created successfully`,
      subject
    );
  }

  ////////////////////////////////////////////////////////////////////////// EDIT SUBJECT
  // PUT -  /API/v1/
  async editSubject(user: User, subjectId: string, dto: EditSubjectDto) {
    this.logger.log(colors.cyan(`Editing subject: ${subjectId}`));

    // Convert to lowercase
    const subjectName = dto.subject_name.toLowerCase();
    const description = dto.description?.toLowerCase();

    // get the school id 
    const existingSchool = await this.prisma.school.findFirst({
      where: {
        school_email: user.email
      }
    });

    if(!existingSchool) {
      console.log(colors.red("School not found"));
      return new ApiResponse(
        false,
        "School does not exist",
        null
      );
    }

    // Check if subject exists and belongs to the school
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: existingSchool.id,
      },
    });

    if (!existingSubject) {
      return new ApiResponse(
        false,
        'Subject not found',
        null
      );
    }

    // If updating code, check for duplicates
    if (dto.code && dto.code !== existingSubject.code) {
      const duplicateSubject = await this.prisma.subject.findFirst({
        where: {
          schoolId: existingSchool.id,
          code: dto.code,
          id: { not: subjectId },
        },
      });

      if (duplicateSubject) {
        return new ApiResponse(
          false,
          `Subject with code ${dto.code} already exists in this school`,
          null
        );
      }
    }

    // If class is specified, verify it exists
    if (dto.class_taking_it) {
      const classExists = await this.prisma.class.findFirst({
        where: {
          id: dto.class_taking_it,
          schoolId: existingSchool.id,
        },
      });

      if (!classExists) {
        return new ApiResponse(
          false,
          'Specified class not found',
          null
        );
      }
    }

    // If teacher is specified, verify they exist and are a teacher
    if (dto.teacher_taking_it) {
      const teacherExists = await this.prisma.user.findFirst({
        where: {
          id: dto.teacher_taking_it,
          school_id: existingSchool.id,
          role: 'teacher',
        },
      });

      if (!teacherExists) {
        return new ApiResponse(
          false,
          'Specified teacher not found or is not a teacher',
          null
        );
      }
    }

    const updatedSubject = await this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: subjectName,
        code: dto.code,
        color: dto.color,
        description: description,
        classId: dto.class_taking_it,
      },
    });

    // If teacher is specified, update the teacher-subject relationship
    if (dto.teacher_taking_it) {
      // First delete existing relationship
      await this.prisma.teacherSubject.deleteMany({
        where: { subjectId },
      });

      // Then create new relationship
      await this.prisma.teacherSubject.create({
        data: {
          teacherId: dto.teacher_taking_it,
          subjectId: subjectId,
        },
      });
    }

    return new ApiResponse(
      true,
      `Subject updated successfully`,
      updatedSubject
    );
  }
}

// Add the create subject service
