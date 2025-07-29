import { ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { BulkOnboardResponseDto } from 'src/shared/dto/bulk-onboard.dto';

// Bulk Onboard from Excel Documentation
export const BulkOnboardDocs = {
  operation: ApiOperation({
    summary: 'Bulk onboard users from Excel file',
    description: 'Upload an Excel file to bulk onboard teachers, students, and directors. The Excel file must have the following columns: First Name, Last Name, Email, Phone, Class, Role.'
  }),
  consumes: ApiConsumes('multipart/form-data'),
  body: ApiBody({
    description: 'Excel file with user data for bulk onboarding',
    schema: {
      type: 'object',
      properties: {
        excel_file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx, .xls) with user data'
        }
      },
      required: ['excel_file']
    }
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response201: ApiResponse({
    status: 201,
    description: 'Bulk onboarding completed successfully',
    type: BulkOnboardResponseDto
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - Invalid Excel file or data'
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
};

// Download Excel Template Documentation
export const DownloadTemplateDocs = {
  operation: ApiOperation({
    summary: 'Download Excel template for bulk onboarding',
    description: 'Download a pre-formatted Excel template with the correct column headers and example data for bulk onboarding'
  }),
  bearerAuth: ApiBearerAuth('JWT-auth'),
  response200: ApiResponse({
    status: 200,
    description: 'Excel template file downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary'
    }
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token'
  })
}; 