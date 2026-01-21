import { ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';

export class StudentsDocs {
  static submitAssessment = {
    operation: ApiOperation({ summary: 'Submit assessment answers and auto-grade' }),
    param: ApiParam({ name: 'id', description: 'Assessment ID' }),
    body: ApiBody({
      description: 'Assessment submission data',
      schema: {
        type: 'object',
        properties: {
          assessment_id: { type: 'string' },
          student_id: { type: 'string' },
          submission_time: { type: 'string', format: 'date-time' },
          time_taken: { type: 'number' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question_id: { type: 'string' },
                question_type: { type: 'string', enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY', 'NUMERIC', 'DATE'] },
                selected_options: { type: 'array', items: { type: 'string' } },
                text_answer: { type: 'string' },
                points_earned: { type: 'number' }
              }
            }
          },
          total_questions: { type: 'number' },
          questions_answered: { type: 'number' },
          questions_skipped: { type: 'number' },
          total_points_possible: { type: 'number' },
          total_points_earned: { type: 'number' },
          submission_status: { type: 'string', enum: ['COMPLETED', 'IN_PROGRESS', 'ABANDONED'] },
          device_info: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              app_version: { type: 'string' },
              device_model: { type: 'string' }
            }
          }
        }
      }
    }),
    response200: ApiResponse({ status: 200, description: 'Assessment submitted successfully' }),
    response401: ApiResponse({ status: 401, description: 'Unauthorized' }),
    response404: ApiResponse({ status: 404, description: 'Assessment not found' }),
    response403: ApiResponse({ status: 403, description: 'Access denied or maximum attempts reached' }),
  };
}

