import { ApiOperation, ApiParam, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

export class AssessmentDocs {
  static createQuestionWithImage = {
    operation: ApiOperation({ 
      summary: 'Create question with image in single request (RECOMMENDED)',
      description: 'Upload image and create question atomically. If question creation fails, image is automatically deleted from S3. This prevents orphaned images.'
    }),
    param: ApiParam({ name: 'id', description: 'ID of the assessment' }),
    consumes: ApiConsumes('multipart/form-data'),
    body: ApiBody({
      description: 'Question data as JSON string + optional image file',
      schema: {
        type: 'object',
        properties: {
          image: {
            type: 'string',
            format: 'binary',
            description: 'Optional image file (JPEG, PNG, GIF, WEBP, max 5MB)'
          },
          questionData: {
            type: 'string',
            description: 'JSON string of question data (CreateAssessmentQuestionDto)',
            example: JSON.stringify({
              question_text: "What is shown in the image?",
              question_type: "MULTIPLE_CHOICE_SINGLE",
              points: 2,
              options: [
                { option_text: "Triangle", order: 1, is_correct: true },
                { option_text: "Square", order: 2, is_correct: false }
              ]
            })
          }
        },
        required: ['questionData']
      }
    }),
    response201: ApiResponse({ status: 201, description: 'Question created successfully with image' }),
    response400: ApiResponse({ status: 400, description: 'Bad request - Invalid data or image' }),
    response404: ApiResponse({ status: 404, description: 'Not found - Assessment not found' }),
    response403: ApiResponse({ status: 403, description: 'Forbidden - No access to assessment' }),
  };
}

