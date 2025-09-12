import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { User } from '@prisma/client';
import { CreateSubjectDto, EditSubjectDto } from 'src/shared/dto/subject.dto';
import { sendSubjectRoleEmail } from 'src/common/mailer/send-assignment-notifications';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';

export interface AssignSubjectToClassDto {
  classId: string;
  subjectId: string;
  teacherId?: string; // Optional: assign a specific teacher to this subject-class combination
}

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(
    private prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

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

    // Get available classes for the school
    const availableClasses = await this.prisma.class.findMany({
      where: { schoolId: user.school_id },
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
            students: true,
            subjects: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

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
          totalSubjects: classes.reduce((sum, cls) => sum + cls.subjects.length, 0),
          availableClasses: availableClasses.map(cls => ({
            id: cls.id,
            name: cls.name,
            class_teacher: cls.classTeacher ? {
              id: cls.classTeacher.id,
              name: `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}`,
              email: cls.classTeacher.email
            } : null,
            student_count: cls._count.students,
            subject_count: cls._count.subjects
          }))
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
        availableClasses: availableClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          class_teacher: cls.classTeacher ? {
            id: cls.classTeacher.id,
            name: `${cls.classTeacher.first_name} ${cls.classTeacher.last_name}`,
            email: cls.classTeacher.email
          } : null,
          student_count: cls._count.students,
          subject_count: cls._count.subjects
        }))
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
        this.logger.error(`A subject with the code ${dto.code} already exists in this school`);
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
        this.logger.error(`The specified class does not exist or does not belong to this school`);
        return new ApiResponse(
          false,
          'Specified class not found',
          null
        );
      }
    }

    // If teacher is specified, verify they exist and are a teacher
    if (dto.teacher_taking_it) {
      this.logger.log(`Checking if teacher exists: ${dto.teacher_taking_it}`);
      const teacherExists = await this.prisma.teacher.findFirst({
        where: {
          id: dto.teacher_taking_it,
          school_id: existingSchool.id,
        },
      });

      if (!teacherExists) {
        this.logger.error(`The specified teacher does not exist or does not belong to this school`);
        return new ApiResponse(
          false,
          'Specified teacher not found or is not a teacher',
          null
        );
      }
    }

    // Get current academic session for the school
    const currentSessionResponse = await this.academicSessionService.getCurrentSession(existingSchool.id);
    if (!currentSessionResponse.success) {
      return new ApiResponse(
        false,
        'No current academic session found for the school',
        null
      );
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: subjectName,
        code: dto.code,
        color: dto.color || '#3B82F6', // Default blue color
        description: description,
        schoolId: existingSchool.id,
        classId: dto.class_taking_it,
        academic_session_id: currentSessionResponse.data.id,
      },
    });

    // If teacher is specified, create the teacher-subject relationship
    if (dto.teacher_taking_it) {
      this.logger.log(`Creating teacher-subject relationship: ${dto.teacher_taking_it} for subject: ${subject.id}`);
      await this.prisma.teacherSubject.create({
        data: {
          teacherId: dto.teacher_taking_it,
          subjectId: subject.id,
        },
      });

      // Send email notification to the teacher
      try {
        // Get teacher details
        const teacher = await this.prisma.teacher.findFirst({
          where: { id: dto.teacher_taking_it },
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        });

        if (teacher) {
          await sendSubjectRoleEmail({
            teacherName: `${teacher.first_name} ${teacher.last_name}`,
            teacherEmail: teacher.email,
            schoolName: existingSchool.school_name,
            subjects: [subjectName],
            assignedBy: 'School Administrator'
          });

          this.logger.log(colors.green(`✅ Subject assignment email sent to teacher: ${teacher.email}`));
        }
      } catch (emailError) {
        this.logger.error(colors.red(`❌ Failed to send subject assignment email: ${emailError.message}`));
        // Don't fail the entire operation if email fails
      }
    }

    return new ApiResponse(
      true,
      `Subject ${subjectName} created successfully`,
      subject
    );
  }

  ////////////////////////////////////////////////////////////////////////// EDIT SUBJECT
  // PATCH - /api/v1/director/subjects/:id
  async editSubject(user: User, subjectId: string, dto: EditSubjectDto) {
    this.logger.log(colors.cyan(`Editing subject: ${subjectId}`));

    // Get the school id 
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
      this.logger.error(colors.red('Subject not found'));
      return new ApiResponse(
        false,
        'Subject not found',
        null
      );
    }

    // Build update data object - only include fields that are provided
    const updateData: any = {};

    // Update subject name if provided
    if (dto.subject_name !== undefined) {
      updateData.name = dto.subject_name.toLowerCase();
    }

    // Update description if provided
    if (dto.description !== undefined) {
      updateData.description = dto.description.toLowerCase();
    }

    // Update code if provided
    if (dto.code !== undefined) {
      // Check for duplicates if code is being changed
      if (dto.code !== existingSubject.code) {
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
      updateData.code = dto.code;
    }

    // Update color if provided
    if (dto.color !== undefined) {
      updateData.color = dto.color;
    }

    // Update class assignment if provided
    if (dto.class_taking_it !== undefined && dto.class_taking_it !== null) {
      // Verify class exists
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
      updateData.classId = dto.class_taking_it;
    }

    // Update the subject
    this.logger.log(colors.blue(`Updating subject with data: ${JSON.stringify(updateData)}`));
    const updatedSubject = await this.prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
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
            name: true,
          },
        },
      },
    });
    this.logger.log(colors.green(`Subject updated successfully: ${updatedSubject.name}`));

    // Handle teacher assignments if provided
    if (dto.teachers_taking_it !== undefined) {
      this.logger.log(colors.blue(`Handling teacher assignments: ${JSON.stringify(dto.teachers_taking_it)}`));
      // Verify all teachers exist and are teachers
      if (dto.teachers_taking_it.length > 0) {
        this.logger.log(colors.blue(`Validating teachers: ${dto.teachers_taking_it.join(', ')}`));
        const teachers = await this.prisma.teacher.findMany({
          where: {
            id: { in: dto.teachers_taking_it },
            school_id: existingSchool.id,
            status: 'active',
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        });
        this.logger.log(colors.green(`Found ${teachers.length} valid teachers`));

        if (teachers.length !== dto.teachers_taking_it.length) {
          return new ApiResponse(
            false,
            'One or more specified teachers not found or are not teachers in this school',
            null
          );
        }

        // Remove existing teacher-subject relationships
        this.logger.log(colors.blue(`Removing existing teacher-subject relationships`));
        await this.prisma.teacherSubject.deleteMany({
          where: { subjectId },
        });
        this.logger.log(colors.green(`Removed existing relationships`));

        // Create new teacher-subject relationships
        this.logger.log(colors.blue(`Creating new teacher-subject relationships`));
        const teacherSubjectData = dto.teachers_taking_it.map(teacherId => ({
          teacherId,
          subjectId,
        }));

        await this.prisma.teacherSubject.createMany({
          data: teacherSubjectData,
        });
        this.logger.log(colors.green(`Created ${teacherSubjectData.length} new relationships`));
      } else {
        // If empty array, remove all teacher assignments
        await this.prisma.teacherSubject.deleteMany({
          where: { subjectId },
        });
      }
    }

    // Get updated subject with teacher information
    const finalSubject = await this.prisma.subject.findFirst({
      where: { id: subjectId },
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
            name: true,
          },
        },
        teacherSubjects: {
          select: {
            teacher: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(colors.green(`Subject ${existingSubject.name} updated successfully`));

    const response = new ApiResponse(
      true,
      `Subject updated successfully`,
      {
        subject: finalSubject,
        updatedFields: Object.keys(updateData),
        teachersAssigned: finalSubject?.teacherSubjects?.length || 0,
      }
    );
    
    this.logger.log(colors.green(`Returning response for subject edit`));
    return response;
  }

  ////////////////////////////////////////////////////////////////////////// FETCH AVAILABLE TEACHERS AND CLASSES
  // GET - /api/v1/director/subjects/available-teachers-classes
  async fetchAvailableTeachersAndClasses(user: User) {
    this.logger.log(colors.cyan(`Fetching available teachers and classes for school: ${user.school_id}`));

    try {
      // Get available teachers
      const availableTeachers = await this.prisma.teacher.findMany({
        where: {
          school_id: user.school_id,
          status: 'active'
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          display_picture: true,
          email: true
        },
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ]
      });

      // Get available classes
      const availableClasses = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id
        },
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
              students: true,
              subjects: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      this.logger.log(colors.green(`Successfully fetched ${availableTeachers.length} teachers and ${availableClasses.length} classes`));

      return new ApiResponse(
        true,
        'Available teachers and classes fetched successfully',
        {
          teachers: availableTeachers.map(teacher => ({
            id: teacher.id,
            name: `${teacher.first_name} ${teacher.last_name}`,
            display_picture: teacher.display_picture
          })),
          classes: availableClasses.map(cls => ({
            id: cls.id,
            name: cls.name
          }))
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching available teachers and classes: ${error.message}`));
      return new ApiResponse(
        false,
        'Failed to fetch available teachers and classes',
        null
      );
    }
  }
}
