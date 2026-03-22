import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import {
  CreateNewAssessmentDto,
  GetAssessmentsQueryDto,
  UpdateAssessmentDto,
  SubmitAssessmentDto,
  DuplicateAssessmentDto,
  AddQuestionsDto,
  UpdateQuestionDto,
} from './dto';
import { UnifiedJwtGuard } from './guards';
import { GetUser } from '../school/auth/decorator/get-user-decorator';

@ApiTags('Centralized Assessment')
@ApiBearerAuth()
@UseGuards(UnifiedJwtGuard)
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // ============================================================
  // Create a new assessment (school or library)
  // Route: POST /assessment/createnewassessment
  // Protected: School Directors, Admins, Teachers, Library Owners
  // ============================================================
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
    `,
  })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to topic/subject',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Topic, subject, or user not found',
  })
  @ApiBody({ type: CreateNewAssessmentDto })
  async createNewAssessment(
    @Body() createAssessmentDto: CreateNewAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.createNewAssessment(
      createAssessmentDto,
      user,
    );
  }

  // ============================================================
  // Get all assessments with pagination, filters, and analytics
  // Route: GET /assessment
  // Protected: All authenticated users (role-based filtering applied)
  //   - Directors/Admins: All school assessments
  //   - Teachers: Assessments for subjects they teach
  //   - Students: Published/Closed assessments for their class subjects
  //   - Library Owners: All library assessments in their platform
  // ============================================================
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
    `,
  })
  @ApiResponse({ status: 200, description: 'Assessments fetched successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid filters or no active session',
  })
  @ApiResponse({ status: 404, description: 'Not found - User not found' })
  async getAllAssessments(
    @Query() query: GetAssessmentsQueryDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.getAllAssessments(query, user);
  }

  // ============================================================
  // Get full assessment details with questions and submissions
  // Route: GET /assessment/:id
  // Protected: All authenticated users (role-based data filtering)
  //   - Directors/Admins/Teachers: Full details with all submissions
  //   - Students: Limited view (own attempts only, answers hidden)
  //   - Library Owners: Full details for their platform assessments
  // ============================================================
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
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({
    status: 200,
    description: 'Assessment details retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - No active session' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access to this assessment',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async getAssessmentDetails(
    @Param('id') assessmentId: string,
    @GetUser() user: any,
  ) {
    return this.assessmentService.getAssessmentDetails(assessmentId, user);
  }

  // ============================================================
  // Update an assessment (partial update - PATCH behavior)
  // Route: PATCH /assessment/:id
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Cannot update PUBLISHED or ACTIVE assessments
  //   - Students cannot update assessments
  // ============================================================
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
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiBody({ type: UpdateAssessmentDto })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Cannot update published assessment or invalid data',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have access to update this assessment',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async updateAssessment(
    @Param('id') assessmentId: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.updateAssessment(
      assessmentId,
      updateAssessmentDto,
      user,
    );
  }

  // ============================================================
  // Get assessment questions for taking/attempting
  // Route: GET /assessment/:id/questions
  // Protected: Students, Library Users
  //   - Assessment must be PUBLISHED or ACTIVE
  //   - User must have remaining attempts
  //   - Correct answers are hidden from students
  //   - Teachers/Directors get preview mode with answers shown
  // ============================================================
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
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({
    status: 200,
    description: 'Assessment questions retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Assessment not available or expired',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Maximum attempts reached or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @GetUser() user: any,
  ) {
    return this.assessmentService.getAssessmentQuestions(assessmentId, user);
  }

  // ============================================================
  // Submit assessment answers for grading
  // Route: POST /assessment/:id/submit
  // Protected: Students, Library Users
  //   - Assessment must be PUBLISHED or ACTIVE
  //   - User must have remaining attempts
  //   - Auto-grades MCQ, True/False, Fill-in-blank, Numeric
  //   - Essay questions marked for manual review
  // ============================================================
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
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiBody({ type: SubmitAssessmentDto })
  @ApiResponse({
    status: 200,
    description: 'Assessment submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Assessment not available, expired, or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Maximum attempts reached or access denied',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async submitAssessment(
    @Param('id') assessmentId: string,
    @Body() submitDto: SubmitAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.submitAssessment(
      assessmentId,
      submitDto,
      user,
    );
  }

  // ============================================================
  // Duplicate an existing assessment with optional shuffling
  // Route: POST /assessment/:id/duplicate
  // Protected: Directors, Admins, Teachers, Library Owners
  //   - Copies all questions, options, and correct answers
  //   - New assessment created with DRAFT status
  //   - Students cannot duplicate assessments
  // ============================================================
  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate an Existing Assessment',
    description: `
      Creates a copy of an existing assessment with a new title.
      
      **Use Cases:**
      - Teacher wants to reuse questions from a previous assessment
      - Create variations of the same test with shuffled content
      - Quickly set up similar assessments for different classes/terms
      
      **Features:**
      - Copies all questions and options from the source assessment
      - Optionally shuffles question order for the new assessment
      - Optionally shuffles option order within each question
      - New assessment is created with DRAFT status (not published)
      - Questions retain their points, hints, media, and all other properties
      
      **Role-Based Access:**
      - **Library Owner:** Can duplicate any LibraryAssessment in their platform
      - **School Director/Admin:** Can duplicate any assessment in their school
      - **Teacher:** Can duplicate assessments for subjects they teach
      - **Student:** Cannot duplicate assessments
      
      **Note:** The duplicated assessment gets a new ID and belongs to the current user.
    `,
  })
  @ApiParam({ name: 'id', description: 'Source Assessment ID to duplicate' })
  @ApiBody({ type: DuplicateAssessmentDto })
  @ApiResponse({
    status: 201,
    description: 'Assessment duplicated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have access to duplicate this assessment',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async duplicateAssessment(
    @Param('id') assessmentId: string,
    @Body() duplicateDto: DuplicateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.duplicateAssessment(
      assessmentId,
      duplicateDto,
      user,
    );
  }

  // ============================================================
  // Add questions to an existing assessment
  // Route: POST /assessment/:id/questions
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Cannot add questions to PUBLISHED or ACTIVE assessments
  //   - Students cannot add questions
  //   - Supports batch creation (multiple questions at once)
  //   - Each question can include options and correct answers
  // ============================================================
  @Post(':id/questions')
  @ApiOperation({
    summary: 'Add Questions to an Assessment',
    description: `
      Adds one or more questions to an existing assessment.
      
      **Supports All Question Types:**
      - MULTIPLE_CHOICE_SINGLE / MULTIPLE_CHOICE_MULTIPLE: Include options with is_correct flags
      - TRUE_FALSE: Include two options (True/False) with is_correct flags
      - SHORT_ANSWER / LONG_ANSWER / ESSAY: No options needed, optional correct_answers for auto-grading
      - FILL_IN_BLANK: Include correct_answers with answer_text for auto-grading
      - NUMERIC: Include correct_answers with answer_number
      - DATE: Include correct_answers with answer_date
      - MATCHING / ORDERING: Include correct_answers with answer_json
      
      **Batch Support:** Send multiple questions in a single request.
      
      **Auto-Ordering:** If order is not specified, questions are appended after the last existing question.
      
      **Restrictions:**
      - Cannot add questions to PUBLISHED or ACTIVE assessments
      - Students cannot add questions
      
      **Total Points:** The assessment's total_points is automatically recalculated.
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID to add questions to' })
  @ApiBody({ type: AddQuestionsDto })
  @ApiResponse({ status: 201, description: 'Questions added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Assessment is published or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Assessment or user not found',
  })
  async addQuestions(
    @Param('id') assessmentId: string,
    @Body() addQuestionsDto: AddQuestionsDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.addQuestions(
      assessmentId,
      addQuestionsDto,
      user,
    );
  }

  // ============================================================
  // Update a question in an assessment
  // Route: PATCH /assessment/:id/questions/:questionId
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Cannot update questions in PUBLISHED or ACTIVE assessments
  //   - Students cannot update questions
  // ============================================================
  @Patch(':id/questions/:questionId')
  @ApiOperation({
    summary: 'Update a Question in an Assessment',
    description: `
      Updates a single question in an assessment (partial update).
      Only fields included in the request body are updated.

      **What you can update:**
      - Question text, type, points, difficulty
      - Media (image, audio, video)
      - Options (full replacement)
      - Correct answers (non-MCQ types)

      **Restrictions:**
      - Cannot update questions in PUBLISHED or ACTIVE assessments
      - Students cannot update questions
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiBody({ type: UpdateQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - assessment status or invalid payload',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - assessment or question not found',
  })
  async updateQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @GetUser() user: any,
  ) {
    return this.assessmentService.updateQuestion(
      assessmentId,
      questionId,
      updateQuestionDto,
      user,
    );
  }

  // ============================================================
  // Update a question with image uploads (multipart)
  // Route: PATCH /assessment/:id/questions/:questionId/with-image
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Handles uploading new images and deleting old ones
  //   - Cannot update questions in PUBLISHED or ACTIVE assessments
  //   - Students cannot update questions
  // ============================================================
  @Patch(':id/questions/:questionId/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'newQuestionImage', maxCount: 1 },
      { name: 'newOptionImages', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update a Question with Image Uploads',
    description: `
      Updates a question with new image uploads (multipart/form-data).
      
      **What you can do:**
      - Update question image (uploads new, deletes old from S3)
      - Update option images (uploads new, deletes old from S3)
      - Update any other question fields (text, points, etc.)
      
      **Form Fields:**
      - \`questionData\`: JSON string with update data (same as regular PATCH)
      - \`oldQuestionImageS3Key\`: String - S3 key of old question image to delete
      - \`newQuestionImage\`: File - New question image file
      - \`optionImageUpdates\`: JSON string - Array of { optionId, oldS3Key }
      - \`newOptionImages\`: Files - New option image files (matched by index)
      
      **Example optionImageUpdates:**
      \`\`\`json
      [
        { "optionId": "option-id-1", "oldS3Key": "old-key-1" },
        { "optionId": "option-id-2", "oldS3Key": "old-key-2" }
      ]
      \`\`\`
      
      **Image Handling:**
      - Old images are deleted from S3 before uploading new ones
      - If upload fails, all changes are rolled back
      - Supports JPEG, PNG, GIF, WEBP (max 5MB per image)
      
      **Restrictions:**
      - Cannot update questions in PUBLISHED or ACTIVE assessments
      - Students cannot update questions
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({
    status: 200,
    description: 'Question updated successfully with new images',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid files or assessment status',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - assessment or question not found',
  })
  async updateQuestionWithImage(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
    @UploadedFiles()
    files: {
      newQuestionImage?: Express.Multer.File[];
      newOptionImages?: Express.Multer.File[];
    },
    @Body('questionData') questionDataStr?: string,
    @Body('oldQuestionImageS3Key') oldQuestionImageS3Key?: string,
    @Body('optionImageUpdates') optionImageUpdatesStr?: string,
  ) {
    // Parse questionData JSON
    let updateQuestionDto: UpdateQuestionDto;

    if (!questionDataStr) {
      throw new Error('questionData field is required');
    }

    try {
      updateQuestionDto = JSON.parse(questionDataStr);
    } catch (error) {
      throw new Error('Invalid JSON in questionData field');
    }

    // Add old question image S3 key to DTO if provided
    if (oldQuestionImageS3Key) {
      updateQuestionDto.image_s3_key = oldQuestionImageS3Key;
    }

    // Parse optionImageUpdates JSON
    let optionImageUpdates:
      | Array<{ optionId: string; oldS3Key?: string }>
      | undefined;
    if (optionImageUpdatesStr) {
      try {
        optionImageUpdates = JSON.parse(optionImageUpdatesStr);
      } catch (error) {
        throw new Error('Invalid JSON in optionImageUpdates field');
      }
    }

    // Validate image files
    const newQuestionImage = files?.newQuestionImage?.[0];
    const newOptionImages = files?.newOptionImages;

    if (newQuestionImage) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedMimeTypes.includes(newQuestionImage.mimetype)) {
        throw new Error(
          `Invalid image file type: ${newQuestionImage.originalname}. Allowed: JPEG, PNG, GIF, WEBP`,
        );
      }
      if (newQuestionImage.size > 5 * 1024 * 1024) {
        throw new Error(
          `Image file ${newQuestionImage.originalname} exceeds 5MB limit`,
        );
      }
    }

    if (newOptionImages && newOptionImages.length > 0) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      for (const img of newOptionImages) {
        if (!allowedMimeTypes.includes(img.mimetype)) {
          throw new Error(
            `Invalid image file type: ${img.originalname}. Allowed: JPEG, PNG, GIF, WEBP`,
          );
        }
        if (img.size > 5 * 1024 * 1024) {
          throw new Error(`Image file ${img.originalname} exceeds 5MB limit`);
        }
      }
    }

    return this.assessmentService.updateQuestionWithImage(
      assessmentId,
      questionId,
      updateQuestionDto,
      user,
      newQuestionImage,
      optionImageUpdates,
      newOptionImages,
    );
  }

  // ============================================================
  // Delete a question from an assessment
  // Route: DELETE /assessment/:id/questions/:questionId
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Cannot delete from PUBLISHED or ACTIVE assessments
  //   - Students cannot delete questions
  // ============================================================
  @Delete(':id/questions/:questionId')
  @ApiOperation({
    summary: 'Delete a Question from an Assessment',
    description: `
      Deletes a single question from an assessment.
      This also removes its options, correct answers, responses, and any media attached.

      **Restrictions:**
      - Cannot delete questions from PUBLISHED or ACTIVE assessments
      - Students cannot delete questions
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - assessment status' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - assessment or question not found',
  })
  async deleteQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
  ) {
    return this.assessmentService.deleteQuestion(
      assessmentId,
      questionId,
      user,
    );
  }

  // ============================================================
  // Add a question with optional images (question + option images)
  // Route: POST /assessment/:id/questions/with-image
  // Protected: Directors, Admins, Teachers (creator), Library Owners
  //   - Multipart form: question image + option images + questionData JSON
  //   - Uploads images, creates question atomically
  //   - Rolls back all S3 uploads if question creation fails
  //   - Students cannot add questions
  // ============================================================
  @Post(':id/questions/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'optionImages', maxCount: 10 },
    ]),
  )
  @ApiOperation({
    summary: 'Add Question with Images (Atomic Operation)',
    description: `
      Creates a single question with optional image uploads for the question and/or its options.
      
      **How to use:**
      Send a multipart/form-data request with:
      - \`image\` (file, optional): Image for the question itself (JPEG, PNG, GIF, WEBP, max 5MB)
      - \`optionImages\` (files, optional): Images for options, matched by index to options array in questionData
      - \`questionData\` (string): A JSON string containing the question data
      
      **Option Image Matching:**
      Option images are matched to options by the \`imageIndex\` field in each option.
      For example, if you upload 2 files in optionImages (index 0 and 1), set \`"imageIndex": 0\` 
      on the first option that needs an image and \`"imageIndex": 1\` on the second.
      
      **Example questionData JSON:**
      \`\`\`json
      {
        "question_text": "Which animal is shown in option A?",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "points": 5,
        "options": [
          { "option_text": "A dog", "is_correct": false, "imageIndex": 0 },
          { "option_text": "A cat", "is_correct": true, "imageIndex": 1 },
          { "option_text": "A bird", "is_correct": false }
        ]
      }
      \`\`\`
      
      **Atomic Guarantee:**
      - If any image uploads but question creation fails, ALL images are deleted from S3
      - No orphaned files left behind on failure
      
      **Role-Based Access:**
      - **Library Owner:** Can add to their platform assessments
      - **School Director/Admin:** Can add to any assessment in their school
      - **Teacher:** Can add to their own assessments
      - **Student:** Cannot add questions
    `,
  })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Question image, option images, and question data as JSON string',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description:
            'Question image file (JPEG, PNG, GIF, WEBP, max 5MB) - optional',
        },
        optionImages: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description:
            'Option image files (JPEG, PNG, GIF, WEBP, max 5MB each) - optional, matched by imageIndex in questionData options',
        },
        questionData: {
          type: 'string',
          description:
            'JSON string with question data (question_text, question_type, points, options with optional imageIndex, etc.)',
        },
      },
      required: ['questionData'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Question created successfully with images',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid JSON, image type, or assessment status',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have access',
  })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found' })
  async addQuestionWithImage(
    @Param('id') assessmentId: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      optionImages?: Express.Multer.File[];
    },
    @Body('questionData') questionDataString: string,
    @GetUser() user: any,
  ) {
    const questionImage = files?.image?.[0];
    const optionImages = files?.optionImages || [];
    return this.assessmentService.addQuestionWithImage(
      assessmentId,
      questionDataString,
      questionImage,
      optionImages,
      user,
    );
  }
}
