/**
 * Shared types and interfaces for Assessment module
 */

/**
 * When set, the assessment operation is performed by a library owner on behalf of a school.
 */
export interface LibraryAssessmentContext {
  schoolId: string;
  /** User id (school's User) to attribute created assessments to. If not provided, school director is used. */
  createdByUserId?: string;
}

/**
 * Result type for user context detection
 */
export interface UserContext {
  type:
    | 'library_owner'
    | 'school_director'
    | 'school_admin'
    | 'teacher'
    | 'student';
  userId: string;
  platformId?: string; // For library owners
  schoolId?: string; // For school users
}

/**
 * Graded answer result
 */
export interface GradedAnswer {
  question_id: string;
  question_type: string;
  is_correct: boolean;
  points_earned: number;
  max_points: number;
  selected_options: string[];
  text_answer?: string;
  numeric_answer?: number | null;
  date_answer?: Date | null;
}

/**
 * Grading result from grading helpers
 */
export interface GradingResult {
  gradedAnswers: GradedAnswer[];
  totalScore: number;
  totalPoints: number;
}

/**
 * Status analytics structure
 */
export interface StatusAnalytics {
  all: number;
  draft: number;
  published: number;
  active: number;
  closed: number;
  archived: number;
}

/**
 * Common assessment context types
 */
export type AssessmentContextType = 'school' | 'library';
