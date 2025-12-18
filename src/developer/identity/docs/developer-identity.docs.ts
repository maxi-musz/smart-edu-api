import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const RegisterDeveloperDocs = {
  operation: ApiOperation({
    summary: 'Register a new developer',
    description:
      'Create a new developer identity for internal platform access. ' +
      'This endpoint is intended for Smart Edu Hub owners/maintainers only.',
  }),
  response201: ApiResponse({
    status: 201,
    description: 'Developer registered successfully',
  }),
};


