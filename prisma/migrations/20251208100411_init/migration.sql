-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('primary', 'secondary', 'primary_and_secondary');

-- CreateEnum
CREATE TYPE "SchoolOwnership" AS ENUM ('government', 'private');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('not_verified', 'pending', 'approved', 'rejected', 'failed', 'suspended', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('full', 'partial');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('all', 'teachers', 'students', 'school_director', 'admin');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "AcademicTerm" AS ENUM ('first', 'second', 'third');

-- CreateEnum
CREATE TYPE "AcademicSessionStatus" AS ENUM ('active', 'inactive', 'completed');

-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('student', 'teacher', 'school_director', 'school_admin', 'parent', 'super_admin', 'ict_staff');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended', 'inactive');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'TRANSFER', 'WITHDRAWAL', 'REFUND', 'FEE_PAYMENT', 'SCHOLARSHIP', 'GRANT', 'DONATION');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('SCHOOL_WALLET', 'STUDENT_WALLET', 'TEACHER_WALLET');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MaterialProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "ChunkType" AS ENUM ('TEXT', 'HEADING', 'PARAGRAPH', 'LIST', 'TABLE', 'IMAGE_CAPTION', 'FOOTNOTE');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING', 'FILE_UPLOAD', 'NUMERIC', 'DATE', 'RATING_SCALE');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GradingType" AS ENUM ('AUTOMATIC', 'MANUAL', 'MIXED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT', 'CBT', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('HOMEWORK', 'PROJECT', 'ESSAY', 'RESEARCH', 'PRACTICAL', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED', 'RETURNED', 'RESUBMITTED');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('PENDING', 'GRADED', 'RETURNED', 'DISPUTED', 'FINAL');

-- CreateEnum
CREATE TYPE "RubricScale" AS ENUM ('POINTS', 'PERCENTAGE', 'LETTER_GRADE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AttendanceSessionType" AS ENUM ('DAILY', 'MORNING', 'AFTERNOON', 'EVENING', 'SPECIAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceRecordStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "AttendancePeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'TERM', 'YEARLY');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('ACADEMIC', 'ATTENDANCE', 'SPORTS', 'EXTRACURRICULAR', 'BEHAVIOR', 'LEADERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED', 'TRIAL');

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "term" "AcademicTerm" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "AcademicSessionStatus" NOT NULL DEFAULT 'active',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_email" TEXT NOT NULL,
    "school_phone" TEXT NOT NULL,
    "school_address" TEXT NOT NULL,
    "school_type" "SchoolType" NOT NULL,
    "school_ownership" "SchoolOwnership" NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'pending',
    "cacId" TEXT,
    "utilityBillId" TEXT,
    "taxClearanceId" TEXT,
    "platformId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "display_picture" JSONB,
    "gender" "Gender" NOT NULL DEFAULT 'other',
    "otp" TEXT DEFAULT '',
    "otp_expires_at" TIMESTAMP(3),
    "is_email_verified" BOOLEAN DEFAULT false,
    "is_otp_verified" BOOLEAN DEFAULT false,
    "role" "Roles" NOT NULL DEFAULT 'student',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "filesUploadedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastFileResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTokenResetDateAllTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxFileSizeMB" INTEGER NOT NULL DEFAULT 100,
    "maxFilesPerMonth" INTEGER NOT NULL DEFAULT 10,
    "maxMessagesPerWeek" INTEGER NOT NULL DEFAULT 100,
    "maxStorageMB" INTEGER NOT NULL DEFAULT 500,
    "maxTokensPerDay" INTEGER NOT NULL DEFAULT 50000,
    "maxTokensPerWeek" INTEGER NOT NULL DEFAULT 50000,
    "messagesSentThisWeek" INTEGER NOT NULL DEFAULT 0,
    "tokensUsedAllTime" INTEGER NOT NULL DEFAULT 0,
    "tokensUsedThisDay" INTEGER NOT NULL DEFAULT 0,
    "tokensUsedThisWeek" INTEGER NOT NULL DEFAULT 0,
    "totalFilesUploadedAllTime" INTEGER NOT NULL DEFAULT 0,
    "totalStorageUsedMB" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "display_picture" JSONB,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL DEFAULT '1',
    "user_id" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'other',
    "role" "Roles" NOT NULL DEFAULT 'teacher',
    "password" TEXT NOT NULL DEFAULT '',
    "teacher_id" TEXT NOT NULL,
    "employee_number" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "years_of_experience" INTEGER,
    "hire_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" DOUBLE PRECISION,
    "department" TEXT,
    "is_class_teacher" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "admission_number" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_class_id" TEXT,
    "guardian_name" TEXT,
    "guardian_phone" TEXT,
    "guardian_email" TEXT,
    "address" TEXT,
    "emergency_contact" TEXT,
    "blood_group" TEXT,
    "medical_conditions" TEXT,
    "allergies" TEXT,
    "previous_school" TEXT,
    "academic_level" TEXT,
    "parent_id" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "state" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parent" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "occupation" TEXT,
    "employer" TEXT,
    "address" TEXT,
    "emergency_contact" TEXT,
    "relationship" TEXT,
    "is_primary_contact" BOOLEAN NOT NULL DEFAULT true,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "classId" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "classTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "description" TEXT,
    "schoolId" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classId" TEXT,
    "thumbnail" JSONB,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instructions" TEXT,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "finance_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "payment_for" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "room" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "wallet_type" "WalletType" NOT NULL DEFAULT 'SCHOOL_WALLET',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "financeId" TEXT,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "transaction_type" "WalletTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherSubject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "comingUpOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPerformance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "term" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT,
    "subject_results" JSONB NOT NULL,
    "total_ca_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_exam_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_max_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_grade" TEXT,
    "class_position" INTEGER,
    "total_students" INTEGER,
    "released_by" TEXT,
    "released_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_final" BOOLEAN NOT NULL DEFAULT true,
    "released_by_school_admin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "schoolId" TEXT,
    "platformId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "duration" TEXT,
    "size" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "thumbnail" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VideoContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PDFMaterial" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "schoolId" TEXT,
    "platformId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "size" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "order" INTEGER NOT NULL DEFAULT 1,
    "fileType" TEXT,
    "originalName" TEXT,
    "materialId" TEXT,

    CONSTRAINT "PDFMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "academic_session_id" TEXT NOT NULL,
    "allow_late_submission" BOOLEAN NOT NULL DEFAULT false,
    "assignment_type" "AssignmentType" NOT NULL DEFAULT 'HOMEWORK',
    "attachment_type" TEXT,
    "attachment_url" TEXT,
    "auto_grade" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "due_date" TIMESTAMP(3),
    "grading_rubric_id" TEXT,
    "instructions" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "late_penalty" DOUBLE PRECISION,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "published_at" TIMESTAMP(3),
    "school_id" TEXT NOT NULL,
    "time_limit" INTEGER,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "academic_session_id" TEXT NOT NULL,
    "allow_review" BOOLEAN NOT NULL DEFAULT true,
    "auto_submit" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),
    "grading_type" "GradingType" NOT NULL DEFAULT 'AUTOMATIC',
    "instructions" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_result_released" BOOLEAN NOT NULL DEFAULT false,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "published_at" TIMESTAMP(3),
    "result_released_at" TIMESTAMP(3),
    "school_id" TEXT NOT NULL,
    "show_correct_answers" BOOLEAN NOT NULL DEFAULT false,
    "show_feedback" BOOLEAN NOT NULL DEFAULT true,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "tags" TEXT[],
    "time_limit" INTEGER,
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "subject_id" TEXT NOT NULL,
    "assessment_type" "AssessmentType" NOT NULL DEFAULT 'CBT',
    "submissions" JSONB,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "time_limit" INTEGER,
    "image_url" TEXT,
    "image_s3_key" TEXT,
    "audio_url" TEXT,
    "video_url" TEXT,
    "allow_multiple_attempts" BOOLEAN NOT NULL DEFAULT false,
    "show_hint" BOOLEAN NOT NULL DEFAULT false,
    "hint_text" TEXT,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "explanation" TEXT,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "audio_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCorrectAnswer" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_number" DOUBLE PRECISION,
    "answer_date" TIMESTAMP(3),
    "option_ids" TEXT[],
    "answer_json" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCorrectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "time_spent" INTEGER,
    "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "graded_at" TIMESTAMP(3),
    "graded_by" TEXT,
    "overall_feedback" TEXT,
    "grade_letter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "submission_type" "AssessmentType" NOT NULL DEFAULT 'EXAM',
    "content" TEXT,
    "attachment_url" TEXT,
    "attachment_type" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "late_submission" BOOLEAN NOT NULL DEFAULT false,
    "word_count" INTEGER,
    "file_size" TEXT,
    "total_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "graded_at" TIMESTAMP(3),
    "graded_by" TEXT,
    "feedback" TEXT,
    "grade_letter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "text_answer" TEXT,
    "numeric_answer" DOUBLE PRECISION,
    "date_answer" TIMESTAMP(3),
    "selected_options" TEXT[],
    "file_urls" TEXT[],
    "is_correct" BOOLEAN,
    "points_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_points" DOUBLE PRECISION NOT NULL,
    "time_spent" INTEGER,
    "feedback" TEXT,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnalytics" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_time" INTEGER NOT NULL DEFAULT 0,
    "pass_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "question_stats" JSONB NOT NULL,
    "daily_attempts" JSONB NOT NULL,
    "hourly_attempts" JSONB NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "abandonment_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClass" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingUrl" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT,
    "platformId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "maxParticipants" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LiveClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL,
    "url" TEXT,
    "schoolId" TEXT,
    "platformId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LibraryResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingRubric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "total_points" DOUBLE PRECISION NOT NULL,
    "scale_type" "RubricScale" NOT NULL DEFAULT 'POINTS',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "content" TEXT,
    "attachment_url" TEXT,
    "attachment_type" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "late_submission" BOOLEAN NOT NULL DEFAULT false,
    "word_count" INTEGER,
    "file_size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topicId" TEXT,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentGrade" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "letter_grade" TEXT,
    "feedback" TEXT,
    "comments" TEXT,
    "rubric_scores" JSONB,
    "status" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "graded_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "grading_time" INTEGER,
    "is_final" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialProcessing" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" "MaterialProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "total_chunks" INTEGER NOT NULL DEFAULT 0,
    "processed_chunks" INTEGER NOT NULL DEFAULT 0,
    "failed_chunks" INTEGER NOT NULL DEFAULT 0,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "vector_database_id" TEXT,
    "embedding_model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "material_processing_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_type" "ChunkType" NOT NULL DEFAULT 'TEXT',
    "page_number" INTEGER,
    "section_title" TEXT,
    "embedding" vector NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "system_prompt" TEXT,
    "context_summary" TEXT,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "role" "MessageRole" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'TEXT',
    "model_used" TEXT,
    "tokens_used" INTEGER,
    "response_time_ms" INTEGER,
    "context_chunks" TEXT[],
    "context_summary" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "parent_message_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatContext" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "chunk_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "context_type" TEXT NOT NULL DEFAULT 'semantic',
    "position_in_context" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "user_id" TEXT,
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_tokens_used" INTEGER NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "average_relevance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "most_used_chunks" TEXT[],
    "popular_questions" TEXT[],
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daily_usage" INTEGER NOT NULL DEFAULT 0,
    "weekly_usage" INTEGER NOT NULL DEFAULT 0,
    "monthly_usage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session_type" "AttendanceSessionType" NOT NULL DEFAULT 'DAILY',
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "present_count" INTEGER NOT NULL DEFAULT 0,
    "absent_count" INTEGER NOT NULL DEFAULT 0,
    "late_count" INTEGER NOT NULL DEFAULT 0,
    "excused_count" INTEGER NOT NULL DEFAULT 0,
    "attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendance_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "status" "AttendanceRecordStatus" NOT NULL DEFAULT 'ABSENT',
    "marked_at" TIMESTAMP(3),
    "marked_by" TEXT,
    "reason" TEXT,
    "is_excused" BOOLEAN NOT NULL DEFAULT false,
    "excuse_note" TEXT,
    "parent_notified" BOOLEAN NOT NULL DEFAULT false,
    "parent_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSummary" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT,
    "period_type" "AttendancePeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL DEFAULT 0,
    "present_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "late_days" INTEGER NOT NULL DEFAULT 0,
    "excused_days" INTEGER NOT NULL DEFAULT 0,
    "attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSettings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "late_threshold_minutes" INTEGER NOT NULL DEFAULT 15,
    "auto_mark_absent_minutes" INTEGER NOT NULL DEFAULT 30,
    "require_excuse_note" BOOLEAN NOT NULL DEFAULT true,
    "parent_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "attendance_tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimum_attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "max_consecutive_absences" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "assessment_reminders" BOOLEAN NOT NULL DEFAULT true,
    "grade_notifications" BOOLEAN NOT NULL DEFAULT true,
    "announcement_notifications" BOOLEAN NOT NULL DEFAULT false,
    "dark_mode" BOOLEAN NOT NULL DEFAULT false,
    "sound_effects" BOOLEAN NOT NULL DEFAULT true,
    "haptic_feedback" BOOLEAN NOT NULL DEFAULT true,
    "auto_save" BOOLEAN NOT NULL DEFAULT true,
    "offline_mode" BOOLEAN NOT NULL DEFAULT false,
    "profile_visibility" TEXT NOT NULL DEFAULT 'classmates',
    "show_contact_info" BOOLEAN NOT NULL DEFAULT true,
    "show_academic_progress" BOOLEAN NOT NULL DEFAULT true,
    "data_sharing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "icon_url" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAchievement" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "achievement_id" TEXT NOT NULL,
    "earned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportInfo" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "faq_count" INTEGER NOT NULL DEFAULT 0,
    "last_faq_update" TIMESTAMP(3),
    "faq_categories" JSONB NOT NULL DEFAULT '[]',
    "email_support" TEXT NOT NULL DEFAULT 'support@school.edu',
    "phone_support" TEXT NOT NULL DEFAULT '+1-800-SCHOOL',
    "live_chat_available" BOOLEAN NOT NULL DEFAULT false,
    "response_time" TEXT NOT NULL DEFAULT '24 hours',
    "app_version" TEXT NOT NULL DEFAULT '1.0.0',
    "build_number" TEXT NOT NULL DEFAULT '100',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minimum_ios_version" TEXT NOT NULL DEFAULT '13.0',
    "minimum_android_version" TEXT NOT NULL DEFAULT '8.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Free',
    "plan_type" "SubscriptionPlanType" NOT NULL DEFAULT 'FREE',
    "description" TEXT,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_allowed_teachers" INTEGER NOT NULL DEFAULT 30,
    "max_allowed_students" INTEGER NOT NULL DEFAULT 100,
    "max_allowed_classes" INTEGER,
    "max_allowed_subjects" INTEGER,
    "allowed_document_types" TEXT[] DEFAULT ARRAY['pdf']::TEXT[],
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 10,
    "max_document_uploads_per_student_per_day" INTEGER NOT NULL DEFAULT 3,
    "max_document_uploads_per_teacher_per_day" INTEGER NOT NULL DEFAULT 10,
    "max_storage_mb" INTEGER NOT NULL DEFAULT 500,
    "max_files_per_month" INTEGER NOT NULL DEFAULT 10,
    "max_daily_tokens_per_user" INTEGER NOT NULL DEFAULT 50000,
    "max_weekly_tokens_per_user" INTEGER,
    "max_monthly_tokens_per_user" INTEGER,
    "max_total_tokens_per_school" INTEGER,
    "max_messages_per_week" INTEGER NOT NULL DEFAULT 100,
    "max_conversations_per_user" INTEGER,
    "max_chat_sessions_per_user" INTEGER,
    "features" JSONB,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlatformSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResponseOptions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResponseOptions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "AcademicSession_school_id_is_current_idx" ON "AcademicSession"("school_id", "is_current");

-- CreateIndex
CREATE INDEX "AcademicSession_start_year_end_year_idx" ON "AcademicSession"("start_year", "end_year");

-- CreateIndex
CREATE INDEX "AcademicSession_academic_year_idx" ON "AcademicSession"("academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_school_id_academic_year_term_key" ON "AcademicSession"("school_id", "academic_year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "School_school_email_key" ON "School"("school_email");

-- CreateIndex
CREATE UNIQUE INDEX "School_cacId_key" ON "School"("cacId");

-- CreateIndex
CREATE UNIQUE INDEX "School_utilityBillId_key" ON "School"("utilityBillId");

-- CreateIndex
CREATE UNIQUE INDEX "School_taxClearanceId_key" ON "School"("taxClearanceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_user_id_key" ON "Teacher"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacher_id_key" ON "Teacher"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employee_number_key" ON "Teacher"("employee_number");

-- CreateIndex
CREATE INDEX "Teacher_school_id_idx" ON "Teacher"("school_id");

-- CreateIndex
CREATE INDEX "Teacher_academic_session_id_idx" ON "Teacher"("academic_session_id");

-- CreateIndex
CREATE INDEX "Teacher_teacher_id_idx" ON "Teacher"("teacher_id");

-- CreateIndex
CREATE INDEX "Teacher_employee_number_idx" ON "Teacher"("employee_number");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "Teacher"("department");

-- CreateIndex
CREATE INDEX "Teacher_is_class_teacher_idx" ON "Teacher"("is_class_teacher");

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_id_key" ON "Student"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admission_number_key" ON "Student"("admission_number");

-- CreateIndex
CREATE INDEX "Student_school_id_idx" ON "Student"("school_id");

-- CreateIndex
CREATE INDEX "Student_academic_session_id_idx" ON "Student"("academic_session_id");

-- CreateIndex
CREATE INDEX "Student_current_class_id_idx" ON "Student"("current_class_id");

-- CreateIndex
CREATE INDEX "Student_student_id_idx" ON "Student"("student_id");

-- CreateIndex
CREATE INDEX "Student_admission_number_idx" ON "Student"("admission_number");

-- CreateIndex
CREATE INDEX "Student_parent_id_idx" ON "Student"("parent_id");

-- CreateIndex
CREATE INDEX "Student_academic_level_idx" ON "Student"("academic_level");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_user_id_key" ON "Parent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_parent_id_key" ON "Parent"("parent_id");

-- CreateIndex
CREATE INDEX "Parent_school_id_idx" ON "Parent"("school_id");

-- CreateIndex
CREATE INDEX "Parent_parent_id_idx" ON "Parent"("parent_id");

-- CreateIndex
CREATE INDEX "Parent_relationship_idx" ON "Parent"("relationship");

-- CreateIndex
CREATE INDEX "Parent_is_primary_contact_idx" ON "Parent"("is_primary_contact");

-- CreateIndex
CREATE INDEX "Class_schoolId_academic_session_id_idx" ON "Class"("schoolId", "academic_session_id");

-- CreateIndex
CREATE INDEX "Class_classId_idx" ON "Class"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_academic_session_id_classId_key" ON "Class"("schoolId", "academic_session_id", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_schoolId_academic_session_id_key" ON "Subject"("code", "schoolId", "academic_session_id");

-- CreateIndex
CREATE INDEX "Topic_subject_id_order_idx" ON "Topic"("subject_id", "order");

-- CreateIndex
CREATE INDEX "Topic_school_id_academic_session_id_idx" ON "Topic"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Topic_created_by_idx" ON "Topic"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subject_id_title_academic_session_id_key" ON "Topic"("subject_id", "title", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "Finance_school_id_key" ON "Finance"("school_id");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacher_id_timeSlotId_day_of_week_academic_s_idx" ON "TimetableEntry"("teacher_id", "timeSlotId", "day_of_week", "academic_session_id");

-- CreateIndex
CREATE INDEX "TimetableEntry_school_id_day_of_week_timeSlotId_academic_se_idx" ON "TimetableEntry"("school_id", "day_of_week", "timeSlotId", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_class_id_timeSlotId_day_of_week_academic_ses_key" ON "TimetableEntry"("class_id", "timeSlotId", "day_of_week", "academic_session_id");

-- CreateIndex
CREATE INDEX "TimeSlot_order_idx" ON "TimeSlot"("order");

-- CreateIndex
CREATE INDEX "TimeSlot_schoolId_startTime_endTime_idx" ON "TimeSlot"("schoolId", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_startTime_endTime_schoolId_key" ON "TimeSlot"("startTime", "endTime", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_school_id_key" ON "Wallet"("school_id");

-- CreateIndex
CREATE INDEX "Wallet_school_id_idx" ON "Wallet"("school_id");

-- CreateIndex
CREATE INDEX "Wallet_wallet_type_idx" ON "Wallet"("wallet_type");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON "WalletTransaction"("reference");

-- CreateIndex
CREATE INDEX "WalletTransaction_wallet_id_idx" ON "WalletTransaction"("wallet_id");

-- CreateIndex
CREATE INDEX "WalletTransaction_transaction_type_idx" ON "WalletTransaction"("transaction_type");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_idx" ON "WalletTransaction"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_reference_idx" ON "WalletTransaction"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_key" ON "TeacherSubject"("teacherId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_user_id_idx" ON "DeviceToken"("user_id");

-- CreateIndex
CREATE INDEX "DeviceToken_school_id_idx" ON "DeviceToken"("school_id");

-- CreateIndex
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_isActive_idx" ON "DeviceToken"("isActive");

-- CreateIndex
CREATE INDEX "Result_school_id_academic_session_id_idx" ON "Result"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Result_student_id_idx" ON "Result"("student_id");

-- CreateIndex
CREATE INDEX "Result_class_id_idx" ON "Result"("class_id");

-- CreateIndex
CREATE INDEX "Result_released_at_idx" ON "Result"("released_at");

-- CreateIndex
CREATE UNIQUE INDEX "Result_academic_session_id_student_id_key" ON "Result"("academic_session_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_name_key" ON "Organisation"("name");

-- CreateIndex
CREATE INDEX "VideoContent_schoolId_idx" ON "VideoContent"("schoolId");

-- CreateIndex
CREATE INDEX "VideoContent_platformId_idx" ON "VideoContent"("platformId");

-- CreateIndex
CREATE INDEX "VideoContent_topic_id_idx" ON "VideoContent"("topic_id");

-- CreateIndex
CREATE INDEX "VideoContent_status_idx" ON "VideoContent"("status");

-- CreateIndex
CREATE INDEX "VideoContent_createdAt_idx" ON "VideoContent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PDFMaterial_materialId_key" ON "PDFMaterial"("materialId");

-- CreateIndex
CREATE INDEX "PDFMaterial_schoolId_idx" ON "PDFMaterial"("schoolId");

-- CreateIndex
CREATE INDEX "PDFMaterial_platformId_idx" ON "PDFMaterial"("platformId");

-- CreateIndex
CREATE INDEX "PDFMaterial_topic_id_idx" ON "PDFMaterial"("topic_id");

-- CreateIndex
CREATE INDEX "PDFMaterial_status_idx" ON "PDFMaterial"("status");

-- CreateIndex
CREATE INDEX "PDFMaterial_createdAt_idx" ON "PDFMaterial"("createdAt");

-- CreateIndex
CREATE INDEX "Assignment_school_id_academic_session_id_idx" ON "Assignment"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Assignment_topic_id_idx" ON "Assignment"("topic_id");

-- CreateIndex
CREATE INDEX "Assignment_created_by_idx" ON "Assignment"("created_by");

-- CreateIndex
CREATE INDEX "Assignment_due_date_idx" ON "Assignment"("due_date");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_is_published_idx" ON "Assignment"("is_published");

-- CreateIndex
CREATE INDEX "Assessment_school_id_academic_session_id_idx" ON "Assessment"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Assessment_topic_id_idx" ON "Assessment"("topic_id");

-- CreateIndex
CREATE INDEX "Assessment_created_by_idx" ON "Assessment"("created_by");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "Assessment_is_published_idx" ON "Assessment"("is_published");

-- CreateIndex
CREATE INDEX "Assessment_assessment_type_idx" ON "Assessment"("assessment_type");

-- CreateIndex
CREATE INDEX "Assessment_start_date_end_date_idx" ON "Assessment"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessment_id_order_idx" ON "AssessmentQuestion"("assessment_id", "order");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_question_type_idx" ON "AssessmentQuestion"("question_type");

-- CreateIndex
CREATE INDEX "AssessmentOption_question_id_order_idx" ON "AssessmentOption"("question_id", "order");

-- CreateIndex
CREATE INDEX "AssessmentCorrectAnswer_question_id_idx" ON "AssessmentCorrectAnswer"("question_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessment_id_idx" ON "AssessmentAttempt"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_student_id_idx" ON "AssessmentAttempt"("student_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_submitted_at_idx" ON "AssessmentAttempt"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_assessment_id_student_id_attempt_number_key" ON "AssessmentAttempt"("assessment_id", "student_id", "attempt_number");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_assessment_id_idx" ON "AssessmentSubmission"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_student_id_idx" ON "AssessmentSubmission"("student_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_school_id_academic_session_id_idx" ON "AssessmentSubmission"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_submitted_at_idx" ON "AssessmentSubmission"("submitted_at");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_status_idx" ON "AssessmentSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_assessment_id_student_id_key" ON "AssessmentSubmission"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_attempt_id_idx" ON "AssessmentResponse"("attempt_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_question_id_idx" ON "AssessmentResponse"("question_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_student_id_idx" ON "AssessmentResponse"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_attempt_id_question_id_key" ON "AssessmentResponse"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnalytics_assessment_id_key" ON "AssessmentAnalytics"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentAnalytics_assessment_id_idx" ON "AssessmentAnalytics"("assessment_id");

-- CreateIndex
CREATE INDEX "LiveClass_schoolId_idx" ON "LiveClass"("schoolId");

-- CreateIndex
CREATE INDEX "LiveClass_platformId_idx" ON "LiveClass"("platformId");

-- CreateIndex
CREATE INDEX "LiveClass_topic_id_idx" ON "LiveClass"("topic_id");

-- CreateIndex
CREATE INDEX "LiveClass_startTime_idx" ON "LiveClass"("startTime");

-- CreateIndex
CREATE INDEX "LiveClass_status_idx" ON "LiveClass"("status");

-- CreateIndex
CREATE INDEX "LiveClass_createdAt_idx" ON "LiveClass"("createdAt");

-- CreateIndex
CREATE INDEX "LibraryResource_schoolId_idx" ON "LibraryResource"("schoolId");

-- CreateIndex
CREATE INDEX "LibraryResource_platformId_idx" ON "LibraryResource"("platformId");

-- CreateIndex
CREATE INDEX "LibraryResource_resourceType_idx" ON "LibraryResource"("resourceType");

-- CreateIndex
CREATE INDEX "LibraryResource_topic_id_idx" ON "LibraryResource"("topic_id");

-- CreateIndex
CREATE INDEX "LibraryResource_status_idx" ON "LibraryResource"("status");

-- CreateIndex
CREATE INDEX "LibraryResource_createdAt_idx" ON "LibraryResource"("createdAt");

-- CreateIndex
CREATE INDEX "GradingRubric_school_id_academic_session_id_idx" ON "GradingRubric"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "GradingRubric_created_by_idx" ON "GradingRubric"("created_by");

-- CreateIndex
CREATE INDEX "GradingRubric_is_template_idx" ON "GradingRubric"("is_template");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignment_id_idx" ON "AssignmentSubmission"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_student_id_idx" ON "AssignmentSubmission"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_school_id_academic_session_id_idx" ON "AssignmentSubmission"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_submitted_at_idx" ON "AssignmentSubmission"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignment_id_student_id_key" ON "AssignmentSubmission"("assignment_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentGrade_submission_id_key" ON "AssignmentGrade"("submission_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_assignment_id_idx" ON "AssignmentGrade"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_student_id_idx" ON "AssignmentGrade"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_teacher_id_idx" ON "AssignmentGrade"("teacher_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_school_id_academic_session_id_idx" ON "AssignmentGrade"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_graded_at_idx" ON "AssignmentGrade"("graded_at");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProcessing_material_id_key" ON "MaterialProcessing"("material_id");

-- CreateIndex
CREATE INDEX "MaterialProcessing_school_id_idx" ON "MaterialProcessing"("school_id");

-- CreateIndex
CREATE INDEX "MaterialProcessing_status_idx" ON "MaterialProcessing"("status");

-- CreateIndex
CREATE INDEX "MaterialProcessing_createdAt_idx" ON "MaterialProcessing"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentChunk_material_id_idx" ON "DocumentChunk"("material_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_school_id_idx" ON "DocumentChunk"("school_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_chunk_type_idx" ON "DocumentChunk"("chunk_type");

-- CreateIndex
CREATE INDEX "DocumentChunk_page_number_idx" ON "DocumentChunk"("page_number");

-- CreateIndex
CREATE INDEX "DocumentChunk_order_index_idx" ON "DocumentChunk"("order_index");

-- CreateIndex
CREATE INDEX "DocumentChunk_createdAt_idx" ON "DocumentChunk"("createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_user_id_idx" ON "ChatConversation"("user_id");

-- CreateIndex
CREATE INDEX "ChatConversation_school_id_idx" ON "ChatConversation"("school_id");

-- CreateIndex
CREATE INDEX "ChatConversation_material_id_idx" ON "ChatConversation"("material_id");

-- CreateIndex
CREATE INDEX "ChatConversation_status_idx" ON "ChatConversation"("status");

-- CreateIndex
CREATE INDEX "ChatConversation_last_activity_idx" ON "ChatConversation"("last_activity");

-- CreateIndex
CREATE INDEX "ChatMessage_conversation_id_idx" ON "ChatMessage"("conversation_id");

-- CreateIndex
CREATE INDEX "ChatMessage_user_id_idx" ON "ChatMessage"("user_id");

-- CreateIndex
CREATE INDEX "ChatMessage_school_id_idx" ON "ChatMessage"("school_id");

-- CreateIndex
CREATE INDEX "ChatMessage_material_id_idx" ON "ChatMessage"("material_id");

-- CreateIndex
CREATE INDEX "ChatMessage_role_idx" ON "ChatMessage"("role");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatContext_conversation_id_idx" ON "ChatContext"("conversation_id");

-- CreateIndex
CREATE INDEX "ChatContext_message_id_idx" ON "ChatContext"("message_id");

-- CreateIndex
CREATE INDEX "ChatContext_chunk_id_idx" ON "ChatContext"("chunk_id");

-- CreateIndex
CREATE INDEX "ChatContext_school_id_idx" ON "ChatContext"("school_id");

-- CreateIndex
CREATE INDEX "ChatContext_relevance_score_idx" ON "ChatContext"("relevance_score");

-- CreateIndex
CREATE UNIQUE INDEX "ChatContext_message_id_chunk_id_key" ON "ChatContext"("message_id", "chunk_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_school_id_idx" ON "ChatAnalytics"("school_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_material_id_idx" ON "ChatAnalytics"("material_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_user_id_idx" ON "ChatAnalytics"("user_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_date_idx" ON "ChatAnalytics"("date");

-- CreateIndex
CREATE INDEX "AttendanceSession_school_id_academic_session_id_idx" ON "AttendanceSession"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceSession_class_id_date_idx" ON "AttendanceSession"("class_id", "date");

-- CreateIndex
CREATE INDEX "AttendanceSession_teacher_id_date_idx" ON "AttendanceSession"("teacher_id", "date");

-- CreateIndex
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE INDEX "AttendanceSession_attendance_rate_idx" ON "AttendanceSession"("attendance_rate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_class_id_date_session_type_key" ON "AttendanceSession"("class_id", "date", "session_type");

-- CreateIndex
CREATE INDEX "AttendanceRecord_school_id_academic_session_id_idx" ON "AttendanceRecord"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_class_id_idx" ON "AttendanceRecord"("class_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_student_id_idx" ON "AttendanceRecord"("student_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_marked_at_idx" ON "AttendanceRecord"("marked_at");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendance_session_id_student_id_key" ON "AttendanceRecord"("attendance_session_id", "student_id");

-- CreateIndex
CREATE INDEX "AttendanceSummary_school_id_academic_session_id_idx" ON "AttendanceSummary"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceSummary_class_id_period_type_idx" ON "AttendanceSummary"("class_id", "period_type");

-- CreateIndex
CREATE INDEX "AttendanceSummary_student_id_period_type_idx" ON "AttendanceSummary"("student_id", "period_type");

-- CreateIndex
CREATE INDEX "AttendanceSummary_period_start_period_end_idx" ON "AttendanceSummary"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "AttendanceSummary_attendance_rate_idx" ON "AttendanceSummary"("attendance_rate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSummary_school_id_academic_session_id_class_id_st_key" ON "AttendanceSummary"("school_id", "academic_session_id", "class_id", "student_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSettings_school_id_key" ON "AttendanceSettings"("school_id");

-- CreateIndex
CREATE INDEX "AttendanceSettings_school_id_academic_session_id_idx" ON "AttendanceSettings"("school_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_user_id_key" ON "UserSettings"("user_id");

-- CreateIndex
CREATE INDEX "UserSettings_user_id_idx" ON "UserSettings"("user_id");

-- CreateIndex
CREATE INDEX "UserSettings_school_id_idx" ON "UserSettings"("school_id");

-- CreateIndex
CREATE INDEX "Achievement_school_id_idx" ON "Achievement"("school_id");

-- CreateIndex
CREATE INDEX "Achievement_academic_session_id_idx" ON "Achievement"("academic_session_id");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- CreateIndex
CREATE INDEX "StudentAchievement_student_id_idx" ON "StudentAchievement"("student_id");

-- CreateIndex
CREATE INDEX "StudentAchievement_achievement_id_idx" ON "StudentAchievement"("achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAchievement_student_id_achievement_id_key" ON "StudentAchievement"("student_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "SupportInfo_school_id_key" ON "SupportInfo"("school_id");

-- CreateIndex
CREATE INDEX "SupportInfo_school_id_idx" ON "SupportInfo"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscriptionPlan_school_id_key" ON "PlatformSubscriptionPlan"("school_id");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_school_id_idx" ON "PlatformSubscriptionPlan"("school_id");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_plan_type_idx" ON "PlatformSubscriptionPlan"("plan_type");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_status_idx" ON "PlatformSubscriptionPlan"("status");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_is_active_idx" ON "PlatformSubscriptionPlan"("is_active");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPlan_is_template_idx" ON "PlatformSubscriptionPlan"("is_template");

-- CreateIndex
CREATE INDEX "_ResponseOptions_B_index" ON "_ResponseOptions"("B");

-- AddForeignKey
ALTER TABLE "AcademicSession" ADD CONSTRAINT "AcademicSession_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_cacId_fkey" FOREIGN KEY ("cacId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_taxClearanceId_fkey" FOREIGN KEY ("taxClearanceId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_current_class_id_fkey" FOREIGN KEY ("current_class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_finance_id_fkey" FOREIGN KEY ("finance_id") REFERENCES "Finance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES "Finance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherSubject" ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPerformance" ADD CONSTRAINT "StudentPerformance_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPerformance" ADD CONSTRAINT "StudentPerformance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPerformance" ADD CONSTRAINT "StudentPerformance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_released_by_fkey" FOREIGN KEY ("released_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoContent" ADD CONSTRAINT "VideoContent_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoContent" ADD CONSTRAINT "VideoContent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoContent" ADD CONSTRAINT "VideoContent_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoContent" ADD CONSTRAINT "VideoContent_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFMaterial" ADD CONSTRAINT "PDFMaterial_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFMaterial" ADD CONSTRAINT "PDFMaterial_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFMaterial" ADD CONSTRAINT "PDFMaterial_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFMaterial" ADD CONSTRAINT "PDFMaterial_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_grading_rubric_id_fkey" FOREIGN KEY ("grading_rubric_id") REFERENCES "GradingRubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCorrectAnswer" ADD CONSTRAINT "AssessmentCorrectAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnalytics" ADD CONSTRAINT "AssessmentAnalytics_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "AssignmentSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProcessing" ADD CONSTRAINT "MaterialProcessing_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProcessing" ADD CONSTRAINT "MaterialProcessing_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_material_processing_id_fkey" FOREIGN KEY ("material_processing_id") REFERENCES "MaterialProcessing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendance_session_id_fkey" FOREIGN KEY ("attendance_session_id") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSettings" ADD CONSTRAINT "AttendanceSettings_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSettings" ADD CONSTRAINT "AttendanceSettings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportInfo" ADD CONSTRAINT "SupportInfo_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSubscriptionPlan" ADD CONSTRAINT "PlatformSubscriptionPlan_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_A_fkey" FOREIGN KEY ("A") REFERENCES "AssessmentOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_B_fkey" FOREIGN KEY ("B") REFERENCES "AssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
