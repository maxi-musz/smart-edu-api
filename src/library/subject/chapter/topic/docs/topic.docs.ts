import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateTopicDto, UpdateTopicDto } from '../dto/topic.dto';

export const CreateTopicDocs = {
  operation: ApiOperation({
    summary: 'Create a new topic',
    description:
      'Create a new topic under a specific library chapter for the authenticated library user\'s platform. ' +
      'The topic will be associated with the user\'s platform, the specified chapter, and subject. ' +
      'Topics are the smallest organizational unit and can contain video lessons and materials. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the created topic with chapter and subject information.',
  }),

  body: ApiBody({
    description: 'Topic creation data',
    type: CreateTopicDto,
  }),

  response201: ApiResponse({
    status: 201,
    description: 'Topic created successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found, chapter not found, or subject not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const UpdateTopicDocs = {
  operation: ApiOperation({
    summary: 'Update a topic',
    description:
      'Update topic details (title, description, order, is_active) for the authenticated library user\'s platform. ' +
      'Only provided fields will be updated. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the updated topic with chapter and subject information.',
  }),

  body: ApiBody({
    description: 'Topic update data (all fields optional)',
    type: UpdateTopicDto,
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Topic updated successfully',
  }),

  response400: ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description: 'Not found - library user not found or topic not found/does not belong to user\'s platform',
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

