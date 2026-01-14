import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export class ExploreAssessmentDocs {
  static getAssessment() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get assessment details with user progress',
        description:
          'Retrieves assessment details including settings, user attempts, and eligibility to take the assessment. Only returns active and published assessments.',
      }),
      ApiResponse({
        status: 200,
        description: 'Assessment retrieved successfully',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Assessment not started or has ended',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found or not available',
      }),
    );
  }

  static getAssessmentQuestions() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get all questions for an assessment',
        description:
          'Retrieves all questions with options for taking the assessment. Questions and options may be shuffled based on assessment settings. Does NOT include correct answers or explanations.',
      }),
      ApiResponse({
        status: 200,
        description: 'Questions retrieved successfully',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - No attempts remaining',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found',
      }),
    );
  }

  static submitAssessment() {
    return applyDecorators(
      ApiOperation({
        summary: 'Submit assessment answers for automatic grading',
        description:
          'Submits all answers for automatic grading. Creates attempt record, grades responses, calculates score, and returns detailed results. Supports multiple question types with automatic grading.',
      }),
      ApiResponse({
        status: 200,
        description: 'Assessment submitted and graded successfully',
      }),
      ApiResponse({
        status: 400,
        description: 'Bad Request - Invalid responses',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - No attempts remaining',
      }),
      ApiResponse({
        status: 404,
        description: 'Assessment not found',
      }),
    );
  }

  static getAttemptResults() {
    return applyDecorators(
      ApiOperation({
        summary: 'Get detailed results for a specific assessment attempt',
        description:
          'Retrieves comprehensive results including all questions, user answers, correct answers (if allowed), scores, and feedback. Users can only view their own attempts.',
      }),
      ApiResponse({
        status: 200,
        description: 'Attempt results retrieved successfully',
      }),
      ApiResponse({
        status: 401,
        description: 'Unauthorized - Authentication required',
      }),
      ApiResponse({
        status: 403,
        description: 'Forbidden - Cannot view other users\' attempts',
      }),
      ApiResponse({
        status: 404,
        description: 'Attempt not found',
      }),
    );
  }
}

