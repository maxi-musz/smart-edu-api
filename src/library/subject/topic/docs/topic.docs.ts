import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreateTopicDto,
  ReorderTopicDto,
  UpdateTopicDto,
} from '../dto/topic.dto';

export const CreateTopicDocs = {
  operation: ApiOperation({
    summary: 'Create a new topic',
    description:
      "Create a new topic under a specific library subject for the authenticated library user's platform. " +
      "The topic will be associated with the user's platform and the specified subject. " +
      'Topics are the organizational unit that can contain video lessons and materials. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the created topic with subject information.',
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
    description:
      "Not found - library user not found, or subject not found/does not belong to user's platform",
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
      "Update topic details (title, description, order, is_active) for the authenticated library user's platform. " +
      'Only provided fields will be updated. ' +
      'To change a topic’s position in the subject list (drag-and-drop), use PATCH reorder instead of setting order here, so indices shift correctly. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the updated topic with subject information.',
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
    description:
      "Not found - library user not found or topic not found/does not belong to user's platform",
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const ReorderTopicDocs = {
  operation: ApiOperation({
    summary: 'Reorder a topic (drag-and-drop)',
    description:
      'PATCH library/subject/topic/reorder/:topicId (app-wide prefix applies, e.g. /api/v1). ' +
      'Moves a topic to a new 1-based position within its subject. Other topics shift so order stays dense 1..N (e.g. move 9→7: old 7→8, old 8→9). ' +
      'Body: currentOrder = row index before the move, newOrder = after — same ordering as GET topics (order ascending, then id ascending). ' +
      'newOrder is usually 1..N; N+1 is accepted as an alias for “after the last row” (normalized to N, list size unchanged). ' +
      'currentOrder must match the server (topic at that index must be topicId); otherwise refresh the list and retry. ' +
      'currentOrder must be in 1..N; newOrder must be in 1..N or N+1. ' +
      'Requires a valid JWT. On success after a move, data is { topic, updatedCount }. If currentOrder equals newOrder, data is the topic alone (no updatedCount).',
  }),

  body: ApiBody({
    description: 'Previous and target list positions (1-based)',
    type: ReorderTopicDto,
  }),

  response200: ApiResponse({
    status: 200,
    description:
      'Order updated, or unchanged (no-op). Payload shape: { topic, updatedCount } after a real move; topic only when positions are equal.',
  }),

  response400: ApiResponse({
    status: 400,
    description:
      'Bad request - validation error, bounds error (newOrder must be 1..N or N+1), or currentOrder out of sync with server',
  }),

  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  }),

  response404: ApiResponse({
    status: 404,
    description:
      "Not found - library user not found or topic not found/does not belong to user's platform",
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GetTopicMaterialsDocs = {
  operation: ApiOperation({
    summary: 'Get all materials for a topic',
    description:
      'Retrieves all content associated with a specific library topic, including videos, materials, links, assignments, and comments. ' +
      'Only published content is returned. Comments include nested replies. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the topic information, statistics, and all associated content.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Topic materials retrieved successfully',
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
    description:
      "Not found - library user not found or topic not found/does not belong to user's platform",
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const GetTopicsBySubjectDocs = {
  operation: ApiOperation({
    summary: 'Get all topics for a subject',
    description:
      'Retrieves all topics associated with a specific library subject. ' +
      'Topics are sorted by `order` ascending, then `id` ascending (stable list positions 1..N for drag-and-drop reorder). ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains the subject information and an array of topics.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Topics retrieved successfully',
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
    description:
      "Not found - library user not found or subject not found/does not belong to user's platform",
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

export const DeleteTopicDocs = {
  operation: ApiOperation({
    summary: 'Delete a topic',
    description:
      "Delete a topic from the authenticated library user's platform. " +
      'The topic and all its associated resources (videos, materials, links, assignments) will be deleted. ' +
      'This action cannot be undone. ' +
      'Requires a valid JWT token in the Authorization header. ' +
      'Response is wrapped in { success, message, data } where data contains information about the deleted topic and resource count.',
  }),

  response200: ApiResponse({
    status: 200,
    description: 'Topic deleted successfully',
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
    description:
      "Not found - library user not found or topic not found/does not belong to user's platform",
  }),

  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};
