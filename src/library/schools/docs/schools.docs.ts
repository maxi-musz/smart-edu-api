import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GetAllSchoolsDocs = {
  operation: ApiOperation({
    summary: 'Get all schools dashboard',
    description:
      'Retrieve comprehensive dashboard data for all schools including statistics, breakdowns, and detailed information. ' +
      'This endpoint provides a complete overview suitable for dashboard UI with summary cards and detailed breakdowns. ' +
      'For each school, includes teacher count, student count, class count, subject count, parent count, user count, ' +
      'academic sessions, content counts, and subscription information. ' +
      'Also includes overall statistics grouped by status, type, and ownership. ' +
      'Response is wrapped in { success, message, data } where data contains statistics, schools array with breakdowns, and total count.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'All schools dashboard data retrieved successfully',
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to retrieve schools dashboard data',
  }),
};

export const GetSchoolByIdDocs = {
  operation: ApiOperation({
    summary: 'Get school by ID',
    description:
      'Retrieve comprehensive detailed information for a specific school by its ID. ' +
      'This endpoint provides all necessary data for displaying a school detail page including: ' +
      'school basic information, statistics (teachers, students, classes, subjects, parents, users), ' +
      'academic sessions (current and all), subscription details, recent teachers (10 most recent), recent students (10 most recent), ' +
      'all classes, all subjects, and recent content (10 most recent assessments and assignments). ' +
      'Response is wrapped in { success, message, data } where data contains school info, statistics, and detailed breakdowns.',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'School details retrieved successfully',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'School not found',
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error - Failed to retrieve school details',
  }),
};

