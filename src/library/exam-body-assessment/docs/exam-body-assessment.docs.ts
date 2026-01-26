import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  CreateLibraryExamBodyAssessmentDto,
  CreateLibraryExamBodyQuestionDto,
  UpdateLibraryExamBodyAssessmentDto,
  UpdateLibraryExamBodyQuestionDto,
} from '../dto';

export const CreateLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Create a library exam body assessment',
    description:
      'Creates a new exam body assessment for the authenticated library platform. ' +
      'Requires admin/manager role and a valid library JWT. ' +
      'Assessment is scoped to the library platform using platformId.',
  }),
  querySubjectId: ApiQuery({
    name: 'subjectId',
    required: true,
    description: 'Exam body subject ID',
  }),
  queryYearId: ApiQuery({
    name: 'yearId',
    required: true,
    description: 'Exam body year ID',
  }),
  body: ApiBody({
    description: 'Assessment creation payload',
    type: CreateLibraryExamBodyAssessmentDto,
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Assessment created successfully',
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or assessment already exists',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),
  response403: ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Not found - exam body/subject/year not found',
  }),
};

export const GetLibraryExamBodyAssessmentsDocs = {
  operation: ApiOperation({
    summary: 'List library exam body assessments',
    description:
      'Returns assessments for the specified exam body that belong to the authenticated library platform. ' +
      'Supports optional subjectId/yearId filters.',
  }),
  querySubjectId: ApiQuery({
    name: 'subjectId',
    required: false,
    description: 'Filter by exam body subject ID',
  }),
  queryYearId: ApiQuery({
    name: 'yearId',
    required: false,
    description: 'Filter by exam body year ID',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessments retrieved successfully',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),
  response403: ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  }),
};

export const GetLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Get a library exam body assessment by ID',
    description:
      'Fetches a single assessment with questions, options, and correct answers, scoped to the library platform.',
  }),
  paramAssessmentId: ApiParam({
    name: 'id',
    description: 'Assessment ID',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessment retrieved successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const UpdateLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Update a library exam body assessment',
    description:
      'Updates assessment metadata for the authenticated library platform.',
  }),
  body: ApiBody({
    description: 'Assessment update payload',
    type: UpdateLibraryExamBodyAssessmentDto,
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessment updated successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const DeleteLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Delete a library exam body assessment',
    description: 'Deletes an assessment owned by the authenticated library platform.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessment deleted successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const CreateLibraryExamBodyQuestionDocs = {
  operation: ApiOperation({
    summary: 'Create a question for a library exam body assessment',
    description:
      'Creates a question (with options and correct answers) for an assessment owned by the authenticated library platform.',
  }),
  body: ApiBody({
    description: 'Question creation payload',
    type: CreateLibraryExamBodyQuestionDto,
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Question created successfully',
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or image upload failed',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const GetLibraryExamBodyQuestionsDocs = {
  operation: ApiOperation({
    summary: 'Get questions for a library exam body assessment',
    description:
      'Retrieves all questions for an assessment owned by the authenticated library platform.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const UpdateLibraryExamBodyQuestionDocs = {
  operation: ApiOperation({
    summary: 'Update a question for a library exam body assessment',
    description:
      'Updates a question and optionally replaces its options and correct answers.',
  }),
  body: ApiBody({
    description: 'Question update payload',
    type: UpdateLibraryExamBodyQuestionDto,
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Question updated successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Question not found',
  }),
};

export const DeleteLibraryExamBodyQuestionDocs = {
  operation: ApiOperation({
    summary: 'Delete a question for a library exam body assessment',
    description: 'Deletes a question owned by the authenticated library platform.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - question does not have an image',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Question not found',
  }),
};

export const PublishLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Publish a library exam body assessment',
    description: 'Marks an assessment as published for student access.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessment published successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};

export const UnpublishLibraryExamBodyAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Unpublish a library exam body assessment',
    description: 'Marks an assessment as unpublished.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Assessment unpublished successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'Assessment not found',
  }),
};
