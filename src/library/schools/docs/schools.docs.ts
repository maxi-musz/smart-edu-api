import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const OnboardSchoolDocs = {
  bearerAuth: ApiBearerAuth('library-jwt'),
  operation: ApiOperation({
    summary: 'Onboard a new school (library owner)',
    description:
      'Register a new school with required documents and information. ' +
      'Only library owners/admins can call this. The action is audited with the library user as performer.',
  }),
  consumes: ApiConsumes('multipart/form-data'),
  body: ApiBody({
    description: 'School registration data with required documents (same as auth onboard-school)',
    schema: {
      type: 'object',
      required: [
        'school_name',
        'school_email',
        'school_address',
        'school_phone',
        'school_type',
        'school_ownership',
        'academic_year',
        'current_term',
        'term_start_date',
      ],
      properties: {
        school_name: { type: 'string', example: "St. Mary's Secondary School" },
        school_email: { type: 'string', example: 'info@stmarys.edu.ng' },
        school_address: { type: 'string', example: '123 Education Street, Lagos, Nigeria' },
        school_phone: { type: 'string', example: '+2348012345678' },
        school_type: { type: 'string', enum: ['primary', 'secondary', 'primary_and_secondary', 'other'], example: 'secondary' },
        school_ownership: { type: 'string', enum: ['government', 'private', 'other'], example: 'private' },
        academic_year: { type: 'string', example: '2024/2025' },
        current_term: { type: 'string', enum: ['first', 'second', 'third'], example: 'first' },
        term_start_date: { type: 'string', format: 'date', example: '2024-09-01' },
        term_end_date: { type: 'string', format: 'date', example: '2024-12-20' },
        cac_or_approval_letter: { type: 'string', format: 'binary', description: 'CAC or approval letter' },
        utility_bill: { type: 'string', format: 'binary', description: 'Utility bill' },
        tax_cert: { type: 'string', format: 'binary', description: 'Tax clearance certificate' },
        school_icon: { type: 'string', format: 'binary', description: 'School logo/icon (optional)' },
      },
    },
  }),
  response201: ApiResponse({
    status: 201,
    description: 'School onboarded successfully',
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - e.g. school already exists or validation failed',
  }),
  response401: ApiResponse({
    status: 401,
    description: 'Unauthorized - library JWT required',
  }),
  response403: ApiResponse({
    status: 403,
    description: 'Forbidden - library owner/admin role required',
  }),
};

const libraryOnboardResponseDocs = {
  bearerAuth: ApiBearerAuth('library-jwt'),
  response201: ApiResponse({ status: 201, description: 'Created successfully' }),
  response400: ApiResponse({ status: 400, description: 'Bad request - validation or business rule failed' }),
  response401: ApiResponse({ status: 401, description: 'Unauthorized - library JWT required' }),
  response403: ApiResponse({ status: 403, description: 'Forbidden - library owner/admin role required' }),
  response404: ApiResponse({ status: 404, description: 'School not found' }),
};

export const OnboardClassesDocs = {
  ...libraryOnboardResponseDocs,
  operation: ApiOperation({
    summary: 'Onboard classes for a school (library owner)',
    description: 'Add classes to a school on behalf of the school. Requires library owner/admin. School is identified by path param. Action is audited.',
  }),
  response201: ApiResponse({ status: 201, description: 'Classes created successfully' }),
};

export const OnboardTeachersDocs = {
  ...libraryOnboardResponseDocs,
  operation: ApiOperation({
    summary: 'Onboard teachers for a school (library owner)',
    description: 'Add teachers to a school on behalf of the school. Requires library owner/admin. School is identified by path param. Action is audited.',
  }),
  response201: ApiResponse({ status: 201, description: 'Teachers onboarded successfully' }),
};

export const OnboardStudentsDocs = {
  ...libraryOnboardResponseDocs,
  operation: ApiOperation({
    summary: 'Onboard students for a school (library owner)',
    description: 'Add students to a school on behalf of the school. Requires library owner/admin. School is identified by path param. Action is audited.',
  }),
  response201: ApiResponse({ status: 201, description: 'Students onboarded successfully' }),
};

export const CreateSubjectDocs = {
  ...libraryOnboardResponseDocs,
  operation: ApiOperation({
    summary: 'Create a subject for a school (library owner)',
    description:
      'Create a subject in a school on behalf of the school. Requires library owner/admin. ' +
      'class_taking_it (school Class id) is required — use the school\'s Class id, not a library class. Action is audited.',
  }),
  response201: ApiResponse({ status: 201, description: 'Subject created successfully' }),
};

export const EditSubjectDocs = {
  ...libraryOnboardResponseDocs,
  operation: ApiOperation({
    summary: 'Edit a subject for a school (library owner)',
    description:
      'Update a subject that belongs to a school. Requires library owner/admin. School and subject are identified by path params. Action is audited.',
  }),
  response200: ApiResponse({ status: 200, description: 'Subject updated successfully' }),
};

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
      'school basic information, documents submitted by the school (CAC, tax clearance, utility bill), ' +
      'statistics (teachers, students, classes, subjects, parents, users), ' +
      'academic sessions (current and all), subscription details, recent teachers (10 most recent), recent students (10 most recent), ' +
      'all classes, all subjects, and recent content (10 most recent assessments and assignments). ' +
      'Response is wrapped in { success, message, data } where data contains school info, documentsSubmitted, statistics, and detailed breakdowns.',
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

export const ApproveSchoolDocs = {
  operation: ApiOperation({
    summary: 'Approve a school',
    description:
      'Set a school\'s status to approved. Only schools with status "pending" or "not_verified" can be approved. ' +
      'Returns the updated school (id, school_name, school_email, status, updatedAt).',
  }),
  response200: ApiResponse({
    status: 200,
    description: 'School approved successfully',
  }),
  response400: ApiResponse({
    status: 400,
    description: 'Bad request - School already approved or cannot be approved from current status',
  }),
  response404: ApiResponse({
    status: 404,
    description: 'School not found',
  }),
  response500: ApiResponse({
    status: 500,
    description: 'Internal server error',
  }),
};

