import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export class ExploreExamBodyDocs {
  static getAllExamBodies() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all exam bodies',
        description:
          'Returns all active exam bodies with their subjects and years. ' +
          'Available for authenticated school users (students, teachers, school owners).',
      }),
      ApiResponse({
        status: 200,
        description: 'Exam bodies retrieved successfully',
      }),
    );
  }

  static getExamBody() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get a single exam body',
        description:
          'Returns a single exam body with its subjects and years by ID. ' +
          'Only returns active exam bodies.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiResponse({
        status: 200,
        description: 'Exam body retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
    );
  }

  static getSubjects() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get subjects for an exam body',
        description: 'Returns all active subjects for a specific exam body.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiResponse({
        status: 200,
        description: 'Subjects retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
    );
  }

  static getYears() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get years for an exam body',
        description: 'Returns all active years for a specific exam body.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiResponse({
        status: 200,
        description: 'Years retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body not found',
      }),
    );
  }

  static getAssessments() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get published assessments',
        description:
          'Returns all published assessments for an exam body. ' +
          'Optionally filter by subjectId and/or yearId. ' +
          'Only returns published assessments.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiQuery({
        name: 'subjectId',
        required: false,
        description: 'Filter by subject ID',
        example: 'cmktpvfoc0001bdsbilpzay3x',
      }),
      ApiQuery({
        name: 'yearId',
        required: false,
        description: 'Filter by year ID',
        example: 'cmktpvfoc0001bdsbilpzay4y',
      }),
      ApiResponse({
        status: 200,
        description: 'Assessments retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Exam body, subject, or year not found',
      }),
    );
  }

  static getQuestions() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get questions for an assessment',
        description:
          'Returns all questions for a published assessment. ' +
          'IMPORTANT: Correct answers are NOT included in the response. ' +
          'Only question text, options (without isCorrect flag), and media are returned.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiParam({
        name: 'assessmentId',
        description: 'Assessment ID',
        example: 'cmktry9fc000026sbbx67fw9y',
      }),
      ApiResponse({
        status: 200,
        description: 'Questions retrieved successfully (without answers)',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found or not published',
      }),
    );
  }

  static submitAssessment() {
    return applyDecorators(
      ApiOperation({
        summary: 'Submit exam body assessment',
        description:
          'Submits an assessment for automatic grading. Results are released immediately. ' +
          'Multiple attempts are allowed based on maxAttempts setting. ' +
          'All responses are automatically graded and saved.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiParam({
        name: 'assessmentId',
        description: 'Assessment ID',
        example: 'cmktry9fc000026sbbx67fw9y',
      }),
      ApiResponse({
        status: 200,
        description: 'Assessment submitted successfully with results',
      }),
      ApiResponse({
        status: 400,
        description: 'Bad request - invalid submission data',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - no attempts remaining',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found or not published',
      }),
    );
  }

  static getAssessmentAttempts() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get attempts for a specific assessment',
        description:
          'Returns all attempts for the authenticated user for a specific assessment. ' +
          'This is a nested route under exam body and assessment.',
      }),
      ApiParam({
        name: 'examBodyId',
        description: 'Exam body ID',
        example: 'cmktpvfoc0001bdsbilpzay2w',
      }),
      ApiParam({
        name: 'assessmentId',
        description: 'Assessment ID',
        example: 'cmktry9fc000026sbbx67fw9y',
      }),
      ApiResponse({
        status: 200,
        description: 'Attempts retrieved successfully',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found',
      }),
    );
  }

  static getUserAttempts() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all attempts for authenticated user',
        description:
          'Returns all assessment attempts for the authenticated user. ' +
          'Optionally filter by assessmentId to get attempts for a specific assessment.',
      }),
      ApiQuery({
        name: 'assessmentId',
        required: false,
        description: 'Filter by assessment ID',
        example: 'cmktry9fc000026sbbx67fw9y',
      }),
      ApiResponse({
        status: 200,
        description: 'Attempts retrieved successfully',
      }),
    );
  }

  static getAttemptResults() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get attempt results',
        description:
          'Retrieves detailed results for a specific assessment attempt. ' +
          'Only the user who submitted the attempt can access it.',
      }),
      ApiParam({
        name: 'attemptId',
        description: 'Attempt ID',
        example: 'cmktry9fc000026sbbx67fw9z',
      }),
      ApiResponse({
        status: 200,
        description: 'Attempt results retrieved successfully',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - you do not have access to this attempt',
      }),
      ApiResponse({
        status: 404,
        description: 'Attempt not found',
      }),
    );
  }
}
