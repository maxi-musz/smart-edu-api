import { ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Swagger decorators for TeachersAssessmentsController (kept in one file for reuse).
 * Folder is `api-docs` (not `docs`) so .gitignore's `docs/` rule does not exclude this from git.
 */
export const TeachersAssessmentsDocs = {
  getAll: {
    operation: ApiOperation({
      summary: 'List assessments for the authenticated teacher',
      description:
        'Returns assessments for subjects the teacher teaches. Query params match GetAssessmentsQueryDto.',
    }),
    response200: ApiResponse({
      status: 200,
      description: 'Assessments retrieved successfully',
    }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  create: {
    operation: ApiOperation({
      summary: 'Create a new assessment (teacher)',
      description:
        'Creates a DRAFT assessment for a subject the teacher teaches. `subject_id` must be in the teacher’s assignments. Optional `academic_session_id` defaults to the school’s current session. Optional `topic_id` must match subject, school, and that session.',
    }),
    response201: ApiResponse({ status: 201, description: 'Created' }),
    response400: ApiResponse({
      status: 400,
      description: 'Bad request (session, type limits, invalid assessment_type)',
    }),
    response403: ApiResponse({
      status: 403,
      description: 'Forbidden — subject not in teacher’s teaching assignments',
    }),
    response404: ApiResponse({
      status: 404,
      description: 'Teacher, subject, or topic not found',
    }),
  },

  getQuestionsPreview: {
    operation: ApiOperation({
      summary: 'Preview assessment questions (teacher)',
      description: 'Returns questions for an assessment the teacher may access.',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({
      status: 403,
      description: 'Forbidden — not assigned to this subject',
    }),
    response404: ApiResponse({ status: 404, description: 'Assessment not found' }),
  },

  getById: {
    operation: ApiOperation({
      summary: 'Get assessment by ID (teacher)',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  duplicateById: {
    operation: ApiOperation({
      summary: 'Duplicate an assessment (teacher)',
    }),
    response201: ApiResponse({ status: 201, description: 'Created' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  addQuestionsById: {
    operation: ApiOperation({
      summary: 'Add questions to assessment (batch, no images)',
    }),
    response201: ApiResponse({ status: 201, description: 'Created' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  addQuestionWithImageById: {
    operation: ApiOperation({
      summary: 'Add question with images (multipart)',
    }),
    response201: ApiResponse({ status: 201, description: 'Created' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  updateQuestionById: {
    operation: ApiOperation({
      summary: 'Update a question (JSON body)',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  deleteQuestionById: {
    operation: ApiOperation({
      summary: 'Delete a question from an assessment',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  updateQuestionWithImageById: {
    operation: ApiOperation({
      summary: 'Update a question with image uploads (multipart)',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },

  updateById: {
    operation: ApiOperation({
      summary: 'Update assessment metadata (teacher)',
    }),
    response200: ApiResponse({ status: 200, description: 'OK' }),
    response400: ApiResponse({ status: 400, description: 'Bad request' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden' }),
    response404: ApiResponse({ status: 404, description: 'Not found' }),
  },
};
