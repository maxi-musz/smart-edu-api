import { Controller, Post, Get, Patch, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { CreateNewAssessmentDto, GetAssessmentsQueryDto, UpdateAssessmentDto, SubmitAssessmentDto } from './dto';
import { UnifiedJwtGuard } from './guards';
import { GetUser } from '../school/auth/decorator/get-user-decorator';

@ApiTags('Centralized Assessment')
@ApiBearerAuth()
@UseGuards(UnifiedJwtGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('createnewassessment')
  @ApiOperation({ 
    summary: 'Create a new Assessment (Unified Endpoint)',
    description: `
      This unified endpoint handles assessment creation for all user types:
      
      **For Library Owners (LibraryResourceUser):**
      - Creates a LibraryAssessment in the library platform
      - subject_id must be a valid LibrarySubject ID
      - topic_id (optional) must be a valid LibraryTopic ID
      
      **For School Users (Teacher/Director/Admin):**
      - Creates a school Assessment
      - subject_id must be a valid school Subject ID
      - topic_id (optional) must be a valid school Topic ID
      - Directors/Admins have unrestricted access to all subjects
      - Teachers must be assigned to the subject
      
      The endpoint automatically detects user type based on JWT token.
    `
  })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to topic/subject' })
  @ApiResponse({ status: 404, description: 'Not found - Topic, subject, or user not found' })
  @ApiBody({ type: CreateNewAssessmentDto })
  async createNewAssessment(
    @Body() createAssessmentDto: CreateNewAssessmentDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.createNewAssessment(createAssessmentDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all Assessments (Paginated, Role-Based)',
    description: `
      Fetches assessments with pagination, filtering, and role-based access control.
      
      **Role-Based Access:**
      - **School Director/Admin:** All assessments in the school
      - **Teacher:** Only assessments for subjects/topics they teach
      - **Student:** Only published or closed assessments for subjects in their class
      
      **Default Behavior:**
      - Returns assessments from the current active academic session/term
      - All filters are optional
      
      **Filters Available:**
      - academic_session_id: Override default session
      - term: Filter by academic term (first, second, third)
      - subject_id: Filter by subject
      - topic_id: Filter by topic
      - status: Filter by assessment status (DRAFT, PUBLISHED, CLOSED)
      - assessment_type: Filter by type (CBT, MANUAL)
      - is_published: Filter by published state
      - created_by: Filter by creator (for directors/admins)
      - search: Search in title/description
    `
  })
  @ApiResponse({ status: 200, description: 'Assessments fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid filters or no active session' })
  @ApiResponse({ status: 404, description: 'Not found - User not found' })
  async getAllAssessments(
    @Query() query: GetAssessmentsQueryDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.getAllAssessments(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Assessment Details by ID',
    description: `
      Fetches complete assessment details including questions and submission attempts.
      
      **Role-Based Access:**
      - **School Director/Admin:** Full access to any assessment in the school
      - **Teacher:** Full access to assessments for subjects they teach
      - **Student:** Limited view (own attempts only, questions without answers unless allowed)
      
      **Response varies by role:**
      - Teachers/Directors: Full assessment info, all questions with answers, all student submissions
      - Students: Assessment info, questions (answers hidden unless allowed), own attempts only
    `
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment details retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - No active session' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this assessment' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or user not found' })
  async getAssessmentDetails(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getAssessmentDetails(assessmentId, user);
  }

//   Update an assessment
// 
  @Patch(':id')
  @ApiOperation({
    summary: 'Update Assessment (Partial Update)',
    description: `
      Updates an assessment with partial data (PATCH behavior).
      Only the fields provided in the request body will be updated.
      
      **Important Restrictions:**
      - Cannot update assessments with status PUBLISHED or ACTIVE
      - To modify a published assessment, first change its status to DRAFT
      - Students cannot update assessments
      
      **Role-Based Access:**
      - **Library Owner:** Can update any LibraryAssessment they created in their platform
      - **School Director/Admin:** Can update any assessment in their school
      - **Teacher:** Can update assessments they created for subjects they teach
      
      **Status Change Side Effects:**
      - Changing status to PUBLISHED/ACTIVE sets is_published=true and published_at timestamp
      - Changing from PUBLISHED/ACTIVE to DRAFT sets is_published=false
      - Cannot publish an assessment with an end_date in the past
    `
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiBody({ type: UpdateAssessmentDto })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot update published assessment or invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to update this assessment' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or user not found' })
  async updateAssessment(
    @Param('id') assessmentId: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.updateAssessment(assessmentId, updateAssessmentDto, user);
  }

//   Get Questions for an assessment so student can take/work on an assessment 
  @Get(':id/questions')
  @ApiOperation({
    summary: 'Get Assessment Questions for Taking Assessment',
    description: `
      Fetches assessment questions for a student/user to take the assessment.
      This endpoint is specifically for students attempting an assessment.
      
      **Validation Checks:**
      - Assessment must be PUBLISHED or ACTIVE
      - Assessment must be within start_date and end_date range
      - User must have remaining attempts (attempts < max_attempts)
      - For school students: Must be enrolled in a class with the assessment's subject
      - For library users: Must have access to the platform
      
      **Response:**
      - Assessment metadata (title, duration, instructions, etc.)
      - Questions with options (correct answers hidden unless explicitly allowed)
      - Current attempt count and remaining attempts
      
      **Note:** Questions may be shuffled if shuffle_questions is enabled on the assessment.
    `
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment questions retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Assessment not available or expired' })
  @ApiResponse({ status: 403, description: 'Forbidden - Maximum attempts reached or access denied' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or user not found' })
  async getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getAssessmentQuestions(assessmentId, user);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Submit Assessment Answers',
    description: `
      Submits student/user answers for an assessment and auto-grades where possible.
      
      **Validation Checks:**
      - Assessment must be PUBLISHED or ACTIVE
      - Assessment must be within date range (or not enforce strict timing)
      - User must have remaining attempts
      - For school students: Must be enrolled in a class with the assessment's subject
      - For library users: Must have access to the platform
      
      **Auto-Grading:**
      - MULTIPLE_CHOICE, TRUE_FALSE: Compared against correct option IDs
      - FILL_IN_BLANK: Case-insensitive text match
      - NUMERIC: Tolerance-based comparison (±0.01)
      - ESSAY: Marked as requiring manual review (0 points initially)
      
      **Response:**
      - Attempt ID and score details
      - Per-question breakdown with is_correct flags
      - Grade letter and pass/fail status
    `
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiBody({ type: SubmitAssessmentDto })
  @ApiResponse({ status: 200, description: 'Assessment submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Assessment not available, expired, or invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Maximum attempts reached or access denied' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or user not found' })
  async submitAssessment(
    @Param('id') assessmentId: string,
    @Body() submitDto: SubmitAssessmentDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.submitAssessment(assessmentId, submitDto, user);
  }
}