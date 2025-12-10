import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateClassDto, EditClassDto } from './dto/class.dto';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  async getAllClasses(user: any) {
    // Fetch complete user data including school_id
    const userData = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { school_id: true }
    });

    if (!userData) {
      return new ApiResponse(
        false,
        'User not found',
        null
      );
    }

    this.logger.log(colors.cyan(`Fetching all classes for school: ${userData.school_id}`));

    // Fetch classes with their teachers
    const classes = await this.prisma.class.findMany({
      where: {
        schoolId: userData.school_id,
      },
      select: {
        id: true,
        name: true,
        classTeacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            display_picture: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Debug: Log the class IDs being returned
    const classIds = classes.map(c => ({ id: c.id, name: c.name }));
    this.logger.log(colors.yellow(`📋 fetch-all-classes returning class IDs: ${JSON.stringify(classIds)}`));

    // Fetch all teachers in the school
    const teachers = await this.prisma.user.findMany({
      where: {
        school_id: userData.school_id,
        role: 'teacher',
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        display_picture: true,
        email: true,
        phone_number: true,
      },
      orderBy: {
        first_name: 'asc',
      },
    });

    this.logger.log(`Found ${classes.length} classes and ${teachers.length} teachers`);

    return new ApiResponse(
        true,
        `Total of ${classes.length} classes retrieved`,
        {
          classes,
          teachers
        }
    );
  }

  async createClass(user: any, createClassDto: CreateClassDto) {
    // Fetch complete user data including school_id
    const userData = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { school_id: true }
    });

    if (!userData) {
      return new ApiResponse(
        false,
        'User not found',
        null
      );
    }

    this.logger.log(colors.cyan(`Creating new class: ${createClassDto.name} for school: ${userData.school_id}`));

    // Check if class name already exists for this school
    const existingClass = await this.prisma.class.findFirst({
      where: {
        schoolId: userData.school_id,
        name: createClassDto.name,
      },
    });

    if (existingClass) {
      this.logger.error(`A class with the name "${createClassDto.name}" already exists in this school`);
      return new ApiResponse(
        false,
        `A class with the name "${createClassDto.name}" already exists in this school`,
        null
      );
    }

    // If classTeacherId is provided, verify the teacher exists and belongs to the school
    if (createClassDto.classTeacherId) {

      this.logger.log(`Checking if teacher exists: ${createClassDto.classTeacherId}`);

      // Find the Teacher record using the User ID
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          user_id: createClassDto.classTeacherId,
          school_id: userData.school_id,
        },
      });

      if (!teacher) {
        this.logger.error(`The specified teacher does not exist or does not belong to this school`);
        return new ApiResponse(
          false,
          'The specified teacher does not exist or does not belong to this school',
          null
        );
      }

      // Use the Teacher ID for class creation
      createClassDto.classTeacherId = teacher.id;
    }

    // Get current academic session for the school
    const currentSessionResponse = await this.academicSessionService.getCurrentSession(userData.school_id);
    if (!currentSessionResponse.success) {
      return new ApiResponse(
        false,
        'No current academic session found for the school',
        null
      );
    }

    const newClass = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        schoolId: userData.school_id,
        classTeacherId: createClassDto.classTeacherId || null,
        academic_session_id: currentSessionResponse.data.id,
      },
      select: {
        id: true,
        name: true,
        classTeacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            display_picture: true,
            email: true,
            phone_number: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Successfully created class: ${newClass.name} with ID: ${newClass.id}`);

    return new ApiResponse(
      true,
      `Class "${newClass.name}" created successfully`,
      newClass
    );
  }

  async editClass(user: any, classId: string, editClassDto: EditClassDto) {
    // Fetch complete user data including school_id
    const userData = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { school_id: true }
    });

    if (!userData) {
      return new ApiResponse(
        false,
        'User not found',
        null
      );
    }

    this.logger.log(colors.cyan(`Editing class: ${classId} for school: ${userData.school_id}`));

    // Check if class exists and belongs to the school
    const existingClass = await this.prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: userData.school_id,
      },
    });

    if (!existingClass) {
      return new ApiResponse(
        false,
        'Class not found or does not belong to this school',
        null
      );
    }

    // Check if the new name already exists for this school (excluding current class)
    if (editClassDto.name) {
      const duplicateClass = await this.prisma.class.findFirst({
        where: {
          schoolId: userData.school_id,
          name: editClassDto.name,
          id: {
            not: classId,
          },
        },
      });

      if (duplicateClass) {
        return new ApiResponse(
          false,
          `A class with the name "${editClassDto.name}" already exists in this school`,
          null
        );
      }
    }

    // If classTeacherId is provided, verify the teacher exists and belongs to the school
    if (editClassDto.classTeacherId) {
      // Find the Teacher record using the User ID
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          user_id: editClassDto.classTeacherId,
          school_id: userData.school_id,
        },
      });

      if (!teacher) {
        return new ApiResponse(
          false,
          'The specified teacher does not exist or does not belong to this school',
          null
        );
      }

      // Use the Teacher ID for class update
      editClassDto.classTeacherId = teacher.id;
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    
    if (editClassDto.name !== undefined) {
      updateData.name = editClassDto.name;
    }
    if (editClassDto.classTeacherId !== undefined) {
      updateData.classTeacherId = editClassDto.classTeacherId;
    }

    const updatedClass = await this.prisma.class.update({
      where: {
        id: classId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        classTeacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            display_picture: true,
            email: true,
            phone_number: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Successfully updated class: ${updatedClass.name} with ID: ${updatedClass.id}`);

    return new ApiResponse(
      true,
      `Class updated successfully to "${updatedClass.name}"`,
      updatedClass
    );
  }

  // details to create a new class
}
