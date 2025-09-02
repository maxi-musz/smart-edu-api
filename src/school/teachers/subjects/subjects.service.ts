import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { ComprehensiveTopicDto } from './dto/comprehensive-subject-response.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import * as colors from 'colors';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  async createSubject(createSubjectDto: CreateSubjectDto, schoolId: string, userId: string): Promise<SubjectResponseDto> {
    this.logger.log(colors.cyan(`Creating subject: ${createSubjectDto.name} for school: ${schoolId}`));

    // Validate academic session
    const academicSessionResponse = await this.academicSessionService.findOne(createSubjectDto.academic_session_id);
    if (!academicSessionResponse.success || !academicSessionResponse.data) {
      throw new NotFoundException('Academic session not found');
    }

    // Check if subject with same code already exists in the school and academic session
    if (createSubjectDto.code) {
      const existingSubject = await this.prisma.subject.findFirst({
        where: {
          code: createSubjectDto.code,
          schoolId,
          academic_session_id: createSubjectDto.academic_session_id,
        },
      });

      if (existingSubject) {
        throw new BadRequestException(`Subject with code ${createSubjectDto.code} already exists in this academic session`);
      }
    }

    const subject = await this.prisma.subject.create({
      data: {
        name: createSubjectDto.name,
        code: createSubjectDto.code,
        color: createSubjectDto.color || '#3B82F6',
        description: createSubjectDto.description,
        thumbnail: createSubjectDto.thumbnail,
        schoolId,
        academic_session_id: createSubjectDto.academic_session_id,
      },
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
      },
    });

    this.logger.log(colors.green(`Subject created successfully: ${subject.id}`));
    return this.mapToResponseDto(subject);
  }

  async getAllSubjects(
    schoolId: string, 
    query: {
      page?: number;
      limit?: number;
      search?: string;
      academicSessionId?: string;
      color?: string;
      isActive?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    data: SubjectResponseDto[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    message: string;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      academicSessionId,
      color,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;

    this.logger.log(colors.cyan(`Fetching subjects for school: ${schoolId} with pagination and filters`));

    // Build where clause
    const where: any = { schoolId };
    
    if (academicSessionId) {
      where.academic_session_id = academicSessionId;
    }
    
    if (color) {
      where.color = color;
    }
    
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const total = await this.prisma.subject.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = sortOrder;
    } else if (sortBy === 'code') {
      orderBy.code = sortOrder;
    } else {
      orderBy.name = sortOrder;
    }

    const subjects = await this.prisma.subject.findMany({
      where,
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        topics: {
          select: {
            id: true,
            title: true,
            order: true,
            is_active: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const data = subjects.map(subject => this.mapToResponseDto(subject));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      message: `Successfully retrieved ${data.length} subjects`,
    };
  }

  async getSubjectById(subjectId: string, schoolId: string): Promise<SubjectResponseDto> {
    this.logger.log(colors.cyan(`Fetching subject: ${subjectId}`));

    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        topics: {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            is_active: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.mapToResponseDto(subject);
  }

  async getComprehensiveSubjectById(
    subjectId: string, 
    schoolId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      type?: string;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      subject: any;
      topics: ComprehensiveTopicDto[];
      pagination: any;
      filters: any;
      stats: any;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type = 'all',
      orderBy = 'order',
      orderDirection = 'asc'
    } = query;

    this.logger.log(colors.cyan(`Fetching comprehensive subject data: ${subjectId}`));

    // Get subject with basic info
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Build where clause for topics
    const topicsWhere: any = {
      subjectId,
      is_active: true, // Only active topics
    };

    if (status && status !== 'all') {
      topicsWhere.is_active = status === 'active';
    }

    if (search) {
      topicsWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total topics count
    const totalTopics = await this.prisma.topic.count({ where: topicsWhere });

    // Build orderBy for topics
    const topicsOrderBy: any = {};
    if (orderBy === 'createdAt') {
      topicsOrderBy.createdAt = orderDirection;
    } else if (orderBy === 'updatedAt') {
      topicsOrderBy.updatedAt = orderDirection;
    } else if (orderBy === 'title') {
      topicsOrderBy.title = orderDirection;
    } else {
      topicsOrderBy.order = orderDirection;
    }

    // Get paginated topics
    const skip = (page - 1) * limit;
    const topics = await this.prisma.topic.findMany({
      where: topicsWhere,
      include: {
        videoContent: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        pdfMaterial: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: topicsOrderBy,
      skip,
      take: limit,
    });

    // Calculate stats
    const totalVideos = await this.prisma.videoContent.count({
      where: {
        topic: { subject_id: subjectId, is_active: true },
      },
    });

    const totalMaterials = await this.prisma.pDFMaterial.count({
      where: {
        topic: { subject_id: subjectId, is_active: true },
      },
    });

    // Mock data for fields not in current schema
    const totalStudents = 25; // This would come from enrollment data
    const progress = 65; // This would be calculated from student progress
    const classes = ['jss2']; // This would come from class assignments

    // Transform topics to match frontend format
    const transformedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description || '',
      order: topic.order,
      status: topic.is_active ? 'active' : 'inactive',
      videos: topic.videoContent.map(video => ({
        id: video.id,
        title: video.title,
        duration: '00:00', // Mock duration since it's not in schema
        thumbnail: '', // Mock thumbnail since it's not in schema
        url: video.url,
        uploadedAt: video.createdAt,
        size: '0 MB', // Mock size since it's not in schema
        views: 0, // Mock views since it's not in schema
        status: 'published', // Mock status since it's not in schema
      })),
      materials: topic.pdfMaterial.map(material => ({
        id: material.id,
        title: material.title,
        type: 'pdf', // Default type
        size: '0 MB', // Mock size since it's not in schema
        url: material.url,
        uploadedAt: material.createdAt,
        downloads: 0, // Mock downloads since it's not in schema
        status: 'published', // Mock status since it's not in schema
      })),
      instructions: 'Complete the assigned materials and videos.', // Mock instructions
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    }));

    // Transform subject data
    const subjectData = {
      id: subject.id,
      name: subject.name,
      description: subject.description || '',
      thumbnail: subject.thumbnail || '',
      code: subject.code || '',
      color: subject.color || '#000000',
      status: 'active', // Default status since is_active field doesn't exist in Subject model
      totalTopics,
      totalVideos,
      totalMaterials,
      totalStudents,
      progress,
      classes,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };

    const totalPages = Math.ceil(totalTopics / limit);

    return {
      success: true,
      message: 'Subject and topics fetched successfully',
      data: {
        subject: subjectData,
        topics: transformedTopics,
        pagination: {
          page,
          limit,
          total: totalTopics,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        filters: {
          search: search || '',
          status: status || 'all',
          type,
          orderBy,
          orderDirection,
        },
        stats: {
          totalTopics,
          totalVideos,
          totalMaterials,
          totalStudents,
          completedTopics: Math.floor(totalTopics * 0.6), // Mock calculation
          inProgressTopics: Math.floor(totalTopics * 0.3), // Mock calculation
          notStartedTopics: Math.floor(totalTopics * 0.1), // Mock calculation
        },
      },
    };
  }

  async updateSubject(subjectId: string, updateSubjectDto: UpdateSubjectDto, schoolId: string): Promise<SubjectResponseDto> {
    this.logger.log(colors.cyan(`Updating subject: ${subjectId}`));

    // Check if subject exists
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!existingSubject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if code is being updated and if it conflicts with existing subjects
    if (updateSubjectDto.code && updateSubjectDto.code !== existingSubject.code) {
      const codeConflict = await this.prisma.subject.findFirst({
        where: {
          code: updateSubjectDto.code,
          schoolId,
          academic_session_id: existingSubject.academic_session_id,
          id: { not: subjectId },
        },
      });

      if (codeConflict) {
        throw new BadRequestException(`Subject with code ${updateSubjectDto.code} already exists in this academic session`);
      }
    }

    const updatedSubject = await this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: updateSubjectDto.name,
        code: updateSubjectDto.code,
        color: updateSubjectDto.color,
        description: updateSubjectDto.description,
        thumbnail: updateSubjectDto.thumbnail,
      },
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
      },
    });

    this.logger.log(colors.green(`Subject updated successfully: ${subjectId}`));
    return this.mapToResponseDto(updatedSubject);
  }

  async deleteSubject(subjectId: string, schoolId: string): Promise<void> {
    this.logger.log(colors.cyan(`Deleting subject: ${subjectId}`));

    // Check if subject exists
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if subject has topics
    const topicCount = await this.prisma.topic.count({
      where: { subject_id: subjectId },
    });

    if (topicCount > 0) {
      throw new BadRequestException(`Cannot delete subject. It has ${topicCount} topic(s) associated with it.`);
    }

    await this.prisma.subject.delete({
      where: { id: subjectId },
    });

    this.logger.log(colors.green(`Subject deleted successfully: ${subjectId}`));
  }

  async assignTeacherToSubject(subjectId: string, teacherId: string, schoolId: string): Promise<void> {
    this.logger.log(colors.cyan(`Assigning teacher ${teacherId} to subject ${subjectId}`));

    // Check if subject exists
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if teacher exists and belongs to the school
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id: teacherId,
        school_id: schoolId,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Create or update teacher-subject relationship
    await this.prisma.teacherSubject.upsert({
      where: {
        teacherId_subjectId: {
          teacherId,
          subjectId,
        },
      },
      update: {},
      create: {
        teacherId,
        subjectId,
      },
    });

    this.logger.log(colors.green(`Teacher assigned to subject successfully`));
  }

  async removeTeacherFromSubject(subjectId: string, teacherId: string, schoolId: string): Promise<void> {
    this.logger.log(colors.cyan(`Removing teacher ${teacherId} from subject ${subjectId}`));

    await this.prisma.teacherSubject.deleteMany({
      where: {
        teacherId,
        subjectId,
      },
    });

    this.logger.log(colors.green(`Teacher removed from subject successfully`));
  }

  async getTeachersForSubject(subjectId: string, schoolId: string): Promise<any[]> {
    this.logger.log(colors.cyan(`Fetching teachers for subject: ${subjectId}`));

    const teacherSubjects = await this.prisma.teacherSubject.findMany({
      where: {
        subjectId,
        teacher: {
          school_id: schoolId,
        },
      },
      include: {
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            teacher_id: true,
            employee_number: true,
            qualification: true,
            specialization: true,
            years_of_experience: true,
            department: true,
            is_class_teacher: true,
            status: true,
          },
        },
      },
    });

    return teacherSubjects.map(ts => ts.teacher);
  }

  private mapToResponseDto(subject: any): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      color: subject.color,
      description: subject.description,
      thumbnail: subject.thumbnail,
      school: subject.school,
      academicSession: subject.academicSession,
      topics: subject.topics || [],
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }
}
