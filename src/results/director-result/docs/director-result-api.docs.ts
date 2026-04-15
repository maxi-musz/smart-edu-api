import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ReleaseResultsForStudentsDto } from '../dto/release-results.dto';
import {
  ComputeResultsForStudentsDto,
  ReverseComputationBatchDto,
} from '../dto/compute-results.dto';

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
        'Publish results for all students in current session (WHOLE SCHOOL)',
      description:
        'Sets visibility so students can see their stored results. Requires computed `Result` rows (use compute endpoints first). Does not recalculate scores.',
    }),
    ApiResponse({ status: 200, description: 'Results published successfully' }),
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
      summary: 'Publish results for a single student',
      description:
        'Makes an existing computed result visible to the student. Does not recalculate scores.',
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
      summary: 'Publish results for all students in a class',
      description:
        'Publishes visibility for students in the class who already have computed results. Does not recalculate scores.',
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
      summary: 'Publish results for multiple students',
      description:
        'Sets visibility for students who already have computed `Result` rows. Body: student IDs + optional session.',
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

/** POST /director/results/compute/students */
export function DocComputeStudents() {
  return applyDecorators(
    ApiOperation({
      summary: 'Compute results for one or more students',
      description:
        'Collates released assessment attempts into `Result` rows (not visible to students until publish). Returns a `batch_id` for reversal.',
    }),
    ApiBody({ type: ComputeResultsForStudentsDto }),
    ApiResponse({
      status: 200,
      description: 'Computation finished (see errors count in payload)',
    }),
    ApiResponse({
      status: 400,
      description: 'No released assessments or invalid session',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'No matching students' }),
  );
}

/** POST /director/results/compute/class/:classId */
export function DocComputeClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Compute results for all students in a class',
      description:
        'Same as compute/students but for every active student in the class. Returns `batch_id`.',
    }),
    ApiParam({ name: 'classId', description: 'Class ID' }),
    sessionIdQuery,
    ApiResponse({ status: 200, description: 'Computation finished' }),
    ApiResponse({
      status: 400,
      description: 'No released assessments',
    }),
    unauthorized,
    forbiddenDirector,
    ApiResponse({ status: 404, description: 'No students in class' }),
  );
}

/** POST /director/results/compute/reverse */
export function DocReverseComputationBatch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reverse a computation batch',
      description:
        'Deletes `Result` rows tied to the batch if none are published. Unpublish first if needed.',
    }),
    ApiBody({ type: ReverseComputationBatchDto }),
    ApiResponse({ status: 200, description: 'Batch reversed' }),
    ApiResponse({ status: 400, description: 'Already reversed' }),
    ApiResponse({ status: 404, description: 'Batch not found' }),
    ApiResponse({
      status: 409,
      description: 'Conflict — some results are still published',
    }),
    unauthorized,
    forbiddenDirector,
  );
}
