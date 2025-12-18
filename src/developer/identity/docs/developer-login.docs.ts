import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const LoginDeveloperDocs = {
  operation: ApiOperation({
    summary: 'Login as developer',
    description:
      'Authenticate a developer using email and password. ' +
      'Returns a token-like value and developer profile, similar in shape to school auth login.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'Developer logged in successfully',
  }),
};


