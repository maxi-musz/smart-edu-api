import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { CreateClassDto, EditClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(private prisma: PrismaService) {}

  async getAllClasses(user: any) {
    this.logger.log(colors.cyan(`Fetching all classes for school: ${user.school_id}`));

    const classes = await this.prisma.class.findMany({
      where: {
        schoolId: user.school_id,
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
    this.logger.log(`Found ${classes.length} classes`);

    return new ApiResponse(
        true,
        `Total of ${classes.length} classes retrieved`,
        classes
    );
  }

  async createClass(user: any, createClassDto: CreateClassDto) {
    this.logger.log(colors.cyan(`Creating new class: ${createClassDto.name} for school: ${user.school_id}`));

    // Check if class name already exists for this school
    const existingClass = await this.prisma.class.findFirst({
      where: {
        schoolId: user.school_id,
        name: createClassDto.name,
      },
    });

    if (existingClass) {
      return new ApiResponse(
        false,
        `A class with the name "${createClassDto.name}" already exists in this school`,
        null
      );
    }

    // If classTeacherId is provided, verify the teacher exists and belongs to the school
    if (createClassDto.classTeacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: {
          id: createClassDto.classTeacherId,
          school_id: user.school_id,
          role: 'teacher',
        },
      });

      if (!teacher) {
        return new ApiResponse(
          false,
          'The specified teacher does not exist or does not belong to this school',
          null
        );
      }
    }

    const newClass = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        schoolId: user.school_id,
        classTeacherId: createClassDto.classTeacherId || null,
      },
      select: {
        id: true,
        name: true,
        classTeacherId: true,
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
}
