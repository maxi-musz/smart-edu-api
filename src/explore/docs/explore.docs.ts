import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

export class ExploreDocs {
  // Main Explore Page Documentation
  static getExploreData() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get explore page data',
        description:
          'Returns all library classes, subjects, and the 20 most recent videos. Accessible to all users without authentication.',
      }),
      ApiResponse({
        status: 200,
        description: 'Explore data retrieved successfully',
        schema: {
          example: {
            success: true,
            message: 'Explore data retrieved successfully',
            data: {
              classes: [
                {
                  id: 'class_123',
                  name: 'SSS 1',
                  order: 1,
                  subjectsCount: 12,
                },
              ],
              subjects: [
                {
                  id: 'subject_123',
                  name: 'Mathematics',
                  code: 'MATH',
                  description: 'Mathematics for senior secondary students',
                  thumbnailUrl: 'https://s3.amazonaws.com/...',
                  color: '#3B82F6',
                  platform: {
                    id: 'platform_123',
                    name: 'Access Study',
                    slug: 'access-study',
                  },
                  class: {
                    id: 'class_123',
                    name: 'SSS 1',
                  },
                },
              ],
              recentVideos: [
                {
                  id: 'video_123',
                  title: 'Introduction to Algebra',
                  description: 'Learn the basics of algebra',
                  videoUrl: 'https://s3.amazonaws.com/...',
                  thumbnailUrl: 'https://s3.amazonaws.com/...',
                  durationSeconds: 1200,
                  views: 150,
                  createdAt: '2025-01-09T10:00:00.000Z',
                  topic: {
                    id: 'topic_123',
                    title: 'Algebraic Expressions',
                    order: 1,
                  },
                  subject: {
                    id: 'subject_123',
                    name: 'Mathematics',
                    code: 'MATH',
                    thumbnailUrl: 'https://s3.amazonaws.com/...',
                  },
                  platform: {
                    id: 'platform_123',
                    name: 'Access Study',
                    slug: 'access-study',
                  },
                },
              ],
              statistics: {
                totalClasses: 10,
                totalSubjects: 45,
                totalVideos: 20,
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  // Get Subjects Documentation
  static getSubjects() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get paginated subjects with filtering',
        description:
          'Returns filtered and paginated library subjects. Can filter by class and search term.',
      }),
      ApiResponse({
        status: 200,
        description: 'Subjects retrieved successfully',
        schema: {
          example: {
            success: true,
            message: 'Subjects retrieved successfully',
            data: {
              items: [
                {
                  id: 'subject_123',
                  name: 'Mathematics',
                  code: 'MATH',
                  description: 'Mathematics for senior secondary students',
                  color: '#3B82F6',
                  thumbnailUrl: 'https://s3.amazonaws.com/...',
                  videosCount: 45,
                  topicsCount: 20,
                  createdAt: '2025-01-01T00:00:00.000Z',
                  platform: {
                    id: 'platform_123',
                    name: 'Access Study',
                    slug: 'access-study',
                  },
                  class: {
                    id: 'class_123',
                    name: 'SSS 1',
                    order: 1,
                  },
                },
              ],
              meta: {
                totalItems: 45,
                totalPages: 3,
                currentPage: 1,
                limit: 20,
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  // Get Videos Documentation
  static getVideos() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get paginated videos with filtering',
        description:
          'Returns filtered and paginated library videos. Can filter by class, subject, topic, and search term.',
      }),
      ApiResponse({
        status: 200,
        description: 'Videos retrieved successfully',
        schema: {
          example: {
            success: true,
            message: 'Videos retrieved successfully',
            data: {
              items: [
                {
                  id: 'video_123',
                  title: 'Introduction to Algebra',
                  description: 'Learn the basics of algebra',
                  videoUrl: 'https://s3.amazonaws.com/...',
                  thumbnailUrl: 'https://s3.amazonaws.com/...',
                  durationSeconds: 1200,
                  views: 150,
                  createdAt: '2025-01-09T10:00:00.000Z',
                  topic: {
                    id: 'topic_123',
                    title: 'Algebraic Expressions',
                    chapter: {
                      id: 'chapter_123',
                      title: 'Introduction to Algebra',
                    },
                  },
                  subject: {
                    id: 'subject_123',
                    name: 'Mathematics',
                    thumbnailUrl: 'https://s3.amazonaws.com/...',
                  },
                  platform: {
                    id: 'platform_123',
                    name: 'Access Study',
                  },
                },
              ],
              meta: {
                totalItems: 150,
                totalPages: 8,
                currentPage: 1,
                limit: 20,
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  // Get Topics by Subject Documentation
  static getTopicsBySubject() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get complete subject resources (chapters → topics → videos/materials/assessments)',
        description:
          'Returns comprehensive resources for a subject: all chapters, topics under each chapter, and complete materials (videos, PDFs/DOCs, published assessments) for each topic. Includes detailed statistics at all levels.',
      }),
      ApiResponse({
        status: 200,
        description: 'Subject resources retrieved successfully',
        schema: {
          example: {
            success: true,
            message: 'Subject resources retrieved successfully',
            data: {
              subject: {
                id: 'subject_123',
                name: 'Mathematics',
                code: 'MATH',
                description: 'Mathematics for senior secondary students',
                thumbnailUrl: 'https://s3.amazonaws.com/...',
                platform: {
                  id: 'platform_123',
                  name: 'Access Study',
                },
              },
              chapters: [
                {
                  id: 'chapter_123',
                  title: 'Introduction to Algebra',
                  topics: [
                    {
                      id: 'topic_123',
                      title: 'Algebraic Expressions',
                      videos: [{ id: 'video_123', title: '...', videoUrl: '...', views: 150 }],
                      materials: [{ id: 'material_123', title: '...', url: '...', materialType: 'PDF' }],
                      assessments: [{ id: 'assessment_123', title: '...', questionsCount: 10, status: 'PUBLISHED' }],
                      statistics: { videosCount: 3, materialsCount: 5, assessmentsCount: 2, totalViews: 450 },
                    },
                  ],
                  statistics: { topicsCount: 4, videosCount: 12, materialsCount: 15, assessmentsCount: 5 },
                },
              ],
              statistics: { chaptersCount: 5, topicsCount: 20, videosCount: 45, materialsCount: 60, assessmentsCount: 15 },
            },
          },
        },
      }),
      ApiResponse({
        status: 404,
        description: 'Subject not found',
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }

  // Play Video Documentation
  static playVideo() {
    return applyDecorators(
      ApiBearerAuth('JWT-auth'),
      ApiOperation({
        summary: 'Play a video with unique view tracking',
        description:
          'Retrieves video details and URL for playback. Tracks unique views per user (YouTube-style). Each user is counted only once per video. Works for all authenticated users: students, teachers, directors, and library users.',
      }),
      ApiResponse({
        status: 200,
        description: 'Video retrieved successfully for playback',
        schema: {
          example: {
            success: true,
            message: 'Video retrieved for playback',
            data: {
              id: 'video_123',
              title: 'Introduction to Algebra',
              description: 'Learn the basics of algebra',
              videoUrl: 'https://s3.amazonaws.com/...',
              thumbnailUrl: 'https://s3.amazonaws.com/...',
              durationSeconds: 1200,
              sizeBytes: 52428800,
              views: 151,
              order: 1,
              createdAt: '2025-01-09T10:00:00.000Z',
              updatedAt: '2025-01-09T10:00:00.000Z',
              hasViewedBefore: false,
              viewedAt: '2025-01-09T15:30:00.000Z',
              topic: {
                id: 'topic_123',
                title: 'Algebraic Expressions',
                description: 'Learn about algebraic expressions',
                chapter: {
                  id: 'chapter_123',
                  title: 'Introduction to Algebra',
                },
              },
              subject: {
                id: 'subject_123',
                name: 'Mathematics',
                code: 'MATH',
                color: '#3B82F6',
                thumbnailUrl: 'https://s3.amazonaws.com/...',
              },
              platform: {
                id: 'platform_123',
                name: 'Access Study',
                slug: 'access-study',
                description: 'Educational platform',
              },
            },
          },
        },
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
      ApiResponse({
        status: 404,
        description: 'Video not found or not available',
      }),
      ApiResponse({
        status: 500,
        description: 'Internal server error',
      }),
    );
  }
}

