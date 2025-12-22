import { ApiOperation, ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { CreateGeneralMaterialDto } from '../dto/create-general-material.dto';
import { QueryGeneralMaterialsDto } from '../dto/query-general-materials.dto';
import { CreateGeneralMaterialChapterDto } from '../dto/create-general-material-chapter.dto';

export const GetGeneralMaterialsDashboardDocs = {
  operation: ApiOperation({
    summary: 'Get general materials dashboard',
    description:
      'Returns high-level statistics for general materials (ebooks/textbooks) on the authenticated library user\'s platform.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'General materials dashboard retrieved successfully',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user or platform not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GetAllGeneralMaterialsDocs = {
  operation: ApiOperation({
    summary: 'Get all general materials (paginated, filterable, searchable)',
    description:
      'Returns a paginated list of general materials for the authenticated library user\'s platform. ' +
      'Supports search by title/author/description/publisher, AI-enabled filters, and class/subject filters.',
  }),

  // Note: Query params are described via QueryGeneralMaterialsDto in controller
  response200: ApiResponse({
    status: 200,
    description: 'General materials retrieved successfully',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user or platform not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const CreateGeneralMaterialDocs = {
  operation: ApiOperation({
    summary: 'Create a new general material with full file upload',
    description:
      'Creates a new general material (ebook/textbook) for the authenticated library user\'s platform. ' +
      'Uploads the full material file to cloud storage and stores its URL/S3 key in the database. ' +
      'Supports optional pricing, class/subject categorization, and AI enablement.',
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'General material creation data with file',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        author: { type: 'string' },
        isbn: { type: 'string' },
        publisher: { type: 'string' },
        classId: { type: 'string' },
        subjectId: { type: 'string' },
        isAiEnabled: { type: 'boolean' },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Optional thumbnail image for the material (JPEG, PNG, GIF, WEBP - max 5MB)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Full material file (PDF, DOC, PPT, etc. max 300MB)',
        },
      },
    },
  }),

  response201: ApiResponse({
    status: 201,
    description: 'General material created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid file',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user or platform not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const CreateGeneralMaterialChapterDocs = {
  operation: ApiOperation({
    summary: 'Create a chapter for a general material',
    description:
      'Creates a new chapter under a general material with automatic incremental ordering. ' +
      'Chapters can optionally specify page ranges (pageStart/pageEnd) within the full material.',
  }),

  body: ApiBody({
    description: 'Chapter creation data',
    type: CreateGeneralMaterialChapterDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'General material chapter created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user or material not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const StartGeneralMaterialUploadDocs = {
  operation: ApiOperation({
    summary: 'Start general material upload with progress tracking',
    description:
      'Starts a general material upload session and returns a sessionId. ' +
      'Use the upload progress endpoints to track upload status. This is recommended for large files.',
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'General material upload data with file',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Material title' },
        description: { type: 'string', description: 'Material description (optional)' },
        author: { type: 'string', description: 'Author name (optional)' },
        isbn: { type: 'string', description: 'ISBN (optional)' },
        publisher: { type: 'string', description: 'Publisher (optional)' },
        classId: { type: 'string', description: 'Optional library class ID for categorization' },
        subjectId: { type: 'string', description: 'Optional library subject ID for categorization' },
        isAiEnabled: { type: 'boolean', description: 'Whether AI chat is enabled for this material' },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Optional thumbnail image for the material (JPEG, PNG, GIF, WEBP - max 5MB)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Full material file (PDF, DOC, PPT, etc. max 300MB)',
        },
      },
    },
  }),

  response202: ApiResponse({
    status: 202,
    description: 'General material upload started successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid file',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user or platform not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GeneralMaterialUploadProgressSseDocs = {
  operation: ApiOperation({
    summary: 'Stream general material upload progress via SSE',
    description:
      'Streams real-time upload progress updates for a general material upload session using Server-Sent Events (SSE).',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Upload progress events streamed successfully',
  }),
};

export const GeneralMaterialUploadProgressPollDocs = {
  operation: ApiOperation({
    summary: 'Get general material upload progress (polling)',
    description:
      'Returns the current upload progress for a general material upload session. ' +
      'Use this if SSE is not available on the client.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Upload progress retrieved successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - upload session not found',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};



