import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../shared/services/providers/storage.service';
import { AssessmentNotificationsService } from '../push-notifications/assessment/assessment-notifications.service';
import {
  CreateNewAssessmentDto,
  GetAssessmentsQueryDto,
  UpdateAssessmentDto,
  SubmitAssessmentDto,
  DuplicateAssessmentDto,
  AddQuestionsDto,
  UpdateQuestionDto,
} from './dto';
import { SchoolAssessmentService } from './services/school-assessment.service';
import { LibraryAssessmentService } from './services/library-assessment.service';
import {
  UserContext,
  LibraryAssessmentContext,
} from './services/assessment.types';
import * as colors from 'colors';

/**
 * Assessment Service - Main Facade
 *
 * This service acts as the main entry point for all assessment operations.
 * It delegates to specialized services based on user context:
 * - SchoolAssessmentService: For school users (teachers, directors, admins, students)
 * - LibraryAssessmentService: For library owners
 *
 * The facade pattern keeps the controller simple while allowing complex
 * business logic to be organized in focused, maintainable services.
 */
@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly assessmentNotificationsService: AssessmentNotificationsService,
    private readonly schoolAssessmentService: SchoolAssessmentService,
    private readonly libraryAssessmentService: LibraryAssessmentService,
  ) {}

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Detect user context - determines if user is a library owner or school user
   * Single query approach: checks LibraryResourceUser first, then falls back to User
   */
  private async detectUserContext(userId: string): Promise<UserContext | null> {
    // First, check if user is a library owner
    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: userId },
      select: { id: true, platformId: true },
    });

    if (libraryUser) {
      return {
        type: 'library_owner',
        userId: libraryUser.id,
        platformId: libraryUser.platformId,
      };
    }

    // If not a library user, check school user
    const schoolUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, school_id: true },
    });

    if (schoolUser) {
      const role = schoolUser.role as string;
      let userType: 'school_director' | 'school_admin' | 'teacher' | 'student';

      if (role === 'school_director') {
        userType = 'school_director';
      } else if (role === 'school_admin') {
        userType = 'school_admin';
      } else if (role === 'student') {
        userType = 'student';
      } else {
        userType = 'teacher';
      }

      return {
        type: userType,
        userId: schoolUser.id,
        schoolId: schoolUser.school_id,
      };
    }

    return null;
  }

  // ========================================
  // PUBLIC ASSESSMENT MANAGEMENT METHODS
  // ========================================

  /**
   * Create a new assessment (unified endpoint)
   *
   * This endpoint intelligently routes to the appropriate assessment type:
   * - If user is a LibraryResourceUser → creates LibraryAssessment
   * - If user is a school user (teacher/director/admin) → creates school Assessment
   * - If libraryContext is provided → creates school Assessment on behalf of school
   *
   * @param createAssessmentDto - Assessment creation data
   * @param user - User object (from JWT)
   * @param libraryContext - Optional context for library owners creating school assessments
   */
  async createNewAssessment(
    createAssessmentDto: CreateNewAssessmentDto,
    user: any,
    libraryContext?: LibraryAssessmentContext,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(colors.cyan(`Creating assessment for user: ${userId}`));

    // If libraryContext is provided, it's a library owner creating for a school
    if (libraryContext) {
      const userContext = await this.detectUserContext(userId);
      if (!userContext || userContext.type !== 'library_owner') {
        this.logger.error(
          colors.red(
            `User ${userId} is not a library owner but provided libraryContext`,
          ),
        );
        throw new Error(
          'Only library owners can create assessments on behalf of schools',
        );
      }
      return this.schoolAssessmentService.createSchoolAssessment(
        createAssessmentDto,
        userContext,
        libraryContext,
      );
    }

    // Detect user context
    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    // Route based on user type
    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.createLibraryAssessment(
        createAssessmentDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.createSchoolAssessment(
        createAssessmentDto,
        userContext,
      );
    }
  }

  /**
   * Get all assessments (paginated, filtered, role-based)
   *
   * Role-based access:
   * - School Director/Admin: All assessments in the school
   * - Teacher: Only assessments for subjects/topics they teach
   * - Student: Only published/closed assessments for subjects in their class
   * - Library Owner: All assessments in their platform
   *
   * @param query - Query parameters for pagination, filtering, and search
   * @param user - User object (from JWT)
   */
  async getAllAssessments(query: GetAssessmentsQueryDto, user: any) {
    const userId = user.sub || user.id;
    this.logger.log(colors.cyan(`Getting assessments for user: ${userId}`));

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.getAllLibraryAssessments(
        query,
        userContext.platformId!,
      );
    } else {
      return this.schoolAssessmentService.getAllSchoolAssessments(
        query,
        userContext,
      );
    }
  }

  /**
   * Get assessment details by ID with full information
   * Returns: assessment info, questions, and attempts/submissions
   *
   * Role-based access:
   * - School Director/Admin: Any assessment in the school
   * - Teacher: Only assessments for subjects they teach
   * - Student: Only published assessments for subjects in their class (no questions/attempts)
   * - Library Owner: Any assessment in their platform
   *
   * @param assessmentId - Assessment ID
   * @param user - User object (from JWT)
   */
  async getAssessmentDetails(assessmentId: string, user: any) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Getting assessment details: ${assessmentId} for user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.getLibraryAssessmentDetails(
        assessmentId,
        userContext.platformId!,
      );
    } else {
      return this.schoolAssessmentService.getSchoolAssessmentDetails(
        assessmentId,
        userContext,
      );
    }
  }

  /**
   * Update an assessment (PATCH - partial update)
   *
   * Restrictions:
   * - Cannot update published assessments
   * - Only assessment creator or authorized users can update
   *
   * @param assessmentId - Assessment ID
   * @param updateDto - Partial assessment data to update
   * @param user - User object (from JWT)
   */
  async updateAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(`Updating assessment: ${assessmentId} for user: ${userId}`),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.updateLibraryAssessment(
        assessmentId,
        updateDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.updateSchoolAssessment(
        assessmentId,
        updateDto,
        userContext,
      );
    }
  }

  /**
   * Get assessment questions for taking
   *
   * For students: Returns questions without correct answers (for taking assessment)
   * For teachers/admins: Returns questions with correct answers (for preview)
   *
   * @param assessmentId - Assessment ID
   * @param user - User object (from JWT)
   */
  async getAssessmentQuestions(assessmentId: string, user: any) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Getting assessment questions: ${assessmentId} for user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.getLibraryAssessmentQuestions(
        assessmentId,
        userContext.platformId!,
        userContext.userId,
        true,
      );
    } else if (userContext.type === 'student') {
      return this.schoolAssessmentService.getSchoolAssessmentQuestions(
        assessmentId,
        userContext,
      );
    } else {
      return this.schoolAssessmentService.getSchoolAssessmentQuestionsForPreview(
        assessmentId,
        userContext,
      );
    }
  }

  /**
   * Submit assessment answers
   *
   * For students: Submits answers, grades automatically, and creates attempt record
   *
   * @param assessmentId - Assessment ID
   * @param submitDto - Submission data with answers
   * @param user - User object (from JWT)
   */
  async submitAssessment(
    assessmentId: string,
    submitDto: SubmitAssessmentDto,
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(`Submitting assessment: ${assessmentId} for user: ${userId}`),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.submitLibraryAssessment(
        assessmentId,
        submitDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.submitSchoolAssessment(
        assessmentId,
        submitDto,
        userContext,
      );
    }
  }

  /**
   * Duplicate an existing assessment
   *
   * Creates a copy of an assessment with a new title. Optionally shuffles
   * questions and/or options for the new assessment.
   *
   * @param assessmentId - Source Assessment ID to duplicate
   * @param duplicateDto - Duplication options (new title, shuffle flags)
   * @param user - User object (from JWT)
   */
  async duplicateAssessment(
    assessmentId: string,
    duplicateDto: DuplicateAssessmentDto,
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Duplicating assessment: ${assessmentId} for user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(`Student ${userId} attempted to duplicate assessment`),
      );
      throw new Error('Students cannot duplicate assessments');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.duplicateLibraryAssessment(
        assessmentId,
        duplicateDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.duplicateSchoolAssessment(
        assessmentId,
        duplicateDto,
        userContext,
      );
    }
  }

  /**
   * Add questions to an existing assessment
   *
   * Adds one or more questions with options and correct answers.
   * Cannot add to published/active assessments.
   *
   * @param assessmentId - Assessment ID to add questions to
   * @param addQuestionsDto - Questions data
   * @param user - User object (from JWT)
   */
  async addQuestions(
    assessmentId: string,
    addQuestionsDto: AddQuestionsDto,
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Adding questions to assessment: ${assessmentId} for user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(`Student ${userId} attempted to add questions`),
      );
      throw new Error('Students cannot add questions to assessments');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.addLibraryAssessmentQuestions(
        assessmentId,
        addQuestionsDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.addSchoolAssessmentQuestions(
        assessmentId,
        addQuestionsDto,
        userContext,
      );
    }
  }

  /**
   * Add a question with images in a single atomic operation
   *
   * Accepts multipart form data with a question image, option images, and a JSON questionData string.
   * Uploads images, creates the question, and rolls back all images if creation fails.
   *
   * @param assessmentId - Assessment ID
   * @param questionDataString - JSON string with question data
   * @param questionImage - Optional multer file for question image
   * @param optionImages - Array of multer files for option images
   * @param user - User object (from JWT)
   */
  async addQuestionWithImage(
    assessmentId: string,
    questionDataString: string,
    questionImage: Express.Multer.File | undefined,
    optionImages: Express.Multer.File[],
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Adding question with image to assessment: ${assessmentId} by user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(`Student ${userId} attempted to add question with image`),
      );
      throw new Error('Students cannot add questions to assessments');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.addQuestionWithImage(
        assessmentId,
        questionDataString,
        questionImage,
        optionImages,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.addQuestionWithImage(
        assessmentId,
        questionDataString,
        questionImage,
        optionImages,
        userContext,
      );
    }
  }

  /**
   * Update a question in an assessment (partial update)
   *
   * Updates question content, options, and correct answers.
   * Cannot update questions in published/active assessments.
   *
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to update
   * @param updateQuestionDto - Partial question data
   * @param user - User object (from JWT)
   */
  async updateQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    user: any,
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Updating question: ${questionId} in assessment: ${assessmentId} by user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(`Student ${userId} attempted to update a question`),
      );
      throw new Error('Students cannot update questions');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.updateLibraryQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.updateSchoolQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        userContext,
      );
    }
  }

  /**
   * Update a question with new image uploads (multipart)
   *
   * Handles uploading new images, deleting old images, and updating question.
   * Cannot update questions in published/active assessments.
   *
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to update
   * @param updateQuestionDto - Partial question data
   * @param user - User object (from JWT)
   * @param newQuestionImage - New question image file (optional)
   * @param optionImageUpdates - Array of { optionId, oldS3Key } for options
   * @param newOptionImages - Array of new option image files
   */
  async updateQuestionWithImage(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    user: any,
    newQuestionImage?: Express.Multer.File,
    optionImageUpdates?: Array<{ optionId: string; oldS3Key?: string }>,
    newOptionImages?: Express.Multer.File[],
  ) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Updating question with images: ${questionId} in assessment: ${assessmentId} by user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(
          `Student ${userId} attempted to update a question with images`,
        ),
      );
      throw new Error('Students cannot update questions');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.updateLibraryQuestionWithImage(
        assessmentId,
        questionId,
        updateQuestionDto,
        userContext.platformId!,
        userContext.userId,
        newQuestionImage,
        optionImageUpdates,
        newOptionImages,
      );
    } else {
      return this.schoolAssessmentService.updateSchoolQuestionWithImage(
        assessmentId,
        questionId,
        updateQuestionDto,
        userContext,
        newQuestionImage,
        optionImageUpdates,
        newOptionImages,
      );
    }
  }

  /**
   * Delete a question from an assessment
   *
   * Removes the question, options, correct answers, responses, and media.
   * Cannot delete from published/active assessments.
   *
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to delete
   * @param user - User object (from JWT)
   */
  async deleteQuestion(assessmentId: string, questionId: string, user: any) {
    const userId = user.sub || user.id;
    this.logger.log(
      colors.cyan(
        `Deleting question: ${questionId} from assessment: ${assessmentId} by user: ${userId}`,
      ),
    );

    const userContext = await this.detectUserContext(userId);
    if (!userContext) {
      this.logger.error(colors.red(`User not found: ${userId}`));
      throw new Error('User not found');
    }

    if (userContext.type === 'student') {
      this.logger.error(
        colors.red(`Student ${userId} attempted to delete a question`),
      );
      throw new Error('Students cannot delete questions');
    }

    if (userContext.type === 'library_owner') {
      return this.libraryAssessmentService.deleteLibraryQuestion(
        assessmentId,
        questionId,
        userContext.platformId!,
        userContext.userId,
      );
    } else {
      return this.schoolAssessmentService.deleteSchoolQuestion(
        assessmentId,
        questionId,
        userContext,
      );
    }
  }
}
