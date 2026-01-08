import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { CreateLibraryAssessmentDto } from '../dto/create-assessment.dto';
import { UpdateLibraryAssessmentDto } from '../dto/update-assessment.dto';
import { CreateLibraryAssessmentQuestionDto } from '../dto/create-question.dto';
import { UpdateLibraryAssessmentQuestionDto } from '../dto/update-question.dto';

export const CreateAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Create a new Library Assessment',
    description:
      'Create a new assessment for library content. Assessments can be attached to a subject (whole), chapter, or topic. ' +
      'The assessment will be created in DRAFT status and must be published before users can take it. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the created assessment.',
  }),

  body: ApiBody({
    description: 'Assessment creation data',
    type: CreateLibraryAssessmentDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Assessment created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data or validation error',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Library user not found, subject/chapter/topic not found or does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GetAssessmentsByTopicDocs = {
  operation: ApiOperation({
    summary: 'Get all assessments under a topic',
    description:
      'Retrieves all published assessments associated with a specific library topic. ' +
      'Only assessments from the user\'s platform are returned. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the topic information and assessments list.',
  }),

  param: ApiParam({
    name: 'topicId',
    description: 'The ID of the topic to get assessments for',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessments retrieved successfully',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Library user not found or topic not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GetAssessmentByIdDocs = {
  operation: ApiOperation({
    summary: 'Get a specific assessment by ID',
    description:
      'Retrieves a specific assessment with all its questions, options, and correct answers. ' +
      'Only assessments created by the authenticated user are accessible. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment retrieved successfully',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const GetAssessmentQuestionsDocs = {
  operation: ApiOperation({
    summary: 'Get all questions for a specific assessment',
    description:
      'Retrieves all questions for an assessment with their options and correct answers. ' +
      'Only assessments created by the authenticated user are accessible. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Questions retrieved successfully',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const UploadQuestionImageDocs = {
  operation: ApiOperation({
    summary: 'Upload an image for a question (use this before creating the question)',
    description:
      'Uploads an image file to S3 for use in a question. Returns the image URL and S3 key which should be used when creating the question. ' +
      'Image must be JPEG, PNG, GIF, or WEBP format and max 5MB. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WEBP, max 5MB)',
        },
      },
      required: ['image'],
    },
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid image file',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const CreateQuestionDocs = {
  operation: ApiOperation({
    summary: 'Add a new question to an assessment',
    description:
      'Creates a new question for an assessment. If you have an image, upload it first using /upload-image endpoint and use the returned imageUrl here. ' +
      'Options and correct answers can be provided for multiple choice questions. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  body: ApiBody({
    description: 'Question data. If you have an image, upload it first using /upload-image endpoint and use the returned imageUrl here.',
    type: CreateLibraryAssessmentQuestionDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Question created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid question data or assessment is closed/archived',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const UpdateQuestionDocs = {
  operation: ApiOperation({
    summary: 'Update a specific question in an assessment',
    description:
      'Updates a question in an assessment. Can optionally upload a new image file. ' +
      'Options and correct answers will be completely replaced if provided. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  paramAssessment: ApiParam({
    name: 'assessmentId',
    description: 'ID of the assessment',
    type: String,
  }),

  paramQuestion: ApiParam({
    name: 'questionId',
    description: 'ID of the question',
    type: String,
  }),

  consumes: ApiConsumes('multipart/form-data'),

  body: ApiBody({
    description: 'Updated question data with optional image file',
    type: UpdateLibraryAssessmentQuestionDto,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Question updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid question data or assessment is closed/archived',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment or question not found or access denied',
  }),
};

export const DeleteQuestionImageDocs = {
  operation: ApiOperation({
    summary: 'Delete the image for a specific question',
    description:
      'Deletes the image associated with a question. The image will be removed from S3 and the question record. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  paramAssessment: ApiParam({
    name: 'assessmentId',
    description: 'ID of the assessment',
    type: String,
  }),

  paramQuestion: ApiParam({
    name: 'questionId',
    description: 'ID of the question',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Question image deleted successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Question does not have an image or assessment is closed',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment or question not found or access denied',
  }),
};

export const DeleteQuestionDocs = {
  operation: ApiOperation({
    summary: 'Delete a specific question from an assessment',
    description:
      'Deletes a question from an assessment. Cannot delete questions that have user responses. ' +
      'The question image will also be deleted from S3. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  paramAssessment: ApiParam({
    name: 'assessmentId',
    description: 'ID of the assessment',
    type: String,
  }),

  paramQuestion: ApiParam({
    name: 'questionId',
    description: 'ID of the question',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Question deleted successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete question with responses',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment or question not found or access denied',
  }),
};

export const UpdateAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Update an assessment',
    description:
      'Updates assessment details. Can change subject, chapter, topic, settings, and status. ' +
      'If status is changed to PUBLISHED/ACTIVE, the assessment will be published. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  body: ApiBody({
    description: 'Assessment update data',
    type: UpdateLibraryAssessmentDto,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const DeleteAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Delete an assessment',
    description:
      'Deletes an assessment. Cannot delete assessments that have user attempts. ' +
      'Consider archiving instead if users have taken the assessment. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment deleted successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Cannot delete assessment with attempts',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const PublishAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Publish an assessment',
    description:
      'Publishes an assessment, making it available to all users. ' +
      'The assessment must have at least one question to be published. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment published successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Cannot publish assessment without questions',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const UnpublishAssessmentDocs = {
  operation: ApiOperation({
    summary: 'Unpublish an assessment',
    description:
      'Unpublishes an assessment, making it unavailable to users. ' +
      'The assessment status will be changed to DRAFT. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment unpublished successfully',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const ReleaseResultsDocs = {
  operation: ApiOperation({
    summary: 'Release assessment results and close the assessment',
    description:
      'Releases the assessment results to all users who took it and closes the assessment. ' +
      'Once results are released, the assessment cannot be modified. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'id',
    description: 'ID of the assessment',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment results released successfully. Assessment has been closed.',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found or access denied',
  }),
};

export const GetAssessmentAnalyticsDocs = {
  operation: ApiOperation({
    summary: 'Get assessment analytics with user participation',
    description:
      'Retrieves detailed analytics for an assessment including user participation breakdown, scores, pass rates, and individual user performance. ' +
      'Only assessments created by the authenticated user are accessible. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'assessmentId',
    description: 'The ID of the assessment to get analytics for',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Assessment analytics retrieved successfully',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - Assessment not found',
  }),
};

export const GetUserAssessmentHistoryDocs = {
  operation: ApiOperation({
    summary: 'Get assessment history for a specific user',
    description:
      'Retrieves all assessment attempts and performance history for a specific user across all library assessments. ' +
      'Requires a valid JWT token in the Authorization header.',
  }),

  param: ApiParam({
    name: 'userId',
    description: 'The ID of the user to get assessment history for',
    type: String,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'User assessment history retrieved successfully',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - User not found',
  }),
};

