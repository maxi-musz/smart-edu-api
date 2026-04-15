import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ReleaseResultsForStudentsDto } from '../dto/release-results.dto';

const sessionIdQuery = ApiQuery({
  name: 'session_id',
  required: false,
  description: 'Academic session ID (defaults to current active session)',
});

const unauthorized = ApiResponse({ status: 401, description: 'Unauthorized' });
const forbiddenDirector = ApiResponse({
  status: 403,
  description: 'Forbidden - Director role required',
});

/** POST /director/results/release */
export function DocReleaseWholeSchool() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Release results for all students in current session (WHOLE SCHOOL)',
      description:
        'Collates all CA and Exam scores for all students in the school and creates Result records. This is a batch operation that processes students in batches to avoid system overload.',
    }),
    ApiResponse({ status: 200, description: 'Results released successfully' }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({
      status: 404,
      description: 'No current session or students found',
    }),
  );
}

/** POST /director/results/release/student/:studentId */
export function DocReleaseStudent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Release results for a single student',
      description:
        'Collates all CA and Exam scores for a specific student and creates/updates their Result record. Only results released by school admin can be viewed by students.',
    }),
    ApiParam({ name: 'studentId', description: 'Student ID' }),
    sessionIdQuery,
    ApiResponse({
      status: 200,
      description: 'Results released successfully for student',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'Student not found' }),
  );
}

/** POST /director/results/release/class/:classId */
export function DocReleaseClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Release results for all students in a specific class',
      description:
        'Collates all CA and Exam scores for all students in a class and creates/updates their Result records. Only results released by school admin can be viewed by students.',
    }),
    ApiParam({ name: 'classId', description: 'Class ID' }),
    sessionIdQuery,
    ApiResponse({
      status: 200,
      description: 'Results released successfully for class',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'Class or students not found' }),
  );
}

/** POST /director/results/release/students */
export function DocReleaseStudents() {
  return applyDecorators(
    ApiOperation({
      summary: 'Release results for multiple students by their IDs',
      description:
        'Collates all CA and Exam scores for specified students and creates/updates their Result records. Accepts an array of student IDs in the request body. Only results released by school admin can be viewed by students.',
    }),
    ApiBody({ type: ReleaseResultsForStudentsDto }),
    ApiResponse({
      status: 200,
      description: 'Results released successfully for students',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input or no assessments found',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({
      status: 404,
      description: 'No students found with provided IDs',
    }),
  );
}

/** POST /director/results/unrelease */
export function DocUnreleaseWholeSchool() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Unrelease results for all students in current session (WHOLE SCHOOL)',
      description:
        'Sets released_by_school_admin to false for all students in the school. Results remain in database but students cannot view them.',
    }),
    sessionIdQuery,
    ApiResponse({ status: 200, description: 'Results unreleased successfully' }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'No current session found' }),
  );
}

/** POST /director/results/unrelease/student/:studentId */
export function DocUnreleaseStudent() {
  return applyDecorators(
    ApiOperation({
      summary: 'Unrelease results for a single student',
      description:
        'Sets released_by_school_admin to false for a specific student. Result remains in database but student cannot view it.',
    }),
    ApiParam({ name: 'studentId', description: 'Student ID' }),
    sessionIdQuery,
    ApiResponse({
      status: 200,
      description: 'Results unreleased successfully for student',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'Result not found' }),
  );
}

/** POST /director/results/unrelease/students */
export function DocUnreleaseStudents() {
  return applyDecorators(
    ApiOperation({
      summary: 'Unrelease results for multiple students by their IDs',
      description:
        'Sets released_by_school_admin to false for specified students. Results remain in database but students cannot view them.',
    }),
    ApiBody({ type: ReleaseResultsForStudentsDto }),
    ApiResponse({
      status: 200,
      description: 'Results unreleased successfully for students',
    }),
    ApiResponse({ status: 400, description: 'Bad request - Invalid input' }),
    unauthorized,
    forbiddenDirector,
  );
}

/** POST /director/results/unrelease/class/:classId */
export function DocUnreleaseClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Unrelease results for all students in a specific class',
      description:
        'Sets released_by_school_admin to false for all students in a class. Results remain in database but students cannot view them.',
    }),
    ApiParam({ name: 'classId', description: 'Class ID' }),
    sessionIdQuery,
    ApiResponse({
      status: 200,
      description: 'Results unreleased successfully for class',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'Class or students not found' }),
  );
}

/** GET /director/results/dashboard */
export function DocGetResultsDashboard() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get results dashboard data for director',
      description:
        'Last 10 sessions, classes ordered by display_order, per-subject CBT and EXAM scores (preview before release). Paginated students with optional search.',
    }),
    ApiQuery({
      name: 'session_id',
      required: false,
      description: 'Academic session ID (defaults to current active session)',
    }),
    ApiQuery({
      name: 'class_id',
      required: false,
      description:
        'Class ID (defaults to first teaching class by display_order, excludes graduates sink)',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Filter students by name, student_id, or admission_number',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      description: 'Alias for search',
    }),
    ApiQuery({
      name: 'student_status',
      required: false,
      description:
        'Student status: active | suspended | inactive (default active)',
    }),
    ApiResponse({
      status: 200,
      description: 'Results dashboard retrieved successfully',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Director role required',
    }),
  );
}

/** GET /director/results/fetch-result-dashboard */
export function DocFetchResultDashboardAlias() {
  return applyDecorators(
    ApiOperation({
      summary: 'Fetch results dashboard (alias of GET dashboard)',
      description:
        'Identical to GET /director/results/dashboard. Single endpoint for sessions, classes, subject assessment slots, and paginated student score matrix.',
    }),
    ApiQuery({
      name: 'session_id',
      required: false,
      description: 'Academic session ID (defaults to current active session)',
    }),
    ApiQuery({
      name: 'class_id',
      required: false,
      description:
        'Class ID (defaults to first teaching class by display_order)',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Filter students by name, student_id, or admission_number',
    }),
    ApiQuery({
      name: 'q',
      required: false,
      description: 'Alias for search',
    }),
    ApiQuery({
      name: 'student_status',
      required: false,
      description: 'active | suspended | inactive (default active)',
    }),
    ApiResponse({
      status: 200,
      description: 'Results dashboard retrieved successfully',
    }),
  );
}
