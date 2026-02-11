--
-- PostgreSQL database dump
--

\restrict W0Pgni8NYBDFqellAQghMZJQNBk6cfuFilGdADpjjesdAbnt0lW6jeWV6XyjXdX

-- Dumped from database version 17.7 (bdd1736)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: AcademicSessionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademicSessionStatus" AS ENUM (
    'active',
    'inactive',
    'completed'
);


--
-- Name: AcademicTerm; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AcademicTerm" AS ENUM (
    'first',
    'second',
    'third'
);


--
-- Name: AccessLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessLevel" AS ENUM (
    'FULL',
    'READ_ONLY',
    'LIMITED'
);


--
-- Name: AchievementType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AchievementType" AS ENUM (
    'ACADEMIC',
    'ATTENDANCE',
    'SPORTS',
    'EXTRACURRICULAR',
    'BEHAVIOR',
    'LEADERSHIP',
    'OTHER'
);


--
-- Name: AssessmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssessmentType" AS ENUM (
    'FORMATIVE',
    'SUMMATIVE',
    'DIAGNOSTIC',
    'BENCHMARK',
    'PRACTICE',
    'MOCK_EXAM',
    'QUIZ',
    'TEST',
    'EXAM',
    'ASSIGNMENT',
    'CBT',
    'OTHER'
);


--
-- Name: AssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssignmentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ACTIVE',
    'CLOSED',
    'ARCHIVED'
);


--
-- Name: AssignmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AssignmentType" AS ENUM (
    'HOMEWORK',
    'PROJECT',
    'ESSAY',
    'RESEARCH',
    'PRACTICAL',
    'PRESENTATION'
);


--
-- Name: AttendancePeriodType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendancePeriodType" AS ENUM (
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'TERM',
    'YEARLY'
);


--
-- Name: AttendanceRecordStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceRecordStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED',
    'PARTIAL'
);


--
-- Name: AttendanceSessionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceSessionType" AS ENUM (
    'DAILY',
    'MORNING',
    'AFTERNOON',
    'EVENING',
    'SPECIAL'
);


--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PENDING',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: AuditForType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditForType" AS ENUM (
    'onboard_school',
    'onboard_classes',
    'onboard_teachers',
    'onboard_students',
    'create_subject',
    'update_subject',
    'release_results',
    'unrelease_results'
);


--
-- Name: AuditPerformedByType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditPerformedByType" AS ENUM (
    'school_user',
    'library_user'
);


--
-- Name: BillingCycle; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BillingCycle" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
    'ONE_TIME'
);


--
-- Name: ChapterStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChapterStatus" AS ENUM (
    'active',
    'deleted'
);


--
-- Name: ChunkType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChunkType" AS ENUM (
    'TEXT',
    'HEADING',
    'PARAGRAPH',
    'LIST',
    'TABLE',
    'IMAGE_CAPTION',
    'FOOTNOTE'
);


--
-- Name: ConversationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConversationStatus" AS ENUM (
    'ACTIVE',
    'PAUSED',
    'ENDED',
    'ARCHIVED'
);


--
-- Name: DayOfWeek; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DayOfWeek" AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);


--
-- Name: DifficultyLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DifficultyLevel" AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD',
    'EXPERT'
);


--
-- Name: ExamBodyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExamBodyStatus" AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: Gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Gender" AS ENUM (
    'male',
    'female',
    'other'
);


--
-- Name: GradeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GradeStatus" AS ENUM (
    'PENDING',
    'GRADED',
    'RETURNED',
    'DISPUTED',
    'FINAL'
);


--
-- Name: GradingType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GradingType" AS ENUM (
    'AUTOMATIC',
    'MANUAL',
    'MIXED'
);


--
-- Name: HlsTranscodeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."HlsTranscodeStatus" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);


--
-- Name: LibraryAssignmentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryAssignmentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'CLOSED',
    'ARCHIVED'
);


--
-- Name: LibraryAssignmentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryAssignmentType" AS ENUM (
    'HOMEWORK',
    'PROJECT',
    'ESSAY',
    'QUIZ',
    'PRACTICAL',
    'OTHER'
);


--
-- Name: LibraryContentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryContentStatus" AS ENUM (
    'draft',
    'published',
    'archived'
);


--
-- Name: LibraryMaterialType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryMaterialType" AS ENUM (
    'PDF',
    'DOC',
    'PPT',
    'VIDEO',
    'NOTE',
    'LINK',
    'OTHER'
);


--
-- Name: LibraryPlatformStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryPlatformStatus" AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: LibraryResourceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryResourceType" AS ENUM (
    'SUBJECT',
    'TOPIC',
    'VIDEO',
    'MATERIAL',
    'ASSESSMENT',
    'ALL'
);


--
-- Name: LibraryUserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryUserRole" AS ENUM (
    'admin',
    'manager',
    'content_creator',
    'reviewer',
    'viewer'
);


--
-- Name: LibraryUserType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LibraryUserType" AS ENUM (
    'libraryresourceowner',
    'librarymanager',
    'contentcreator',
    'reviewer',
    'viewer'
);


--
-- Name: MaterialProcessingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MaterialProcessingStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'RETRYING'
);


--
-- Name: MessageRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageRole" AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'all',
    'teachers',
    'students',
    'school_director',
    'admin'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'full',
    'partial'
);


--
-- Name: PurchaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PurchaseStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'CANCELLED'
);


--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuestionType" AS ENUM (
    'MULTIPLE_CHOICE_SINGLE',
    'MULTIPLE_CHOICE_MULTIPLE',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'TRUE_FALSE',
    'FILL_IN_BLANK',
    'MATCHING',
    'ORDERING',
    'FILE_UPLOAD',
    'NUMERIC',
    'DATE',
    'RATING_SCALE'
);


--
-- Name: QuizAttemptStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuizAttemptStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'SUBMITTED',
    'GRADED',
    'EXPIRED'
);


--
-- Name: QuizStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."QuizStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ACTIVE',
    'CLOSED',
    'ARCHIVED'
);


--
-- Name: Roles; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Roles" AS ENUM (
    'student',
    'teacher',
    'school_director',
    'school_admin',
    'parent',
    'super_admin',
    'ict_staff'
);


--
-- Name: RubricScale; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RubricScale" AS ENUM (
    'POINTS',
    'PERCENTAGE',
    'LETTER_GRADE',
    'CUSTOM'
);


--
-- Name: SchoolOwnership; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SchoolOwnership" AS ENUM (
    'government',
    'private'
);


--
-- Name: SchoolStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SchoolStatus" AS ENUM (
    'not_verified',
    'pending',
    'approved',
    'rejected',
    'failed',
    'suspended',
    'closed',
    'archived'
);


--
-- Name: SchoolType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SchoolType" AS ENUM (
    'primary',
    'secondary',
    'primary_and_secondary'
);


--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'GRADED',
    'RETURNED',
    'RESUBMITTED'
);


--
-- Name: SubscriptionPlanType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionPlanType" AS ENUM (
    'FREE',
    'BASIC',
    'PREMIUM',
    'ENTERPRISE',
    'CUSTOM'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'EXPIRED',
    'CANCELLED',
    'TRIAL'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'credit',
    'debit'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'active',
    'suspended',
    'inactive'
);


--
-- Name: WalletTransactionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WalletTransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'REVERSED'
);


--
-- Name: WalletTransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WalletTransactionType" AS ENUM (
    'CREDIT',
    'DEBIT',
    'TRANSFER',
    'WITHDRAWAL',
    'REFUND',
    'FEE_PAYMENT',
    'SCHOLARSHIP',
    'GRANT',
    'DONATION'
);


--
-- Name: WalletType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WalletType" AS ENUM (
    'SCHOOL_WALLET',
    'STUDENT_WALLET',
    'TEACHER_WALLET'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcademicSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AcademicSession" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_year text NOT NULL,
    start_year integer NOT NULL,
    end_year integer NOT NULL,
    term public."AcademicTerm" NOT NULL,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone NOT NULL,
    status public."AcademicSessionStatus" DEFAULT 'active'::public."AcademicSessionStatus" NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AccessControlAuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AccessControlAuditLog" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    "performedById" text NOT NULL,
    "performedByRole" text NOT NULL,
    "schoolId" text,
    "platformId" text,
    changes jsonb,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Achievement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Achievement" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."AchievementType" NOT NULL,
    icon_url text,
    points integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Assessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Assessment" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    duration integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text,
    "order" integer DEFAULT 0 NOT NULL,
    academic_session_id text NOT NULL,
    allow_review boolean DEFAULT true NOT NULL,
    auto_submit boolean DEFAULT true NOT NULL,
    created_by text NOT NULL,
    end_date timestamp(3) without time zone,
    grading_type public."GradingType" DEFAULT 'AUTOMATIC'::public."GradingType" NOT NULL,
    instructions text,
    is_published boolean DEFAULT false NOT NULL,
    is_result_released boolean DEFAULT false NOT NULL,
    max_attempts integer DEFAULT 1 NOT NULL,
    passing_score double precision DEFAULT 50.0 NOT NULL,
    published_at timestamp(3) without time zone,
    result_released_at timestamp(3) without time zone,
    school_id text NOT NULL,
    show_correct_answers boolean DEFAULT false NOT NULL,
    show_feedback boolean DEFAULT true NOT NULL,
    shuffle_options boolean DEFAULT false NOT NULL,
    shuffle_questions boolean DEFAULT false NOT NULL,
    start_date timestamp(3) without time zone,
    tags text[],
    time_limit integer,
    total_points double precision DEFAULT 100.0 NOT NULL,
    status public."QuizStatus" DEFAULT 'DRAFT'::public."QuizStatus" NOT NULL,
    subject_id text NOT NULL,
    assessment_type public."AssessmentType" DEFAULT 'CBT'::public."AssessmentType" NOT NULL,
    submissions jsonb,
    student_can_view_grading boolean DEFAULT false NOT NULL,
    can_edit_assessment boolean DEFAULT true NOT NULL,
    student_completed_assessment boolean DEFAULT false NOT NULL
);


--
-- Name: AssessmentAnalytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentAnalytics" (
    id text NOT NULL,
    assessment_id text NOT NULL,
    total_attempts integer DEFAULT 0 NOT NULL,
    total_students integer DEFAULT 0 NOT NULL,
    average_score double precision DEFAULT 0 NOT NULL,
    average_time integer DEFAULT 0 NOT NULL,
    pass_rate double precision DEFAULT 0 NOT NULL,
    question_stats jsonb NOT NULL,
    daily_attempts jsonb NOT NULL,
    hourly_attempts jsonb NOT NULL,
    completion_rate double precision DEFAULT 0 NOT NULL,
    abandonment_rate double precision DEFAULT 0 NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentAttempt" (
    id text NOT NULL,
    assessment_id text NOT NULL,
    student_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    attempt_number integer DEFAULT 1 NOT NULL,
    status public."QuizAttemptStatus" DEFAULT 'NOT_STARTED'::public."QuizAttemptStatus" NOT NULL,
    started_at timestamp(3) without time zone,
    submitted_at timestamp(3) without time zone,
    time_spent integer,
    total_score double precision DEFAULT 0 NOT NULL,
    max_score double precision NOT NULL,
    percentage double precision DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    is_graded boolean DEFAULT false NOT NULL,
    graded_at timestamp(3) without time zone,
    graded_by text,
    overall_feedback text,
    grade_letter text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentCorrectAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentCorrectAnswer" (
    id text NOT NULL,
    question_id text NOT NULL,
    answer_text text,
    answer_number double precision,
    answer_date timestamp(3) without time zone,
    option_ids text[],
    answer_json jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentOption" (
    id text NOT NULL,
    question_id text NOT NULL,
    option_text text NOT NULL,
    "order" integer NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    image_url text,
    audio_url text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentQuestion" (
    id text NOT NULL,
    assessment_id text NOT NULL,
    question_text text NOT NULL,
    question_type public."QuestionType" NOT NULL,
    "order" integer NOT NULL,
    points double precision DEFAULT 1.0 NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    time_limit integer,
    image_url text,
    image_s3_key text,
    audio_url text,
    video_url text,
    allow_multiple_attempts boolean DEFAULT false NOT NULL,
    show_hint boolean DEFAULT false NOT NULL,
    hint_text text,
    min_length integer,
    max_length integer,
    min_value double precision,
    max_value double precision,
    explanation text,
    difficulty_level public."DifficultyLevel" DEFAULT 'MEDIUM'::public."DifficultyLevel" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentResponse" (
    id text NOT NULL,
    attempt_id text NOT NULL,
    question_id text NOT NULL,
    student_id text NOT NULL,
    text_answer text,
    numeric_answer double precision,
    date_answer timestamp(3) without time zone,
    selected_options text[],
    file_urls text[],
    is_correct boolean,
    points_earned double precision DEFAULT 0 NOT NULL,
    max_points double precision NOT NULL,
    time_spent integer,
    feedback text,
    is_graded boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssessmentSubmission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssessmentSubmission" (
    id text NOT NULL,
    assessment_id text NOT NULL,
    student_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    submission_type public."AssessmentType" DEFAULT 'EXAM'::public."AssessmentType" NOT NULL,
    content text,
    attachment_url text,
    attachment_type text,
    status public."SubmissionStatus" DEFAULT 'SUBMITTED'::public."SubmissionStatus" NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    late_submission boolean DEFAULT false NOT NULL,
    word_count integer,
    file_size text,
    total_score double precision,
    max_score double precision,
    percentage double precision,
    passed boolean DEFAULT false NOT NULL,
    is_graded boolean DEFAULT false NOT NULL,
    graded_at timestamp(3) without time zone,
    graded_by text,
    feedback text,
    grade_letter text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Assignment" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    academic_session_id text NOT NULL,
    allow_late_submission boolean DEFAULT false NOT NULL,
    assignment_type public."AssignmentType" DEFAULT 'HOMEWORK'::public."AssignmentType" NOT NULL,
    attachment_type text,
    attachment_url text,
    auto_grade boolean DEFAULT false NOT NULL,
    created_by text NOT NULL,
    difficulty_level public."DifficultyLevel" DEFAULT 'MEDIUM'::public."DifficultyLevel" NOT NULL,
    due_date timestamp(3) without time zone,
    grading_rubric_id text,
    instructions text,
    is_published boolean DEFAULT false NOT NULL,
    late_penalty double precision,
    max_score integer DEFAULT 100 NOT NULL,
    published_at timestamp(3) without time zone,
    school_id text NOT NULL,
    time_limit integer,
    status public."AssignmentStatus" DEFAULT 'DRAFT'::public."AssignmentStatus" NOT NULL
);


--
-- Name: AssignmentGrade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssignmentGrade" (
    id text NOT NULL,
    assignment_id text NOT NULL,
    submission_id text NOT NULL,
    student_id text NOT NULL,
    teacher_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    score double precision NOT NULL,
    max_score double precision NOT NULL,
    percentage double precision NOT NULL,
    letter_grade text,
    feedback text,
    comments text,
    rubric_scores jsonb,
    status public."GradeStatus" DEFAULT 'PENDING'::public."GradeStatus" NOT NULL,
    graded_at timestamp(3) without time zone,
    returned_at timestamp(3) without time zone,
    grading_time integer,
    is_final boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssignmentSubmission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssignmentSubmission" (
    id text NOT NULL,
    assignment_id text NOT NULL,
    student_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    content text,
    attachment_url text,
    attachment_type text,
    status public."SubmissionStatus" DEFAULT 'SUBMITTED'::public."SubmissionStatus" NOT NULL,
    submitted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    late_submission boolean DEFAULT false NOT NULL,
    word_count integer,
    file_size text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "topicId" text
);


--
-- Name: AttendanceRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceRecord" (
    id text NOT NULL,
    attendance_session_id text NOT NULL,
    student_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    class_id text NOT NULL,
    status public."AttendanceRecordStatus" DEFAULT 'ABSENT'::public."AttendanceRecordStatus" NOT NULL,
    marked_at timestamp(3) without time zone,
    marked_by text,
    reason text,
    is_excused boolean DEFAULT false NOT NULL,
    excuse_note text,
    parent_notified boolean DEFAULT false NOT NULL,
    parent_notified_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: AttendanceSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSession" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    class_id text NOT NULL,
    teacher_id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    session_type public."AttendanceSessionType" DEFAULT 'DAILY'::public."AttendanceSessionType" NOT NULL,
    status public."AttendanceStatus" DEFAULT 'PENDING'::public."AttendanceStatus" NOT NULL,
    total_students integer DEFAULT 0 NOT NULL,
    present_count integer DEFAULT 0 NOT NULL,
    absent_count integer DEFAULT 0 NOT NULL,
    late_count integer DEFAULT 0 NOT NULL,
    excused_count integer DEFAULT 0 NOT NULL,
    attendance_rate double precision DEFAULT 0.0 NOT NULL,
    notes text,
    submitted_at timestamp(3) without time zone,
    approved_at timestamp(3) without time zone,
    approved_by text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: AttendanceSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSettings" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    late_threshold_minutes integer DEFAULT 15 NOT NULL,
    auto_mark_absent_minutes integer DEFAULT 30 NOT NULL,
    require_excuse_note boolean DEFAULT true NOT NULL,
    parent_notification_enabled boolean DEFAULT true NOT NULL,
    attendance_tracking_enabled boolean DEFAULT true NOT NULL,
    minimum_attendance_rate double precision DEFAULT 75.0 NOT NULL,
    max_consecutive_absences integer DEFAULT 5 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: AttendanceSummary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSummary" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    class_id text NOT NULL,
    student_id text,
    period_type public."AttendancePeriodType" NOT NULL,
    period_start timestamp(3) without time zone NOT NULL,
    period_end timestamp(3) without time zone NOT NULL,
    total_days integer DEFAULT 0 NOT NULL,
    present_days integer DEFAULT 0 NOT NULL,
    absent_days integer DEFAULT 0 NOT NULL,
    late_days integer DEFAULT 0 NOT NULL,
    excused_days integer DEFAULT 0 NOT NULL,
    attendance_rate double precision DEFAULT 0.0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    audit_for_type public."AuditForType" NOT NULL,
    target_id text,
    performed_by_id text,
    performed_by_type public."AuditPerformedByType",
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChatAnalytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatAnalytics" (
    id text NOT NULL,
    school_id text NOT NULL,
    material_id text,
    user_id text,
    total_conversations integer DEFAULT 0 NOT NULL,
    total_messages integer DEFAULT 0 NOT NULL,
    total_tokens_used integer DEFAULT 0 NOT NULL,
    average_response_time_ms integer DEFAULT 0 NOT NULL,
    average_relevance_score double precision DEFAULT 0 NOT NULL,
    most_used_chunks text[],
    popular_questions text[],
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    daily_usage integer DEFAULT 0 NOT NULL,
    weekly_usage integer DEFAULT 0 NOT NULL,
    monthly_usage integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChatContext; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatContext" (
    id text NOT NULL,
    conversation_id text NOT NULL,
    message_id text NOT NULL,
    chunk_id text NOT NULL,
    school_id text NOT NULL,
    relevance_score double precision NOT NULL,
    context_type text DEFAULT 'semantic'::text NOT NULL,
    position_in_context integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChatConversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatConversation" (
    id text NOT NULL,
    user_id text NOT NULL,
    school_id text NOT NULL,
    material_id text,
    title text,
    status public."ConversationStatus" DEFAULT 'ACTIVE'::public."ConversationStatus" NOT NULL,
    system_prompt text,
    context_summary text,
    total_messages integer DEFAULT 0 NOT NULL,
    last_activity timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    conversation_id text,
    user_id text NOT NULL,
    school_id text NOT NULL,
    material_id text,
    role public."MessageRole" DEFAULT 'USER'::public."MessageRole" NOT NULL,
    content text NOT NULL,
    message_type text DEFAULT 'TEXT'::text NOT NULL,
    model_used text,
    tokens_used integer,
    response_time_ms integer,
    context_chunks text[],
    context_summary text,
    is_edited boolean DEFAULT false NOT NULL,
    edited_at timestamp(3) without time zone,
    parent_message_id text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Class; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Class" (
    id text NOT NULL,
    "classId" integer NOT NULL,
    name text NOT NULL,
    "schoolId" text NOT NULL,
    academic_session_id text NOT NULL,
    "classTeacherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Class_classId_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Class_classId_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Class_classId_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Class_classId_seq" OWNED BY public."Class"."classId";


--
-- Name: Developer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Developer" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'developer'::text NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DeviceToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeviceToken" (
    id text NOT NULL,
    token text NOT NULL,
    "deviceType" text NOT NULL,
    user_id text NOT NULL,
    school_id text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    secure_url text NOT NULL,
    public_id text NOT NULL
);


--
-- Name: DocumentChunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DocumentChunk" (
    id text NOT NULL,
    material_processing_id text NOT NULL,
    material_id text NOT NULL,
    school_id text NOT NULL,
    content text NOT NULL,
    chunk_type public."ChunkType" DEFAULT 'TEXT'::public."ChunkType" NOT NULL,
    page_number integer,
    section_title text,
    embedding public.vector NOT NULL,
    embedding_model text NOT NULL,
    token_count integer DEFAULT 0 NOT NULL,
    word_count integer DEFAULT 0 NOT NULL,
    order_index integer NOT NULL,
    keywords text[] DEFAULT ARRAY[]::text[],
    summary text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBody; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBody" (
    id text NOT NULL,
    name text NOT NULL,
    "fullName" text NOT NULL,
    code text NOT NULL,
    description text,
    "logoUrl" text,
    "websiteUrl" text,
    status public."ExamBodyStatus" DEFAULT 'active'::public."ExamBodyStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyAssessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessment" (
    id text NOT NULL,
    "examBodyId" text NOT NULL,
    "subjectId" text NOT NULL,
    "yearId" text NOT NULL,
    title text NOT NULL,
    description text,
    instructions text,
    "assessmentType" public."AssessmentType" DEFAULT 'CBT'::public."AssessmentType" NOT NULL,
    duration integer,
    "totalPoints" double precision DEFAULT 0 NOT NULL,
    "passingScore" double precision DEFAULT 50 NOT NULL,
    "maxAttempts" integer DEFAULT 999,
    "allowReview" boolean DEFAULT true NOT NULL,
    "shuffleQuestions" boolean DEFAULT true NOT NULL,
    "shuffleOptions" boolean DEFAULT true NOT NULL,
    "showCorrectAnswers" boolean DEFAULT true NOT NULL,
    "showFeedback" boolean DEFAULT true NOT NULL,
    "showExplanation" boolean DEFAULT true NOT NULL,
    status public."ExamBodyStatus" DEFAULT 'active'::public."ExamBodyStatus" NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "platformId" text
);


--
-- Name: ExamBodyAssessmentAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessmentAttempt" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "userId" text NOT NULL,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    status public."QuizAttemptStatus" DEFAULT 'IN_PROGRESS'::public."QuizAttemptStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "timeSpent" integer,
    "totalScore" double precision DEFAULT 0 NOT NULL,
    "maxScore" double precision DEFAULT 0 NOT NULL,
    percentage double precision DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    "isGraded" boolean DEFAULT false NOT NULL,
    "gradedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyAssessmentCorrectAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessmentCorrectAnswer" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "answerText" text,
    "answerNumber" double precision,
    "answerDate" timestamp(3) without time zone,
    "optionIds" text[],
    "answerJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyAssessmentOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessmentOption" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "optionText" text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "imageUrl" text,
    "audioUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyAssessmentQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessmentQuestion" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "questionText" text NOT NULL,
    "questionType" public."QuestionType" DEFAULT 'MULTIPLE_CHOICE_SINGLE'::public."QuestionType" NOT NULL,
    "imageUrl" text,
    "audioUrl" text,
    "videoUrl" text,
    points double precision DEFAULT 1 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    explanation text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyAssessmentResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyAssessmentResponse" (
    id text NOT NULL,
    "attemptId" text NOT NULL,
    "questionId" text NOT NULL,
    "userId" text NOT NULL,
    "textAnswer" text,
    "numericAnswer" double precision,
    "dateAnswer" timestamp(3) without time zone,
    "selectedOptions" text[],
    "fileUrls" text[],
    "answerJson" jsonb,
    "isCorrect" boolean,
    "pointsEarned" double precision DEFAULT 0 NOT NULL,
    "maxPoints" double precision DEFAULT 0 NOT NULL,
    feedback text,
    "isGraded" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodySubject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodySubject" (
    id text NOT NULL,
    "examBodyId" text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    "iconUrl" text,
    "order" integer DEFAULT 0 NOT NULL,
    status public."ExamBodyStatus" DEFAULT 'active'::public."ExamBodyStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExamBodyYear; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExamBodyYear" (
    id text NOT NULL,
    "examBodyId" text NOT NULL,
    year text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "order" integer DEFAULT 0 NOT NULL,
    status public."ExamBodyStatus" DEFAULT 'active'::public."ExamBodyStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Finance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Finance" (
    id text NOT NULL,
    school_id text NOT NULL,
    total_revenue double precision DEFAULT 0 NOT NULL,
    outstanding_fee double precision DEFAULT 0 NOT NULL,
    amount_withdrawn double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GradingRubric; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GradingRubric" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    created_by text NOT NULL,
    criteria jsonb NOT NULL,
    total_points double precision NOT NULL,
    scale_type public."RubricScale" DEFAULT 'POINTS'::public."RubricScale" NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessment" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "topicId" text,
    "createdById" text NOT NULL,
    title text NOT NULL,
    description text,
    instructions text,
    "assessmentType" public."AssessmentType" DEFAULT 'CBT'::public."AssessmentType" NOT NULL,
    "gradingType" public."GradingType" DEFAULT 'AUTOMATIC'::public."GradingType" NOT NULL,
    status public."QuizStatus" DEFAULT 'DRAFT'::public."QuizStatus" NOT NULL,
    duration integer,
    "timeLimit" integer,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "maxAttempts" integer DEFAULT 1 NOT NULL,
    "allowReview" boolean DEFAULT true NOT NULL,
    "autoSubmit" boolean DEFAULT false NOT NULL,
    "totalPoints" double precision DEFAULT 100.0 NOT NULL,
    "passingScore" double precision DEFAULT 50.0 NOT NULL,
    "showCorrectAnswers" boolean DEFAULT false NOT NULL,
    "showFeedback" boolean DEFAULT true NOT NULL,
    "studentCanViewGrading" boolean DEFAULT true NOT NULL,
    "shuffleQuestions" boolean DEFAULT false NOT NULL,
    "shuffleOptions" boolean DEFAULT false NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "isResultReleased" boolean DEFAULT false NOT NULL,
    "resultReleasedAt" timestamp(3) without time zone,
    tags text[] DEFAULT ARRAY[]::text[],
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentAnalytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentAnalytics" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "totalAttempts" integer DEFAULT 0 NOT NULL,
    "totalUsers" integer DEFAULT 0 NOT NULL,
    "averageScore" double precision DEFAULT 0 NOT NULL,
    "averageTime" integer DEFAULT 0 NOT NULL,
    "passRate" double precision DEFAULT 0 NOT NULL,
    "questionStats" jsonb NOT NULL,
    "dailyAttempts" jsonb NOT NULL,
    "hourlyAttempts" jsonb NOT NULL,
    "completionRate" double precision DEFAULT 0 NOT NULL,
    "abandonmentRate" double precision DEFAULT 0 NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentAttempt" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "userId" text NOT NULL,
    "attemptNumber" integer DEFAULT 1 NOT NULL,
    status public."QuizAttemptStatus" DEFAULT 'NOT_STARTED'::public."QuizAttemptStatus" NOT NULL,
    "startedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "timeSpent" integer,
    "totalScore" double precision DEFAULT 0 NOT NULL,
    "maxScore" double precision NOT NULL,
    percentage double precision DEFAULT 0 NOT NULL,
    passed boolean DEFAULT false NOT NULL,
    "isGraded" boolean DEFAULT false NOT NULL,
    "gradedAt" timestamp(3) without time zone,
    "gradedBy" text,
    "overallFeedback" text,
    "gradeLetter" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentCorrectAnswer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentCorrectAnswer" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "answerText" text,
    "answerNumber" double precision,
    "answerDate" timestamp(3) without time zone,
    "optionIds" text[],
    "answerJson" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentOption" (
    id text NOT NULL,
    "questionId" text NOT NULL,
    "optionText" text NOT NULL,
    "order" integer NOT NULL,
    "isCorrect" boolean DEFAULT false NOT NULL,
    "imageUrl" text,
    "audioUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentQuestion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentQuestion" (
    id text NOT NULL,
    "assessmentId" text NOT NULL,
    "questionText" text NOT NULL,
    "questionType" public."QuestionType" NOT NULL,
    "order" integer NOT NULL,
    points double precision DEFAULT 1.0 NOT NULL,
    "isRequired" boolean DEFAULT true NOT NULL,
    "timeLimit" integer,
    "imageUrl" text,
    "imageS3Key" text,
    "audioUrl" text,
    "videoUrl" text,
    "allowMultipleAttempts" boolean DEFAULT false NOT NULL,
    "showHint" boolean DEFAULT false NOT NULL,
    "hintText" text,
    "minLength" integer,
    "maxLength" integer,
    "minValue" double precision,
    "maxValue" double precision,
    explanation text,
    "difficultyLevel" public."DifficultyLevel" DEFAULT 'MEDIUM'::public."DifficultyLevel" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssessmentResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssessmentResponse" (
    id text NOT NULL,
    "attemptId" text NOT NULL,
    "questionId" text NOT NULL,
    "userId" text NOT NULL,
    "textAnswer" text,
    "numericAnswer" double precision,
    "dateAnswer" timestamp(3) without time zone,
    "selectedOptions" text[],
    "fileUrls" text[],
    "isCorrect" boolean,
    "pointsEarned" double precision DEFAULT 0 NOT NULL,
    "maxPoints" double precision NOT NULL,
    "timeSpent" integer,
    feedback text,
    "isGraded" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryAssignment" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "topicId" text NOT NULL,
    "uploadedById" text NOT NULL,
    title text NOT NULL,
    description text,
    "assignmentType" public."LibraryAssignmentType" DEFAULT 'HOMEWORK'::public."LibraryAssignmentType" NOT NULL,
    instructions text,
    "attachmentUrl" text,
    "attachmentS3Key" text,
    "dueDate" timestamp(3) without time zone,
    "maxScore" integer DEFAULT 100 NOT NULL,
    "allowLateSubmission" boolean DEFAULT false NOT NULL,
    "latePenalty" double precision,
    status public."LibraryAssignmentStatus" DEFAULT 'DRAFT'::public."LibraryAssignmentStatus" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryClass; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryClass" (
    id text NOT NULL,
    name text NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryComment" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text,
    "topicId" text,
    "commentedById" text,
    "userId" text,
    content text NOT NULL,
    "parentCommentId" text,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterial" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "uploadedById" text NOT NULL,
    title text NOT NULL,
    description text,
    author text,
    isbn text,
    publisher text,
    "materialType" public."LibraryMaterialType" DEFAULT 'PDF'::public."LibraryMaterialType" NOT NULL,
    url text NOT NULL,
    "s3Key" text,
    "sizeBytes" integer,
    "pageCount" integer,
    "thumbnailUrl" text,
    "thumbnailS3Key" text,
    price double precision,
    currency text DEFAULT 'NGN'::text,
    "isFree" boolean DEFAULT false NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "subjectId" text,
    "isAiEnabled" boolean DEFAULT false NOT NULL,
    "processingStatus" public."MaterialProcessingStatus" DEFAULT 'PENDING'::public."MaterialProcessingStatus" NOT NULL,
    status public."LibraryContentStatus" DEFAULT 'published'::public."LibraryContentStatus" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    "salesCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialChapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChapter" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "platformId" text NOT NULL,
    title text NOT NULL,
    description text,
    "pageStart" integer,
    "pageEnd" integer,
    "order" integer DEFAULT 1 NOT NULL,
    "isAiEnabled" boolean DEFAULT false NOT NULL,
    "isProcessed" boolean DEFAULT false NOT NULL,
    "chunkCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "chapterStatus" public."ChapterStatus" DEFAULT 'active'::public."ChapterStatus" NOT NULL
);


--
-- Name: LibraryGeneralMaterialChapterFile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChapterFile" (
    id text NOT NULL,
    "chapterId" text NOT NULL,
    "platformId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "fileName" text NOT NULL,
    "fileType" public."LibraryMaterialType" DEFAULT 'PDF'::public."LibraryMaterialType" NOT NULL,
    url text NOT NULL,
    "s3Key" text,
    "sizeBytes" integer,
    "pageCount" integer,
    title text,
    description text,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialChatContext; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChatContext" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "chunkId" text NOT NULL,
    "materialId" text NOT NULL,
    "relevanceScore" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LibraryGeneralMaterialChatConversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChatConversation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "materialId" text NOT NULL,
    "platformId" text NOT NULL,
    title text,
    status public."ConversationStatus" DEFAULT 'ACTIVE'::public."ConversationStatus" NOT NULL,
    "systemPrompt" text,
    "contextSummary" text,
    "totalMessages" integer DEFAULT 0 NOT NULL,
    "lastActivity" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialChatMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChatMessage" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "materialId" text NOT NULL,
    "userId" text NOT NULL,
    role public."MessageRole" NOT NULL,
    content text NOT NULL,
    "tokensUsed" integer,
    model text,
    "referencedChunks" text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LibraryGeneralMaterialChunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialChunk" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "chapterId" text,
    "processingId" text NOT NULL,
    "platformId" text NOT NULL,
    content text NOT NULL,
    "chunkType" public."ChunkType" DEFAULT 'TEXT'::public."ChunkType" NOT NULL,
    "pageNumber" integer,
    "sectionTitle" text,
    embedding public.vector NOT NULL,
    "embeddingModel" text NOT NULL,
    "tokenCount" integer DEFAULT 0 NOT NULL,
    "wordCount" integer DEFAULT 0 NOT NULL,
    "orderIndex" integer NOT NULL,
    keywords text[] DEFAULT ARRAY[]::text[],
    summary text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialClass; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialClass" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "classId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialProcessing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialProcessing" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "platformId" text NOT NULL,
    status public."MaterialProcessingStatus" DEFAULT 'PENDING'::public."MaterialProcessingStatus" NOT NULL,
    "totalChunks" integer DEFAULT 0 NOT NULL,
    "processedChunks" integer DEFAULT 0 NOT NULL,
    "failedChunks" integer DEFAULT 0 NOT NULL,
    "processingStartedAt" timestamp(3) without time zone,
    "processingCompletedAt" timestamp(3) without time zone,
    "errorMessage" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "vectorDatabaseId" text,
    "embeddingModel" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryGeneralMaterialPurchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryGeneralMaterialPurchase" (
    id text NOT NULL,
    "materialId" text NOT NULL,
    "userId" text NOT NULL,
    "platformId" text NOT NULL,
    price double precision NOT NULL,
    currency text DEFAULT 'NGN'::text NOT NULL,
    "paymentMethod" text,
    "transactionId" text,
    status public."PurchaseStatus" DEFAULT 'PENDING'::public."PurchaseStatus" NOT NULL,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryLink; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryLink" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "topicId" text,
    "uploadedById" text NOT NULL,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    "linkType" text,
    "thumbnailUrl" text,
    domain text,
    status public."LibraryContentStatus" DEFAULT 'published'::public."LibraryContentStatus" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryMaterial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryMaterial" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "topicId" text,
    "uploadedById" text NOT NULL,
    title text NOT NULL,
    description text,
    "materialType" public."LibraryMaterialType" DEFAULT 'PDF'::public."LibraryMaterialType" NOT NULL,
    url text NOT NULL,
    "s3Key" text,
    "sizeBytes" integer,
    "pageCount" integer,
    status public."LibraryContentStatus" DEFAULT 'published'::public."LibraryContentStatus" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryPermissionDefinition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryPermissionDefinition" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryPlatform; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryPlatform" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    status public."LibraryPlatformStatus" DEFAULT 'active'::public."LibraryPlatformStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryResource; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryResource" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "resourceType" text NOT NULL,
    url text,
    "schoolId" text,
    "platformId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text,
    format text,
    status text DEFAULT 'available'::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


--
-- Name: LibraryResourceAccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryResourceAccess" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "schoolId" text NOT NULL,
    "subjectId" text,
    "topicId" text,
    "videoId" text,
    "materialId" text,
    "assessmentId" text,
    "resourceType" public."LibraryResourceType" NOT NULL,
    "accessLevel" public."AccessLevel" DEFAULT 'FULL'::public."AccessLevel" NOT NULL,
    "grantedById" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryResourceUser; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryResourceUser" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_number text,
    role public."LibraryUserRole" DEFAULT 'content_creator'::public."LibraryUserRole" NOT NULL,
    "userType" public."LibraryUserType" DEFAULT 'libraryresourceowner'::public."LibraryUserType" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "permissionLevel" integer,
    permissions text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: LibrarySubject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibrarySubject" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "classId" text,
    name text NOT NULL,
    code text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "thumbnailKey" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryTopic" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LibraryVideoLesson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryVideoLesson" (
    id text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "topicId" text,
    "uploadedById" text NOT NULL,
    title text NOT NULL,
    description text,
    "videoUrl" text NOT NULL,
    "videoS3Key" text,
    "thumbnailUrl" text,
    "thumbnailS3Key" text,
    "durationSeconds" integer,
    "sizeBytes" integer,
    views integer DEFAULT 0 NOT NULL,
    status public."LibraryContentStatus" DEFAULT 'published'::public."LibraryContentStatus" NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "hlsPlaybackUrl" text,
    "hlsS3Prefix" text,
    "hlsStatus" public."HlsTranscodeStatus"
);


--
-- Name: LibraryVideoView; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryVideoView" (
    id text NOT NULL,
    "videoId" text NOT NULL,
    "userId" text,
    "libraryResourceUserId" text,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LibraryVideoWatchHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LibraryVideoWatchHistory" (
    id text NOT NULL,
    "videoId" text NOT NULL,
    "userId" text,
    "libraryResourceUserId" text,
    "schoolId" text,
    "classId" text,
    "userRole" text,
    "watchedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "watchDurationSeconds" integer,
    "videoDurationSeconds" integer,
    "completionPercentage" double precision DEFAULT 0,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "lastWatchPosition" integer DEFAULT 0,
    "watchCount" integer DEFAULT 1 NOT NULL,
    "deviceType" text,
    platform text,
    "userAgent" text,
    "ipAddress" text,
    "referrerSource" text,
    "referrerUrl" text,
    "videoQuality" text,
    "bufferingEvents" integer DEFAULT 0,
    "playbackSpeed" double precision DEFAULT 1.0,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LiveClass; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LiveClass" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "meetingUrl" text NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    "schoolId" text,
    "platformId" text NOT NULL,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text,
    "maxParticipants" integer,
    status text DEFAULT 'scheduled'::text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


--
-- Name: MaterialProcessing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MaterialProcessing" (
    id text NOT NULL,
    material_id text NOT NULL,
    school_id text NOT NULL,
    status public."MaterialProcessingStatus" DEFAULT 'PENDING'::public."MaterialProcessingStatus" NOT NULL,
    total_chunks integer DEFAULT 0 NOT NULL,
    processed_chunks integer DEFAULT 0 NOT NULL,
    failed_chunks integer DEFAULT 0 NOT NULL,
    processing_started_at timestamp(3) without time zone,
    processing_completed_at timestamp(3) without time zone,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    vector_database_id text,
    embedding_model text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type public."NotificationType" NOT NULL,
    "comingUpOn" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Organisation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organisation" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PDFMaterial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PDFMaterial" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    "schoolId" text,
    "platformId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text,
    downloads integer DEFAULT 0 NOT NULL,
    size text,
    status text DEFAULT 'published'::text NOT NULL,
    "order" integer DEFAULT 1 NOT NULL,
    "fileType" text,
    "originalName" text,
    "materialId" text
);


--
-- Name: Parent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Parent" (
    id text NOT NULL,
    school_id text NOT NULL,
    user_id text NOT NULL,
    parent_id text NOT NULL,
    occupation text,
    employer text,
    address text,
    emergency_contact text,
    relationship text,
    is_primary_contact boolean DEFAULT true NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    finance_id text NOT NULL,
    academic_session_id text NOT NULL,
    student_id text NOT NULL,
    class_id text NOT NULL,
    payment_for text NOT NULL,
    amount double precision NOT NULL,
    payment_type public."PaymentType" NOT NULL,
    transaction_type public."TransactionType" NOT NULL,
    payment_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PlatformSubscriptionPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlatformSubscriptionPlan" (
    id text NOT NULL,
    school_id text,
    name text DEFAULT 'Free'::text NOT NULL,
    plan_type public."SubscriptionPlanType" DEFAULT 'FREE'::public."SubscriptionPlanType" NOT NULL,
    description text,
    cost double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    billing_cycle public."BillingCycle" DEFAULT 'MONTHLY'::public."BillingCycle" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    max_allowed_teachers integer DEFAULT 30 NOT NULL,
    max_allowed_students integer DEFAULT 100 NOT NULL,
    max_allowed_classes integer,
    max_allowed_subjects integer,
    allowed_document_types text[] DEFAULT ARRAY['pdf'::text],
    max_file_size_mb integer DEFAULT 10 NOT NULL,
    max_document_uploads_per_student_per_day integer DEFAULT 3 NOT NULL,
    max_document_uploads_per_teacher_per_day integer DEFAULT 10 NOT NULL,
    max_storage_mb integer DEFAULT 500 NOT NULL,
    max_files_per_month integer DEFAULT 10 NOT NULL,
    max_daily_tokens_per_user integer DEFAULT 50000 NOT NULL,
    max_weekly_tokens_per_user integer,
    max_monthly_tokens_per_user integer,
    max_total_tokens_per_school integer,
    max_messages_per_week integer DEFAULT 100 NOT NULL,
    max_conversations_per_user integer,
    max_chat_sessions_per_user integer,
    features jsonb,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    auto_renew boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_template boolean DEFAULT false NOT NULL
);


--
-- Name: Result; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Result" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    student_id text NOT NULL,
    class_id text,
    subject_results jsonb NOT NULL,
    total_ca_score double precision DEFAULT 0 NOT NULL,
    total_exam_score double precision DEFAULT 0 NOT NULL,
    total_score double precision DEFAULT 0 NOT NULL,
    total_max_score double precision DEFAULT 0 NOT NULL,
    overall_percentage double precision DEFAULT 0 NOT NULL,
    overall_grade text,
    class_position integer,
    total_students integer,
    released_by text,
    released_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_final boolean DEFAULT true NOT NULL,
    released_by_school_admin boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: School; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."School" (
    id text NOT NULL,
    school_name text NOT NULL,
    school_email text NOT NULL,
    school_phone text NOT NULL,
    school_address text NOT NULL,
    school_type public."SchoolType" NOT NULL,
    school_ownership public."SchoolOwnership" NOT NULL,
    status public."SchoolStatus" DEFAULT 'pending'::public."SchoolStatus" NOT NULL,
    school_icon jsonb,
    "cacId" text,
    "utilityBillId" text,
    "taxClearanceId" text,
    "platformId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SchoolResourceAccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolResourceAccess" (
    id text NOT NULL,
    "schoolId" text NOT NULL,
    "libraryResourceAccessId" text NOT NULL,
    "userId" text,
    "roleType" public."Roles",
    "classId" text,
    "subjectId" text,
    "topicId" text,
    "videoId" text,
    "materialId" text,
    "assessmentId" text,
    "resourceType" public."LibraryResourceType" NOT NULL,
    "accessLevel" public."AccessLevel" DEFAULT 'READ_ONLY'::public."AccessLevel" NOT NULL,
    "grantedById" text NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SchoolResourceExclusion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolResourceExclusion" (
    id text NOT NULL,
    "schoolId" text NOT NULL,
    "platformId" text NOT NULL,
    "subjectId" text NOT NULL,
    "excludedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SchoolVideoView; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolVideoView" (
    id text NOT NULL,
    "videoId" text NOT NULL,
    "userId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SchoolVideoWatchHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchoolVideoWatchHistory" (
    id text NOT NULL,
    "videoId" text NOT NULL,
    "userId" text NOT NULL,
    "schoolId" text,
    "classId" text,
    "userRole" text,
    "watchedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "watchDurationSeconds" integer,
    "videoDurationSeconds" integer,
    "completionPercentage" double precision DEFAULT 0,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "lastWatchPosition" integer DEFAULT 0,
    "watchCount" integer DEFAULT 1 NOT NULL,
    "deviceType" text,
    platform text,
    "userAgent" text,
    "referrerSource" text,
    "referrerUrl" text,
    "videoQuality" text,
    "bufferingEvents" integer DEFAULT 0,
    "playbackSpeed" double precision DEFAULT 1.0,
    "sessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Student" (
    id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    user_id text NOT NULL,
    student_id text NOT NULL,
    admission_number text,
    date_of_birth timestamp(3) without time zone,
    admission_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_class_id text,
    guardian_name text,
    guardian_phone text,
    guardian_email text,
    address text,
    emergency_contact text,
    blood_group text,
    medical_conditions text,
    allergies text,
    previous_school text,
    academic_level text,
    parent_id text,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    city text,
    country text,
    postal_code text,
    state text
);


--
-- Name: StudentAchievement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentAchievement" (
    id text NOT NULL,
    student_id text NOT NULL,
    achievement_id text NOT NULL,
    earned_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    points_earned integer DEFAULT 0 NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: StudentPerformance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StudentPerformance" (
    id text NOT NULL,
    student_id text NOT NULL,
    class_id text NOT NULL,
    academic_session_id text NOT NULL,
    term integer NOT NULL,
    year integer NOT NULL,
    total_score double precision NOT NULL,
    max_score double precision NOT NULL,
    "position" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Subject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subject" (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    description text,
    "schoolId" text NOT NULL,
    academic_session_id text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "classId" text,
    thumbnail jsonb
);


--
-- Name: SupportInfo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupportInfo" (
    id text NOT NULL,
    school_id text NOT NULL,
    faq_count integer DEFAULT 0 NOT NULL,
    last_faq_update timestamp(3) without time zone,
    faq_categories jsonb DEFAULT '[]'::jsonb NOT NULL,
    email_support text DEFAULT 'support@school.edu'::text NOT NULL,
    phone_support text DEFAULT '+1-800-SCHOOL'::text NOT NULL,
    live_chat_available boolean DEFAULT false NOT NULL,
    response_time text DEFAULT '24 hours'::text NOT NULL,
    app_version text DEFAULT '1.0.0'::text NOT NULL,
    build_number text DEFAULT '100'::text NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    minimum_ios_version text DEFAULT '13.0'::text NOT NULL,
    minimum_android_version text DEFAULT '8.0'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Teacher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Teacher" (
    id text NOT NULL,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_number text NOT NULL,
    display_picture jsonb,
    school_id text NOT NULL,
    academic_session_id text DEFAULT '1'::text NOT NULL,
    user_id text NOT NULL,
    gender public."Gender" DEFAULT 'other'::public."Gender" NOT NULL,
    role public."Roles" DEFAULT 'teacher'::public."Roles" NOT NULL,
    password text DEFAULT ''::text NOT NULL,
    teacher_id text NOT NULL,
    employee_number text,
    qualification text,
    specialization text,
    years_of_experience integer,
    hire_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    salary double precision,
    department text,
    is_class_teacher boolean DEFAULT false NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TeacherResourceAccess; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeacherResourceAccess" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "schoolId" text NOT NULL,
    "schoolResourceAccessId" text NOT NULL,
    "studentId" text,
    "classId" text,
    "subjectId" text,
    "topicId" text,
    "videoId" text,
    "materialId" text,
    "assessmentId" text,
    "resourceType" public."LibraryResourceType" NOT NULL,
    "accessLevel" public."AccessLevel" DEFAULT 'READ_ONLY'::public."AccessLevel" NOT NULL,
    "grantedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TeacherResourceExclusion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeacherResourceExclusion" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "schoolId" text NOT NULL,
    "subjectId" text NOT NULL,
    "resourceType" text NOT NULL,
    "resourceId" text NOT NULL,
    "classId" text,
    "studentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "libraryClassId" text
);


--
-- Name: TeacherSubject; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TeacherSubject" (
    id text NOT NULL,
    "teacherId" text NOT NULL,
    "subjectId" text NOT NULL
);


--
-- Name: TimeSlot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimeSlot" (
    id text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    label text NOT NULL,
    "order" integer NOT NULL,
    "schoolId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TimetableEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimetableEntry" (
    id text NOT NULL,
    class_id text NOT NULL,
    subject_id text NOT NULL,
    teacher_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    "timeSlotId" text NOT NULL,
    day_of_week public."DayOfWeek" NOT NULL,
    room text,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Topic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topic" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "order" integer NOT NULL,
    subject_id text NOT NULL,
    school_id text NOT NULL,
    academic_session_id text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    instructions text
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    school_id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone_number text NOT NULL,
    display_picture jsonb,
    gender public."Gender" DEFAULT 'other'::public."Gender" NOT NULL,
    otp text DEFAULT ''::text,
    otp_expires_at timestamp(3) without time zone,
    is_email_verified boolean DEFAULT true,
    is_otp_verified boolean DEFAULT true,
    role public."Roles" DEFAULT 'student'::public."Roles" NOT NULL,
    status public."UserStatus" DEFAULT 'active'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "filesUploadedThisMonth" integer DEFAULT 0 NOT NULL,
    "lastFileResetDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastTokenResetDateAllTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "maxFileSizeMB" integer DEFAULT 100 NOT NULL,
    "maxFilesPerMonth" integer DEFAULT 10 NOT NULL,
    "maxMessagesPerWeek" integer DEFAULT 100 NOT NULL,
    "maxStorageMB" integer DEFAULT 500 NOT NULL,
    "maxTokensPerDay" integer DEFAULT 50000 NOT NULL,
    "maxTokensPerWeek" integer DEFAULT 50000 NOT NULL,
    "messagesSentThisWeek" integer DEFAULT 0 NOT NULL,
    "tokensUsedAllTime" integer DEFAULT 0 NOT NULL,
    "tokensUsedThisDay" integer DEFAULT 0 NOT NULL,
    "tokensUsedThisWeek" integer DEFAULT 0 NOT NULL,
    "totalFilesUploadedAllTime" integer DEFAULT 0 NOT NULL,
    "totalStorageUsedMB" integer DEFAULT 0 NOT NULL
);


--
-- Name: UserSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserSettings" (
    id text NOT NULL,
    user_id text NOT NULL,
    school_id text NOT NULL,
    push_notifications boolean DEFAULT true NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    assessment_reminders boolean DEFAULT true NOT NULL,
    grade_notifications boolean DEFAULT true NOT NULL,
    announcement_notifications boolean DEFAULT false NOT NULL,
    dark_mode boolean DEFAULT false NOT NULL,
    sound_effects boolean DEFAULT true NOT NULL,
    haptic_feedback boolean DEFAULT true NOT NULL,
    auto_save boolean DEFAULT true NOT NULL,
    offline_mode boolean DEFAULT false NOT NULL,
    profile_visibility text DEFAULT 'classmates'::text NOT NULL,
    show_contact_info boolean DEFAULT true NOT NULL,
    show_academic_progress boolean DEFAULT true NOT NULL,
    data_sharing boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VideoContent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VideoContent" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    "schoolId" text,
    "platformId" text NOT NULL,
    "uploadedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    topic_id text,
    duration text,
    size text,
    status text DEFAULT 'published'::text NOT NULL,
    thumbnail jsonb,
    views integer DEFAULT 0 NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "hlsPlaybackUrl" text,
    "hlsS3Prefix" text,
    "hlsStatus" public."HlsTranscodeStatus",
    "videoS3Key" text
);


--
-- Name: Wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wallet" (
    id text NOT NULL,
    school_id text NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    currency text DEFAULT 'NGN'::text NOT NULL,
    wallet_type public."WalletType" DEFAULT 'SCHOOL_WALLET'::public."WalletType" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "financeId" text
);


--
-- Name: WalletTransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WalletTransaction" (
    id text NOT NULL,
    wallet_id text NOT NULL,
    transaction_type public."WalletTransactionType" NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    reference text,
    status public."WalletTransactionStatus" DEFAULT 'PENDING'::public."WalletTransactionStatus" NOT NULL,
    metadata jsonb,
    processed_at timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _LibraryResponseOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_LibraryResponseOptions" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _ResponseOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ResponseOptions" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Class classId; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class" ALTER COLUMN "classId" SET DEFAULT nextval('public."Class_classId_seq"'::regclass);


--
-- Data for Name: AcademicSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AcademicSession" (id, school_id, academic_year, start_year, end_year, term, start_date, end_date, status, is_current, "createdAt", "updatedAt") FROM stdin;
cml80jq9j0002crvldmoq6slk	cml80jppv0000crvl8hh8fvb3	2025/2026	2025	2026	first	2025-09-01 00:00:00	2025-12-01 00:00:00	active	t	2026-02-04 12:38:09.079	2026-02-04 12:38:09.079
cmlf8n4fq000527h17yo3y41k	cmlf8n44o000327h1w5mi08k0	2025/2026	2025	2026	first	2026-02-09 00:00:00	2026-05-09 00:00:00	active	t	2026-02-09 13:59:07.574	2026-02-09 13:59:07.574
cmlfbp5e7000w5wlkw1u5rbh5	cmlfbp5cw000u5wlkfgpcgols	2026/2027	2026	2027	second	2025-09-09 00:00:00	2025-12-09 00:00:00	active	t	2026-02-09 15:24:40.975	2026-02-09 15:24:40.975
\.


--
-- Data for Name: AccessControlAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AccessControlAuditLog" (id, "entityType", "entityId", action, "performedById", "performedByRole", "schoolId", "platformId", changes, reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: Achievement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Achievement" (id, school_id, academic_session_id, title, description, type, icon_url, points, is_active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Assessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Assessment" (id, title, description, duration, "createdAt", "updatedAt", topic_id, "order", academic_session_id, allow_review, auto_submit, created_by, end_date, grading_type, instructions, is_published, is_result_released, max_attempts, passing_score, published_at, result_released_at, school_id, show_correct_answers, show_feedback, shuffle_options, shuffle_questions, start_date, tags, time_limit, total_points, status, subject_id, assessment_type, submissions, student_can_view_grading, can_edit_assessment, student_completed_assessment) FROM stdin;
cmlaz2o3a005x28m16pb4ie0m	secondn time exam 		30	2026-02-06 14:20:11.964	2026-02-06 14:29:22.382	\N	0	cml80jq9j0002crvldmoq6slk	t	t	cml9ap7c7000v28kcv28kd76q	2026-02-08 14:20:11.961	AUTOMATIC	answer all thw question 	f	f	1	50	\N	\N	cml80jppv0000crvl8hh8fvb3	t	t	t	t	\N	{}	\N	1	DRAFT	cml9gmpll002528m1y8x7j8us	CBT	\N	t	t	f
cmlfbaz0v00015wlk23x8oljp	Assessment on Governance, Copyright, Finance, and Public Service	This test assesses knowledge of Nigerian current affairs, copyright law, financial regulations, and public service rules, focusing on governance, compliance, and ethical standards.	30	2026-02-09 15:13:39.524	2026-02-11 09:12:03.931	\N	0	cmlf8n4fq000527h17yo3y41k	t	t	cmlf8n4hm000627h1tl1jfltf	2026-02-11 15:13:00	AUTOMATIC	Answer all questions in this test. Each question carries one mark. Choose the correct option (A, B, C, or D) for each question and mark your answers clearly.	f	f	1	50	\N	\N	cmlf8n44o000327h1w5mi08k0	f	f	f	t	\N	{}	\N	50	DRAFT	cmlfahlur000029kijsemr8nu	CBT	\N	f	t	f
cml9e9mmc000228m11e75jgov	MATHEMATICS ASSESSMENT	This assessment is designed to test pupils’ understanding of numbers in daily life. It checks their ability to count, identify numbers, recognize number order, and match numbers with quantities using simple and familiar examples. Pupils are expected to choose the correct answer from the options provided.	30	2026-02-05 11:49:58.538	2026-02-05 13:45:56.638	\N	0	cml80jq9j0002crvldmoq6slk	f	t	cml9al62d000q28kcq0i6bdw4	2026-02-07 11:49:58.534	AUTOMATIC	✏️ Instructions\n\nRead each question carefully.\n\nChoose the correct answer from options A, B, C, or D.\n\nCircle or tick one correct answer only.\n\nAnswer all questions neatly.	t	f	1	50	2026-02-05 13:45:56.636	\N	cml80jppv0000crvl8hh8fvb3	f	f	t	t	\N	{}	\N	100	ACTIVE	cml9a8dbp000p28kc7ri7y9xk	CBT	\N	t	t	f
cmlazgmoh006828m100lwlrlm	fjk;kg	drf	30	2026-02-06 14:31:03.32	2026-02-06 14:36:30.51	\N	0	cml80jq9j0002crvldmoq6slk	t	t	cml9ap7c7000v28kcv28kd76q	2026-02-08 14:31:03.318	AUTOMATIC	dgg	t	t	1	50	2026-02-06 14:36:03.547	2026-02-06 14:36:30.509	cml80jppv0000crvl8hh8fvb3	t	t	t	t	\N	{}	\N	5	CLOSED	cml9gmpll002528m1y8x7j8us	CBT	\N	t	t	f
cmlayfq3m005c28m1nyzm7h01	Demand and Supply		30	2026-02-06 14:02:21.482	2026-02-06 14:51:31.44	\N	0	cml80jq9j0002crvldmoq6slk	t	t	cml9asnv9001128kcuc4gq69x	2026-02-08 14:02:21.48	AUTOMATIC	Answer all Questions	f	f	1	50	\N	\N	cml80jppv0000crvl8hh8fvb3	f	t	f	f	\N	{}	\N	10	DRAFT	cml9go7pr002928m18xksjmik	CBT	\N	t	t	f
cmlb58rk8009s28m129bxcrta	dcvv	dfdfv	30	2026-02-06 17:12:54.095	2026-02-06 17:25:28.259	\N	0	cml80jq9j0002crvldmoq6slk	t	t	cml9ap7c7000v28kcv28kd76q	2026-02-08 17:12:54.092	AUTOMATIC	jklvfd	f	f	1	50	\N	\N	cml80jppv0000crvl8hh8fvb3	t	t	t	t	\N	{}	\N	1	DRAFT	cml9gmpll002528m1y8x7j8us	CBT	\N	t	t	f
\.


--
-- Data for Name: AssessmentAnalytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentAnalytics" (id, assessment_id, total_attempts, total_students, average_score, average_time, pass_rate, question_stats, daily_attempts, hourly_attempts, completion_rate, abandonment_rate, last_updated, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssessmentAttempt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentAttempt" (id, assessment_id, student_id, school_id, academic_session_id, attempt_number, status, started_at, submitted_at, time_spent, total_score, max_score, percentage, passed, is_graded, graded_at, graded_by, overall_feedback, grade_letter, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssessmentCorrectAnswer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentCorrectAnswer" (id, question_id, answer_text, answer_number, answer_date, option_ids, answer_json, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssessmentOption; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentOption" (id, question_id, option_text, "order", is_correct, image_url, audio_url, "createdAt", "updatedAt") FROM stdin;
cml9ecq9t000428m1kj7xkohi	cml9ecq7x000328m1k3v43dkn	To count things like books and toys	1	t	\N	\N	2026-02-05 11:52:23.297	2026-02-05 11:52:23.297
cml9ecqbk000528m1x8n7u7ob	cml9ecq7x000328m1k3v43dkn	To listen to music	2	f	\N	\N	2026-02-05 11:52:23.36	2026-02-05 11:52:23.36
cml9ecqd7000628m1k6d26crt	cml9ecq7x000328m1k3v43dkn	To draw pictures in our notebooks	3	f	\N	\N	2026-02-05 11:52:23.419	2026-02-05 11:52:23.419
cml9ecqet000728m1ycder0pb	cml9ecq7x000328m1k3v43dkn	To name the colors of our pencils	4	f	\N	\N	2026-02-05 11:52:23.477	2026-02-05 11:52:23.477
cml9edu0a000928m1rjpjm5sn	cml9edtyh000828m1n2cor3ze	2	1	f	\N	\N	2026-02-05 11:53:14.794	2026-02-05 11:53:14.794
cml9edu1y000a28m101khlixi	cml9edtyh000828m1n2cor3ze	5	2	f	\N	\N	2026-02-05 11:53:14.854	2026-02-05 11:53:14.854
cml9edu3l000b28m1g9m97zrh	cml9edtyh000828m1n2cor3ze	4	3	t	\N	\N	2026-02-05 11:53:14.913	2026-02-05 11:53:14.913
cml9edu58000c28m18a0xy98i	cml9edtyh000828m1n2cor3ze	1	4	f	\N	\N	2026-02-05 11:53:14.972	2026-02-05 11:53:14.972
cml9eh71y000n28m1fb566xzn	cml9eevh9000d28m10c273q1b	4 apples	1	t	\N	\N	2026-02-05 11:55:51.67	2026-02-05 11:55:51.67
cml9eh73l000o28m1rgvin3xr	cml9eevh9000d28m10c273q1b	5 apples	2	f	\N	\N	2026-02-05 11:55:51.729	2026-02-05 11:55:51.729
cml9eh758000p28m1vwhshsf2	cml9eevh9000d28m10c273q1b	2 apples	3	f	\N	\N	2026-02-05 11:55:51.788	2026-02-05 11:55:51.788
cml9eh76w000q28m1y53kpgw5	cml9eevh9000d28m10c273q1b	3 apples	4	f	\N	\N	2026-02-05 11:55:51.848	2026-02-05 11:55:51.848
cml9ehf66000r28m1dd41t7w0	cml9ego4b000i28m1bv4yon58	10 fingers	1	f	\N	\N	2026-02-05 11:56:02.19	2026-02-05 11:56:02.19
cml9ehf7v000s28m1x7k0k1zu	cml9ego4b000i28m1bv4yon58	4 fingers	2	f	\N	\N	2026-02-05 11:56:02.251	2026-02-05 11:56:02.251
cml9ehf9h000t28m101wv7v0q	cml9ego4b000i28m1bv4yon58	5 fingers	3	t	\N	\N	2026-02-05 11:56:02.309	2026-02-05 11:56:02.309
cml9ehfb4000u28m1r4mqd214	cml9ego4b000i28m1bv4yon58	1 fingers	4	f	\N	\N	2026-02-05 11:56:02.368	2026-02-05 11:56:02.368
cml9eil2y000w28m19zkt01cn	cml9eil18000v28m1fo6qi312	Six	1	f	\N	\N	2026-02-05 11:56:56.506	2026-02-05 11:56:56.506
cml9eil4m000x28m1jlbonqy2	cml9eil18000v28m1fo6qi312	Five	2	f	\N	\N	2026-02-05 11:56:56.566	2026-02-05 11:56:56.566
cml9eil6c000y28m1i2ru048x	cml9eil18000v28m1fo6qi312	Seven	3	t	\N	\N	2026-02-05 11:56:56.628	2026-02-05 11:56:56.628
cml9eil7z000z28m1ipbuifx9	cml9eil18000v28m1fo6qi312	Eight	4	f	\N	\N	2026-02-05 11:56:56.687	2026-02-05 11:56:56.687
cml9ek1vc001528m17t9d19lu	cml9ejvb3001028m114f5m5bj	100	1	f	\N	\N	2026-02-05 11:58:04.92	2026-02-05 11:58:04.92
cml9ek1x0001628m1o6tmoemq	cml9ejvb3001028m114f5m5bj	1	2	f	\N	\N	2026-02-05 11:58:04.98	2026-02-05 11:58:04.98
cml9ek1yo001728m1nmuqp78f	cml9ejvb3001028m114f5m5bj	10	3	t	\N	\N	2026-02-05 11:58:05.039	2026-02-05 11:58:05.039
cml9ek20d001828m1adkoxgqc	cml9ejvb3001028m114f5m5bj	0	4	f	\N	\N	2026-02-05 11:58:05.101	2026-02-05 11:58:05.101
cml9ekvae001e28m1a58r0kc8	cml9eko3p001928m1xssoue2m	1	1	f	\N	\N	2026-02-05 11:58:43.046	2026-02-05 11:58:43.046
cml9ekvc0001f28m16maamq1m	cml9eko3p001928m1xssoue2m	5	2	f	\N	\N	2026-02-05 11:58:43.104	2026-02-05 11:58:43.104
cml9ekvdx001g28m16lyyqetv	cml9eko3p001928m1xssoue2m	0	3	t	\N	\N	2026-02-05 11:58:43.173	2026-02-05 11:58:43.173
cml9ekvfi001h28m102pn4iwb	cml9eko3p001928m1xssoue2m	2	4	f	\N	\N	2026-02-05 11:58:43.23	2026-02-05 11:58:43.23
cml9elrn1001j28m1vw4n9al6	cml9elrle001i28m1bhjnru3a	1	1	t	\N	\N	2026-02-05 11:59:24.973	2026-02-05 11:59:24.973
cml9elron001k28m1n15fcl42	cml9elrle001i28m1bhjnru3a	0	2	f	\N	\N	2026-02-05 11:59:25.031	2026-02-05 11:59:25.031
cml9elrq9001l28m1fcniegdw	cml9elrle001i28m1bhjnru3a	3	3	f	\N	\N	2026-02-05 11:59:25.089	2026-02-05 11:59:25.089
cml9elrrv001m28m1x9ey07z1	cml9elrle001i28m1bhjnru3a	4	4	f	\N	\N	2026-02-05 11:59:25.147	2026-02-05 11:59:25.147
cml9embp7001o28m1x30zjlp6	cml9embnh001n28m1saimnryt	2	1	f	\N	\N	2026-02-05 11:59:50.971	2026-02-05 11:59:50.971
cml9embqt001p28m1fv3c0wan	cml9embnh001n28m1saimnryt	5	2	f	\N	\N	2026-02-05 11:59:51.029	2026-02-05 11:59:51.029
cml9embsf001q28m14mqim9gf	cml9embnh001n28m1saimnryt	8	3	f	\N	\N	2026-02-05 11:59:51.087	2026-02-05 11:59:51.087
cml9embu1001r28m1nnywah43	cml9embnh001n28m1saimnryt	9	4	t	\N	\N	2026-02-05 11:59:51.144	2026-02-05 11:59:51.144
cml9emsdy001t28m1kjge0m1c	cml9emsca001s28m16lo9w275	True	1	t	\N	\N	2026-02-05 12:00:12.597	2026-02-05 12:00:12.597
cml9emsfj001u28m1ffri23rh	cml9emsca001s28m16lo9w275	False	2	f	\N	\N	2026-02-05 12:00:12.655	2026-02-05 12:00:12.655
cmlaylp3z005e28m1yrl2yq6a	cmlaylp08005d28m1htqp2sda	The necessity of a product for survival.	1	f	\N	\N	2026-02-06 14:07:00.191	2026-02-06 14:07:00.191
cmlaylp5p005f28m1eg4o48ym	cmlaylp08005d28m1htqp2sda	The price set by the government for essential services.	2	f	\N	\N	2026-02-06 14:07:00.253	2026-02-06 14:07:00.253
cmlaylp7a005g28m1wfbowx07	cmlaylp08005d28m1htqp2sda	The willingness and ability of consumers to buy goods at various prices.	3	t	\N	\N	2026-02-06 14:07:00.31	2026-02-06 14:07:00.31
cmlaylp8u005h28m1547mgrbw	cmlaylp08005d28m1htqp2sda	The total amount of goods produced by a company.	4	f	\N	\N	2026-02-06 14:07:00.366	2026-02-06 14:07:00.366
cmlayo23j005j28m16fc4ojqw	cmlayo21t005i28m1ve76xrck	Constant relationship	1	f	\N	\N	2026-02-06 14:08:50.335	2026-02-06 14:08:50.335
cmlayo257005k28m1xci3d95q	cmlayo21t005i28m1ve76xrck	Inverse relationship	2	t	\N	\N	2026-02-06 14:08:50.395	2026-02-06 14:08:50.395
cmlayo26t005l28m15spu86it	cmlayo21t005i28m1ve76xrck	Exponential relationship	3	f	\N	\N	2026-02-06 14:08:50.453	2026-02-06 14:08:50.453
cmlayo28f005m28m1rywjh75g	cmlayo21t005i28m1ve76xrck	Direct relationship	4	f	\N	\N	2026-02-06 14:08:50.511	2026-02-06 14:08:50.511
cmlayq93u005o28m1d9x6xc17	cmlayq924005n28m19uqky09j	They will increase the quantity offered for sale to maximize profit.	1	t	\N	\N	2026-02-06 14:10:32.73	2026-02-06 14:10:32.73
cmlayq95i005p28m11bw0k1f6	cmlayq924005n28m19uqky09j	The quantity supplied will remain exactly the same.	2	f	\N	\N	2026-02-06 14:10:32.79	2026-02-06 14:10:32.79
cmlayq975005q28m1g4uoxert	cmlayq924005n28m19uqky09j	They will reduce the quantity brought to the market to save resources.	3	f	\N	\N	2026-02-06 14:10:32.849	2026-02-06 14:10:32.849
cmlayq98r005r28m19kwpcjdp	cmlayq924005n28m19uqky09j	They will stop production entirely until the price drops.	4	f	\N	\N	2026-02-06 14:10:32.907	2026-02-06 14:10:32.907
cmlaz0go6005t28m1c72lq5sc	cmlaz0glw005s28m17x14020u	Market Shortage 	1	f	\N	\N	2026-02-06 14:18:29.094	2026-02-06 14:18:29.094
cmlaz0gq0005u28m18gn4408i	cmlaz0glw005s28m17x14020u	Market Equilibrium 	2	t	\N	\N	2026-02-06 14:18:29.16	2026-02-06 14:18:29.16
cmlaz0grn005v28m1fwod8pel	cmlaz0glw005s28m17x14020u	Price Ceiling 	3	f	\N	\N	2026-02-06 14:18:29.219	2026-02-06 14:18:29.219
cmlaz0gta005w28m1p36sbtgc	cmlaz0glw005s28m17x14020u	Market Surplus	4	f	\N	\N	2026-02-06 14:18:29.278	2026-02-06 14:18:29.278
cmlazegh1005z28m1bchkk8nz	cmlazegex005y28m11ov7qcuc	gj	1	f	\N	\N	2026-02-06 14:29:22.021	2026-02-06 14:29:22.021
cmlazegit006028m1yd9ym0vc	cmlazegex005y28m11ov7qcuc	ghjjk	2	f	\N	\N	2026-02-06 14:29:22.084	2026-02-06 14:29:22.084
cmlazegke006128m1uinb7hah	cmlazegex005y28m11ov7qcuc	ioo	3	t	\N	\N	2026-02-06 14:29:22.142	2026-02-06 14:29:22.142
cmlazeglz006228m1629ajn8v	cmlazegex005y28m11ov7qcuc	ggj	4	f	\N	\N	2026-02-06 14:29:22.199	2026-02-06 14:29:22.199
cmlazfrre006428m145yrn1xx	cmlazfrpp006328m18h0cg4j5	Sellers have brought more bread to the market than buyers are willing to purchase.	1	t	\N	\N	2026-02-06 14:30:23.306	2026-02-06 14:30:23.306
cmlazfrt1006528m1zdyf47dq	cmlazfrpp006328m18h0cg4j5	The law of supply has been violated. 	2	f	\N	\N	2026-02-06 14:30:23.365	2026-02-06 14:30:23.365
cmlazfrup006628m18mg124zt	cmlazfrpp006328m18h0cg4j5	The price is currently at the equilibrium level. 	3	f	\N	\N	2026-02-06 14:30:23.425	2026-02-06 14:30:23.425
cmlazfrwa006728m19h37cyc4	cmlazfrpp006328m18h0cg4j5	Buyers want to buy more than what is available.	4	f	\N	\N	2026-02-06 14:30:23.482	2026-02-06 14:30:23.482
cmlazhj1v006a28m10omxrsro	cmlazhj05006928m1dd1datj3	fff	1	f	\N	\N	2026-02-06 14:31:45.331	2026-02-06 14:31:45.331
cmlazhj3i006b28m1sa52mgh1	cmlazhj05006928m1dd1datj3	df	2	t	\N	\N	2026-02-06 14:31:45.39	2026-02-06 14:31:45.39
cmlazhj55006c28m1nvogsd97	cmlazhj05006928m1dd1datj3	df	3	f	\N	\N	2026-02-06 14:31:45.449	2026-02-06 14:31:45.449
cmlazhj6s006d28m1gr3a72t6	cmlazhj05006928m1dd1datj3	ff	4	f	\N	\N	2026-02-06 14:31:45.508	2026-02-06 14:31:45.508
cmlazjz5p006k28m136nyylrq	cmlazjz3z006j28m1gkjipkji	ght	1	t	\N	\N	2026-02-06 14:33:39.517	2026-02-06 14:33:39.517
cmlazjz7b006l28m15evnl3pl	cmlazjz3z006j28m1gkjipkji	yh	2	f	\N	\N	2026-02-06 14:33:39.575	2026-02-06 14:33:39.575
cmlazjz8w006m28m1xnh0un62	cmlazjz3z006j28m1gkjipkji	hjh	3	f	\N	\N	2026-02-06 14:33:39.632	2026-02-06 14:33:39.632
cmlazjzai006n28m1tznujilr	cmlazjz3z006j28m1gkjipkji	hnn 	4	f	\N	\N	2026-02-06 14:33:39.69	2026-02-06 14:33:39.69
cmlazkln0006p28m1c3tcz01j	cmlazkllb006o28m1i0m2ougo	fvfvf	1	f	\N	\N	2026-02-06 14:34:08.652	2026-02-06 14:34:08.652
cmlazkloo006q28m1ewpyydpd	cmlazkllb006o28m1i0m2ougo	vfvrfg	2	f	\N	\N	2026-02-06 14:34:08.712	2026-02-06 14:34:08.712
cmlazklqb006r28m1byafkza6	cmlazkllb006o28m1i0m2ougo	vreerr	3	f	\N	\N	2026-02-06 14:34:08.771	2026-02-06 14:34:08.771
cmlazklry006s28m1qk4x6wym	cmlazkllb006o28m1i0m2ougo	gfrvtrt	4	t	\N	\N	2026-02-06 14:34:08.83	2026-02-06 14:34:08.83
cmlazldxi006u28m1q82sg1ea	cmlazldvt006t28m146k1fnos	rgrgg	1	f	\N	\N	2026-02-06 14:34:45.318	2026-02-06 14:34:45.318
cmlazldz5006v28m1crdcy2yt	cmlazldvt006t28m146k1fnos	fbb t	2	t	\N	\N	2026-02-06 14:34:45.377	2026-02-06 14:34:45.377
cmlazle0s006w28m1r6f38qv5	cmlazldvt006t28m146k1fnos	fb t ghb	3	f	\N	\N	2026-02-06 14:34:45.436	2026-02-06 14:34:45.436
cmlazle2f006x28m1q8wr4v8j	cmlazldvt006t28m146k1fnos	vtghth	4	f	\N	\N	2026-02-06 14:34:45.495	2026-02-06 14:34:45.495
cmlazj9o0006f28m1gw4w0jmh	cmlazj9mc006e28m1vawqersg	hhth	1	t	\N	\N	2026-02-06 14:33:06.48	2026-02-06 14:33:06.48
cmlazj9pm006g28m1txik49hi	cmlazj9mc006e28m1vawqersg	ttty	2	f	\N	\N	2026-02-06 14:33:06.538	2026-02-06 14:33:06.538
cmlazj9r8006h28m18n090pxy	cmlazj9mc006e28m1vawqersg	yjj	3	f	\N	\N	2026-02-06 14:33:06.596	2026-02-06 14:33:06.596
cmlazj9st006i28m13dtcga1d	cmlazj9mc006e28m1vawqersg	hyn	4	f	\N	\N	2026-02-06 14:33:06.653	2026-02-06 14:33:06.653
cmlazwrb4006z28m1bi8kmhc0	cmlazwr9g006y28m179k2uakp	Consumer interest in data will disappear. 	1	f	\N	\N	2026-02-06 14:43:35.872	2026-02-06 14:43:35.872
cmlazwrcp007028m18tryqma0	cmlazwr9g006y28m179k2uakp	Sellers will immediately want to double their supply. 	2	f	\N	\N	2026-02-06 14:43:35.929	2026-02-06 14:43:35.929
cmlazwreb007128m144fhynb0	cmlazwr9g006y28m179k2uakp	 A decrease in the quantity demanded.	3	f	\N	\N	2026-02-06 14:43:35.987	2026-02-06 14:43:35.987
cmlazwrfx007228m1pq8g37u6	cmlazwr9g006y28m179k2uakp	 An increase in the quantity demanded.	4	t	\N	\N	2026-02-06 14:43:36.045	2026-02-06 14:43:36.045
cmlazz4yx007428m1t493awoi	cmlazz4x7007328m18khs6z39	Because the supply of chicken automatically increases during holidays. 	1	f	\N	\N	2026-02-06 14:45:26.889	2026-02-06 14:45:26.889
cmlazz50k007528m1kwn8h442	cmlazz4x7007328m18khs6z39	Because consumers have less ability to buy goods during festivals. 	2	f	\N	\N	2026-02-06 14:45:26.948	2026-02-06 14:45:26.948
cmlazz526007628m1ot3ody4q	cmlazz4x7007328m18khs6z39	Because demand significantly increases as more people want to buy chicken for celebrations. 	3	t	\N	\N	2026-02-06 14:45:27.006	2026-02-06 14:45:27.006
cmlazz53t007728m13g1ef6e1	cmlazz4x7007328m18khs6z39	Because the law of supply states that prices must rise every December.	4	f	\N	\N	2026-02-06 14:45:27.065	2026-02-06 14:45:27.065
cmlb03385007928m1sw92vvf4	cmlb0336i007828m1w09swu0w	The amount consumers wish they could afford. 	1	f	\N	\N	2026-02-06 14:48:31.253	2026-02-06 14:48:31.253
cmlb0339r007a28m1y6p9w2ex	cmlb0336i007828m1w09swu0w	The total wealth of the people living in a country. 	2	f	\N	\N	2026-02-06 14:48:31.311	2026-02-06 14:48:31.311
cmlb033bb007b28m1evu0t2k1	cmlb0336i007828m1w09swu0w	The quantity of goods producers are willing and able to offer for sale. 	3	t	\N	\N	2026-02-06 14:48:31.367	2026-02-06 14:48:31.367
cmlb033cw007c28m1nt90sz47	cmlb0336i007828m1w09swu0w	The price at which a consumer refuses to buy a product.	4	f	\N	\N	2026-02-06 14:48:31.424	2026-02-06 14:48:31.424
cmlb053d4007e28m1p9rhquji	cmlb053bh007d28m1bnmu0wg4	That prices never change in a real market. 	1	f	\N	\N	2026-02-06 14:50:04.744	2026-02-06 14:50:04.744
cmlb053eq007f28m1is19v03j	cmlb053bh007d28m1bnmu0wg4	That demand and supply are always the same. 	2	f	\N	\N	2026-02-06 14:50:04.802	2026-02-06 14:50:04.802
cmlb053gb007g28m101gw8h0l	cmlb053bh007d28m1bnmu0wg4	That every consumer has the same amount of money. 	3	f	\N	\N	2026-02-06 14:50:04.859	2026-02-06 14:50:04.859
cmlb053hw007h28m1aie44lyz	cmlb053bh007d28m1bnmu0wg4	That we are assuming factors like income or tastes remain constant while looking at price.	4	t	\N	\N	2026-02-06 14:50:04.916	2026-02-06 14:50:04.916
cmlb06xzq007j28m1gvql80n5	cmlb06xy3007i28m1nwuf39ux	No, because the price is too low for it to be considered demand. 	1	f	\N	\N	2026-02-06 14:51:31.094	2026-02-06 14:51:31.094
cmlb06y1c007k28m1fom2glfh	cmlb06xy3007i28m1nwuf39ux	Yes, because the student has the willingness to buy it. 	2	f	\N	\N	2026-02-06 14:51:31.152	2026-02-06 14:51:31.152
cmlb06y2x007l28m1lr61yopk	cmlb06xy3007i28m1nwuf39ux	No, because the student lacks the 'ability' to buy the product. 	3	t	\N	\N	2026-02-06 14:51:31.209	2026-02-06 14:51:31.209
cmlb06y4i007m28m1k6damafp	cmlb06xy3007i28m1nwuf39ux	Yes, because water is a basic human right.	4	f	\N	\N	2026-02-06 14:51:31.266	2026-02-06 14:51:31.266
cmlb5ox5d009u28m18m30selw	cmlb5ox39009t28m1t5ss6p5e	Standards Office of Nigeria	1	f	\N	\N	2026-02-06 17:25:27.889	2026-02-06 17:25:27.889
cmlb5ox77009v28m1kkdxndvn	cmlb5ox39009t28m1t5ss6p5e	Standards Organisation of Nigeria	2	t	\N	\N	2026-02-06 17:25:27.955	2026-02-06 17:25:27.955
cmlb5ox8t009w28m1i32egjm5	cmlb5ox39009t28m1t5ss6p5e	Standards Organisation of Nation	3	f	\N	\N	2026-02-06 17:25:28.013	2026-02-06 17:25:28.013
cmlb5oxaf009x28m1sq50e4nl	cmlb5ox39009t28m1t5ss6p5e	Standards Organ of Nigeria	4	f	\N	\N	2026-02-06 17:25:28.071	2026-02-06 17:25:28.071
cmlfbhnmg00035wlk8idnc1lx	cmlfbhnm600025wlkn3719nos	Parliamentary	1	f	\N	\N	2026-02-09 15:18:51.352	2026-02-09 15:18:51.352
cmlfbhnmo00045wlkhbrlytbr	cmlfbhnm600025wlkn3719nos	Federal presidential 	2	t	\N	\N	2026-02-09 15:18:51.36	2026-02-09 15:18:51.36
cmlfbhnmr00055wlktkjx03gz	cmlfbhnm600025wlkn3719nos	Monarchical 	3	f	\N	\N	2026-02-09 15:18:51.363	2026-02-09 15:18:51.363
cmlfbhnmv00065wlks03fjcgl	cmlfbhnm600025wlkn3719nos	Military	4	f	\N	\N	2026-02-09 15:18:51.367	2026-02-09 15:18:51.367
cmlfbiv0h00085wlkmcyn1052	cmlfbiv0900075wlkgluqscdn	Muhammadu Buhari 	1	f	\N	\N	2026-02-09 15:19:47.585	2026-02-09 15:19:47.585
cmlfbiv0m00095wlkoveeiav7	cmlfbiv0900075wlkgluqscdn	 Bola Ahmed Tinubu 	2	t	\N	\N	2026-02-09 15:19:47.59	2026-02-09 15:19:47.59
cmlfbiv0p000a5wlkupro790n	cmlfbiv0900075wlkgluqscdn	Yemi Osinbajo 	3	f	\N	\N	2026-02-09 15:19:47.593	2026-02-09 15:19:47.593
cmlfbiv0s000b5wlke7o8fv56	cmlfbiv0900075wlkgluqscdn	 Atiku Abubakar	4	f	\N	\N	2026-02-09 15:19:47.596	2026-02-09 15:19:47.596
cmlfbk8je000d5wlk9lfbxr91	cmlfbk8j4000c5wlkarmm7gkz	African Common Free Trade Agreement 	1	f	\N	\N	2026-02-09 15:20:51.77	2026-02-09 15:20:51.77
cmlfbk8jh000e5wlks9nqhhvi	cmlfbk8j4000c5wlkarmm7gkz	African Continental Free Trade Area 	2	t	\N	\N	2026-02-09 15:20:51.773	2026-02-09 15:20:51.773
cmlfbk8jk000f5wlkjh29t85s	cmlfbk8j4000c5wlkarmm7gkz	African Council for Trade Access 	3	f	\N	\N	2026-02-09 15:20:51.776	2026-02-09 15:20:51.776
cmlfbk8jn000g5wlkcvydqbrc	cmlfbk8j4000c5wlkarmm7gkz	 African Customs Federation Treaty	4	f	\N	\N	2026-02-09 15:20:51.779	2026-02-09 15:20:51.779
cmlfbmdiv000i5wlkql2ev9kr	cmlfbmdiq000h5wlkd99n4u17	Promote military cooperation 	1	f	\N	\N	2026-02-09 15:22:31.543	2026-02-09 15:22:31.543
cmlfbmdiy000j5wlki1l58ft5	cmlfbmdiq000h5wlkd99n4u17	B. Establish a single African currency 	2	f	\N	\N	2026-02-09 15:22:31.546	2026-02-09 15:22:31.546
cmlfbmdj1000k5wlkxpdsuesm	cmlfbmdiq000h5wlkd99n4u17	Create a single African market for goods and services 	3	t	\N	\N	2026-02-09 15:22:31.549	2026-02-09 15:22:31.549
cmlfbmdj3000l5wlk2bl7z6ee	cmlfbmdiq000h5wlkd99n4u17	 Regulate immigration	4	f	\N	\N	2026-02-09 15:22:31.551	2026-02-09 15:22:31.551
cmlfboifo000n5wlk5zn4x011	cmlfboifh000m5wlkc2urpirq	Ministry of Information 	1	f	\N	\N	2026-02-09 15:24:11.22	2026-02-09 15:24:11.22
cmlfboifr000o5wlkb2j6pjs0	cmlfboifh000m5wlkc2urpirq	 Ministry of Youth Development 	2	f	\N	\N	2026-02-09 15:24:11.223	2026-02-09 15:24:11.223
cmlfboift000p5wlkfj7lczbv	cmlfboifh000m5wlkc2urpirq	 Ministry of Arts, Culture, Tourism and Creative Economy 	3	t	\N	\N	2026-02-09 15:24:11.225	2026-02-09 15:24:11.225
cmlfboifw000q5wlk7n9lwt3a	cmlfboifh000m5wlkc2urpirq	 Ministry of Education	4	f	\N	\N	2026-02-09 15:24:11.228	2026-02-09 15:24:11.228
cmlfbqdad00105wlk3ppui4cz	cmlfbqda9000z5wlkxaoajzd8	Dollar 	1	f	\N	\N	2026-02-09 15:25:37.861	2026-02-09 15:25:37.861
cmlfbqdag00115wlks9g3tk8u	cmlfbqda9000z5wlkxaoajzd8	 Pound 	2	f	\N	\N	2026-02-09 15:25:37.864	2026-02-09 15:25:37.864
cmlfbqdai00125wlk1bsh3m0d	cmlfbqda9000z5wlkxaoajzd8	 Naira 	3	t	\N	\N	2026-02-09 15:25:37.866	2026-02-09 15:25:37.866
cmlfbqdal00135wlkkmlg4eyu	cmlfbqda9000z5wlkxaoajzd8	Franc	4	f	\N	\N	2026-02-09 15:25:37.869	2026-02-09 15:25:37.869
cmlfbsigs00155wlkeqlwpha9	cmlfbsigm00145wlkkij63g3w	National Institute for Political Studies	1	f	\N	\N	2026-02-09 15:27:17.884	2026-02-09 15:27:17.884
cmlfbsigv00165wlk91wdtia7	cmlfbsigm00145wlkkij63g3w	 National Institute for Policy and Strategic Studies 	2	t	\N	\N	2026-02-09 15:27:17.887	2026-02-09 15:27:17.887
cmlfbsigz00175wlkbc9vk761	cmlfbsigm00145wlkkij63g3w	Nigerian Institute of Public Service 	3	f	\N	\N	2026-02-09 15:27:17.891	2026-02-09 15:27:17.891
cmlfbsih200185wlkbx91vox0	cmlfbsigm00145wlkkij63g3w	National Intelligence and Policy School	4	f	\N	\N	2026-02-09 15:27:17.894	2026-02-09 15:27:17.894
cmlfbty8c001a5wlko4b6vp5o	cmlfbty8500195wlk1cxgxjku	Bank of Industry 	1	f	\N	\N	2026-02-09 15:28:24.972	2026-02-09 15:28:24.972
cmlfbty8f001b5wlk5dignluu	cmlfbty8500195wlk1cxgxjku	 Central Bank of Nigeria 	2	t	\N	\N	2026-02-09 15:28:24.975	2026-02-09 15:28:24.975
cmlfbty8h001c5wlkamg0q74x	cmlfbty8500195wlk1cxgxjku	CNigerian Deposit Insurance Corporation 	3	f	\N	\N	2026-02-09 15:28:24.977	2026-02-09 15:28:24.977
cmlfbty8k001d5wlkq1yzlr40	cmlfbty8500195wlk1cxgxjku	Federal Ministry of Finance	4	f	\N	\N	2026-02-09 15:28:24.98	2026-02-09 15:28:24.98
cmlfbvvus001f5wlk5pcliayk	cmlfbvvum001e5wlks9xt4s67	Agriculture	1	f	\N	\N	2026-02-09 15:29:55.204	2026-02-09 15:29:55.204
cmlfbvvuu001g5wlku445nxgx	cmlfbvvum001e5wlks9xt4s67	Oil and gas	2	f	\N	\N	2026-02-09 15:29:55.206	2026-02-09 15:29:55.206
cmlfbvvux001h5wlksvkmrgdb	cmlfbvvum001e5wlks9xt4s67	Creative and cultural industries 	3	t	\N	\N	2026-02-09 15:29:55.209	2026-02-09 15:29:55.209
cmlfbvvv0001i5wlkl7xf4s70	cmlfbvvum001e5wlks9xt4s67	Mining	4	f	\N	\N	2026-02-09 15:29:55.211	2026-02-09 15:29:55.211
cmlfbxdvr001k5wlk09b80gwp	cmlfbxdvl001j5wlkpejzk3bb	Trade liberalisation 	1	f	\N	\N	2026-02-09 15:31:05.223	2026-02-09 15:31:05.223
cmlfbxdvt001l5wlkd2zagqzo	cmlfbxdvl001j5wlkpejzk3bb	Climate change 	2	f	\N	\N	2026-02-09 15:31:05.225	2026-02-09 15:31:05.225
cmlfbxdvv001m5wlk28nngc4m	cmlfbxdvl001j5wlkpejzk3bb	Access to books for the visually impaired 	3	t	\N	\N	2026-02-09 15:31:05.227	2026-02-09 15:31:05.227
cmlfbxdvy001n5wlkk1ewaxq4	cmlfbxdvl001j5wlkpejzk3bb	Maritime security	4	f	\N	\N	2026-02-09 15:31:05.23	2026-02-09 15:31:05.23
cmlfbyr9b001p5wlk83w1qa64	cmlfbyr90001o5wlkvj9agpqy	Legislature 	1	f	\N	\N	2026-02-09 15:32:09.215	2026-02-09 15:32:09.215
cmlfbyr9e001q5wlke89frfwq	cmlfbyr90001o5wlkvj9agpqy	Executive 	2	f	\N	\N	2026-02-09 15:32:09.218	2026-02-09 15:32:09.218
cmlfbyr9i001r5wlkzby13gvb	cmlfbyr90001o5wlkvj9agpqy	Judiciary 	3	t	\N	\N	2026-02-09 15:32:09.221	2026-02-09 15:32:09.221
cmlfbyr9k001s5wlk0ud2dcaq	cmlfbyr90001o5wlkvj9agpqy	Civil Service	4	f	\N	\N	2026-02-09 15:32:09.224	2026-02-09 15:32:09.224
cmlfc03pl001u5wlkdudzq9qc	cmlfc03pg001t5wlkyz7mnb0c	Federal Electoral Council 	1	f	\N	\N	2026-02-09 15:33:12.009	2026-02-09 15:33:12.009
cmlfc03pp001v5wlkwwkcl35f	cmlfc03pg001t5wlkyz7mnb0c	Federal Executive Council 	2	t	\N	\N	2026-02-09 15:33:12.013	2026-02-09 15:33:12.013
cmlfc03ps001w5wlkutk50q45	cmlfc03pg001t5wlkyz7mnb0c	Financial Ethics Committee 	3	f	\N	\N	2026-02-09 15:33:12.016	2026-02-09 15:33:12.016
cmlfc03pv001x5wlkb4bfa4bn	cmlfc03pg001t5wlkyz7mnb0c	 Fiscal Expenditure Council	4	f	\N	\N	2026-02-09 15:33:12.019	2026-02-09 15:33:12.019
cmlfc1dob001z5wlkhupwjrhy	cmlfc1do3001y5wlkw1j9gge9	WTO 	1	f	\N	\N	2026-02-09 15:34:11.579	2026-02-09 15:34:11.579
cmlfc1dof00205wlkfc5kzjw2	cmlfc1do3001y5wlkw1j9gge9	WIPO 	2	t	\N	\N	2026-02-09 15:34:11.583	2026-02-09 15:34:11.583
cmlfc1doi00215wlk0ueiubz8	cmlfc1do3001y5wlkw1j9gge9	 UNESCO 	3	f	\N	\N	2026-02-09 15:34:11.586	2026-02-09 15:34:11.586
cmlfc1dol00225wlk5bvo7cgi	cmlfc1do3001y5wlkw1j9gge9	IMF	4	f	\N	\N	2026-02-09 15:34:11.589	2026-02-09 15:34:11.589
cmlfc2s6x00245wlk464ziy4l	cmlfc2s6t00235wlkfkav04wx	 Supreme Council 	1	f	\N	\N	2026-02-09 15:35:17.049	2026-02-09 15:35:17.049
cmlfc2s6z00255wlkpvkzmqqq	cmlfc2s6t00235wlkfkav04wx	National Assembly 	2	t	\N	\N	2026-02-09 15:35:17.051	2026-02-09 15:35:17.051
cmlfc2s7100265wlkwcve9f5w	cmlfc2s6t00235wlkfkav04wx	 Council of State 	3	f	\N	\N	2026-02-09 15:35:17.053	2026-02-09 15:35:17.053
cmlfc2s7300275wlkydcvtzkw	cmlfc2s6t00235wlkfkav04wx	Federal Executive Council	4	f	\N	\N	2026-02-09 15:35:17.055	2026-02-09 15:35:17.055
cmlfc51wc00295wlk2qks7rps	cmlfc51w700285wlk5ajgtl8u	Gross Domestic Profit 	1	f	\N	\N	2026-02-09 15:37:02.94	2026-02-09 15:37:02.94
cmlfc51wf002a5wlkxkjje1hx	cmlfc51w700285wlk5ajgtl8u	Gross Domestic Product 	2	t	\N	\N	2026-02-09 15:37:02.943	2026-02-09 15:37:02.943
cmlfc51wi002b5wlk2i3gp6x0	cmlfc51w700285wlk5ajgtl8u	General Development Plan 	3	f	\N	\N	2026-02-09 15:37:02.946	2026-02-09 15:37:02.946
cmlfc51wk002c5wlklmimbdum	cmlfc51w700285wlk5ajgtl8u	Government Debt Profile	4	f	\N	\N	2026-02-09 15:37:02.948	2026-02-09 15:37:02.948
cmlfc6fpg002e5wlk2jgojm6f	cmlfc6fpb002d5wlkuvwl34t7	EFCC 	1	f	\N	\N	2026-02-09 15:38:07.492	2026-02-09 15:38:07.492
cmlfc6fpj002f5wlk9tkz2vyq	cmlfc6fpb002d5wlkuvwl34t7	Ministry of Justice 	2	f	\N	\N	2026-02-09 15:38:07.495	2026-02-09 15:38:07.495
cmlfc6fpl002g5wlkmdcfzkjq	cmlfc6fpb002d5wlkuvwl34t7	Nigerian Copyright Commission 	3	t	\N	\N	2026-02-09 15:38:07.497	2026-02-09 15:38:07.497
cmlfc6fpo002h5wlk35cuuixf	cmlfc6fpb002d5wlkuvwl34t7	 National Film Board	4	f	\N	\N	2026-02-09 15:38:07.5	2026-02-09 15:38:07.5
cmlfc8abt002j5wlkoricw7x7	cmlfc8abi002i5wlkxwr9mbrv	Political manifesto 	1	f	\N	\N	2026-02-09 15:39:33.833	2026-02-09 15:39:33.833
cmlfc8abw002k5wlkb5omvk6s	cmlfc8abi002i5wlkxwr9mbrv	 National IP reform framework 	2	t	\N	\N	2026-02-09 15:39:33.836	2026-02-09 15:39:33.836
cmlfc8aby002l5wlkrh7uui6l	cmlfc8abi002i5wlkxwr9mbrv	Budget policy 	3	f	\N	\N	2026-02-09 15:39:33.838	2026-02-09 15:39:33.838
cmlfc8ac0002m5wlkx7nngeg6	cmlfc8abi002i5wlkxwr9mbrv	Trade agreement	4	f	\N	\N	2026-02-09 15:39:33.84	2026-02-09 15:39:33.84
cmlfca4y0002o5wlkx5yojjv4	cmlfca4xv002n5wlkijezkw5d	Bollywood 	1	f	\N	\N	2026-02-09 15:41:00.168	2026-02-09 15:41:00.168
cmlfca4y3002p5wlkxsqr03h5	cmlfca4xv002n5wlkijezkw5d	Nollywood 	2	t	\N	\N	2026-02-09 15:41:00.171	2026-02-09 15:41:00.171
cmlfca4y5002q5wlk0324zijo	cmlfca4xv002n5wlkijezkw5d	Hollywood 	3	f	\N	\N	2026-02-09 15:41:00.173	2026-02-09 15:41:00.173
cmlfca4y7002r5wlkrcqshku8	cmlfca4xv002n5wlkijezkw5d	Riverwood	4	f	\N	\N	2026-02-09 15:41:00.175	2026-02-09 15:41:00.175
cmlfcbqai002t5wlk8n5gby8m	cmlfcbqab002s5wlksy0yw07t	IMF 	1	f	\N	\N	2026-02-09 15:42:14.49	2026-02-09 15:42:14.49
cmlfcbqam002u5wlkx7q6cbtp	cmlfcbqab002s5wlksy0yw07t	World Trade Organization 	2	t	\N	\N	2026-02-09 15:42:14.494	2026-02-09 15:42:14.494
cmlfcbqau002v5wlkyud895c3	cmlfcbqab002s5wlksy0yw07t	 World Bank 	3	f	\N	\N	2026-02-09 15:42:14.502	2026-02-09 15:42:14.502
cmlfcbqax002w5wlkn4l5fyr1	cmlfcbqab002s5wlksy0yw07t	UNDP	4	f	\N	\N	2026-02-09 15:42:14.505	2026-02-09 15:42:14.505
cmlfcd85l002y5wlkeezsslne	cmlfcd85g002x5wlkm31g6wxr	2004 	1	f	\N	\N	2026-02-09 15:43:24.297	2026-02-09 15:43:24.297
cmlfcd85o002z5wlk4v4nkf0s	cmlfcd85g002x5wlkm31g6wxr	2015 	2	f	\N	\N	2026-02-09 15:43:24.3	2026-02-09 15:43:24.3
cmlfcd85r00305wlkaq62xhld	cmlfcd85g002x5wlkm31g6wxr	 2022 	3	t	\N	\N	2026-02-09 15:43:24.303	2026-02-09 15:43:24.303
cmlfcd85u00315wlk7ywiz6zb	cmlfcd85g002x5wlkm31g6wxr	2024	4	f	\N	\N	2026-02-09 15:43:24.305	2026-02-09 15:43:24.305
cmlfcv9w900335wlk5yvc3e7b	cmlfcv9vz00325wlk3ork8az7	Ideas only 	1	f	\N	\N	2026-02-09 15:57:26.361	2026-02-09 15:57:26.361
cmlfcv9wj00345wlk1rjsuaa0	cmlfcv9vz00325wlk3ork8az7	Expression of original works 	2	t	\N	\N	2026-02-09 15:57:26.371	2026-02-09 15:57:26.371
cmlfcv9wm00355wlk4ry0h4hg	cmlfcv9vz00325wlk3ork8az7	Facts and data	3	f	\N	\N	2026-02-09 15:57:26.374	2026-02-09 15:57:26.374
cmlfcv9wp00365wlkuy3k7ajm	cmlfcv9vz00325wlk3ork8az7	 Titles alone	4	f	\N	\N	2026-02-09 15:57:26.377	2026-02-09 15:57:26.377
cmlfcxs4700385wlk349rd01s	cmlfcxs3w00375wlkgtsextx4	Penal Code 	1	f	\N	\N	2026-02-09 15:59:23.287	2026-02-09 15:59:23.287
cmlfcxs4a00395wlkto11s6rj	cmlfcxs3w00375wlkgtsextx4	 Copyright Act, 2022 	2	t	\N	\N	2026-02-09 15:59:23.289	2026-02-09 15:59:23.289
cmlfcxs4d003a5wlkem0wvadq	cmlfcxs3w00375wlkgtsextx4	Companies Act 	3	f	\N	\N	2026-02-09 15:59:23.293	2026-02-09 15:59:23.293
cmlfcxs4i003b5wlk3m8r30lm	cmlfcxs3w00375wlkgtsextx4	 Evidence Act	4	f	\N	\N	2026-02-09 15:59:23.298	2026-02-09 15:59:23.298
cmlfczr3b003d5wlkm8slubsf	cmlfczr36003c5wlke0a5c3zp	Mathematical formula	1	f	\N	\N	2026-02-09 16:00:55.271	2026-02-09 16:00:55.271
cmlfczr3e003e5wlkremm8t5t	cmlfczr36003c5wlke0a5c3zp	  Literary work 	2	t	\N	\N	2026-02-09 16:00:55.274	2026-02-09 16:00:55.274
cmlfczr3h003f5wlk7oxzsxgx	cmlfczr36003c5wlke0a5c3zp	 News headline 	3	f	\N	\N	2026-02-09 16:00:55.277	2026-02-09 16:00:55.277
cmlfczr3k003g5wlk7zuf21oi	cmlfczr36003c5wlke0a5c3zp	Government policy	4	f	\N	\N	2026-02-09 16:00:55.28	2026-02-09 16:00:55.28
cmlfd56ra003i5wlkxjnlh3lc	cmlfd56r6003h5wlkss6b2g3r	Automatically	1	f	\N	\N	2026-02-09 16:05:08.854	2026-02-09 16:05:08.854
cmlfd56rc003j5wlk1r7xv5ry	cmlfd56r6003h5wlkss6b2g3r	 Conditionally 	2	f	\N	\N	2026-02-09 16:05:08.856	2026-02-09 16:05:08.856
cmlfd56re003k5wlkvma3t1ra	cmlfd56r6003h5wlkss6b2g3r	Not at all 	3	t	\N	\N	2026-02-09 16:05:08.858	2026-02-09 16:05:08.858
cmlfd56rh003l5wlksg9o4zf4	cmlfd56r6003h5wlkss6b2g3r	 Temporarily	4	f	\N	\N	2026-02-09 16:05:08.861	2026-02-09 16:05:08.861
cmlfd6srg003n5wlkll5glc9b	cmlfd6sra003m5wlkd0cwv0b4	Unlimited copying 	1	f	\N	\N	2026-02-09 16:06:24.028	2026-02-09 16:06:24.028
cmlfd6srj003o5wlkmnqx33we	cmlfd6sra003m5wlkd0cwv0b4	Limited use for specific purposes 	2	f	\N	\N	2026-02-09 16:06:24.031	2026-02-09 16:06:24.031
cmlfd6srm003p5wlk3d8wc87v	cmlfd6sra003m5wlkd0cwv0b4	 Commercial exploitation 	3	f	\N	\N	2026-02-09 16:06:24.034	2026-02-09 16:06:24.034
cmlfd6sro003q5wlkj2egsygp	cmlfd6sra003m5wlkd0cwv0b4	Sale without permission	4	t	\N	\N	2026-02-09 16:06:24.036	2026-02-09 16:06:24.036
cmlfda4g4003s5wlkllwjm71d	cmlfda4fz003r5wlk1t442lnm	Advertising 	1	f	\N	\N	2026-02-09 16:08:59.14	2026-02-09 16:08:59.14
cmlfda4g6003t5wlk8uismnwt	cmlfda4fz003r5wlk1t442lnm	 Entertainment	2	f	\N	\N	2026-02-09 16:08:59.142	2026-02-09 16:08:59.142
cmlfda4g8003u5wlkxlddymmy	cmlfda4fz003r5wlk1t442lnm	Research 	3	t	\N	\N	2026-02-09 16:08:59.144	2026-02-09 16:08:59.144
cmlfda4ga003v5wlkjcx9j4sa	cmlfda4fz003r5wlk1t442lnm	Broadcasting	4	f	\N	\N	2026-02-09 16:08:59.146	2026-02-09 16:08:59.146
cmlfdcm6n003x5wlkoui2xedn	cmlfdcm6j003w5wlkz4e32486	Publisher 	1	f	\N	\N	2026-02-09 16:10:55.439	2026-02-09 16:10:55.439
cmlfdcm6p003y5wlkvi41s3z8	cmlfdcm6j003w5wlkz4e32486	Author 	2	t	\N	\N	2026-02-09 16:10:55.441	2026-02-09 16:10:55.441
cmlfdcm6r003z5wlkiccd9ioh	cmlfdcm6j003w5wlkz4e32486	Employer always 	3	f	\N	\N	2026-02-09 16:10:55.443	2026-02-09 16:10:55.443
cmlfdcm6t00405wlkyesyej0u	cmlfdcm6j003w5wlkz4e32486	Government	4	f	\N	\N	2026-02-09 16:10:55.445	2026-02-09 16:10:55.445
cmlfdeehx00425wlkff1547cm	cmlfdeeho00415wlknlxkykwo	Sale of work 	1	f	\N	\N	2026-02-09 16:12:18.789	2026-02-09 16:12:18.789
cmlfdeei000435wlkf98z6uev	cmlfdeeho00415wlknlxkykwo	Attribution and integrity	2	t	\N	\N	2026-02-09 16:12:18.792	2026-02-09 16:12:18.792
cmlfdeei400445wlk392spfbw	cmlfdeeho00415wlknlxkykwo	 Royalties 	3	f	\N	\N	2026-02-09 16:12:18.796	2026-02-09 16:12:18.796
cmlfdeei700455wlk7fs7j07f	cmlfdeeho00415wlknlxkykwo	Licensing	4	f	\N	\N	2026-02-09 16:12:18.799	2026-02-09 16:12:18.799
cmlfdhxwj004j5wlk8ubylx0d	cmlfdhxwe004i5wlk7gu76442	Moral reputation . 	1	f	\N	\N	2026-02-09 16:15:03.907	2026-02-09 16:15:03.907
cmlfdhxwm004k5wlkt70yuwx8	cmlfdhxwe004i5wlk7gu76442	Ownership and control of property 	2	t	\N	\N	2026-02-09 16:15:03.91	2026-02-09 16:15:03.91
cmlfdhxwo004l5wlkdjb88aq8	cmlfdhxwe004i5wlk7gu76442	Freedom of speech 	3	f	\N	\N	2026-02-09 16:15:03.912	2026-02-09 16:15:03.912
cmlfdhxwr004m5wlkzdj92utr	cmlfdhxwe004i5wlk7gu76442	Right to fair hearing	4	f	\N	\N	2026-02-09 16:15:03.915	2026-02-09 16:15:03.915
cmlfdj46k004q5wlk7afuiivm	cmlfdj46h004p5wlkxicwqjiy	50 years 	1	f	\N	\N	2026-02-09 16:15:58.7	2026-02-09 16:15:58.7
cmlfdj46m004r5wlkgbct1hkr	cmlfdj46h004p5wlkxicwqjiy	Life plus 70 years 	2	t	\N	\N	2026-02-09 16:15:58.702	2026-02-09 16:15:58.702
cmlfdj46o004s5wlkjvbh6kwy	cmlfdj46h004p5wlkxicwqjiy	 Life plus 25 years 	3	f	\N	\N	2026-02-09 16:15:58.704	2026-02-09 16:15:58.704
cmlfdj46q004t5wlkvmutwdko	cmlfdj46h004p5wlkxicwqjiy	Perpetual	4	f	\N	\N	2026-02-09 16:15:58.706	2026-02-09 16:15:58.706
cmlfdkdgs004x5wlkytiv3q47	cmlfdkdgo004w5wlkmlbwn2hh	Lawful copying 	1	f	\N	\N	2026-02-09 16:16:57.388	2026-02-09 16:16:57.388
cmlfdkdgu004y5wlkdm87kucc	cmlfdkdgo004w5wlkmlbwn2hh	Unauthorised use	2	t	\N	\N	2026-02-09 16:16:57.39	2026-02-09 16:16:57.39
cmlfdkdgx004z5wlk53nubnt5	cmlfdkdgo004w5wlkmlbwn2hh	 Fair dealing 	3	f	\N	\N	2026-02-09 16:16:57.393	2026-02-09 16:16:57.393
cmlfdkdgz00505wlk120eo6cz	cmlfdkdgo004w5wlkmlbwn2hh	Public domain use	4	f	\N	\N	2026-02-09 16:16:57.395	2026-02-09 16:16:57.395
cmlfdnis1005k5wlk058pv0yq	cmlfdnirx005j5wlk24zsobyl	Mandatory 	1	f	\N	\N	2026-02-09 16:19:24.241	2026-02-09 16:19:24.241
cmlfdnis4005l5wlkkzrlx1n7	cmlfdnirx005j5wlk24zsobyl	Optional but compulsory 	2	f	\N	\N	2026-02-09 16:19:24.244	2026-02-09 16:19:24.244
cmlfdnis6005m5wlkwas9gh6f	cmlfdnirx005j5wlk24zsobyl	Not mandatory 	3	t	\N	\N	2026-02-09 16:19:24.246	2026-02-09 16:19:24.246
cmlfdnis8005n5wlko1v5o2js	cmlfdnirx005j5wlk24zsobyl	Prohibited	4	f	\N	\N	2026-02-09 16:19:24.248	2026-02-09 16:19:24.248
cmlfdp81p005p5wlktee3x7gt	cmlfdp81k005o5wlkoi6xa9jb	SEC 	1	f	\N	\N	2026-02-09 16:20:43.645	2026-02-09 16:20:43.645
cmlfdp81s005q5wlkjf7x5ngi	cmlfdp81k005o5wlkoi6xa9jb	Ministry of Culture 	2	f	\N	\N	2026-02-09 16:20:43.648	2026-02-09 16:20:43.648
cmlfdp81v005r5wlkdjlznzgs	cmlfdp81k005o5wlkoi6xa9jb	 Nigerian Copyright Commission 	3	t	\N	\N	2026-02-09 16:20:43.651	2026-02-09 16:20:43.651
cmlfdp81z005s5wlkhj6l2enb	cmlfdp81k005o5wlkoi6xa9jb	 CBN 	4	f	\N	\N	2026-02-09 16:20:43.655	2026-02-09 16:20:43.655
cmlfdsmbx005u5wlkv2i6ydnp	cmlfdsmbq005t5wlkktriin86	Government ownership 	1	f	\N	\N	2026-02-09 16:23:22.125	2026-02-09 16:23:22.125
cmlfdsmc0005v5wlkisgucasq	cmlfdsmbq005t5wlkktriin86	 Rights administration on behalf of multiple owners 	2	t	\N	\N	2026-02-09 16:23:22.128	2026-02-09 16:23:22.128
cmlfdsmc4005w5wlkdztuk3zc	cmlfdsmbq005t5wlkktriin86	Free licensing 	3	f	\N	\N	2026-02-09 16:23:22.132	2026-02-09 16:23:22.132
cmlfdsmc8005x5wlk30oiubnh	cmlfdsmbq005t5wlkktriin86	 Public domain use	4	f	\N	\N	2026-02-09 16:23:22.136	2026-02-09 16:23:22.136
cmlfdw0e7005z5wlkjm25u7x9	cmlfdw0e2005y5wlk0kee76zc	Transfer of ownership 	1	f	\N	\N	2026-02-09 16:26:00.319	2026-02-09 16:26:00.319
cmlfdw0ea00605wlksynr66a0	cmlfdw0e2005y5wlk0kee76zc	Permission to use a work 	2	t	\N	\N	2026-02-09 16:26:00.322	2026-02-09 16:26:00.322
cmlfdw0ed00615wlk4rcbm9r9	cmlfdw0e2005y5wlk0kee76zc	 Waiver of rights 	3	f	\N	\N	2026-02-09 16:26:00.324	2026-02-09 16:26:00.324
cmlfdw0ef00625wlkslijhnjf	cmlfdw0e2005y5wlk0kee76zc	Court order	4	f	\N	\N	2026-02-09 16:26:00.327	2026-02-09 16:26:00.327
cmlfdxdgo00645wlkrjz6m0rq	cmlfdxdgk00635wlkgbjl9skb	Temporary use 	1	f	\N	\N	2026-02-09 16:27:03.912	2026-02-09 16:27:03.912
cmlfdxdgr00655wlk5g6oq3ln	cmlfdxdgk00635wlkgbjl9skb	Transfer of ownership 	2	t	\N	\N	2026-02-09 16:27:03.915	2026-02-09 16:27:03.915
cmlfdxdgt00665wlkavrep4yr	cmlfdxdgk00635wlkgbjl9skb	Fair dealing 	3	f	\N	\N	2026-02-09 16:27:03.917	2026-02-09 16:27:03.917
cmlfdxdgw00675wlkflnv1jjs	cmlfdxdgk00635wlkgbjl9skb	Registration	4	f	\N	\N	2026-02-09 16:27:03.92	2026-02-09 16:27:03.92
cmlfe6a4a006d5wlktnphn463	cmlfe6a42006c5wlkd230wc48	Authors only 	1	f	\N	\N	2026-02-09 16:33:59.482	2026-02-09 16:33:59.482
cmlfe6a4d006e5wlk6wr9uj0f	cmlfe6a42006c5wlkd230wc48	 Performers and producers	2	t	\N	\N	2026-02-09 16:33:59.485	2026-02-09 16:33:59.485
cmlfe6a4h006f5wlky0wodvae	cmlfe6a42006c5wlkd230wc48	 Judges 	3	f	\N	\N	2026-02-09 16:33:59.489	2026-02-09 16:33:59.489
cmlfe6a4k006g5wlkoaaqm22m	cmlfe6a42006c5wlkd230wc48	Publishers only	4	f	\N	\N	2026-02-09 16:33:59.492	2026-02-09 16:33:59.492
cmlfecmqy006s5wlk551aqx0n	cmlfecmqs006r5wlkce5owcfw	Never 	1	f	\N	\N	2026-02-09 16:38:55.786	2026-02-09 16:38:55.786
cmlfecmr1006t5wlkr86w1lx0	cmlfecmqs006r5wlkce5owcfw	Only partially 	2	f	\N	\N	2026-02-09 16:38:55.789	2026-02-09 16:38:55.789
cmlfecmr7006u5wlkdgj6u0r4	cmlfecmqs006r5wlkce5owcfw	Yes 	3	t	\N	\N	2026-02-09 16:38:55.795	2026-02-09 16:38:55.795
cmlfecmr9006v5wlkvqm9a0f5	cmlfecmqs006r5wlkce5owcfw	Only by government	4	f	\N	\N	2026-02-09 16:38:55.797	2026-02-09 16:38:55.797
cmlfe7v0h006i5wlkxnkom98w	cmlfe7v0c006h5wlkk8pljjyz	Writes a book	1	f	\N	\N	2026-02-09 16:35:13.217	2026-02-09 16:35:13.217
cmlfe7v0k006j5wlkayjcmz1s	cmlfe7v0c006h5wlkk8pljjyz	 Performs a work 	2	t	\N	\N	2026-02-09 16:35:13.22	2026-02-09 16:35:13.22
cmlfe7v0n006k5wlks67evnvi	cmlfe7v0c006h5wlkk8pljjyz	 Registers copyright 	3	f	\N	\N	2026-02-09 16:35:13.223	2026-02-09 16:35:13.223
cmlfe7v0p006l5wlkerw8idd7	cmlfe7v0c006h5wlkk8pljjyz	Publishes newspapers	4	f	\N	\N	2026-02-09 16:35:13.225	2026-02-09 16:35:13.225
cmlfe8zx7006n5wlkkez8t6vf	cmlfe8zx2006m5wlkas7j8nwm	Private listening 	1	f	\N	\N	2026-02-09 16:36:06.235	2026-02-09 16:36:06.235
cmlfe8zxd006o5wlkoyx0hnj1	cmlfe8zx2006m5wlkas7j8nwm	Playing works in public 	2	t	\N	\N	2026-02-09 16:36:06.241	2026-02-09 16:36:06.241
cmlfe8zxf006p5wlkgmpn1e2u	cmlfe8zx2006m5wlkas7j8nwm	Home viewing 	3	f	\N	\N	2026-02-09 16:36:06.243	2026-02-09 16:36:06.243
cmlfe8zxi006q5wlk79egeucq	cmlfe8zx2006m5wlkas7j8nwm	Archiving  	4	f	\N	\N	2026-02-09 16:36:06.246	2026-02-09 16:36:06.246
cmlfegkfa00725wlkagwn9vgj	cmlfegkf500715wlk4yg0vaev	Apology 	1	f	\N	\N	2026-02-09 16:41:59.398	2026-02-09 16:41:59.398
cmlfegkfd00735wlk46ahiels	cmlfegkf500715wlk4yg0vaev	 Injunction 	2	t	\N	\N	2026-02-09 16:41:59.401	2026-02-09 16:41:59.401
cmlfegkff00745wlk8kg2a4v5	cmlfegkf500715wlk4yg0vaev	Warning only 	3	f	\N	\N	2026-02-09 16:41:59.403	2026-02-09 16:41:59.403
cmlfegkfh00755wlk7h12lwj3	cmlfegkf500715wlk4yg0vaev	Registration	4	f	\N	\N	2026-02-09 16:41:59.405	2026-02-09 16:41:59.405
cmlfeifcd00775wlk36my576p	cmlfeifc900765wlkpp3235vc	Children 	1	f	\N	\N	2026-02-09 16:43:26.125	2026-02-09 16:43:26.125
cmlfeifcr00785wlkfpy68gzm	cmlfeifc900765wlkpp3235vc	Publishers 	2	f	\N	\N	2026-02-09 16:43:26.139	2026-02-09 16:43:26.139
cmlfeifd100795wlkvfmjm8xm	cmlfeifc900765wlkpp3235vc	 Print-disabled persons 	3	t	\N	\N	2026-02-09 16:43:26.149	2026-02-09 16:43:26.149
cmlfeifdd007a5wlkrkyil4x2	cmlfeifc900765wlkpp3235vc	Libraries only	4	f	\N	\N	2026-02-09 16:43:26.161	2026-02-09 16:43:26.161
cmlfejo7s007c5wlkfzlb7e2i	cmlfejo7n007b5wlk7v4l8430	Section 10 	1	f	\N	\N	2026-02-09 16:44:24.28	2026-02-09 16:44:24.28
cmlfejo7u007d5wlk3b1tp0rh	cmlfejo7n007b5wlk7v4l8430	Section 18	2	f	\N	\N	2026-02-09 16:44:24.282	2026-02-09 16:44:24.282
cmlfejo7x007e5wlkchjw2qjp	cmlfejo7n007b5wlk7v4l8430	  Section 26 	3	t	\N	\N	2026-02-09 16:44:24.285	2026-02-09 16:44:24.285
cmlfejo80007f5wlkwan95qit	cmlfejo7n007b5wlk7v4l8430	Section 40	4	f	\N	\N	2026-02-09 16:44:24.288	2026-02-09 16:44:24.288
cmlfef37n006x5wlk7i0ubbl3	cmlfef37j006w5wlkie53jzew	 Lawful distribution 	1	f	\N	\N	2026-02-09 16:40:50.435	2026-02-09 16:40:50.435
cmlfef37r006y5wlkuxiubtvk	cmlfef37j006w5wlkie53jzew	Unauthorised reproduction 	2	t	\N	\N	2026-02-09 16:40:50.439	2026-02-09 16:40:50.439
cmlfef37t006z5wlkdekvk3hw	cmlfef37j006w5wlkie53jzew	Fair dealing 	3	f	\N	\N	2026-02-09 16:40:50.441	2026-02-09 16:40:50.441
cmlfef37v00705wlkis6c5y8b	cmlfef37j006w5wlkie53jzew	Licensing	4	f	\N	\N	2026-02-09 16:40:50.443	2026-02-09 16:40:50.443
cmlfeqyfp007h5wlkat6wldqu	cmlfeqyf2007g5wlkdsi0e95f	 Berne Convention 	1	f	\N	\N	2026-02-09 16:50:04.117	2026-02-09 16:50:04.117
cmlfeqyg1007i5wlk7vtkzxai	cmlfeqyf2007g5wlkdsi0e95f	Marrakesh Treaty 	2	t	\N	\N	2026-02-09 16:50:04.129	2026-02-09 16:50:04.129
cmlfeqyg4007j5wlk21y445y6	cmlfeqyf2007g5wlkdsi0e95f	Paris Convention 	3	f	\N	\N	2026-02-09 16:50:04.132	2026-02-09 16:50:04.132
cmlfeqyg7007k5wlkqj4fw0lb	cmlfeqyf2007g5wlkdsi0e95f	Rome Convention	4	f	\N	\N	2026-02-09 16:50:04.135	2026-02-09 16:50:04.135
cmlfesyje007m5wlk9ie9g4w9	cmlfesyj9007l5wlk8pusvxen	Banks 	1	f	\N	\N	2026-02-09 16:51:37.562	2026-02-09 16:51:37.562
cmlfesyjg007n5wlkgb9kfqor	cmlfesyj9007l5wlk8pusvxen	Internet intermediaries	2	t	\N	\N	2026-02-09 16:51:37.564	2026-02-09 16:51:37.564
cmlfesyji007o5wlk79e7cfxz	cmlfesyj9007l5wlk8pusvxen	 Authors 	3	f	\N	\N	2026-02-09 16:51:37.566	2026-02-09 16:51:37.566
cmlfesyjk007p5wlkv0uqhyun	cmlfesyj9007l5wlk8pusvxen	 Libraries	4	f	\N	\N	2026-02-09 16:51:37.568	2026-02-09 16:51:37.568
cmlff0wzd007r5wlkmxtgw4r2	cmlff0wyn007q5wlkpo1toqco	Court only 	1	f	\N	\N	2026-02-09 16:57:48.793	2026-02-09 16:57:48.793
cmlff0x00007s5wlk6uimihzk	cmlff0wyn007q5wlkpo1toqco	 Contract 	2	t	\N	\N	2026-02-09 16:57:48.816	2026-02-09 16:57:48.816
cmlff0x03007t5wlkmmqfu689	cmlff0wyn007q5wlkpo1toqco	 Constitution 	3	f	\N	\N	2026-02-09 16:57:48.819	2026-02-09 16:57:48.819
cmlff0x06007u5wlk35txbhk7	cmlff0wyn007q5wlkpo1toqco	 Regulation	4	f	\N	\N	2026-02-09 16:57:48.822	2026-02-09 16:57:48.822
cmlff34o1007w5wlkyshukbmb	cmlff34nw007v5wlkl3qg3frp	Tax consumers	1	f	\N	\N	2026-02-09 16:59:32.065	2026-02-09 16:59:32.065
cmlff34o3007x5wlki5dhavsm	cmlff34nw007v5wlkl3qg3frp	 Compensate right holders 	2	t	\N	\N	2026-02-09 16:59:32.067	2026-02-09 16:59:32.067
cmlff34o6007y5wlkix703cfh	cmlff34nw007v5wlkl3qg3frp	 Fund courts 	3	f	\N	\N	2026-02-09 16:59:32.07	2026-02-09 16:59:32.07
cmlff34o8007z5wlkkbmc6z13	cmlff34nw007v5wlkl3qg3frp	Penalise users	4	f	\N	\N	2026-02-09 16:59:32.072	2026-02-09 16:59:32.072
cmlff478900815wlkarl9sr5u	cmlff478500805wlk5zfqizp8	Discretion 	1	f	\N	\N	2026-02-09 17:00:22.041	2026-02-09 17:00:22.041
cmlff478b00825wlkuctm4si3	cmlff478500805wlk5zfqizp8	 International conventions 	2	t	\N	\N	2026-02-09 17:00:22.043	2026-02-09 17:00:22.043
cmlff478e00835wlkumnrb2uy	cmlff478500805wlk5zfqizp8	Registration only 	3	f	\N	\N	2026-02-09 17:00:22.046	2026-02-09 17:00:22.046
cmlff478g00845wlkkzhqh8r7	cmlff478500805wlk5zfqizp8	Reciprocity tax	4	f	\N	\N	2026-02-09 17:00:22.048	2026-02-09 17:00:22.048
cmlff69xw00865wlkke66ik7k	cmlff69xr00855wlkfey7r3jp	State High Court 	1	f	\N	\N	2026-02-09 17:01:58.868	2026-02-09 17:01:58.868
cmlff69xy00875wlkkvfvvu8u	cmlff69xr00855wlkfey7r3jp	Federal High Court 	2	t	\N	\N	2026-02-09 17:01:58.87	2026-02-09 17:01:58.87
cmlff69y100885wlke1c0pk7b	cmlff69xr00855wlkfey7r3jp	Magistrate Court 	3	f	\N	\N	2026-02-09 17:01:58.873	2026-02-09 17:01:58.873
cmlff69y400895wlkqd63b60w	cmlff69xr00855wlkfey7r3jp	Sharia Court	4	f	\N	\N	2026-02-09 17:01:58.876	2026-02-09 17:01:58.876
\.


--
-- Data for Name: AssessmentQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentQuestion" (id, assessment_id, question_text, question_type, "order", points, is_required, time_limit, image_url, image_s3_key, audio_url, video_url, allow_multiple_attempts, show_hint, hint_text, min_length, max_length, min_value, max_value, explanation, difficulty_level, "createdAt", "updatedAt") FROM stdin;
cml9ecq7x000328m1k3v43dkn	cml9e9mmc000228m11e75jgov	What do we use numbers for in our daily lives?	MULTIPLE_CHOICE_SINGLE	1	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:52:23.229	2026-02-05 11:52:23.229
cml9edtyh000828m1n2cor3ze	cml9e9mmc000228m11e75jgov	When counting from 1 to 10, which number comes immediately after 3?	MULTIPLE_CHOICE_SINGLE	2	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:53:14.729	2026-02-05 11:53:14.729
cml9eevh9000d28m10c273q1b	cml9e9mmc000228m11e75jgov	If you see the objects 🍎🍎🍎🍎, how many apples are there?\n	MULTIPLE_CHOICE_SINGLE	3	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:54:03.357	2026-02-05 11:55:51.503
cml9ego4b000i28m1bv4yon58	cml9e9mmc000228m11e75jgov	How many fingers do you typically have on one hand?	MULTIPLE_CHOICE_SINGLE	4	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:55:27.131	2026-02-05 11:56:02.07
cml9eil18000v28m1fo6qi312	cml9e9mmc000228m11e75jgov	Which word is the correct name for the number 7?	MULTIPLE_CHOICE_SINGLE	5	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:56:56.444	2026-02-05 11:56:56.444
cml9ejvb3001028m114f5m5bj	cml9e9mmc000228m11e75jgov	Which of these is the correct way to write the number 'Ten'?	MULTIPLE_CHOICE_SINGLE	6	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:57:56.415	2026-02-05 11:58:04.797
cml9eko3p001928m1xssoue2m	cml9e9mmc000228m11e75jgov	Numbers tell us 'how many'. If a basket is empty, how many items are in it?\n	MULTIPLE_CHOICE_SINGLE	7	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:58:33.733	2026-02-05 11:58:42.928
cml9elrle001i28m1bhjnru3a	cml9e9mmc000228m11e75jgov	Which number comes just before 2?\n	MULTIPLE_CHOICE_SINGLE	8	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:59:24.914	2026-02-05 11:59:24.914
cml9embnh001n28m1saimnryt	cml9e9mmc000228m11e75jgov	Which of the following represents the largest quantity?\n	MULTIPLE_CHOICE_SINGLE	9	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 11:59:50.909	2026-02-05 11:59:50.909
cml9emsca001s28m16lo9w275	cml9e9mmc000228m11e75jgov	True or False: We can use numbers to count how many friends we have.\n	TRUE_FALSE	10	10	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-05 12:00:12.538	2026-02-05 12:00:12.538
cmlaylp08005d28m1htqp2sda	cmlayfq3m005c28m1nyzm7h01	In the context of Economics, what does the term 'Demand' specifically represent?	MULTIPLE_CHOICE_SINGLE	1	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:07:00.056	2026-02-06 14:07:00.056
cmlayo21t005i28m1ve76xrck	cmlayfq3m005c28m1nyzm7h01	According to the Law of Demand, what is the relationship between price and quantity demanded, assuming all other factors remain equal?	MULTIPLE_CHOICE_SINGLE	2	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:08:50.273	2026-02-06 14:08:50.273
cmlayq924005n28m19uqky09j	cmlayfq3m005c28m1nyzm7h01	If the price of a paint of garri increases from ₦1,000 to ₦3,000, how are farmers likely to react based on the Law of Supply?	MULTIPLE_CHOICE_SINGLE	3	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:10:32.668	2026-02-06 14:10:32.668
cmlaz0glw005s28m17x14020u	cmlayfq3m005c28m1nyzm7h01	What occurs at the specific point where the quantity of a product demanded by buyers equals the quantity supplied by sellers?	MULTIPLE_CHOICE_SINGLE	4	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:18:29.012	2026-02-06 14:18:29.012
cmlazegex005y28m11ov7qcuc	cmlaz2o3a005x28m16pb4ie0m	what is my nam	MULTIPLE_CHOICE_MULTIPLE	1	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	rgfegfwegewg	MEDIUM	2026-02-06 14:29:21.945	2026-02-06 14:29:21.945
cmlazfrpp006328m18h0cg4j5	cmlayfq3m005c28m1nyzm7h01	If a market has an 'excess supply' of bread, what does this imply about the relationship between buyers and sellers?	MULTIPLE_CHOICE_SINGLE	5	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:30:23.245	2026-02-06 14:30:23.245
cmlazhj05006928m1dd1datj3	cmlazgmoh006828m100lwlrlm	hefejfkl4	MULTIPLE_CHOICE_MULTIPLE	1	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:31:45.269	2026-02-06 14:31:45.269
cmlazj9mc006e28m1vawqersg	cmlazgmoh006828m100lwlrlm	htnhhjuk	MULTIPLE_CHOICE_MULTIPLE	2	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:33:06.42	2026-02-06 14:33:06.42
cmlazjz3z006j28m1gkjipkji	cmlazgmoh006828m100lwlrlm	tyhgfbhth	MULTIPLE_CHOICE_MULTIPLE	3	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:33:39.455	2026-02-06 14:33:39.455
cmlazkllb006o28m1i0m2ougo	cmlazgmoh006828m100lwlrlm	wryhtrgk	MULTIPLE_CHOICE_MULTIPLE	4	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:34:08.591	2026-02-06 14:34:08.591
cmlazldvt006t28m146k1fnos	cmlazgmoh006828m100lwlrlm	gggggggggeg	MULTIPLE_CHOICE_MULTIPLE	5	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:34:45.257	2026-02-06 14:34:45.257
cmlazwr9g006y28m179k2uakp	cmlayfq3m005c28m1nyzm7h01	A drop in the price of data subscriptions would likely lead to which of the following results?\n	MULTIPLE_CHOICE_SINGLE	6	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:43:35.812	2026-02-06 14:43:35.812
cmlazz4x7007328m18khs6z39	cmlayfq3m005c28m1nyzm7h01	Why does the price of chicken often increase during festive periods?\n	MULTIPLE_CHOICE_SINGLE	7	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:45:26.827	2026-02-06 14:45:26.827
cmlb0336i007828m1w09swu0w	cmlayfq3m005c28m1nyzm7h01	Which of the following is a core component of the definition of 'Supply'?\n	MULTIPLE_CHOICE_SINGLE	8	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:48:31.194	2026-02-06 14:48:31.194
cmlb053bh007d28m1bnmu0wg4	cmlayfq3m005c28m1nyzm7h01	What does the phrase 'all other things being equal' (ceteris paribus) imply in the Law of Demand?\n	MULTIPLE_CHOICE_SINGLE	9	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:50:04.685	2026-02-06 14:50:04.685
cmlb06xy3007i28m1nwuf39ux	cmlayfq3m005c28m1nyzm7h01	If a student wants a bottle of water but does not have the ₦50 required to pay for it, does this constitute 'Demand' in an economic sense?\n	MULTIPLE_CHOICE_SINGLE	10	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 14:51:31.035	2026-02-06 14:51:31.035
cmlb5ox39009t28m1t5ss6p5e	cmlb58rk8009s28m129bxcrta	What is the full meaning if SON	MULTIPLE_CHOICE_SINGLE	1	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-06 17:25:27.813	2026-02-06 17:25:27.813
cmlfbhnm600025wlkn3719nos	cmlfbaz0v00015wlk23x8oljp	SECTION A: CURRENT AFFAIRS (1–20)\n\n1.\tNigeria operates which system of government?	MULTIPLE_CHOICE_SINGLE	1	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:18:51.342	2026-02-09 15:18:51.342
cmlfbiv0900075wlkgluqscdn	cmlfbaz0v00015wlk23x8oljp	2.\tWho is Nigeria’s President as at 2026?	MULTIPLE_CHOICE_SINGLE	2	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:19:47.577	2026-02-09 15:19:47.577
cmlfbk8j4000c5wlkarmm7gkz	cmlfbaz0v00015wlk23x8oljp	3.\tACFTA means:	MULTIPLE_CHOICE_SINGLE	3	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:20:51.76	2026-02-09 15:20:51.76
cmlfbmdiq000h5wlkd99n4u17	cmlfbaz0v00015wlk23x8oljp	The main goal of AfCFTA is to	MULTIPLE_CHOICE_SINGLE	4	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:22:31.538	2026-02-09 15:22:31.538
cmlfboifh000m5wlkc2urpirq	cmlfbaz0v00015wlk23x8oljp	5.\tWhich ministry supervises Nigeria’s creative economy?	MULTIPLE_CHOICE_SINGLE	5	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:24:11.213	2026-02-09 15:24:11.213
cmlfbqda9000z5wlkxaoajzd8	cmlfbaz0v00015wlk23x8oljp	6.\tNigeria’s official currency is the:	MULTIPLE_CHOICE_SINGLE	6	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:25:37.857	2026-02-09 15:25:37.857
cmlfbsigm00145wlkkij63g3w	cmlfbaz0v00015wlk23x8oljp	NIPPS stands for:	MULTIPLE_CHOICE_SINGLE	7	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:27:17.878	2026-02-09 15:27:17.878
cmlfbty8500195wlk1cxgxjku	cmlfbaz0v00015wlk23x8oljp	Nigeria’s apex bank is the	MULTIPLE_CHOICE_SINGLE	8	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:28:24.965	2026-02-09 15:28:24.965
cmlfbvvum001e5wlks9xt4s67	cmlfbaz0v00015wlk23x8oljp	Nigeria’s “Orange Economy” refers mainly to:	MULTIPLE_CHOICE_SINGLE	9	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:29:55.198	2026-02-09 15:29:55.198
cmlfbxdvl001j5wlkpejzk3bb	cmlfbaz0v00015wlk23x8oljp	The Marrakesh Treaty focuses on:	MULTIPLE_CHOICE_SINGLE	10	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:31:05.217	2026-02-09 15:31:05.217
cmlfbyr90001o5wlkvj9agpqy	cmlfbaz0v00015wlk23x8oljp	Which arm of government interprets laws?	MULTIPLE_CHOICE_SINGLE	11	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:32:09.204	2026-02-09 15:32:09.204
cmlfc03pg001t5wlkyz7mnb0c	cmlfbaz0v00015wlk23x8oljp	FEC means	MULTIPLE_CHOICE_SINGLE	12	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:33:12.004	2026-02-09 15:33:12.004
cmlfc1do3001y5wlkw1j9gge9	cmlfbaz0v00015wlk23x8oljp	Global administration of IP treaties is handled by:	MULTIPLE_CHOICE_SINGLE	13	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:34:11.571	2026-02-09 15:34:11.571
cmlfc2s6t00235wlkfkav04wx	cmlfbaz0v00015wlk23x8oljp	Nigeria’s law-making body is the:	MULTIPLE_CHOICE_SINGLE	14	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:35:17.045	2026-02-09 15:35:17.045
cmlfc51w700285wlk5ajgtl8u	cmlfbaz0v00015wlk23x8oljp	GDP stands for	MULTIPLE_CHOICE_SINGLE	15	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:37:02.935	2026-02-09 15:37:02.935
cmlfc6fpb002d5wlkuvwl34t7	cmlfbaz0v00015wlk23x8oljp	Which agency enforces copyright in Nigeria?	MULTIPLE_CHOICE_SINGLE	16	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:38:07.487	2026-02-09 15:38:07.487
cmlfc8abi002i5wlkxwr9mbrv	cmlfbaz0v00015wlk23x8oljp	NIPPS is a:	MULTIPLE_CHOICE_SINGLE	17	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:39:33.822	2026-02-09 15:39:33.822
cmlfcbqab002s5wlksy0yw07t	cmlfbaz0v00015wlk23x8oljp	The global trade regulator is the	MULTIPLE_CHOICE_SINGLE	19	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:42:14.483	2026-02-09 15:42:14.483
cmlfcd85g002x5wlkm31g6wxr	cmlfbaz0v00015wlk23x8oljp	Nigeria’s current Copyright Act was enacted in	MULTIPLE_CHOICE_SINGLE	20	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:43:24.292	2026-02-09 15:43:24.292
cmlfca4xv002n5wlkijezkw5d	cmlfbaz0v00015wlk23x8oljp	Nigeria’s film industry is known as:	MULTIPLE_CHOICE_SINGLE	18	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:41:00.163	2026-02-09 15:41:00.163
cmlfcv9vz00325wlk3ork8az7	cmlfbaz0v00015wlk23x8oljp	SECTION B: COPYRIGHT (21–50)\n\nCopyright protects	MULTIPLE_CHOICE_SINGLE	21	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:57:26.351	2026-02-09 15:57:26.351
cmlfcxs3w00375wlkgtsextx4	cmlfbaz0v00015wlk23x8oljp	Copyright in Nigeria is governed by the	MULTIPLE_CHOICE_SINGLE	22	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 15:59:23.276	2026-02-09 15:59:23.276
cmlfczr36003c5wlke0a5c3zp	cmlfbaz0v00015wlk23x8oljp	Which is a copyrightable work?	MULTIPLE_CHOICE_SINGLE	23	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:00:55.266	2026-02-09 16:00:55.266
cmlfd56r6003h5wlkss6b2g3r	cmlfbaz0v00015wlk23x8oljp	Copyright protects ideas:	MULTIPLE_CHOICE_SINGLE	24	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:05:08.85	2026-02-09 16:05:08.85
cmlfd6sra003m5wlkd0cwv0b4	cmlfbaz0v00015wlk23x8oljp	Fair dealing allows	MULTIPLE_CHOICE_SINGLE	25	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:06:24.022	2026-02-09 16:06:24.022
cmlfda4fz003r5wlk1t442lnm	cmlfbaz0v00015wlk23x8oljp	One recognised fair dealing purpose is	MULTIPLE_CHOICE_SINGLE	26	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:08:59.135	2026-02-09 16:08:59.135
cmlfdcm6j003w5wlkz4e32486	cmlfbaz0v00015wlk23x8oljp	First ownership of copyright vests in the	MULTIPLE_CHOICE_SINGLE	27	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:10:55.435	2026-02-09 16:10:55.435
cmlfdeeho00415wlknlxkykwo	cmlfbaz0v00015wlk23x8oljp	Moral rights relate to	MULTIPLE_CHOICE_SINGLE	28	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:12:18.78	2026-02-09 16:12:18.78
cmlfdhxwe004i5wlk7gu76442	cmlfbaz0v00015wlk23x8oljp	Economic rights concern	MULTIPLE_CHOICE_SINGLE	29	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:15:03.902	2026-02-09 16:15:03.902
cmlfdj46h004p5wlkxicwqjiy	cmlfbaz0v00015wlk23x8oljp	Duration of copyright for literary works is:	MULTIPLE_CHOICE_SINGLE	30	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:15:58.697	2026-02-09 16:15:58.697
cmlfdkdgo004w5wlkmlbwn2hh	cmlfbaz0v00015wlk23x8oljp	Copyright infringement is:	MULTIPLE_CHOICE_SINGLE	31	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:16:57.384	2026-02-09 16:16:57.384
cmlfdnirx005j5wlk24zsobyl	cmlfbaz0v00015wlk23x8oljp	Copyright registration in Nigeria is:	MULTIPLE_CHOICE_SINGLE	32	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:19:24.237	2026-02-09 16:19:24.237
cmlfdp81k005o5wlkoi6xa9jb	cmlfbaz0v00015wlk23x8oljp	CMOs are regulated by the	MULTIPLE_CHOICE_SINGLE	33	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:20:43.64	2026-02-09 16:20:43.64
cmlfdsmbq005t5wlkktriin86	cmlfbaz0v00015wlk23x8oljp	Collective management means	MULTIPLE_CHOICE_SINGLE	34	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:23:22.118	2026-02-09 16:23:22.118
cmlfdw0e2005y5wlk0kee76zc	cmlfbaz0v00015wlk23x8oljp	A copyright licence is:	MULTIPLE_CHOICE_SINGLE	35	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:26:00.314	2026-02-09 16:26:00.314
cmlfdxdgk00635wlkgbjl9skb	cmlfbaz0v00015wlk23x8oljp	Assignment means:	MULTIPLE_CHOICE_SINGLE	36	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:27:03.908	2026-02-09 16:27:03.908
cmlfe6a42006c5wlkd230wc48	cmlfbaz0v00015wlk23x8oljp	Neighbouring rights protect:	MULTIPLE_CHOICE_SINGLE	37	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:33:59.474	2026-02-09 16:33:59.474
cmlfe7v0c006h5wlkk8pljjyz	cmlfbaz0v00015wlk23x8oljp	A performer is one who:	MULTIPLE_CHOICE_SINGLE	38	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:35:13.212	2026-02-09 16:35:13.212
cmlfe8zx2006m5wlkas7j8nwm	cmlfbaz0v00015wlk23x8oljp	39.\tPublic performance means:	MULTIPLE_CHOICE_SINGLE	39	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:36:06.23	2026-02-09 16:36:06.23
cmlfecmqs006r5wlkce5owcfw	cmlfbaz0v00015wlk23x8oljp	Copyright can be inherited:	MULTIPLE_CHOICE_SINGLE	40	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:38:55.779	2026-02-09 16:38:55.779
cmlfef37j006w5wlkie53jzew	cmlfbaz0v00015wlk23x8oljp	Piracy refers to:	MULTIPLE_CHOICE_SINGLE	41	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:40:50.431	2026-02-09 16:40:50.431
cmlfegkf500715wlk4yg0vaev	cmlfbaz0v00015wlk23x8oljp	42.\tA remedy for infringement is:	MULTIPLE_CHOICE_SINGLE	42	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:41:59.393	2026-02-09 16:41:59.393
cmlfeifc900765wlkpp3235vc	cmlfbaz0v00015wlk23x8oljp	Accessible format copies are for:	MULTIPLE_CHOICE_SINGLE	43	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:43:26.121	2026-02-09 16:43:26.121
cmlfejo7n007b5wlk7v4l8430	cmlfbaz0v00015wlk23x8oljp	Accessible-format exception is under:	MULTIPLE_CHOICE_SINGLE	44	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:44:24.275	2026-02-09 16:44:24.275
cmlfeqyf2007g5wlkdsi0e95f	cmlfbaz0v00015wlk23x8oljp	Section 26 is inspired by the:	MULTIPLE_CHOICE_SINGLE	45	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:50:04.094	2026-02-09 16:50:04.094
cmlfesyj9007l5wlk8pusvxen	cmlfbaz0v00015wlk23x8oljp	Service-provider liability concerns:	MULTIPLE_CHOICE_SINGLE	46	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:51:37.557	2026-02-09 16:51:37.557
cmlff0wyn007q5wlkpo1toqco	cmlfbaz0v00015wlk23x8oljp	Economic rights may be waived by:	MULTIPLE_CHOICE_SINGLE	47	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:57:48.767	2026-02-09 16:57:48.767
cmlff34nw007v5wlkl3qg3frp	cmlfbaz0v00015wlk23x8oljp	Copyright levy is meant to:	MULTIPLE_CHOICE_SINGLE	48	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 16:59:32.06	2026-02-09 16:59:32.06
cmlff478500805wlk5zfqizp8	cmlfbaz0v00015wlk23x8oljp	Foreign works are protected in Nigeria by:	MULTIPLE_CHOICE_SINGLE	49	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 17:00:22.037	2026-02-09 17:00:22.037
cmlff69xr00855wlkfey7r3jp	cmlfbaz0v00015wlk23x8oljp	Jurisdiction over copyright lies with the:	MULTIPLE_CHOICE_SINGLE	50	1	t	\N	\N	\N	\N	\N	f	f	\N	\N	\N	\N	\N	\N	MEDIUM	2026-02-09 17:01:58.863	2026-02-09 17:01:58.863
\.


--
-- Data for Name: AssessmentResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentResponse" (id, attempt_id, question_id, student_id, text_answer, numeric_answer, date_answer, selected_options, file_urls, is_correct, points_earned, max_points, time_spent, feedback, is_graded, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssessmentSubmission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssessmentSubmission" (id, assessment_id, student_id, school_id, academic_session_id, submission_type, content, attachment_url, attachment_type, status, submitted_at, late_submission, word_count, file_size, total_score, max_score, percentage, passed, is_graded, graded_at, graded_by, feedback, grade_letter, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Assignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Assignment" (id, title, description, "createdAt", "updatedAt", topic_id, "order", academic_session_id, allow_late_submission, assignment_type, attachment_type, attachment_url, auto_grade, created_by, difficulty_level, due_date, grading_rubric_id, instructions, is_published, late_penalty, max_score, published_at, school_id, time_limit, status) FROM stdin;
\.


--
-- Data for Name: AssignmentGrade; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssignmentGrade" (id, assignment_id, submission_id, student_id, teacher_id, school_id, academic_session_id, score, max_score, percentage, letter_grade, feedback, comments, rubric_scores, status, graded_at, returned_at, grading_time, is_final, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssignmentSubmission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssignmentSubmission" (id, assignment_id, student_id, school_id, academic_session_id, content, attachment_url, attachment_type, status, submitted_at, late_submission, word_count, file_size, "createdAt", "updatedAt", "topicId") FROM stdin;
\.


--
-- Data for Name: AttendanceRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceRecord" (id, attendance_session_id, student_id, school_id, academic_session_id, class_id, status, marked_at, marked_by, reason, is_excused, excuse_note, parent_notified, parent_notified_at, created_at, updated_at) FROM stdin;
cmlao71kf004z28m1ghqhnron	cmlao71i8004y28m1ps4ux9wx	cml9ldyzy004a28m1fke1wg1r	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9lcfwo004728m1mg9lj1ec	PRESENT	2026-02-06 09:15:40.334	\N	\N	f	\N	f	\N	2026-02-06 09:15:40.335	2026-02-06 09:15:40.335
cmlao71mh005028m13mdmscgo	cmlao71i8004y28m1ps4ux9wx	cml9ldbei004828m1jrgdv0ju	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9lcfwo004728m1mg9lj1ec	ABSENT	2026-02-06 09:15:40.334	\N	\N	f	\N	f	\N	2026-02-06 09:15:40.408	2026-02-06 09:15:40.408
\.


--
-- Data for Name: AttendanceSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceSession" (id, school_id, academic_session_id, class_id, teacher_id, date, session_type, status, total_students, present_count, absent_count, late_count, excused_count, attendance_rate, notes, submitted_at, approved_at, approved_by, created_at, updated_at) FROM stdin;
cmlao71i8004y28m1ps4ux9wx	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9lcfwo004728m1mg9lj1ec	cml9al6fq000r28kcfucmmaev	2025-12-01 00:00:00	DAILY	SUBMITTED	2	1	1	0	0	50	\N	2026-02-06 09:15:40.249	\N	\N	2026-02-06 09:15:40.256	2026-02-06 09:15:40.474
\.


--
-- Data for Name: AttendanceSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceSettings" (id, school_id, academic_session_id, late_threshold_minutes, auto_mark_absent_minutes, require_excuse_note, parent_notification_enabled, attendance_tracking_enabled, minimum_attendance_rate, max_consecutive_absences, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: AttendanceSummary; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceSummary" (id, school_id, academic_session_id, class_id, student_id, period_type, period_start, period_end, total_days, present_days, absent_days, late_days, excused_days, attendance_rate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, audit_for_type, target_id, performed_by_id, performed_by_type, metadata, "createdAt") FROM stdin;
cmlf8n4vj000727h1l16capmy	onboard_school	cmlf8n44o000327h1w5mi08k0	cml68167p0002wxvlxc5psjph	library_user	\N	2026-02-09 13:59:08.143
cmlf8qif7000927h1tkf9h4pn	onboard_classes	cmlf8n44o000327h1w5mi08k0	cml68167p0002wxvlxc5psjph	library_user	\N	2026-02-09 14:01:45.667
cmlfahlwo000129kiljztjj01	create_subject	cmlf8n44o000327h1w5mi08k0	\N	school_user	{"subjectId": "cmlfahlur000029kijsemr8nu"}	2026-02-09 14:50:49.512
cmlfask0200005wlk4vocphrr	update_subject	cmlf8n44o000327h1w5mi08k0	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfahlur000029kijsemr8nu"}	2026-02-09 14:59:20.258
cmlfbp5sv000y5wlk2l9v0iz4	onboard_school	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-09 15:24:41.503
cmlfdfq55004h5wlkouwgf33l	onboard_classes	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-09 16:13:20.537
cmlfdivgl004o5wlktnb38bwe	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdivgf004n5wlkitkwaabl"}	2026-02-09 16:15:47.397
cmlfdk5ax004v5wlksv1jlo65	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdk5ar004u5wlkl2p16obc"}	2026-02-09 16:16:46.809
cmlfdkhq600525wlk3oh6pp4b	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdkhq100515wlk2g2p2b9i"}	2026-02-09 16:17:02.91
cmlfdkw2400545wlk9udo5fdy	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdkw1z00535wlkv5m3v9dy"}	2026-02-09 16:17:21.484
cmlfdl7sq00565wlk72f5ihdo	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdl7sl00555wlkdtv40t3y"}	2026-02-09 16:17:36.698
cmlfdlmpv00585wlkx977fhjs	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdlmpn00575wlkxg9f1j22"}	2026-02-09 16:17:56.035
cmlfdlyc7005a5wlkbpv440xb	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdlyc200595wlkmh0vb47s"}	2026-02-09 16:18:11.095
cmlfdm7ij005c5wlkwuvwm9wn	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdm7if005b5wlkg430ps8v"}	2026-02-09 16:18:22.987
cmlfdmzfm005e5wlk2ky0hnu8	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdmzff005d5wlkm1xi02or"}	2026-02-09 16:18:59.17
cmlfdnb8p005g5wlkc1f0suld	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdnb8k005f5wlkyev3dd91"}	2026-02-09 16:19:14.473
cmlfdnii6005i5wlkgqrrs5a2	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdnii2005h5wlkeko9dqfm"}	2026-02-09 16:19:23.886
cmlgk7o7c008c5wlkvu0iejaq	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:10:48.264
cmlgk9wh5008h5wlkqbs7abzv	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:12:32.297
cmlgl50vh008s5wlkowull9vn	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:36:44.333
cmlgl9dsb008v5wlk48yi0fcr	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:40:07.691
cmlglaavi008y5wlkqx9p6mcc	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:40:50.574
cmlglb3f000915wlk30ftelcp	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:41:27.564
cmlglcmav00945wlkkqaau7n7	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:42:38.695
cmlgldmgc00975wlkiwo2oh75	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:43:25.548
cmlglf99i009a5wlkk02qpvjk	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:44:41.763
cmlgll5ye009d5wlkgcoj8p17	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:49:17.414
cmlglm2yh009g5wlkb79hp74f	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:50:00.185
cmlglogfx009j5wlkhliwlwhx	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:51:50.973
cmlglpwgs009m5wlkd532iidy	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:52:58.396
cmlglqqp6009p5wlkeex78ukt	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:53:37.578
cmlglruqm009s5wlk0dh3a01k	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:54:29.47
cmlglsgwb009v5wlkzaful4ec	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:54:58.187
cmlglt689009y5wlkgv500b34	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:55:31.017
cmlgltzoq00a15wlk7cxo82dd	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:56:09.194
cmlglvghg00a45wlkh0y8qknc	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:57:17.62
cmlglw0iw00a75wlkphjntx98	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:57:43.592
cmlglwu1w00aa5wlk07itzyjm	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:58:21.86
cmlglxcyg00ad5wlkhreoa7o5	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 12:58:46.36
cmlgmfa2q00ag5wlkacvwxb8f	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 13:12:42.434
cmlgn362u00aj5wlkmszcp40f	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 13:31:16.998
cmlgnf0g400am5wlkl6nv88ny	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 13:40:29.572
cmlgpeijv00ap5wlkldeq22q7	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 14:36:05.611
cmlgq2ct000ar5wlkvqwr9lo3	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlgq2css00aq5wlk80vb7s75"}	2026-02-10 14:54:37.908
cmlgq7vuh00as5wlk08rsnssr	update_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlgq2css00aq5wlk80vb7s75"}	2026-02-10 14:58:55.865
cmlgqwqcc00at5wlkmeus2j6m	update_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlgq2css00aq5wlk80vb7s75"}	2026-02-10 15:18:15.132
cmlgs89hp00aw5wlkqudgd6bl	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:55:12.781
cmlgsag2e00az5wlkicn0ta3r	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:56:54.614
cmlgsb94n00b25wlkyoa9632e	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:57:32.279
cmlgsbyoj00b55wlkfhf9zg6m	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:58:05.395
cmlgsd0fi00b85wlk2uwklo8w	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:58:54.318
cmlgsdv5x00bb5wlknsez1qh2	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 15:59:34.149
cmlgwqddt00bc5wlkjfds1o92	update_subject	cmlf8n44o000327h1w5mi08k0	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfahlur000029kijsemr8nu"}	2026-02-10 18:01:16.097
cmlh2vg0n00bf5wlk1ei0amcm	onboard_teachers	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-10 20:53:10.487
cmlhqm5l400bi5wlkcxr9gxm4	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 07:57:47.848
cmlhrvo0100bl5wlkx9w5lusb	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 08:33:11.233
cmlhrwdic00bo5wlkruyk4um4	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 08:33:44.292
cmlhs8hbd00br5wlk5guj4iun	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 08:43:09.096
cmlhslb6v00bu5wlklyomvov1	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 08:53:07.687
cmlhsqm2500bx5wlkwseen4tc	onboard_students	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	\N	2026-02-11 08:57:15.053
cmlht53ci00by5wlk99p4b7tc	update_subject	cmlf8n44o000327h1w5mi08k0	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfahlur000029kijsemr8nu"}	2026-02-11 09:08:30.642
cmlhtkhry00c05wlkladupr8n	update_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlgq2css00aq5wlk80vb7s75"}	2026-02-11 09:20:29.182
cmlhtl3kp00c15wlk3jg7189j	update_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlfdmzff005d5wlkm1xi02or"}	2026-02-11 09:20:57.433
cmlhtlhio00c25wlk9x7yxro2	update_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlgq2css00aq5wlk80vb7s75"}	2026-02-11 09:21:15.504
cmlhtlr9t00c55wlk99bwiwgq	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhtlr5o00c35wlkd99gqzpr"}	2026-02-11 09:21:28.145
cmlhufp8900c85wlkvzjas7lc	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhufp4e00c65wlk5s3v5ffh"}	2026-02-11 09:44:45.177
cmlhug8ke00cb5wlk4545zxfj	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhug8gi00c95wlk9xeexr6c"}	2026-02-11 09:45:10.238
cmlhuw0w100ce5wlkrfpv7ntf	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhuw0r800cc5wlk5yqxuo6s"}	2026-02-11 09:57:26.785
cmlhuwvyv00ch5wlk7ew5odv0	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhuwvv500cf5wlk3dvzsdym"}	2026-02-11 09:58:07.063
cmlhuxi1700ck5wlkja39wzql	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhuxhxs00ci5wlksxk4olic"}	2026-02-11 09:58:35.659
cmlhuzemf00cn5wlkpom8qqxq	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhuzegy00cl5wlkozx3dsu6"}	2026-02-11 10:00:04.551
cmlhuzwmb00cq5wlkyvef63q9	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhuzwj100co5wlkc5zinshh"}	2026-02-11 10:00:27.875
cmlhv0ea400cs5wlk3uoz0jzj	create_subject	cmlfbp5cw000u5wlkfgpcgols	cml81ghr900002ekutwitq9q0	library_user	{"subjectId": "cmlhv0e9w00cr5wlkexvjljdo"}	2026-02-11 10:00:50.764
\.


--
-- Data for Name: ChatAnalytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatAnalytics" (id, school_id, material_id, user_id, total_conversations, total_messages, total_tokens_used, average_response_time_ms, average_relevance_score, most_used_chunks, popular_questions, date, daily_usage, weekly_usage, monthly_usage, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChatContext; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatContext" (id, conversation_id, message_id, chunk_id, school_id, relevance_score, context_type, position_in_context, "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatConversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatConversation" (id, user_id, school_id, material_id, title, status, system_prompt, context_summary, total_messages, last_activity, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChatMessage" (id, conversation_id, user_id, school_id, material_id, role, content, message_type, model_used, tokens_used, response_time_ms, context_chunks, context_summary, is_edited, edited_at, parent_message_id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Class; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Class" (id, "classId", name, "schoolId", academic_session_id, "classTeacherId", "createdAt", "updatedAt") FROM stdin;
cml82jxo700082ekuhkwqk82m	2	Jss1	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aso81001228kccdrmmg2b	2026-02-04 13:34:17.853	2026-02-05 10:17:03.628
cml99r289000j28kc9tsths0d	4	Primary 1	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aso81001228kccdrmmg2b	2026-02-05 09:43:33.84	2026-02-05 10:18:59.351
cml82jowa00072ekubwusc3km	1	Primary 2	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aso81001228kccdrmmg2b	2026-02-04 13:34:06.478	2026-02-05 10:19:28.316
cml99t7hq000k28kcwnknibvb	5	Primary 3	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aq9cr000y28kcet6rnkqi	2026-02-05 09:45:13.973	2026-02-05 10:19:59.645
cml9a2v9v000l28kccfa2k8uz	6	Primary 4	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aq9cr000y28kcet6rnkqi	2026-02-05 09:52:44.696	2026-02-05 10:20:12.001
cml9axhbr001328kc5fb495i8	10	Primary 5	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9arj15001028kc8lr9zu7q	2026-02-05 10:16:32.957	2026-02-05 10:20:46.817
cml9a4kuk000m28kcva1xx8f4	7	Primary 6	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9arj15001028kc8lr9zu7q	2026-02-05 09:54:04.499	2026-02-05 10:20:55.129
cml82k4rr00092ekuibuz50h6	3	Ss3	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9an6vj000u28kcs7627fbp	2026-02-04 13:34:27.052	2026-02-05 10:21:08.827
cml9a596b000o28kck9fs0onq	9	Ss 1	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ap7pn000w28kc3087zbt3	2026-02-05 09:54:36.025	2026-02-05 10:21:26.011
cml9a4y6o000n28kcon9x6krm	8	Jss3	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ap7pn000w28kc3087zbt3	2026-02-05 09:54:21.782	2026-02-05 10:22:50.773
cml9lcfwo004728m1mg9lj1ec	11	Jss2	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9al6fq000r28kcfucmmaev	2026-02-05 15:08:07.118	2026-02-05 15:08:07.118
cmlan0i8j004r28m1gt0pqv8j	12	SS2	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aso81001228kccdrmmg2b	2026-02-06 08:42:35.675	2026-02-06 08:42:35.675
cmlf8qia2000827h1oqg9jkwf	13	kg1	cmlf8n44o000327h1w5mi08k0	cmlf8n4fq000527h17yo3y41k	\N	2026-02-09 14:01:45.425	2026-02-09 14:01:45.425
cmlf8vgxb000a27h1w73jnah3	14	General	cmlf8n44o000327h1w5mi08k0	cmlf8n4fq000527h17yo3y41k	\N	2026-02-09 14:05:36.95	2026-02-09 14:05:36.95
cmlfdfq4h00465wlk6halc39e	15	primary2	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h00475wlksyueaoyj	16	primary3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h00485wlk04up8u4s	17	primary4	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h00495wlkm5cpzr86	18	primary5	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004a5wlkxwws4n42	19	primary6	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004b5wlksarcbzia	20	jss1	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004c5wlkpjgkawx0	21	jss2	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004d5wlki5dhhqxg	22	jss3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004e5wlktau56fmo	23	ss1	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004f5wlkzi4kl3rh	24	ss2	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
cmlfdfq4h004g5wlkfgwox3t6	25	ss3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	\N	2026-02-09 16:13:20.511	2026-02-09 16:13:20.511
\.


--
-- Data for Name: Developer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Developer" (id, name, email, password, role, note, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DeviceToken; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeviceToken" (id, token, "deviceType", user_id, school_id, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, secure_url, public_id) FROM stdin;
cmlf8n3zs000027h15uiez5uy	https://smart-edu-s3-staging.s3.us-east-1.amazonaws.com/schools/nigerian_copyright_commission/onboarding/tax_clearance/tax_clearance_1770645545399.pdf	schools/nigerian_copyright_commission/onboarding/tax_clearance/tax_clearance_1770645545399.pdf
cmlf8n41h000127h11l2tmz3s	https://smart-edu-s3-staging.s3.us-east-1.amazonaws.com/schools/nigerian_copyright_commission/onboarding/utility_bill/utility_bill_1770645545399.pdf	schools/nigerian_copyright_commission/onboarding/utility_bill/utility_bill_1770645545399.pdf
cmlf8n433000227h12lti507m	https://smart-edu-s3-staging.s3.us-east-1.amazonaws.com/schools/nigerian_copyright_commission/onboarding/cac/cac_1770645545395.pdf	schools/nigerian_copyright_commission/onboarding/cac/cac_1770645545395.pdf
cmlfbp5ci000r5wlk1u4bdssd	https://smart-edu-s3-prod.s3.us-east-1.amazonaws.com/schools/great_excellence_school/onboarding/tax_clearance/tax_clearance_1770650679689.pdf	schools/great_excellence_school/onboarding/tax_clearance/tax_clearance_1770650679689.pdf
cmlfbp5cn000s5wlkjkgbi9br	https://smart-edu-s3-prod.s3.us-east-1.amazonaws.com/schools/great_excellence_school/onboarding/utility_bill/utility_bill_1770650679688.pdf	schools/great_excellence_school/onboarding/utility_bill/utility_bill_1770650679688.pdf
cmlfbp5cq000t5wlk4z0u9mlg	https://smart-edu-s3-prod.s3.us-east-1.amazonaws.com/schools/great_excellence_school/onboarding/cac/cac_1770650679684.pdf	schools/great_excellence_school/onboarding/cac/cac_1770650679684.pdf
\.


--
-- Data for Name: DocumentChunk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DocumentChunk" (id, material_processing_id, material_id, school_id, content, chunk_type, page_number, section_title, embedding, embedding_model, token_count, word_count, order_index, keywords, summary, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBody; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBody" (id, name, "fullName", code, description, "logoUrl", "websiteUrl", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessment" (id, "examBodyId", "subjectId", "yearId", title, description, instructions, "assessmentType", duration, "totalPoints", "passingScore", "maxAttempts", "allowReview", "shuffleQuestions", "shuffleOptions", "showCorrectAnswers", "showFeedback", "showExplanation", status, "isPublished", "publishedAt", "createdAt", "updatedAt", "platformId") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessmentAttempt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessmentAttempt" (id, "assessmentId", "userId", "attemptNumber", status, "startedAt", "submittedAt", "timeSpent", "totalScore", "maxScore", percentage, passed, "isGraded", "gradedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessmentCorrectAnswer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessmentCorrectAnswer" (id, "questionId", "answerText", "answerNumber", "answerDate", "optionIds", "answerJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessmentOption; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessmentOption" (id, "questionId", "optionText", "order", "isCorrect", "imageUrl", "audioUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessmentQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessmentQuestion" (id, "assessmentId", "questionText", "questionType", "imageUrl", "audioUrl", "videoUrl", points, "order", "isRequired", explanation, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyAssessmentResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyAssessmentResponse" (id, "attemptId", "questionId", "userId", "textAnswer", "numericAnswer", "dateAnswer", "selectedOptions", "fileUrls", "answerJson", "isCorrect", "pointsEarned", "maxPoints", feedback, "isGraded", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodySubject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodySubject" (id, "examBodyId", name, code, description, "iconUrl", "order", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExamBodyYear; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExamBodyYear" (id, "examBodyId", year, description, "startDate", "endDate", "order", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Finance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Finance" (id, school_id, total_revenue, outstanding_fee, amount_withdrawn, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GradingRubric; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GradingRubric" (id, name, description, school_id, academic_session_id, created_by, criteria, total_points, scale_type, is_template, is_active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessment" (id, "platformId", "subjectId", "topicId", "createdById", title, description, instructions, "assessmentType", "gradingType", status, duration, "timeLimit", "startDate", "endDate", "maxAttempts", "allowReview", "autoSubmit", "totalPoints", "passingScore", "showCorrectAnswers", "showFeedback", "studentCanViewGrading", "shuffleQuestions", "shuffleOptions", "isPublished", "publishedAt", "isResultReleased", "resultReleasedAt", tags, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentAnalytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentAnalytics" (id, "assessmentId", "totalAttempts", "totalUsers", "averageScore", "averageTime", "passRate", "questionStats", "dailyAttempts", "hourlyAttempts", "completionRate", "abandonmentRate", "lastUpdated", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentAttempt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentAttempt" (id, "assessmentId", "userId", "attemptNumber", status, "startedAt", "submittedAt", "timeSpent", "totalScore", "maxScore", percentage, passed, "isGraded", "gradedAt", "gradedBy", "overallFeedback", "gradeLetter", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentCorrectAnswer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentCorrectAnswer" (id, "questionId", "answerText", "answerNumber", "answerDate", "optionIds", "answerJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentOption; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentOption" (id, "questionId", "optionText", "order", "isCorrect", "imageUrl", "audioUrl", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentQuestion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentQuestion" (id, "assessmentId", "questionText", "questionType", "order", points, "isRequired", "timeLimit", "imageUrl", "imageS3Key", "audioUrl", "videoUrl", "allowMultipleAttempts", "showHint", "hintText", "minLength", "maxLength", "minValue", "maxValue", explanation, "difficultyLevel", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssessmentResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssessmentResponse" (id, "attemptId", "questionId", "userId", "textAnswer", "numericAnswer", "dateAnswer", "selectedOptions", "fileUrls", "isCorrect", "pointsEarned", "maxPoints", "timeSpent", feedback, "isGraded", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryAssignment" (id, "platformId", "subjectId", "topicId", "uploadedById", title, description, "assignmentType", instructions, "attachmentUrl", "attachmentS3Key", "dueDate", "maxScore", "allowLateSubmission", "latePenalty", status, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryClass; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryClass" (id, name, "order", "createdAt", "updatedAt") FROM stdin;
cml68teik0000u5vle00rmqxi	KG-1	1	2026-02-03 06:54:04.987	2026-02-03 06:54:04.987
cml68tjyx0001u5vlnh6hrq99	KG-2	2	2026-02-03 06:54:12.057	2026-02-03 06:54:12.057
cml68tvqv0002u5vlce4cts52	Pry-1	3	2026-02-03 06:54:27.319	2026-02-03 06:54:27.319
cml68tzq50003u5vlixeua8n5	Pry-2	4	2026-02-03 06:54:32.477	2026-02-03 06:54:32.477
cml68u3qv0004u5vlu62wizjo	Pry-3	5	2026-02-03 06:54:37.687	2026-02-03 06:54:37.687
cml68u7gi0005u5vlsmxjoqmq	Pry-4	6	2026-02-03 06:54:42.498	2026-02-03 06:54:42.498
cml68ubpt0006u5vl1q6eanq1	Pry-5	7	2026-02-03 06:54:48.017	2026-02-03 06:54:48.017
cml68uhpa0007u5vlx4eia2fo	Pry-6	8	2026-02-03 06:54:55.774	2026-02-03 06:54:55.774
cml68up6a0008u5vl40nuhzax	JSS-1	9	2026-02-03 06:55:05.457	2026-02-03 06:55:05.457
cml68utzu0009u5vl3ro1gwkr	JSS-2	10	2026-02-03 06:55:11.706	2026-02-03 06:55:11.706
cml68uxwo000au5vlsb68c5si	JSS-3	11	2026-02-03 06:55:16.776	2026-02-03 06:55:16.776
cml68v45h000bu5vlxo5n44o9	SS-1	12	2026-02-03 06:55:24.869	2026-02-03 06:55:24.869
cml68v92g000cu5vl0pucczbz	SS-2	13	2026-02-03 06:55:31.24	2026-02-03 06:55:31.24
cml68vduz000du5vl79qd0te2	SS-3	14	2026-02-03 06:55:37.451	2026-02-03 06:55:37.451
\.


--
-- Data for Name: LibraryComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryComment" (id, "platformId", "subjectId", "topicId", "commentedById", "userId", content, "parentCommentId", "isEdited", "editedAt", "isDeleted", "deletedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterial; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterial" (id, "platformId", "uploadedById", title, description, author, isbn, publisher, "materialType", url, "s3Key", "sizeBytes", "pageCount", "thumbnailUrl", "thumbnailS3Key", price, currency, "isFree", "isAvailable", "subjectId", "isAiEnabled", "processingStatus", status, "order", views, downloads, "salesCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChapter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChapter" (id, "materialId", "platformId", title, description, "pageStart", "pageEnd", "order", "isAiEnabled", "isProcessed", "chunkCount", "createdAt", "updatedAt", "chapterStatus") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChapterFile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChapterFile" (id, "chapterId", "platformId", "uploadedById", "fileName", "fileType", url, "s3Key", "sizeBytes", "pageCount", title, description, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChatContext; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChatContext" (id, "conversationId", "chunkId", "materialId", "relevanceScore", "createdAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChatConversation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChatConversation" (id, "userId", "materialId", "platformId", title, status, "systemPrompt", "contextSummary", "totalMessages", "lastActivity", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChatMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChatMessage" (id, "conversationId", "materialId", "userId", role, content, "tokensUsed", model, "referencedChunks", "createdAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialChunk; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialChunk" (id, "materialId", "chapterId", "processingId", "platformId", content, "chunkType", "pageNumber", "sectionTitle", embedding, "embeddingModel", "tokenCount", "wordCount", "orderIndex", keywords, summary, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialClass; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialClass" (id, "materialId", "classId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialProcessing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialProcessing" (id, "materialId", "platformId", status, "totalChunks", "processedChunks", "failedChunks", "processingStartedAt", "processingCompletedAt", "errorMessage", "retryCount", "vectorDatabaseId", "embeddingModel", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryGeneralMaterialPurchase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryGeneralMaterialPurchase" (id, "materialId", "userId", "platformId", price, currency, "paymentMethod", "transactionId", status, "purchasedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryLink; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryLink" (id, "platformId", "subjectId", "topicId", "uploadedById", title, description, url, "linkType", "thumbnailUrl", domain, status, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryMaterial; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryMaterial" (id, "platformId", "subjectId", "topicId", "uploadedById", title, description, "materialType", url, "s3Key", "sizeBytes", "pageCount", status, "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryPermissionDefinition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryPermissionDefinition" (id, code, name, description, "createdAt", "updatedAt") FROM stdin;
cml68lta60003wxvlkfjmm8yk	manage_library_users	Manage All Users	To be able to manage all users under a library	2026-02-03 06:48:10.878	2026-02-03 06:48:10.878
\.


--
-- Data for Name: LibraryPlatform; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryPlatform" (id, name, slug, description, status, "createdAt", "updatedAt") FROM stdin;
cml680odd0000wxvlzumocems	Smart Edu Hub	Smart Edu Hub's-global-library	Official Smart Edu Hub's public content library for West Africa.	active	2026-02-03 06:31:44.737	2026-02-03 06:31:44.737
\.


--
-- Data for Name: LibraryResource; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryResource" (id, title, description, "resourceType", url, "schoolId", "platformId", "uploadedById", "createdAt", "updatedAt", topic_id, format, status, "order") FROM stdin;
\.


--
-- Data for Name: LibraryResourceAccess; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryResourceAccess" (id, "platformId", "schoolId", "subjectId", "topicId", "videoId", "materialId", "assessmentId", "resourceType", "accessLevel", "grantedById", "grantedAt", "expiresAt", "isActive", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryResourceUser; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryResourceUser" (id, "platformId", email, password, first_name, last_name, phone_number, role, "userType", status, "createdAt", "updatedAt", "permissionLevel", permissions) FROM stdin;
cml680ojy0001wxvlxcr56e7j	cml680odd0000wxvlzumocems	hello@smart-edu-hub.com	$argon2id$v=19$m=65536,t=3,p=4$e0aQ2uy70lyu8THrSebyjQ$oopCq+M+qv2xyP36D6PtVRnbZLwVJIBlHTeA+V8Jcy4	Smart Edu Hub	Owner	\N	admin	libraryresourceowner	active	2026-02-03 06:31:44.973	2026-02-03 06:31:44.973	\N	{}
cml81ghr900002ekutwitq9q0	cml680odd0000wxvlzumocems	gbenga.ige@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$uUoXwG2xJ9PioDRO6tgQHw$g5whYMjaRK1aXXczTr4+VuNSgenLLjc/1e3ENQ2DzHI	Ige	oluwagbenga	07033625503	admin	libraryresourceowner	active	2026-02-04 13:03:37.701	2026-02-04 13:14:59.011	10	{manage_library_users}
cml826euw00062eku93klpb8w	cml680odd0000wxvlzumocems	dapo.adebayo@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$3aDrzN0utXaFefJdnRJ2yA$+Qs1hWGGDqsg+d38SPS2swkzbMcuDGUQtNHI0XWBLvM	Mr	Dapo	\N	admin	libraryresourceowner	active	2026-02-04 13:23:47	2026-02-04 13:23:47	10	{manage_library_users}
cml8225gl00012ekur9gsjsz8	cml680odd0000wxvlzumocems	deborah.akinruli@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$LwbB6tlyqCGZHUAcDmTbzw$vlwh9djZMOoFWqoS3VH+O22x7e9cWec1WrsMsXNl0SQ	Deborah	Akinruli	\N	admin	libraryresourceowner	active	2026-02-04 13:20:28.197	2026-02-04 14:21:16.945	10	{}
cml825kaq00052ekuzhqt94df	cml680odd0000wxvlzumocems	solomon.alade@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$Vxy5MaMDFvDwRsGx3h6a9w$OeoRIwLMr3bA3RWmMo4Zz0ifxlZprDxSYuhleaRS+tc	Seyi	Alade	\N	admin	libraryresourceowner	active	2026-02-04 13:23:07.394	2026-02-04 14:19:34.46	10	{}
cml824gst00042eku0s7ctije	cml680odd0000wxvlzumocems	itunu.towoju@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$Ke8FX48LQAYE5KrloJmb3Q$Cp4U41HlTbiXo+oBH51RZaJRlHe/AEFgWiNuv0G31mk	Towoju	Itunuoluwa	\N	content_creator	libraryresourceowner	active	2026-02-04 13:22:16.205	2026-02-04 14:15:00.658	10	{}
cml823jmd00032eku83eugfuy	cml680odd0000wxvlzumocems	sharon.kolawole@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$S/uNUV8xsgvP62159ulTtw$OaruV3e2WDqk7wxd0q8ELKnfui6n+CEUTeV3u8ff3Ho	Sharon	Kolawole	\N	content_creator	libraryresourceowner	active	2026-02-04 13:21:33.205	2026-02-04 13:21:33.205	10	{}
cml822vp600022ekum1h3wzws	cml680odd0000wxvlzumocems	basma.arikalamu@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$j1hockX6mGI2I5UxkkVD1A$qmOKDvROswxAmm6KHBqjD/sJW+EwaS2f1SYz6YeGCc4	Basma	Arikalamu	\N	content_creator	libraryresourceowner	active	2026-02-04 13:21:02.202	2026-02-04 13:21:02.202	10	{}
cml80fq86000026j5wjvgkbsx	cml680odd0000wxvlzumocems	demruthesther99@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$83f/tX5RUQ4A2YdrMonjBQ$frnMKBsGWOGBmxLVSqlabSYvFeVQe1jiWt2hX/+foNc	Esther	Bangboje	\N	content_creator	libraryresourceowner	active	2026-02-04 12:35:02.406	2026-02-04 12:35:02.406	10	{manage_library_users}
cml68167p0002wxvlxc5psjph	cml680odd0000wxvlzumocems	maximus@smart-edu-hub.com	$argon2id$v=19$m=65536,t=3,p=4$XWthvuhg9nDvCIscq1hjsQ$RdG5JXaLzeL4R9kfEODUy0UNv77aCsmXHIGm8feu0Wc	Mayowa	Oluwaremi	+2348146694787	admin	libraryresourceowner	active	2026-02-03 06:32:07.861	2026-02-03 06:50:48.216	\N	{manage_library_users}
\.


--
-- Data for Name: LibrarySubject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibrarySubject" (id, "platformId", "classId", name, code, color, description, "thumbnailUrl", "thumbnailKey", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryTopic; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryTopic" (id, "platformId", "subjectId", title, description, "order", is_active, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LibraryVideoLesson; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryVideoLesson" (id, "platformId", "subjectId", "topicId", "uploadedById", title, description, "videoUrl", "videoS3Key", "thumbnailUrl", "thumbnailS3Key", "durationSeconds", "sizeBytes", views, status, "order", "createdAt", "updatedAt", "hlsPlaybackUrl", "hlsS3Prefix", "hlsStatus") FROM stdin;
\.


--
-- Data for Name: LibraryVideoView; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryVideoView" (id, "videoId", "userId", "libraryResourceUserId", "viewedAt") FROM stdin;
\.


--
-- Data for Name: LibraryVideoWatchHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LibraryVideoWatchHistory" (id, "videoId", "userId", "libraryResourceUserId", "schoolId", "classId", "userRole", "watchedAt", "watchDurationSeconds", "videoDurationSeconds", "completionPercentage", "isCompleted", "lastWatchPosition", "watchCount", "deviceType", platform, "userAgent", "ipAddress", "referrerSource", "referrerUrl", "videoQuality", "bufferingEvents", "playbackSpeed", "sessionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LiveClass; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LiveClass" (id, title, description, "meetingUrl", "startTime", "endTime", "schoolId", "platformId", "createdById", "createdAt", "updatedAt", topic_id, "maxParticipants", status, "order") FROM stdin;
\.


--
-- Data for Name: MaterialProcessing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MaterialProcessing" (id, material_id, school_id, status, total_chunks, processed_chunks, failed_chunks, processing_started_at, processing_completed_at, error_message, retry_count, vector_database_id, embedding_model, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, school_id, academic_session_id, title, description, type, "comingUpOn", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Organisation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Organisation" (id, name, email, "createdAt", "updatedAt") FROM stdin;
cml9ez5id001v28m1pgullr9h	AWS S3	s3@smart-edu.com	2026-02-05 12:09:49.363	2026-02-05 12:09:49.363
\.


--
-- Data for Name: PDFMaterial; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PDFMaterial" (id, title, description, url, "schoolId", "platformId", "uploadedById", "createdAt", "updatedAt", topic_id, downloads, size, status, "order", "fileType", "originalName", "materialId") FROM stdin;
cml9ez5r2001w28m1398btm26	introduction to numbers	this pdf helps pupils practice counting and understanding numbers using pictures and activities. instruction: read the pdf and complete the activities.	https://smart-edu-s3-staging.s3.amazonaws.com/Introduction_to_Numbers_1770293388016.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9al62d000q28kcq0i6bdw4	2026-02-05 12:09:49.733	2026-02-05 12:09:49.733	cml9bj2e0001428kcikjdvhhe	0	11.17 MB	published	1	pdf	Introduction to Numbers.pdf	6e977069-3beb-4abc-8ba9-2ed19e60d8b9
cml9oew7f004e28m1t7w6w7f1	living things	this pdf contains simple notes and pictures on living things. it explains what living things are, their characteristics, and examples of living and non-living things to help pupils understand the topic easily.	https://smart-edu-s3-staging.s3.amazonaws.com/Living_Things_1770309238494.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9aq8zt000x28kc6b6tji59	2026-02-05 16:34:00.399	2026-02-05 16:34:00.399	cml9oa77h004c28m1kxx2ry66	0	15.38 MB	published	1	pdf	Living Things.pdf	dc969cc7-24f9-4808-949a-716cb36efb2a
cmlajhj8w004g28m1g2n7q0eq	figure of speech	figures of speech are special ways of using words to make language more interesting, vivid, and expressive. writers, poets, speakers, and even everyday speakers use figures of speech to compare ideas, emphasize meaning, and create strong mental pictures.	https://smart-edu-s3-staging.s3.amazonaws.com/Figure_of_Speech_1770361428668.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 07:03:51.67	2026-02-06 07:03:51.67	cml9oas88004d28m1yf6aarjo	0	23.39 MB	published	1	pdf	History PDF.pdf	9fb645c7-8c67-4aee-9033-3eee390da8c6
cmlajn4yk004h28m130zd7tek	figure of speech	figures of speech are special ways of using words to make language more interesting, vivid, and expressive. writers, poets, speakers, and even everyday speakers use figures of speech to compare ideas, emphasize meaning, and create strong mental pictures.	https://smart-edu-s3-staging.s3.amazonaws.com/Figure_of_Speech_1770361690569.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 07:08:13.091	2026-02-06 07:08:13.091	cml9oas88004d28m1yf6aarjo	0	23.39 MB	published	2	pdf	Figure of Speech PDF.pdf	d10dbad6-cefa-459e-91ff-cff71ccfaba1
cmlal4zd6004m28m1hd63ftps	history	this text outlines the historical progression of nigeria, starting with its diverse indigenous kingdoms and decentralized societies prior to european contact. it examines how early european trade relations eventually transitioned into british colonial dominance, highlighted by the pivotal 1914 amalgamation of the northern and southern protectorates.	https://smart-edu-s3-staging.s3.amazonaws.com/History_1770364202290.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 07:50:05.266	2026-02-06 07:50:05.266	cmlak0z9x004i28m1fr25v3qd	0	22.7 MB	published	1	pdf	History PDF (1).pdf	49e80a52-9871-4268-a39c-ef9dfcf9697d
cmlalwumw004q28m1fyct2b4t	national value education	the provided text outlines the fundamental principles of nigerian citizenship, emphasizing how shared standards of behavior foster a strong and unified nation. it defines national values as the ethical benchmarks that guide interpersonal relationships and social progress, specifically highlighting honesty, discipline, and respect for others.	https://smart-edu-s3-staging.s3.amazonaws.com/National_Value_Education_1770365503862.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 08:11:45.503	2026-02-06 08:11:45.503	cmlal8p5e004o28m1dqnh4ksl	0	18.52 MB	published	1	pdf	NAtional Value PDF.pdf	023faf39-f999-4ec3-82c5-302706a98a89
cmlaq5uh7005628m1wtru4525	acid	this educational resource provides a comprehensive introduction to acidic substances tailored for high school chemistry students. it begins by defining an acid as a compound that generates hydrogen ions in aqueous solutions and details their distinct physical and chemical characteristics, such as a sour taste and low ph. the text organizes these substances into specific categories based on their molecular strength, their natural or mineral origins, and their basicity.	https://smart-edu-s3-staging.s3.amazonaws.com/Acid_1770372641805.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 10:10:43.667	2026-02-06 10:10:43.667	cmlap834o005428m15whserp8	0	17.06 MB	published	1	pdf	Chemistry DF.pdf	5970c1de-0478-4d99-9460-0dc79f4acdfe
cmlas3o6z005928m18c5eq6r8	demand and supply	\N	https://smart-edu-s3-staging.s3.amazonaws.com/Demand_and_Supply_1770375899803.pdf	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9asnv9001128kcuc4gq69x	2026-02-06 11:05:01.44	2026-02-06 11:05:01.44	cmlal7bag004n28m1z58bgyo5	0	16.97 MB	published	1	pdf	Demand and Supply.pdf	2ac054c3-75b1-4087-98e8-d5b5ecb1bcd6
\.


--
-- Data for Name: Parent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Parent" (id, school_id, user_id, parent_id, occupation, employer, address, emergency_contact, relationship, is_primary_contact, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, finance_id, academic_session_id, student_id, class_id, payment_for, amount, payment_type, transaction_type, payment_date, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PlatformSubscriptionPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlatformSubscriptionPlan" (id, school_id, name, plan_type, description, cost, currency, billing_cycle, is_active, max_allowed_teachers, max_allowed_students, max_allowed_classes, max_allowed_subjects, allowed_document_types, max_file_size_mb, max_document_uploads_per_student_per_day, max_document_uploads_per_teacher_per_day, max_storage_mb, max_files_per_month, max_daily_tokens_per_user, max_weekly_tokens_per_user, max_monthly_tokens_per_user, max_total_tokens_per_school, max_messages_per_week, max_conversations_per_user, max_chat_sessions_per_user, features, start_date, end_date, status, auto_renew, created_at, updated_at, is_template) FROM stdin;
cml80jq2p0001crvlsxg8mpk0	cml80jppv0000crvl8hh8fvb3	Free	FREE	Free plan with basic features and limited AI interactions	0	USD	MONTHLY	t	30	100	\N	\N	{pdf}	10	3	10	500	10	50000	\N	\N	\N	100	\N	\N	{"ai_chat": true, "basic_analytics": true, "limited_support": true}	2026-02-04 12:38:08.826	\N	ACTIVE	f	2026-02-04 12:38:08.832	2026-02-04 12:38:08.832	f
cmlf8n4dv000427h1i5n9ag84	cmlf8n44o000327h1w5mi08k0	Free	FREE	Free plan with basic features and limited AI interactions	0	USD	MONTHLY	t	30	100	\N	\N	{pdf}	10	3	10	500	10	50000	\N	\N	\N	100	\N	\N	{"ai_chat": true, "basic_analytics": true, "limited_support": true}	2026-02-09 13:59:07.504	\N	ACTIVE	f	2026-02-09 13:59:07.507	2026-02-09 13:59:07.507	f
cmlfbp5do000v5wlkaxuufvlp	cmlfbp5cw000u5wlkfgpcgols	Free	FREE	Free plan with basic features and limited AI interactions	0	USD	MONTHLY	t	30	100	\N	\N	{pdf}	10	3	10	500	10	50000	\N	\N	\N	100	\N	\N	{"ai_chat": true, "basic_analytics": true, "limited_support": true}	2026-02-09 15:24:40.954	\N	ACTIVE	f	2026-02-09 15:24:40.956	2026-02-09 15:24:40.956	f
\.


--
-- Data for Name: Result; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Result" (id, school_id, academic_session_id, student_id, class_id, subject_results, total_ca_score, total_exam_score, total_score, total_max_score, overall_percentage, overall_grade, class_position, total_students, released_by, released_at, is_final, released_by_school_admin, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: School; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."School" (id, school_name, school_email, school_phone, school_address, school_type, school_ownership, status, school_icon, "cacId", "utilityBillId", "taxClearanceId", "platformId", "createdAt", "updatedAt") FROM stdin;
cml80jppv0000crvl8hh8fvb3	Access Study	access-study@smart-edu-hub.com	0912323367	123, obafemi awolowo way, oke-ado, ibadan, oyo state	primary_and_secondary	private	approved	\N	\N	\N	\N	\N	2026-02-04 12:38:08.371	2026-02-04 12:39:44.607
cml83gnpb000m2ekurf0586ak	Library System	library-system@system.com	+000-000-0000	System Default	primary_and_secondary	private	approved	\N	\N	\N	\N	\N	2026-02-04 13:59:44.524	2026-02-04 13:59:44.524
cmlf8n44o000327h1w5mi08k0	nigerian copyright commission	ncc@smart-edu-hub.com	08146694787	abuja	primary_and_secondary	government	approved	{"key": "schools/nigerian_copyright_commission/onboarding/icon/school_icon_1770645546234.jpeg", "url": "https://smart-edu-s3-staging.s3.us-east-1.amazonaws.com/schools/nigerian_copyright_commission/onboarding/icon/school_icon_1770645546234.jpeg", "etag": "\\"da74d7a596aa9df851f3e57dd5f210e8\\"", "bucket": "smart-edu-s3-staging", "uploaded_at": "2026-02-09T13:59:06.933Z"}	cmlf8n433000227h12lti507m	cmlf8n41h000127h11l2tmz3s	cmlf8n3zs000027h15uiez5uy	\N	2026-02-09 13:59:06.942	2026-02-09 13:59:20.223
cmlfbp5cw000u5wlkfgpcgols	great excellence school	ombofficiall@gmail.com	07033625503	address gwhc+83h, afurugbin area, moniya rd, near ramahat, ibadan 200136, oyo	primary_and_secondary	private	approved	\N	cmlfbp5cq000t5wlk4z0u9mlg	cmlfbp5cn000s5wlkjkgbi9br	cmlfbp5ci000r5wlk1u4bdssd	\N	2026-02-09 15:24:40.911	2026-02-09 15:57:12.135
\.


--
-- Data for Name: SchoolResourceAccess; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolResourceAccess" (id, "schoolId", "libraryResourceAccessId", "userId", "roleType", "classId", "subjectId", "topicId", "videoId", "materialId", "assessmentId", "resourceType", "accessLevel", "grantedById", "grantedAt", "expiresAt", "isActive", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SchoolResourceExclusion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolResourceExclusion" (id, "schoolId", "platformId", "subjectId", "excludedById", "createdAt") FROM stdin;
\.


--
-- Data for Name: SchoolVideoView; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolVideoView" (id, "videoId", "userId", "viewedAt") FROM stdin;
cml9kc6ky003p28m1e19j9f5b	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	2026-02-05 14:39:55.474
cmlaksbd1004k28m1wf9o0x98	cmlakbvtn004j28m1bx0pl1ql	cml9ario5000z28kc88hp8g4i	2026-02-06 07:40:14.341
cmlaoqf84005228m1nkda083i	cml9idbrs003528m12d8en7qj	cml9hr9wz002r28m1u9b28mfc	2026-02-06 09:30:44.5
cmlayajeh005a28m1sdelq4yc	cmlartgsi005728m1wnkltp70	cml9asnv9001128kcuc4gq69x	2026-02-06 13:58:19.577
cmlb4jeps007n28m174lhdj1f	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	2026-02-06 16:53:11.104
\.


--
-- Data for Name: SchoolVideoWatchHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchoolVideoWatchHistory" (id, "videoId", "userId", "schoolId", "classId", "userRole", "watchedAt", "watchDurationSeconds", "videoDurationSeconds", "completionPercentage", "isCompleted", "lastWatchPosition", "watchCount", "deviceType", platform, "userAgent", "referrerSource", "referrerUrl", "videoQuality", "bufferingEvents", "playbackSpeed", "sessionId", "createdAt", "updatedAt") FROM stdin;
cml9kdbhv003q28m1njgibyhm	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 14:40:48.499	0	327	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770302393643	2026-02-05 14:40:48.499	2026-02-05 14:40:48.499
cml9kdbwe003r28m1ojhv9r26	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 14:40:49.022	0	327	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770302393643	2026-02-05 14:40:49.022	2026-02-05 14:40:49.022
cml9kdcdv003s28m1p9yfaxny	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 14:40:49.651	0	327	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770302393643	2026-02-05 14:40:49.651	2026-02-05 14:40:49.651
cml9l6iq3004328m18lujicth	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 15:03:30.891	9	327	2.8	f	9	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770303793485	2026-02-05 15:03:30.891	2026-02-05 15:03:30.891
cml9l6pzq004428m110zie3ie	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 15:03:40.31	19	327	5.8	f	19	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770303793485	2026-02-05 15:03:40.31	2026-02-05 15:03:40.31
cml9l6sr3004528m1io80cbwu	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 15:03:43.887	23	327	7	f	23	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770303793485	2026-02-05 15:03:43.887	2026-02-05 15:03:43.887
cml9l6u8d004628m14vu4kumx	cml9idbrs003528m12d8en7qj	cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-05 15:03:45.805	0	327	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770303793485	2026-02-05 15:03:45.805	2026-02-05 15:03:45.805
cmlakti0y004l28m1q6r9vhj2	cmlakbvtn004j28m1bx0pl1ql	cml9ario5000z28kc88hp8g4i	cml80jppv0000crvl8hh8fvb3	\N	teacher	2026-02-06 07:41:09.634	0	425	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770363611033	2026-02-06 07:41:09.634	2026-02-06 07:41:09.634
cmlaoqqb2005328m1kv1xawvv	cml9idbrs003528m12d8en7qj	cml9hr9wz002r28m1u9b28mfc	cml80jppv0000crvl8hh8fvb3	cml99r289000j28kc9tsths0d	student	2026-02-06 09:30:58.862	0	327	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770370243106	2026-02-06 09:30:58.862	2026-02-06 09:30:58.862
cmlayb192005b28m1zye5m1sp	cmlartgsi005728m1wnkltp70	cml9asnv9001128kcuc4gq69x	cml80jppv0000crvl8hh8fvb3	\N	teacher	2026-02-06 13:58:42.71	0	394	0	f	0	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	direct	\N	720p	0	1	session-1770386296699	2026-02-06 13:58:42.71	2026-02-06 13:58:42.71
cmlb4k8rw007o28m14r1a06dq	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:53:50.06	9	394	2.3	f	9	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:53:50.06	2026-02-06 16:53:50.06
cmlb4kg7e007p28m1v94cvjt1	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:53:59.69	19	394	4.8	f	19	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:53:59.69	2026-02-06 16:53:59.69
cmlb4knn2007q28m161ioixoz	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:09.326	29	394	7.4	f	29	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:09.326	2026-02-06 16:54:09.326
cmlb4kvll007r28m18jzikxf7	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:19.641	39	394	9.9	f	39	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:19.641	2026-02-06 16:54:19.641
cmlb4l324007s28m1zh7mrscu	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:29.308	49	394	12.4	f	49	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:29.308	2026-02-06 16:54:29.308
cmlb4lb0d007t28m1p0hy98ky	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:39.613	59	394	15	f	59	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:39.613	2026-02-06 16:54:39.613
cmlb4lkza007u28m1lyk02g5u	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:52.534	69	394	17.5	f	69	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:52.534	2026-02-06 16:54:52.534
cmlb4lqdn007v28m15rcq789v	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:54:59.531	79	394	20.1	f	79	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:54:59.531	2026-02-06 16:54:59.531
cmlb4ly72007w28m15df7c16p	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:09.662	89	394	22.6	f	89	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:09.662	2026-02-06 16:55:09.662
cmlb4m663007x28m18ukgl2ns	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:19.995	99	394	25.1	f	99	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:19.995	2026-02-06 16:55:19.995
cmlb4mt11008028m1anr4155p	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:49.621	129	394	32.7	f	129	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:49.621	2026-02-06 16:55:49.621
cmlb4noj2008428m1wrr8kln8	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:56:30.446	169	394	42.9	f	169	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:56:30.446	2026-02-06 16:56:30.446
cmlb4nvj3008528m1u9lkch9w	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:56:39.519	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:56:39.519	2026-02-06 16:56:39.519
cmlb4o4ex008628m1njbm1e7r	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:56:51.033	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:56:51.033	2026-02-06 16:56:51.033
cmlb4obrs008728m1r6du7nbx	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:00.568	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:00.568	2026-02-06 16:57:00.568
cmlb4ojd4008828m1j2x0tdx0	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:10.408	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:10.408	2026-02-06 16:57:10.408
cmlb4orq8008928m17xa4q2vy	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:21.248	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:21.248	2026-02-06 16:57:21.248
cmlb4psvg008e28m1f7x3rtba	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:58:09.388	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:58:09.388	2026-02-06 16:58:09.388
cmlb4t11m008n28m1atwi4flr	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:00:39.946	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:00:39.946	2026-02-06 17:00:39.946
cmlb4t9a3008o28m1rtwsiuyv	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:00:50.619	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:00:50.619	2026-02-06 17:00:50.619
cmlb4tg7n008p28m1o2lygsls	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:00:59.603	183	394	46.4	f	183	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:00:59.603	2026-02-06 17:00:59.603
cmlb4tqzn008q28m16hvjhxu4	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:13.57	193	394	49	f	193	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:13.57	2026-02-06 17:01:13.57
cmlb4mhkb007y28m1ywgcz9sp	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:34.763	109	394	27.7	f	109	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:34.763	2026-02-06 16:55:34.763
cmlb4mmmc007z28m1kt038dzc	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:41.316	119	394	30.2	f	119	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:41.316	2026-02-06 16:55:41.316
cmlb4n0oq008128m1tyfbcai1	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:55:59.546	139	394	35.3	f	139	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:55:59.546	2026-02-06 16:55:59.546
cmlb4nc25008228m17p64zqqo	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:56:14.285	149	394	37.8	f	149	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:56:14.285	2026-02-06 16:56:14.285
cmlb4njcp008328m1qzki35rw	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:56:23.737	159	394	40.4	f	159	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:56:23.737	2026-02-06 16:56:23.737
cmlb4p2ot008a28m1wu1xt7bv	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:35.453	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:35.453	2026-02-06 16:57:35.453
cmlb4pkdj008b28m1z7f43y3e	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:58.375	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:58.375	2026-02-06 16:57:58.375
cmlb4pl3s008c28m11z5v1h76	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:59.32	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:59.32	2026-02-06 16:57:59.32
cmlb4plg4008d28m1forenaps	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:57:59.764	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:57:59.764	2026-02-06 16:57:59.764
cmlb4q26h008f28m1uw9iw40a	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:58:21.449	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:58:21.449	2026-02-06 16:58:21.449
cmlb4rwzq008g28m1a8vkdsjg	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:59:48.038	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:59:48.038	2026-02-06 16:59:48.038
cmlb4rxi5008h28m1luamkuiv	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:59:48.701	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:59:48.701	2026-02-06 16:59:48.701
cmlb4rxi7008i28m1lniqate4	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:59:48.703	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:59:48.703	2026-02-06 16:59:48.703
cmlb4rxia008j28m1tv3esfnl	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:59:48.706	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:59:48.706	2026-02-06 16:59:48.706
cmlb4rxvp008k28m1sxfbbpoa	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 16:59:49.189	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 16:59:49.189	2026-02-06 16:59:49.189
cmlb4s88u008l28m1ezuqjqrl	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:00:02.622	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:00:02.622	2026-02-06 17:00:02.622
cmlb4szwg008m28m123h39y7t	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:00:38.464	179	394	45.4	f	179	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:00:38.464	2026-02-06 17:00:38.464
cmlb4tvs2008r28m17gz095ng	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:19.778	197	394	50	f	197	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:19.778	2026-02-06 17:01:19.778
cmlb4u3co008s28m190181oo6	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:29.592	198	394	50.3	f	198	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:29.592	2026-02-06 17:01:29.592
cmlb4ubas008t28m1hpkqpnu6	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:39.892	203	394	51.5	f	203	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:39.892	2026-02-06 17:01:39.892
cmlb4ukwe008u28m1yyp6c9zh	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:52.334	209	394	53	f	209	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:52.334	2026-02-06 17:01:52.334
cmlb4uqd9008v28m15ae22mtx	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:01:59.421	209	394	53	f	209	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:01:59.421	2026-02-06 17:01:59.421
cmlb4uy2f008w28m121q6p4wk	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:09.399	210	394	53.3	f	210	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:09.399	2026-02-06 17:02:09.399
cmlb4v61m008x28m1h090gbmv	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:19.738	219	394	55.6	f	219	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:19.738	2026-02-06 17:02:19.738
cmlb4ve9u008y28m1exqgna1l	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:30.402	229	394	58.1	f	229	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:30.402	2026-02-06 17:02:30.402
cmlb4vla1008z28m15ki17ay4	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:39.481	235	394	59.6	f	235	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:39.481	2026-02-06 17:02:39.481
cmlb4vt1d009028m14llz8uug	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:49.537	245	394	62.2	f	245	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:49.537	2026-02-06 17:02:49.537
cmlb4w10h009128m1nzhm9jxm	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:02:59.873	251	394	63.7	f	251	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:02:59.873	2026-02-06 17:02:59.873
cmlb4w8eg009228m1hg9mwf5l	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:03:09.448	259	394	65.7	f	259	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:03:09.448	2026-02-06 17:03:09.448
cmlb4xh7o009328m191qyr6if	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:04:07.524	263	394	66.8	f	263	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:04:07.524	2026-02-06 17:04:07.524
cmlb4xhbh009428m1g85a3ctk	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:04:07.661	263	394	66.8	f	263	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:04:07.661	2026-02-06 17:04:07.661
cmlb4xhju009528m13xcr1fwr	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:04:07.962	263	394	66.8	f	263	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:04:07.962	2026-02-06 17:04:07.962
cmlb4yfc3009628m1r93aburn	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:04:51.747	264	394	67	f	264	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:04:51.747	2026-02-06 17:04:51.747
cmlb4ym4c009728m1jm9wqohj	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:00.54	271	394	68.8	f	271	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:00.54	2026-02-06 17:05:00.54
cmlb4ytr9009828m1n4eu6og7	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:10.437	275	394	69.8	f	275	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:10.437	2026-02-06 17:05:10.437
cmlb4z14b009928m1m5f9dg48	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:19.979	284	394	72.1	f	284	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:19.979	2026-02-06 17:05:19.979
cmlb4z8kl009a28m1bhnos66b	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:29.637	294	394	74.6	f	294	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:29.637	2026-02-06 17:05:29.637
cmlb4zhiy009b28m1sy1p5vrd	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:41.242	304	394	77.2	f	304	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:41.242	2026-02-06 17:05:41.242
cmlb4zo3h009c28m1xayqh0qn	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:05:49.757	314	394	79.7	f	314	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:05:49.757	2026-02-06 17:05:49.757
cmlb50399009e28m1wf47pblb	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:09.405	334	394	84.8	f	334	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:09.405	2026-02-06 17:06:09.405
cmlb515uf009j28m17x4kgokm	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:59.415	367	394	93.1	t	367	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:59.415	2026-02-06 17:06:59.415
cmlb57gt3009q28m1krbeir62	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:11:53.559	29	394	7.4	f	29	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770397873676	2026-02-06 17:11:53.559	2026-02-06 17:11:53.559
cmlb4zwu3009d28m1cfqqnys8	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:01.083	324	394	82.2	f	324	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:01.083	2026-02-06 17:06:01.083
cmlb50b7w009f28m17t658wnw	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:19.724	341	394	86.5	f	341	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:19.724	2026-02-06 17:06:19.724
cmlb50is2009g28m1ty8ozptv	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:29.522	347	394	88.1	f	347	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:29.522	2026-02-06 17:06:29.522
cmlb50qiw009h28m10ikh57x0	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:39.56	353	394	89.6	f	353	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:39.56	2026-02-06 17:06:39.56
cmlb50yjl009i28m1vl9kkdan	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:06:49.953	359	394	91.1	t	359	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:06:49.953	2026-02-06 17:06:49.953
cmlb51dk9009k28m1a7ayu8kp	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:07:09.417	377	394	95.7	t	377	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:07:09.417	2026-02-06 17:07:09.417
cmlb51l7e009l28m1qszrzj5h	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:07:19.322	387	394	98.2	t	387	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770396789404	2026-02-06 17:07:19.322	2026-02-06 17:07:19.322
cmlb51rof009m28m17xtrejj9	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:07:27.711	394	394	100	t	394	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	17	1	session-1770396789404	2026-02-06 17:07:27.711	2026-02-06 17:07:27.711
cmlb51tob009n28m1rwoc9v15	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:07:30.299	394	394	100	t	394	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	17	1	session-1770396789404	2026-02-06 17:07:30.299	2026-02-06 17:07:30.299
cmlb56zxa009o28m1ijx5hnoz	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:11:31.678	9	394	2.3	f	9	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770397873676	2026-02-06 17:11:31.678	2026-02-06 17:11:31.678
cmlb577bs009p28m14v4vflrm	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:11:41.272	19	394	4.8	f	19	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770397873676	2026-02-06 17:11:41.272	2026-02-06 17:11:41.272
cmlb57o7o009r28m1c1vpiayr	cmlartgsi005728m1wnkltp70	cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	cml82k4rr00092ekuibuz50h6	student	2026-02-06 17:12:03.156	39	394	9.9	f	39	1	desktop	web	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0	direct	\N	720p	0	1	session-1770397873676	2026-02-06 17:12:03.156	2026-02-06 17:12:03.156
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Student" (id, school_id, academic_session_id, user_id, student_id, admission_number, date_of_birth, admission_date, current_class_id, guardian_name, guardian_phone, guardian_email, address, emergency_contact, blood_group, medical_conditions, allergies, previous_school, academic_level, parent_id, status, "createdAt", "updatedAt", city, country, postal_code, state) FROM stdin;
cml9h36sw002i28m124xc093l	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9h36e8002h28m1sv1rp84q	STUD/26/001	\N	\N	2026-02-05 13:08:57.006	cml99r289000j28kc9tsths0d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:08:57.008	2026-02-05 13:08:57.008	\N	\N	\N	\N
cml9hjqpq002k28m1fon6bub6	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hjqb8002j28m1wn2gppg0	STUD/26/002	\N	\N	2026-02-05 13:21:49.309	cml82jxo700082ekuhkwqk82m	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:21:49.31	2026-02-05 13:21:49.31	\N	\N	\N	\N
cml9hkn1v002m28m1yp3cgvg7	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hkmn7002l28m19l6h4ufr	STUD/26/003	\N	\N	2026-02-05 13:22:31.217	cml82jowa00072ekubwusc3km	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:22:31.219	2026-02-05 13:22:31.219	\N	\N	\N	\N
cml9hn213002o28m10rh32ekd	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hn1lp002n28m14s6isua4	STUD/26/004	\N	\N	2026-02-05 13:24:23.942	cml99t7hq000k28kcwnknibvb	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:24:23.943	2026-02-05 13:24:23.943	\N	\N	\N	\N
cml9hqkbh002q28m14ahxzj1o	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hqjx1002p28m1u8i144pq	STUD/26/005	\N	\N	2026-02-05 13:27:07.612	cml9axhbr001328kc5fb495i8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:27:07.613	2026-02-05 13:27:07.613	\N	\N	\N	\N
cml9hrabl002s28m18i14rodm	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hr9wz002r28m1u9b28mfc	STUD/26/006	\N	\N	2026-02-05 13:27:41.311	cml99r289000j28kc9tsths0d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:27:41.312	2026-02-05 13:27:41.312	\N	\N	\N	\N
cml9hryul002u28m1x3cayav3	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hryg2002t28m14yf50k1r	STUD/26/007	\N	\N	2026-02-05 13:28:13.1	cml82jxo700082ekuhkwqk82m	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:28:13.101	2026-02-05 13:28:13.101	\N	\N	\N	\N
cml9htlky002w28m1ieimfk7n	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9htl6h002v28m1shx5mhvg	STUD/26/008	\N	\N	2026-02-05 13:29:29.216	cml9a4y6o000n28kcon9x6krm	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:29:29.218	2026-02-05 13:29:29.218	\N	\N	\N	\N
cml9huy9b002y28m17s3ruo75	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9huxur002x28m1gpvjsput	STUD/26/009	\N	\N	2026-02-05 13:30:32.301	cml9a4y6o000n28kcon9x6krm	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:30:32.303	2026-02-05 13:30:32.303	\N	\N	\N	\N
cml9hvg5w003028m16mcfuzjl	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hvfrf002z28m1licqphdx	STUD/26/010	\N	\N	2026-02-05 13:30:55.506	cml82k4rr00092ekuibuz50h6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:30:55.508	2026-02-05 13:30:55.508	\N	\N	\N	\N
cml9hw12s003228m1acn9dr20	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9hw0o0003128m1inywvxz8	STUD/26/011	\N	\N	2026-02-05 13:31:22.611	cml82k4rr00092ekuibuz50h6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:31:22.612	2026-02-05 13:31:22.612	\N	\N	\N	\N
cml9i75s1003428m16sxqunjp	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9i75lx003328m1me33b7gm	STUD/26/012	\N	\N	2026-02-05 13:40:01.919	cml9a596b000o28kck9fs0onq	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 13:40:01.921	2026-02-05 13:40:01.921	\N	\N	\N	\N
cml9jq9n9003i28m125ky1h0c	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9jq98f003h28m10vqc78vk	STUD/26/013	\N	\N	2026-02-05 14:22:53.011	cml99r289000j28kc9tsths0d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:22:53.013	2026-02-05 14:22:53.013	\N	\N	\N	\N
cml9jyexu003k28m1ldy4uj73	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9jyehf003j28m1ri38jj74	STUD/26/014	\N	\N	2026-02-05 14:29:13.121	cml99r289000j28kc9tsths0d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:29:13.122	2026-02-05 14:29:13.122	\N	\N	\N	\N
cml9k02wm003m28m1xa3jfsez	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9k02hr003l28m1yh1pmge3	STUD/26/015	\N	\N	2026-02-05 14:30:30.836	cml82jowa00072ekubwusc3km	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:30:30.838	2026-02-05 14:30:30.838	\N	\N	\N	\N
cml9k22kn003o28m1lhk2wi48	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9k2260003n28m1xoqdetrc	STUD/26/016	\N	\N	2026-02-05 14:32:03.718	cml99t7hq000k28kcwnknibvb	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:32:03.719	2026-02-05 14:32:03.719	\N	\N	\N	\N
cml9kt2tj003u28m10qwlwil3	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9kt2e2003t28m138tvkzqq	STUD/26/017	\N	\N	2026-02-05 14:53:03.75	cml9axhbr001328kc5fb495i8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:53:03.751	2026-02-05 14:53:03.751	\N	\N	\N	\N
cml9ku5rp003w28m1kbwsw1wv	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ku5cr003v28m1ctkchixa	STUD/26/018	\N	\N	2026-02-05 14:53:54.227	cml9a2v9v000l28kccfa2k8uz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:53:54.229	2026-02-05 14:53:54.229	\N	\N	\N	\N
cml9kuzs5003y28m1bw7g13ds	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9kuzdb003x28m1v6c0y6at	STUD/26/019	\N	\N	2026-02-05 14:54:33.124	cml9a2v9v000l28kccfa2k8uz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:54:33.125	2026-02-05 14:54:33.125	\N	\N	\N	\N
cml9kyosn004028m1meqafepa	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9kyodu003z28m13u402t5v	STUD/26/020	\N	\N	2026-02-05 14:57:25.509	cml9a4kuk000m28kcva1xx8f4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:57:25.511	2026-02-05 14:57:25.511	\N	\N	\N	\N
cml9kzuxj004228m1ijlpq6bm	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9kzuiy004128m1t1odir8d	STUD/26/021	\N	\N	2026-02-05 14:58:20.117	cml9a4kuk000m28kcva1xx8f4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 14:58:20.119	2026-02-05 14:58:20.119	\N	\N	\N	\N
cml9ldbtg004928m1478ahqkg	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ldbei004828m1jrgdv0ju	STUD/26/022	\N	\N	2026-02-05 15:08:48.53	cml9lcfwo004728m1mg9lj1ec	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 15:08:48.532	2026-02-05 15:08:48.532	\N	\N	\N	\N
cml9ldzei004b28m1zrp388ej	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ldyzy004a28m1fke1wg1r	STUD/26/023	\N	\N	2026-02-05 15:09:19.097	cml9lcfwo004728m1mg9lj1ec	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-05 15:09:19.098	2026-02-05 15:09:19.098	\N	\N	\N	\N
cmlan7u5o004v28m12gximmcr	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cmlan7tqb004u28m1xsncfxdt	STUD/26/024	\N	\N	2026-02-06 08:48:17.771	cmlan0i8j004r28m1gt0pqv8j	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-06 08:48:17.772	2026-02-06 08:48:17.772	\N	\N	\N	\N
cmlana217004x28m1zem9u10x	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cmlana1kp004w28m1l764i7on	STUD/26/025	\N	\N	2026-02-06 08:50:01.289	cmlan0i8j004r28m1gt0pqv8j	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-06 08:50:01.291	2026-02-06 08:50:01.291	\N	\N	\N	\N
cmlfe020m006b5wlkpmw661fl	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlfe01wt00685wlk9eu9uob1	STUD/26/026	\N	\N	2026-02-09 16:29:09.042	cmlfdfq4h004c5wlkpjgkawx0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-09 16:29:09.046	2026-02-09 16:29:09.046	\N	\N	\N	\N
cmlgk7o1e008b5wlkwhl3snbg	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgk7o0j008a5wlkhwsxr129	STUD/26/027	\N	\N	2026-02-10 12:10:48.05	cmlfdfq4h004b5wlksarcbzia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:10:48.05	2026-02-10 12:10:48.05	\N	\N	\N	\N
cmlgk9wc4008f5wlkpzvleoap	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgk9wb9008d5wlkby86o8pb	STUD/26/028	\N	\N	2026-02-10 12:12:32.115	cmlfdfq4h004b5wlksarcbzia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:12:32.116	2026-02-10 12:12:32.116	\N	\N	\N	\N
cmlgk9wcs008g5wlkv9o93935	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgk9wbv008e5wlkgky362ae	STUD/26/029	\N	\N	2026-02-10 12:12:32.139	cmlfdfq4h004b5wlksarcbzia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:12:32.14	2026-02-10 12:12:32.14	\N	\N	\N	\N
cmlgktm0v008k5wlkp1pxc53g	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgktlzb008i5wlk5pijtx7w	STUD/26/030	\N	\N	2026-02-10 12:27:51.87	cmlfdfq4h00465wlk6halc39e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:27:51.871	2026-02-10 12:27:51.871	\N	\N	\N	\N
cmlgkxods008o5wlkpoktaufz	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgkxoce008m5wlkv6xcw7j3	STUD/26/031	\N	\N	2026-02-10 12:31:01.551	cmlfdfq4h00465wlk6halc39e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:31:01.552	2026-02-10 12:31:01.552	\N	\N	\N	\N
cmlgl50ng008r5wlkstenbxyb	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgl50ml008q5wlk3h6aytwu	STUD/26/032	\N	\N	2026-02-10 12:36:44.043	cmlfdfq4h00465wlk6halc39e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:36:44.044	2026-02-10 12:36:44.044	\N	\N	\N	\N
cmlgl9dnx008u5wlk00m4kvc3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgl9dn1008t5wlk0o9hocym	STUD/26/033	\N	\N	2026-02-10 12:40:07.532	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:40:07.533	2026-02-10 12:40:07.533	\N	\N	\N	\N
cmlglaarv008x5wlkp17y7g90	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglaar2008w5wlkxets2z7q	STUD/26/034	\N	\N	2026-02-10 12:40:50.441	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:40:50.443	2026-02-10 12:40:50.443	\N	\N	\N	\N
cmlglb3bl00905wlkf06nsv3c	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglb3an008z5wlkjdwtjsup	STUD/26/035	\N	\N	2026-02-10 12:41:27.44	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:41:27.441	2026-02-10 12:41:27.441	\N	\N	\N	\N
cmlglcm6s00935wlkuilojonm	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglcm5x00925wlkphonrfrp	STUD/26/036	\N	\N	2026-02-10 12:42:38.547	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:42:38.548	2026-02-10 12:42:38.548	\N	\N	\N	\N
cmlglruhu009r5wlkrs60ac43	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglrugn009q5wlk28arfiko	STUD/26/044	\N	\N	2026-02-10 12:54:29.153	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:54:29.154	2026-02-10 12:54:29.154	\N	\N	\N	\N
cmlgltzkg00a05wlkp36yleq3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgltzj8009z5wlkkgp1b5hy	STUD/26/047	\N	\N	2026-02-10 12:56:09.039	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:56:09.04	2026-02-10 12:56:09.04	\N	\N	\N	\N
cmlgldmc000965wlk8nfav2o5	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgldma000955wlkvkrqg6vy	STUD/26/037	\N	\N	2026-02-10 12:43:25.388	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:43:25.391	2026-02-10 12:43:25.391	\N	\N	\N	\N
cmlglf96700995wlk0o68fffc	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglf95500985wlk606leq1w	STUD/26/038	\N	\N	2026-02-10 12:44:41.646	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:44:41.647	2026-02-10 12:44:41.647	\N	\N	\N	\N
cmlgll5tq009c5wlkcbysh7us	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgll5st009b5wlkzqnc0fse	STUD/26/039	\N	\N	2026-02-10 12:49:17.245	cmlfdfq4h004c5wlkpjgkawx0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:49:17.246	2026-02-10 12:49:17.246	\N	\N	\N	\N
cmlglpwch009l5wlklrs83fyw	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglpwbn009k5wlk7hzwatfi	STUD/26/042	\N	\N	2026-02-10 12:52:58.24	cmlfdfq4h004d5wlki5dhhqxg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:52:58.241	2026-02-10 12:52:58.241	\N	\N	\N	\N
cmlglqql1009o5wlk9m4ru9jz	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglqqk3009n5wlksgnc5mmy	STUD/26/043	\N	\N	2026-02-10 12:53:37.428	cmlfdfq4h004d5wlki5dhhqxg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:53:37.429	2026-02-10 12:53:37.429	\N	\N	\N	\N
cmlglm2uc009f5wlkrrytpqid	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglm2te009e5wlk5cvhyb9u	STUD/26/040	\N	\N	2026-02-10 12:50:00.035	cmlfdfq4h004c5wlkpjgkawx0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:50:00.036	2026-02-10 12:50:00.036	\N	\N	\N	\N
cmlglogau009i5wlk5azttvv3	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglog8s009h5wlkvbjgyqty	STUD/26/041	\N	\N	2026-02-10 12:51:50.789	cmlfdfq4h004c5wlkpjgkawx0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:51:50.79	2026-02-10 12:51:50.79	\N	\N	\N	\N
cmlglsgtb009u5wlklgq755sl	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglsgre009t5wlkev733ua9	STUD/26/045	\N	\N	2026-02-10 12:54:58.078	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:54:58.079	2026-02-10 12:54:58.079	\N	\N	\N	\N
cmlglt63a009x5wlkmm4yhw3t	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglt62j009w5wlkc6vycn9y	STUD/26/046	\N	\N	2026-02-10 12:55:30.837	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:55:30.838	2026-02-10 12:55:30.838	\N	\N	\N	\N
cmlglvge700a35wlktw8jki6u	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglvgbs00a25wlku670g5km	STUD/26/048	\N	\N	2026-02-10 12:57:17.502	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:57:17.503	2026-02-10 12:57:17.503	\N	\N	\N	\N
cmlglw0f000a65wlks2cpzu9n	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglw0e200a55wlk5vlyxed8	STUD/26/049	\N	\N	2026-02-10 12:57:43.451	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:57:43.452	2026-02-10 12:57:43.452	\N	\N	\N	\N
cmlglwtvr00a95wlkem8ur8dj	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglwtuy00a85wlk8qdaphk1	STUD/26/050	\N	\N	2026-02-10 12:58:21.638	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:58:21.639	2026-02-10 12:58:21.639	\N	\N	\N	\N
cmlglxcv300ac5wlkiemq98sq	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlglxcu900ab5wlkxkm9z7qa	STUD/26/051	\N	\N	2026-02-10 12:58:46.239	cmlfdfq4h004g5wlkfgwox3t6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 12:58:46.239	2026-02-10 12:58:46.239	\N	\N	\N	\N
cmlgmf9y700af5wlk70ek21oh	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgmf9wz00ae5wlk8hkxhlpa	STUD/26/052	\N	\N	2026-02-10 13:12:42.27	cmlfdfq4h00465wlk6halc39e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 13:12:42.271	2026-02-10 13:12:42.271	\N	\N	\N	\N
cmlgn35z100ai5wlk3ckqaqh8	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgn35xx00ah5wlkmm250tqj	STUD/26/053	\N	\N	2026-02-10 13:31:16.86	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 13:31:16.861	2026-02-10 13:31:16.861	\N	\N	\N	\N
cmlgnf0cr00al5wlkg94grkcs	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgnf0bm00ak5wlkp0ydvucu	STUD/26/054	\N	\N	2026-02-10 13:40:29.449	cmlfdfq4h00475wlksyueaoyj	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 13:40:29.451	2026-02-10 13:40:29.451	\N	\N	\N	\N
cmlgpeicl00ao5wlkscwgwby8	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgpei9u00an5wlkgmfvg1z2	STUD/26/055	\N	\N	2026-02-10 14:36:05.347	cmlfdfq4h004b5wlksarcbzia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-10 14:36:05.349	2026-02-10 14:36:05.349	\N	\N	\N	\N
cmlhqm5gc00bh5wlkm9ocjq8m	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhqm5ey00bg5wlkpirnipyx	STUD/26/056	\N	\N	2026-02-11 07:57:47.675	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 07:57:47.676	2026-02-11 07:57:47.676	\N	\N	\N	\N
cmlhrvnvv00bk5wlk6h1sgiv9	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhrvnt600bj5wlk8wbqq5dv	STUD/26/057	\N	\N	2026-02-11 08:33:11.082	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 08:33:11.083	2026-02-11 08:33:11.083	\N	\N	\N	\N
cmlhrwdei00bn5wlkwcgtj3os	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhrwddb00bm5wlkd3neolp3	STUD/26/058	\N	\N	2026-02-11 08:33:44.153	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 08:33:44.154	2026-02-11 08:33:44.154	\N	\N	\N	\N
cmlhs8h7d00bq5wlkhip8ebgc	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhs8h5v00bp5wlkxaszqxjs	STUD/26/059	\N	\N	2026-02-11 08:43:08.952	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 08:43:08.953	2026-02-11 08:43:08.953	\N	\N	\N	\N
cmlhslb2a00bt5wlkax6gy1bm	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhslazt00bs5wlksfywiw4d	STUD/26/060	\N	\N	2026-02-11 08:53:07.521	cmlfdfq4h004g5wlkfgwox3t6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 08:53:07.522	2026-02-11 08:53:07.522	\N	\N	\N	\N
cmlhsqly100bw5wlkg832epr9	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlhsqlvl00bv5wlkxh8urpsu	STUD/26/061	\N	\N	2026-02-11 08:57:14.904	cmlfdfq4h004e5wlktau56fmo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	active	2026-02-11 08:57:14.905	2026-02-11 08:57:14.905	\N	\N	\N	\N
\.


--
-- Data for Name: StudentAchievement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentAchievement" (id, student_id, achievement_id, earned_date, points_earned, is_visible, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: StudentPerformance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StudentPerformance" (id, student_id, class_id, academic_session_id, term, year, total_score, max_score, "position", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subject" (id, name, code, color, description, "schoolId", academic_session_id, "createdAt", "updatedAt", "classId", thumbnail) FROM stdin;
cmlfdnb8k005f5wlkyev3dd91	english	ENG SS2	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:19:14.468	2026-02-09 16:19:14.468	cmlfdfq4h004f5wlkzi4kl3rh	\N
cmlfdnii2005h5wlkeko9dqfm	english	ENG SS3	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:19:23.882	2026-02-09 16:19:23.882	cmlfdfq4h004g5wlkfgwox3t6	\N
cml9a8dbp000p28kc7ri7y9xk	mathematics	MATH	#2ECC71	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 09:57:01.429	2026-02-05 10:36:25.564	cml99r289000j28kc9tsths0d	\N
cml9gmpll002528m1y8x7j8us	digital technologies	DIT	#E74C3C	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:56:08.217	2026-02-05 12:58:26.298	cml9a4y6o000n28kcon9x6krm	\N
cmlfahlur000029kijsemr8nu	ncc demo examination	NCC	#3498DB	\N	cmlf8n44o000327h1w5mi08k0	cmlf8n4fq000527h17yo3y41k	2026-02-09 14:50:49.443	2026-02-11 09:08:30.576	cmlf8vgxb000a27h1w73jnah3	\N
cml9ghoj5001x28m1rmb6th7z	basic science and technology	B.SC	#E67E22	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:52:13.553	2026-02-05 12:59:10.791	cml99t7hq000k28kcwnknibvb	\N
cml9gk8q7002128m1l8iygbah	physical and health education	PHE	#3F51B5	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:54:13.039	2026-02-05 12:59:51.929	cml9a2v9v000l28kccfa2k8uz	\N
cml9gnfob002728m1bwdeh7cr	government	GOV	#E74C3C	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:56:42.011	2026-02-05 14:03:31.416	cml9a596b000o28kck9fs0onq	\N
cmlfdmzff005d5wlkm1xi02or	english	ENG SS1	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:18:59.163	2026-02-11 09:20:57.395	cmlfdfq4h004e5wlktau56fmo	\N
cml830ydt000g2eku9ekj0djg	history	HIS	#3498DB	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-04 13:47:31.985	2026-02-05 14:04:09.2	cml82jowa00072ekubwusc3km	\N
cml82zu1z000e2ekuchcoro9q	english	ENG	#E74C3C	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-04 13:46:39.719	2026-02-05 14:04:41.863	cml82jxo700082ekuhkwqk82m	\N
cml9go7pr002928m18xksjmik	economics	ECO	#E74C3C	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:57:18.351	2026-02-05 14:05:14.844	cml82k4rr00092ekuibuz50h6	\N
cml9gl80u002328m1mofltpzd	national values education	NAE	#9B59B6	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-05 12:54:58.782	2026-02-05 14:10:02.71	cml9axhbr001328kc5fb495i8	\N
cmlan5gmo004s28m1y4hxzfiu	chemitry	CHM	#1ABC9C	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	2026-02-06 08:46:26.928	2026-02-06 08:46:26.928	cmlan0i8j004r28m1gt0pqv8j	\N
cmlfdivgf004n5wlkitkwaabl	english	ENG	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:15:47.391	2026-02-09 16:15:47.391	cmlfdfq4h00465wlk6halc39e	\N
cmlfdk5ar004u5wlkl2p16obc	english	ENG PRY 3	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:16:46.803	2026-02-09 16:16:46.803	cmlfdfq4h00475wlksyueaoyj	\N
cmlfdkhq100515wlk2g2p2b9i	english	ENG 4	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:17:02.905	2026-02-09 16:17:02.905	cmlfdfq4h00485wlk04up8u4s	\N
cmlfdkw1z00535wlkv5m3v9dy	english	ENG 5	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:17:21.479	2026-02-09 16:17:21.479	cmlfdfq4h00495wlkm5cpzr86	\N
cmlfdl7sl00555wlkdtv40t3y	english	ENG 6	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:17:36.693	2026-02-09 16:17:36.693	cmlfdfq4h004a5wlkxwws4n42	\N
cmlfdlmpn00575wlkxg9f1j22	english	ENG JSS1	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:17:56.027	2026-02-09 16:17:56.027	cmlfdfq4h004b5wlksarcbzia	\N
cmlfdlyc200595wlkmh0vb47s	english	ENG JJ2	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:18:11.09	2026-02-09 16:18:11.09	cmlfdfq4h004c5wlkpjgkawx0	\N
cmlfdm7if005b5wlkg430ps8v	english	ENG JSS3	#E74C3C	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-09 16:18:22.983	2026-02-09 16:18:22.983	cmlfdfq4h004d5wlki5dhhqxg	\N
cmlgq2css00aq5wlk80vb7s75	mathematics	Math pry2	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-10 14:54:37.9	2026-02-11 09:21:15.459	cmlfdfq4h00465wlk6halc39e	\N
cmlhtlr5o00c35wlkd99gqzpr	mathematics	Math pry3	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:21:27.996	2026-02-11 09:21:27.996	cmlfdfq4h00475wlksyueaoyj	\N
cmlhufp4e00c65wlk5s3v5ffh	mathematics	Math pry4	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:44:45.038	2026-02-11 09:44:45.038	cmlfdfq4h00485wlk04up8u4s	\N
cmlhug8gi00c95wlk9xeexr6c	mathematics	Math pry5	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:45:10.098	2026-02-11 09:45:10.098	cmlfdfq4h00495wlkm5cpzr86	\N
cmlhuw0r800cc5wlk5yqxuo6s	mathematics	Math Jss1	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:57:26.612	2026-02-11 09:57:26.612	cmlfdfq4h004b5wlksarcbzia	\N
cmlhuwvv500cf5wlk3dvzsdym	mathematics	Math Jss2	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:58:06.929	2026-02-11 09:58:06.929	cmlfdfq4h004c5wlkpjgkawx0	\N
cmlhuxhxs00ci5wlksxk4olic	mathematics	Math Jss3	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 09:58:35.536	2026-02-11 09:58:35.536	cmlfdfq4h004d5wlki5dhhqxg	\N
cmlhuzegy00cl5wlkozx3dsu6	mathematics	Math SSS 1	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 10:00:04.354	2026-02-11 10:00:04.354	cmlfdfq4h004e5wlktau56fmo	\N
cmlhuzwj100co5wlkc5zinshh	mathematics	Math SSS 2	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 10:00:27.757	2026-02-11 10:00:27.757	cmlfdfq4h004f5wlkzi4kl3rh	\N
cmlhv0e9w00cr5wlkexvjljdo	mathematics	Math SSS 3	#3498DB	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	2026-02-11 10:00:50.756	2026-02-11 10:00:50.756	cmlfdfq4h004g5wlkfgwox3t6	\N
\.


--
-- Data for Name: SupportInfo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupportInfo" (id, school_id, faq_count, last_faq_update, faq_categories, email_support, phone_support, live_chat_available, response_time, app_version, build_number, last_updated, minimum_ios_version, minimum_android_version, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Teacher; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Teacher" (id, email, first_name, last_name, phone_number, display_picture, school_id, academic_session_id, user_id, gender, role, password, teacher_id, employee_number, qualification, specialization, years_of_experience, hire_date, salary, department, is_class_teacher, status, "createdAt", "updatedAt") FROM stdin;
cml9al6fq000r28kcfucmmaev	igeoluwagbenga01@gmail.com	Oluwagbenga	Ige	09029399294	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9al62d000q28kcq0i6bdw4	male	teacher	$argon2id$v=19$m=65536,t=3,p=4$XQVriyOCMqdlwLiuBnatRw$bYiSemd1BJ2PFqdxvj6fYXtyOmcGOl7DuISWvdb/Wa8	SMHT-26-001	\N	\N	\N	\N	2026-02-05 10:06:59.028	\N	\N	f	active	2026-02-05 10:06:59.03	2026-02-05 10:06:59.03
cml9an6vj000u28kcs7627fbp	seyihaladay@gmail.com	Alade	Seyi	08118491929	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9an6f9000t28kcejdr6glo	male	teacher	$argon2id$v=19$m=65536,t=3,p=4$KqJjW9sNR3IA5CKOeRU0uQ$ZFMOYz+B6W+vZcsRoP3gzRKgCOO4YlgxoA2TsCbj7yo	SMHT-26-002	\N	\N	\N	\N	2026-02-05 10:08:32.91	\N	\N	f	active	2026-02-05 10:08:32.911	2026-02-05 10:08:32.911
cml9ap7pn000w28kc3087zbt3	towojupatricia@gmail.com	Itunuoluwa Patricia	Towoju 	08138731988	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ap7c7000v28kcv28kd76q	female	teacher	$argon2id$v=19$m=65536,t=3,p=4$mXo6sM/n18G8RzQg+K7GAA$AMzfZjHbK9IZi4wG79zEjh+Db8NrKXOxBAX97f6QHYQ	SMHT-26-003	\N	\N	\N	\N	2026-02-05 10:10:07.305	\N	\N	f	active	2026-02-05 10:10:07.307	2026-02-05 10:10:07.307
cml9aq9cr000y28kcet6rnkqi	akinruliayomide4@gmail.com	Deborah	Akinruli 	09035069117	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9aq8zt000x28kc6b6tji59	female	teacher	$argon2id$v=19$m=65536,t=3,p=4$jhTJn+hoNc+9iB0tbWb7FQ$ujojcRf9d7+FNUacF2r8bZ+mKSq2MLkqd4dnzCKXFYQ	SMHT-26-004	\N	\N	\N	\N	2026-02-05 10:10:56.089	\N	\N	f	active	2026-02-05 10:10:56.091	2026-02-05 10:10:56.091
cml9arj15001028kc8lr9zu7q	arikalamubasma@gmail.com	Basma Busayo 	Arikalamu 	08142812650	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9ario5000z28kc88hp8g4i	female	teacher	$argon2id$v=19$m=65536,t=3,p=4$mUDIiA0QpDaqZxTK5k7MqA$FFHIMLY2QUhQocmNbmUMiBvUyYcoFiRwl/gzjZRTJa0	SMHT-26-005	\N	\N	\N	\N	2026-02-05 10:11:55.288	\N	\N	f	active	2026-02-05 10:11:55.289	2026-02-05 10:11:55.289
cml9aso81001228kccdrmmg2b	kolawolesharon9@gmail.com	Oluwalana Sharon	Kolawole 	08124824648	\N	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	cml9asnv9001128kcuc4gq69x	female	teacher	$argon2id$v=19$m=65536,t=3,p=4$1gWyulzf96KAI3YKXkyNuA$QcEWqUpvsuzjhLl65XviCtInY/BLzoXpa7rZlx7ftTQ	SMHT-26-006	\N	\N	\N	\N	2026-02-05 10:12:48.671	\N	\N	f	active	2026-02-05 10:12:48.672	2026-02-05 10:12:48.672
cmlgs89d100av5wlkci605q2z	oluwafemiadeniran471@gmail.com	adeniran	kehinde	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgs899n00au5wlkvetsfos2	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$GXZVYkg1eK2ei1/V24PSQQ$JA8P/p8xjrW09rCloSm55Mr18l4r6dchnacEPH+Vxpw	SMHT-26-007	\N	\N	\N	\N	2026-02-10 15:55:12.612	\N	\N	f	active	2026-02-10 15:55:12.613	2026-02-10 15:55:12.613
cmlgsafxj00ay5wlkbz2qa9ld	wemimoadelokun@gmail.com	adelokun	wemimo	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgsafwk00ax5wlkt6bpealo	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$lz/WVUG13cDAb8oibxhpoQ$P/OtoVHnz3uO6Ndcrx/4yFHBblkX1plvuWc6/9E/mDE	SMHT-26-008	\N	\N	\N	\N	2026-02-10 15:56:54.438	\N	\N	f	active	2026-02-10 15:56:54.439	2026-02-10 15:56:54.439
cmlgsb91700b15wlksc24l4yd	gracemayowa240@gmail.com	mayowa	daramola	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgsb90500b05wlkvd7xzygl	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$2yoz3E1dpuaMjGBAkWuHdA$EkUPb+6+qtHwWMFJSoRdwnzra/Vyb6NNJAzNJglCteA	SMHT-26-009	\N	\N	\N	\N	2026-02-10 15:57:32.153	\N	\N	f	active	2026-02-10 15:57:32.155	2026-02-10 15:57:32.155
cmlgsbyjq00b45wlkjqchykq9	olanikebakare5@icloud.com	bakare	olaniran	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgsbyiz00b35wlk180yp44n	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$5bXyaI1EqGQS0EBXKr44bQ$EJ/1pPFNwmgpnZv5ioNwT0WnDgqlOI/CSNKwcGHdua8	SMHT-26-010	\N	\N	\N	\N	2026-02-10 15:58:05.221	\N	\N	f	active	2026-02-10 15:58:05.222	2026-02-10 15:58:05.222
cmlgsd0c300b75wlkqkjkpqix	ttijani543@gmail.com	deborah	olalekan	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgsd09k00b65wlkye34nnf0	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$uE582JhjdHxNOZkCa83GYw$8+PI0NKtLXZHlcE7GvALL6dJiVtmWn+LyvgDw9AWFmg	SMHT-26-011	\N	\N	\N	\N	2026-02-10 15:58:54.193	\N	\N	f	active	2026-02-10 15:58:54.195	2026-02-10 15:58:54.195
cmlgsdv2j00ba5wlkopi9ths3	akinsuyiayomide3@gmail.com	ayomide	akinsuyi	07033625503	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlgsdv1t00b95wlk17reoupv	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$U6zfuClC5TyR9KEZiS8oeA$lTbP8UPt7oKdrgsgFYrcoRAmosLUDnuSCg9iVHw1Oi8	SMHT-26-012	\N	\N	\N	\N	2026-02-10 15:59:34.026	\N	\N	f	active	2026-02-10 15:59:34.027	2026-02-10 15:59:34.027
cmlh2vfqo00be5wlkai2cyizd	oluwagbengataofeekige@gmail.com	oluwagbenga	ige	09029399294	\N	cmlfbp5cw000u5wlkfgpcgols	cmlfbp5e7000w5wlkw1u5rbh5	cmlh2vfn100bd5wlk96y5uv6c	other	teacher	$argon2id$v=19$m=65536,t=3,p=4$IYiZUndtMtEMod7cJT2b1A$4OljxkOZMbmh0s3MZX5ECJDstnoeHqH2Fh1j8fcTswE	SMHT-26-013	\N	\N	\N	\N	2026-02-10 20:53:10.126	\N	\N	f	active	2026-02-10 20:53:10.128	2026-02-10 20:53:10.128
\.


--
-- Data for Name: TeacherResourceAccess; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeacherResourceAccess" (id, "teacherId", "schoolId", "schoolResourceAccessId", "studentId", "classId", "subjectId", "topicId", "videoId", "materialId", "assessmentId", "resourceType", "accessLevel", "grantedAt", "expiresAt", "isActive", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TeacherResourceExclusion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeacherResourceExclusion" (id, "teacherId", "schoolId", "subjectId", "resourceType", "resourceId", "classId", "studentId", "createdAt", "libraryClassId") FROM stdin;
\.


--
-- Data for Name: TeacherSubject; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TeacherSubject" (id, "teacherId", "subjectId") FROM stdin;
cml9bn1vf000028m10dhx2vfv	cml9al6fq000r28kcfucmmaev	cml9a8dbp000p28kc7ri7y9xk
cml9bn1vf000128m1qtyp0nbf	cml9aq9cr000y28kcet6rnkqi	cml9a8dbp000p28kc7ri7y9xk
cml9gpohy002b28m1q1tb31dl	cml9ap7pn000w28kc3087zbt3	cml9gmpll002528m1y8x7j8us
cml9gqmtx002e28m19hcx2zp7	cml9aq9cr000y28kcet6rnkqi	cml9ghoj5001x28m1rmb6th7z
cml9grikl002g28m1wnafl375	cml9aq9cr000y28kcet6rnkqi	cml9gk8q7002128m1l8iygbah
cml9j1dph003628m15uk3stql	cml9ap7pn000w28kc3087zbt3	cml9gnfob002728m1bwdeh7cr
cml9j1dph003728m1p6t91r7q	cml9aso81001228kccdrmmg2b	cml9gnfob002728m1bwdeh7cr
cml9j26v5003a28m142z26l6b	cml9aso81001228kccdrmmg2b	cml830ydt000g2eku9ekj0djg
cml9j26v5003b28m1m2xzgu1j	cml9arj15001028kc8lr9zu7q	cml830ydt000g2eku9ekj0djg
cml9j2w2a003c28m19ficau2a	cml9arj15001028kc8lr9zu7q	cml82zu1z000e2ekuchcoro9q
cml9j3lig003d28m17yz47oii	cml9an6vj000u28kcs7627fbp	cml9go7pr002928m18xksjmik
cml9j3lig003e28m162mydond	cml9aso81001228kccdrmmg2b	cml9go7pr002928m18xksjmik
cml9j9rmq003f28m1kbdy3hra	cml9arj15001028kc8lr9zu7q	cml9gl80u002328m1mofltpzd
cml9j9rmq003g28m1ofknzzzi	cml9ap7pn000w28kc3087zbt3	cml9gl80u002328m1mofltpzd
cmlan5goc004t28m11a26megn	cml9arj15001028kc8lr9zu7q	cmlan5gmo004s28m1y4hxzfiu
cmlhtkhqt00bz5wlk4t2iu54t	cmlgsd0c300b75wlkqkjkpqix	cmlgq2css00aq5wlk80vb7s75
cmlhtlr5v00c45wlkm7y1m7hd	cmlgs89d100av5wlkci605q2z	cmlhtlr5o00c35wlkd99gqzpr
cmlhufp4o00c75wlknfep8ljh	cmlgs89d100av5wlkci605q2z	cmlhufp4e00c65wlk5s3v5ffh
cmlhug8go00ca5wlkvf10hf43	cmlgs89d100av5wlkci605q2z	cmlhug8gi00c95wlk9xeexr6c
cmlhuw0re00cd5wlkrn4rk9xl	cmlgsafxj00ay5wlkbz2qa9ld	cmlhuw0r800cc5wlk5yqxuo6s
cmlhuwvve00cg5wlkd9qfn2gn	cmlgsbyjq00b45wlkjqchykq9	cmlhuwvv500cf5wlk3dvzsdym
cmlhuxhxz00cj5wlk8wgc79ky	cmlgsbyjq00b45wlkjqchykq9	cmlhuxhxs00ci5wlksxk4olic
cmlhuzeh200cm5wlkms9ht0ri	cmlgsdv2j00ba5wlkopi9ths3	cmlhuzegy00cl5wlkozx3dsu6
cmlhuzwj700cp5wlkhqam3gmc	cmlgsdv2j00ba5wlkopi9ths3	cmlhuzwj100co5wlkc5zinshh
\.


--
-- Data for Name: TimeSlot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimeSlot" (id, "startTime", "endTime", label, "order", "schoolId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TimetableEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimetableEntry" (id, class_id, subject_id, teacher_id, school_id, academic_session_id, "timeSlotId", day_of_week, room, notes, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Topic; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Topic" (id, title, description, "order", subject_id, school_id, academic_session_id, is_active, created_by, "createdAt", "updatedAt", instructions) FROM stdin;
cml9bj2e0001428kcikjdvhhe	introduction to numbers	\N	1	cml9a8dbp000p28kc7ri7y9xk	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9al62d000q28kcq0i6bdw4	2026-02-05 10:33:20.032	2026-02-05 10:33:20.032	\N
cml9oa77h004c28m1kxx2ry66	living things	this lesson helps pupils understand living things. through a video and pdf material, pupils will learn what living things are, their examples, and what makes them alive.	1	cml9ghoj5001x28m1rmb6th7z	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9aq8zt000x28kc6b6tji59	2026-02-05 16:30:21.377	2026-02-05 16:30:21.377	▶️ watch the video lesson carefully. 📄 download and read the pdf material. 🗣️ talk about examples of living things around you. ✏️ complete and submit all given activities.
cml9oas88004d28m1yf6aarjo	figure of speech	figures of speech are special ways of using words to make language more interesting, vivid, and expressive.	1	cml82zu1z000e2ekuchcoro9q	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9ario5000z28kc88hp8g4i	2026-02-05 16:30:48.623	2026-02-05 16:30:48.623	watch the video lesson from the beginning to the end. download and read the pdf material. talk about examples of figure of speech. complete and submit all activities given.
cmlak0z9x004i28m1fr25v3qd	history	this text outlines the historical progression of nigeria, starting with its diverse indigenous kingdoms and decentralized societies prior to european contact. it examines how early european trade relations eventually transitioned into british colonial dominance, highlighted by the pivotal 1914 amalgamation of the northern and southern protectorates.	1	cml830ydt000g2eku9ekj0djg	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9ario5000z28kc88hp8g4i	2026-02-06 07:18:58.908	2026-02-06 07:18:58.908	sit in a quiet place and watch the video carefully from the beginning to the end. pay close attention to the topic, explanations, and examples shown on the screen. pause the video when necessary to think, read, or take notes. repeat after the teacher when asked to do so. have your notebook, pen, and textbook ready before the lesson starts. try all examples and activities along with the teacher. rewatch any part of the video you do not understand. complete all exercises given at the end of the lesson. ask your teacher or parent for help if you are still confused. practice what you have learned after watching the video.
cmlal7bag004n28m1z58bgyo5	demand and supply	\N	1	cml9go7pr002928m18xksjmik	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9asnv9001128kcuc4gq69x	2026-02-06 07:51:54.031	2026-02-06 07:51:54.031	\N
cmlal8p5e004o28m1dqnh4ksl	national value education	the provided text outlines the fundamental principles of nigerian citizenship, emphasizing how shared standards of behavior foster a strong and unified nation. it defines national values as the ethical benchmarks that guide interpersonal relationships and social progress, specifically highlighting honesty, discipline, and respect for others.	1	cml9gl80u002328m1mofltpzd	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9ario5000z28kc88hp8g4i	2026-02-06 07:52:58.649	2026-02-06 07:52:58.649	sit in a quiet place and watch the video carefully from the beginning to the end. pay close attention to the topic, explanations, and examples shown on the screen. pause the video when necessary to think, read, or take notes. repeat after the teacher when asked to do so. have your notebook, pen, and textbook ready before the lesson starts. try all examples and activities along with the teacher. rewatch any part of the video you do not understand. complete all exercises given at the end of the lesson. ask your teacher or parent for help if you are still confused. practice what you have learned after watching the video.
cmlaoaxsx005128m1ghfqdggb	decimal point	this lesson teaches pupils what a decimal point is and how it is used to show parts of a whole, using simple and easy examples suitable for primary 1 learners.	2	cml9a8dbp000p28kc7ri7y9xk	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9al62d000q28kcq0i6bdw4	2026-02-06 09:18:42.023	2026-02-06 09:18:42.023	watch the video and read the pdf carefully. listen to the explanations, study the examples, and practice reading numbers with a decimal point.
cmlap834o005428m15whserp8	acid	this educational resource provides a comprehensive introduction to acidic substances tailored for high school chemistry students. it begins by defining an acid as a compound that generates hydrogen ions in aqueous solutions and details their distinct physical and chemical characteristics, such as a sour taste and low ph. the text organizes these substances into specific categories based on their molecular strength, their natural or mineral origins, and their basicity.	1	cmlan5gmo004s28m1y4hxzfiu	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9ario5000z28kc88hp8g4i	2026-02-06 09:44:28.575	2026-02-06 09:44:28.575	sit in a quiet place and watch the video carefully from the beginning to the end. pay close attention to the topic, explanations, and examples shown on the screen. pause the video when necessary to think, read, or take notes. repeat after the teacher when asked to do so. have your notebook, pen, and textbook ready before the lesson starts. try all examples and activities along with the teacher. rewatch any part of the video you do not understand. complete all exercises given at the end of the lesson. ask your teacher or parent for help if you are still confused. practice what you have learned after watching the video.
cmlaryhw6005828m1kjil4plu	what is government	this topic in government introduces students to the concept of government as an essential institution in society. it explains why government exists, how it operates, and its role in organizing society. the topic helps learners understand authority, leadership, law-making, and the relationship between the government and the people. it also lays the foundation for studying types, arms, and functions of government in later topics.	1	cml9gnfob002728m1bwdeh7cr	cml80jppv0000crvl8hh8fvb3	cml80jq9j0002crvldmoq6slk	t	cml9ap7c7000v28kcv28kd76q	2026-02-06 11:00:59.997	2026-02-06 11:00:59.997	watch the videos carefully, then complete the assessment based on what you learned.
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, school_id, email, password, first_name, last_name, phone_number, display_picture, gender, otp, otp_expires_at, is_email_verified, is_otp_verified, role, status, "createdAt", "updatedAt", "filesUploadedThisMonth", "lastFileResetDate", "lastTokenResetDateAllTime", "maxFileSizeMB", "maxFilesPerMonth", "maxMessagesPerWeek", "maxStorageMB", "maxTokensPerDay", "maxTokensPerWeek", "messagesSentThisWeek", "tokensUsedAllTime", "tokensUsedThisDay", "tokensUsedThisWeek", "totalFilesUploadedAllTime", "totalStorageUsedMB") FROM stdin;
cml83w0o9000p2ekuxhaye5eh	cml83gnpb000m2ekurf0586ak	itunu.towoju@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$Ke8FX48LQAYE5KrloJmb3Q$Cp4U41HlTbiXo+oBH51RZaJRlHe/AEFgWiNuv0G31mk	Towoju	Itunuoluwa	+000-000-0000	\N	other	056640	2026-02-05 12:20:09.159	t	f	super_admin	active	2026-02-04 14:11:41.289	2026-02-05 12:15:09.162	0	2026-02-04 14:11:41.289	2026-02-04 14:11:41.289	100	10	100	500	50000	50000	0	0	0	0	0	0
cml80jqg30003crvl90fsxtbn	cml80jppv0000crvl8hh8fvb3	access-study@smart-edu-hub.com	$argon2id$v=19$m=65536,t=3,p=4$EhbBxFeYqD5iegPLvgDhJg$pLFp0PodG4fwtFUCs7kgCyuldGqT2Fs3R5UQDArqhYk	School	Director	0912323367	\N	other		\N	t	f	school_director	active	2026-02-04 12:38:09.315	2026-02-04 12:44:56.659	0	2026-02-04 12:38:09.315	2026-02-04 12:38:09.315	100	10	100	500	50000	50000	0	0	0	0	0	0
cml80z72w0004crvlbgo80661	cml80jppv0000crvl8hh8fvb3	principal1@smart-edu-hub.com	$argon2id$v=19$m=65536,t=3,p=4$fPpmxgSJaHMPHl//r3PJaA$oTLMH649BcChSzBq6dp3E3KAfzwtRqI7zpYbMNl9WX4	principal	director	1234567890	\N	other		\N	t	f	school_director	active	2026-02-04 12:50:10.497	2026-02-04 12:52:58.262	0	2026-02-04 12:50:10.497	2026-02-04 12:50:10.497	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9htl6h002v28m1shx5mhvg	cml80jppv0000crvl8hh8fvb3	fayokemi.makinde@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$r4Gq2SRt2i4M+u2VCsvWzw$J/vJx0PyBuDc+EgkWX2xWkBlJ9wCEiVzw6uEsIi7veY	FAYOKEMI ELIZABETH	MAKINDE 	07033625503	\N	female		\N	t	t	student	active	2026-02-05 13:29:28.696	2026-02-05 13:29:28.696	0	2026-02-05 13:29:28.696	2026-02-05 13:29:28.696	100	10	100	500	50000	50000	0	0	0	0	0	0
cml83gnwi000n2ekuvavs3dg0	cml83gnpb000m2ekurf0586ak	basma.arikalamu@accessiblepublishers.com	smartedu	Basma	Arikalamu	+000-000-0000	\N	other	963287	2026-02-04 14:11:49.997	t	t	super_admin	active	2026-02-04 13:59:44.898	2026-02-04 14:06:49.999	0	2026-02-04 13:59:44.898	2026-02-04 13:59:44.898	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9h36e8002h28m1sv1rp84q	cml80jppv0000crvl8hh8fvb3	accessstudy03@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$eOT6+ZKak1d1F9FeCkaPKQ$q/hLUXQ4Scvf05LL0lXApEqkyjOmB702RAYhXgei6tI	Oluwagbenga	Ige	07033625503	\N	male		\N	t	f	student	active	2026-02-05 13:08:56.48	2026-02-05 13:10:49.571	0	2026-02-05 13:08:56.48	2026-02-05 13:08:56.48	100	10	100	500	50000	50000	0	0	0	0	0	0
cml83n6p6000o2ekuxyjk1s76	cml83gnpb000m2ekurf0586ak	deborah.akinruli@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$LwbB6tlyqCGZHUAcDmTbzw$vlwh9djZMOoFWqoS3VH+O22x7e9cWec1WrsMsXNl0SQ	Deborah	Akinruli	+000-000-0000	\N	other		\N	t	f	super_admin	active	2026-02-04 14:04:49.194	2026-02-04 14:08:20.825	0	2026-02-04 14:04:49.194	2026-02-04 14:04:49.194	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hjqb8002j28m1wn2gppg0	cml80jppv0000crvl8hh8fvb3	aliu.kareem@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$SrvGyQr98o6EqxioYa6u+Q$VHbXdgBLhVBoootoJtx2JQerxnTt3t17LTf5XKE7KAE	Aliu atanda 	Kareem 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 13:21:48.788	2026-02-05 13:21:48.788	0	2026-02-05 13:21:48.788	2026-02-05 13:21:48.788	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hkmn7002l28m19l6h4ufr	cml80jppv0000crvl8hh8fvb3	adams.odeyeyiwa@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$nCyvuFg2dirt4YWSBiD9tQ$njbZBFxI31rbvCi5PUewrrqSk7ftNZEryk2478RYFoo	Odeyeyiwa 	Adams 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 13:22:30.691	2026-02-05 13:22:30.691	0	2026-02-05 13:22:30.691	2026-02-05 13:22:30.691	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hn1lp002n28m14s6isua4	cml80jppv0000crvl8hh8fvb3	Kemi.oyeyele@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$qXGYh5DlJn55gUrLc6fEpQ$FKVvBOPj7lk85JVoCX9EnvsNNvmrFMZhVHHz8klkNFQ	Oluwakemi Ipemeshinegba 	Oyeyele 	07033625503	\N	female		\N	t	t	student	active	2026-02-05 13:24:23.389	2026-02-05 13:24:23.389	0	2026-02-05 13:24:23.389	2026-02-05 13:24:23.389	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9al62d000q28kcq0i6bdw4	cml80jppv0000crvl8hh8fvb3	igeoluwagbenga01@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$DucKnJFlvJFYJPxQNAUmkA$Wr6gFau97P3AboaQpHTe6qO7qeZE8vNDlt0vfvo2ykg	Oluwagbenga	Ige	09029399294	\N	other		\N	t	f	teacher	active	2026-02-05 10:06:58.549	2026-02-05 10:27:05.444	0	2026-02-05 10:06:58.549	2026-02-05 10:06:58.549	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hqjx1002p28m1u8i144pq	cml80jppv0000crvl8hh8fvb3	adeyinka.adebisi@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$VCpYaSr+jmPNOd3tOFSrGA$vUfAbrOls10HQeFQIxd8+rlywans6pfULb+Ia5jkTD0	Adeyinka	Adebisi	07033625503	\N	male		\N	t	t	student	active	2026-02-05 13:27:07.093	2026-02-05 13:27:07.093	0	2026-02-05 13:27:07.093	2026-02-05 13:27:07.093	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9huxur002x28m1gpvjsput	cml80jppv0000crvl8hh8fvb3	oreoluwa.okeleye@accessibleplublishers.com	$argon2id$v=19$m=65536,t=3,p=4$whqeNFFmUODUsbUGTKSnKw$laHRpnHVQ24WXvbO7+n/XzDoQ292svAzkhkHzG8OtcQ	Oreoluwa 	Okeleye 	07033625503	\N	female		\N	t	t	student	active	2026-02-05 13:30:31.779	2026-02-05 13:30:31.779	0	2026-02-05 13:30:31.779	2026-02-05 13:30:31.779	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hryg2002t28m14yf50k1r	cml80jppv0000crvl8hh8fvb3	morenikeji.fadoju@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$cXfM0il3Pon4o0sAw2rjFw$TQGGRSTqmYxvqiJkiZs0Y30mz4I8h0w7F6Gi0yQO3MA	Rebecca	Fadoju 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 13:28:12.578	2026-02-05 13:28:12.578	0	2026-02-05 13:28:12.578	2026-02-05 13:28:12.578	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hw0o0003128m1inywvxz8	cml80jppv0000crvl8hh8fvb3	Wunmi@buybooks.ng	$argon2id$v=19$m=65536,t=3,p=4$rDdL1gntZc5EfeIAuyR3TQ$PcX9zqBFxtMCTylegG+17HynvUUYyO6hn6LH2TiumIg	Omowunmi Gbemisola	 Ijiyode	07033625503	\N	female		\N	t	t	student	active	2026-02-05 13:31:22.08	2026-02-05 13:31:22.08	0	2026-02-05 13:31:22.08	2026-02-05 13:31:22.08	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9aq8zt000x28kc6b6tji59	cml80jppv0000crvl8hh8fvb3	akinruliayomide4@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$I9fK5U2cOPdDGcWUI964Ew$qC0mveL7t9Q4bakSDbBEME/l0C6fCWnu/DuMRFmwAAc	Deborah	Akinruli 	09035069117	\N	other		\N	t	f	teacher	active	2026-02-05 10:10:55.624	2026-02-05 13:55:13.066	0	2026-02-05 10:10:55.624	2026-02-05 10:10:55.624	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9ario5000z28kc88hp8g4i	cml80jppv0000crvl8hh8fvb3	arikalamubasma@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$HUnv7xedChubNTvX1j+HHg$UHQx4Z9OszqbK4i2giTHtu18xOKvJBFN7L5AhXseggI	Basma Busayo 	Arikalamu 	08142812650	\N	other		\N	t	f	teacher	active	2026-02-05 10:11:54.821	2026-02-05 13:54:09.767	0	2026-02-05 10:11:54.821	2026-02-05 10:11:54.821	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9an6f9000t28kcejdr6glo	cml80jppv0000crvl8hh8fvb3	seyihaladay@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$fi+nON727BeIKB3v78zTyQ$OgDdLywgMc2/FDMpEmJ1SzSV8zReEt8iu13jFW6YfmE	Alade	Seyi	08118491929	\N	other		\N	t	f	teacher	active	2026-02-05 10:08:32.325	2026-02-05 14:03:30.436	0	2026-02-05 10:08:32.325	2026-02-05 10:08:32.325	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9ap7c7000v28kcv28kd76q	cml80jppv0000crvl8hh8fvb3	towojupatricia@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$NuMX/nLlVLOlclKjcauOzA$tSAHufboiOkyZOCkIySGfV3s0DVE4Wzwkvana4MVzm8	Itunuoluwa Patricia	Towoju 	08138731988	\N	other		\N	t	f	teacher	active	2026-02-05 10:10:06.823	2026-02-05 14:07:20.476	0	2026-02-05 10:10:06.823	2026-02-05 10:10:06.823	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hvfrf002z28m1licqphdx	cml80jppv0000crvl8hh8fvb3	pelumi.sogbetun@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$S9BhR5lifweA5o03Dk4e2w$1kyfYkLmsidnySMyjqL9Sm6SXw+swEksWd+XnXaKZd8	Oluwapelumi	Sogbetun 	07033625503	\N	male		\N	t	f	student	active	2026-02-05 13:30:54.987	2026-02-06 08:14:20.774	0	2026-02-05 13:30:54.987	2026-02-05 13:30:54.987	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9hr9wz002r28m1u9b28mfc	cml80jppv0000crvl8hh8fvb3	inegbedion.victory@rasmedpublications.com	$argon2id$v=19$m=65536,t=3,p=4$fepgryLlAE2RS53WMu0GcA$QNvKnfF3loy6VrSNT/i1AOImLlBaxWsE59Um+YVXMP4	Victory 	Inegbedion 	07033625503	\N	male		\N	t	f	student	active	2026-02-05 13:27:40.787	2026-02-06 08:32:13.301	0	2026-02-05 13:27:40.787	2026-02-05 13:27:40.787	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9i75lx003328m1me33b7gm	cml80jppv0000crvl8hh8fvb3	pelumisogbetun@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$SX6fOjVW9Scbrd/MLm2oPA$Mro/HBHxpHAXYM9+Df6BPZGSbIGThkW+QrwUKG74c7g	Sogbetun	Pelumi	07033625503	\N	male		\N	t	t	student	active	2026-02-05 13:40:01.701	2026-02-05 13:40:01.701	0	2026-02-05 13:40:01.701	2026-02-05 13:40:01.701	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9asnv9001128kcuc4gq69x	cml80jppv0000crvl8hh8fvb3	kolawolesharon9@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$AwrHw5AMSTLMcqkkPRGjeA$jo/kbICdyDkksN5DJYClxhuB5YjOUeJ7VUwc2piFOcE	Oluwalana Sharon	Kolawole 	08124824648	\N	other		\N	t	f	teacher	active	2026-02-05 10:12:48.213	2026-02-05 13:53:15.474	0	2026-02-05 10:12:48.213	2026-02-05 10:12:48.213	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9jyehf003j28m1ri38jj74	cml80jppv0000crvl8hh8fvb3	daramolaluke17@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$KmyciJVdvEEKWt8HQTtpXA$ZwMrYY5P0irk0U7Qv/50yiw5dI8eLl9ZpNkcsgQ0UA8	 LUKE	DARAMOLA	07033625503	\N	male		\N	t	t	student	active	2026-02-05 14:29:12.531	2026-02-05 14:29:12.531	0	2026-02-05 14:29:12.531	2026-02-05 14:29:12.531	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9k02hr003l28m1yh1pmge3	cml80jppv0000crvl8hh8fvb3	davidowolabi000@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$Sx+yLqeHBjolYuaTZftNRg$cv6O/pmhRPtOcOCguMspr/QA30r3zh4KwmN4jNSFaq4	OWOLABI	DAVID OWOLABI	07033625503	\N	male		\N	t	t	student	active	2026-02-05 14:30:30.303	2026-02-05 14:30:30.303	0	2026-02-05 14:30:30.303	2026-02-05 14:30:30.303	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9k2260003n28m1xoqdetrc	cml80jppv0000crvl8hh8fvb3	nwaefuluchristy@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$HuWrkp003+PYj5Cx6HDhTQ$cAreLsKktiZdj+KVuYp0dPYdo9PUIqkSWOojaP9uDrY	CHRISTIANAH	NWAEFULU 	07033625503	\N	female		\N	t	t	student	active	2026-02-05 14:32:03.192	2026-02-05 14:32:03.192	0	2026-02-05 14:32:03.192	2026-02-05 14:32:03.192	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlf8n4hm000627h1tl1jfltf	cmlf8n44o000327h1w5mi08k0	ncc@smart-edu-hub.com	$argon2id$v=19$m=65536,t=3,p=4$KBQbU1p4Zkatzr2116PBZQ$i1O/hgUmxRghcWzhJArtufgolafs3deYfejch8DI8p8	School	Director	08146694787	{"key": "schools/nigerian_copyright_commission/onboarding/icon/school_icon_1770645546234.jpeg", "url": "https://smart-edu-s3-staging.s3.us-east-1.amazonaws.com/schools/nigerian_copyright_commission/onboarding/icon/school_icon_1770645546234.jpeg", "etag": "\\"da74d7a596aa9df851f3e57dd5f210e8\\"", "bucket": "smart-edu-s3-staging", "uploaded_at": "2026-02-09T13:59:06.933Z"}	other		\N	t	f	school_director	active	2026-02-09 13:59:07.642	2026-02-09 14:04:29.399	0	2026-02-09 13:59:07.642	2026-02-09 13:59:07.642	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9jq98f003h28m10vqc78vk	cml80jppv0000crvl8hh8fvb3	accessstudy02@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$6RjACgKHg50sJ/ketRr6lQ$daPa3XbfyqPiM8e3h3xFY4h0kIHnCgs5hx58QD4KzbM	Oluwagbenga	Ige	09029399294	\N	male		\N	t	f	student	active	2026-02-05 14:22:52.478	2026-02-05 14:36:59.476	0	2026-02-05 14:22:52.478	2026-02-05 14:22:52.478	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9kt2e2003t28m138tvkzqq	cml80jppv0000crvl8hh8fvb3	boluwatifeayilara069@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$iG1y/UWkrdacVQ+xE2pJSA$886wjhbOacWasp8JE6mAYeqAbt5E8VpxT5/84TQ/0Aw	BOLUWATIFE ADEOLU	AYILARA 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 14:53:03.194	2026-02-05 14:53:03.194	0	2026-02-05 14:53:03.194	2026-02-05 14:53:03.194	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9ku5cr003v28m1ctkchixa	cml80jppv0000crvl8hh8fvb3	ayinka203@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$PO4lNEk7lemyVxN8pZjR6g$9umQ5X9R0ekws7CGa606pF+8zkw3y8VNz8Vv/DCA/N8	ADEYINKA	ADETORO 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 14:53:53.691	2026-02-05 14:53:53.691	0	2026-02-05 14:53:53.691	2026-02-05 14:53:53.691	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9kuzdb003x28m1v6c0y6at	cml80jppv0000crvl8hh8fvb3	shittuebunoluwa1@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$dPmvsw+DPZrmLPcQjMWkJA$0jtMCEtwqaFAIEijae/67Qq7S9nwRp+33c3ZNt4jLT4	ZAINAB EBUNOLUWA	SHITTU 	07033625503	\N	male		\N	t	t	student	active	2026-02-05 14:54:32.591	2026-02-05 14:54:32.591	0	2026-02-05 14:54:32.591	2026-02-05 14:54:32.591	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9kzuiy004128m1t1odir8d	cml80jppv0000crvl8hh8fvb3	Seun.owolabi@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$B/8Sauafwt67hHwVGKEdlg$Z+8oYj8mlH0QauYKYu+Qv2zZlFP57f5lNEwxAB6ZgQc	OWOLABI	 Seun R	07033625503	\N	female		\N	t	t	student	active	2026-02-05 14:58:19.594	2026-02-05 14:58:19.594	0	2026-02-05 14:58:19.594	2026-02-05 14:58:19.594	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9ldbei004828m1jrgdv0ju	cml80jppv0000crvl8hh8fvb3	seyi.akinmoye@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$NuL0NTMZvxIXH2Tx2IHI3w$Ost/b728UDtjz6lCYpzPOkMAQXicC3+Ox3hRFVpuVNM	Seyi Deborah	Akinmoye  	07033625503	\N	female		\N	t	t	student	active	2026-02-05 15:08:47.994	2026-02-05 15:08:47.994	0	2026-02-05 15:08:47.994	2026-02-05 15:08:47.994	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9kyodu003z28m13u402t5v	cml80jppv0000crvl8hh8fvb3	bolaji.iyanda@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$QoeE+w7tmw4VTU3Tzrtivw$t3RHp2jgIJJ99764Ak9IrxUGEjUAlpCeUfDupi7PzOU	Bolaji Adedamola	Iyanda 	07033625503	\N	female		\N	t	f	student	active	2026-02-05 14:57:24.978	2026-02-06 10:06:12.582	0	2026-02-05 14:57:24.978	2026-02-05 14:57:24.978	100	10	100	500	50000	50000	0	0	0	0	0	0
cml9ldyzy004a28m1fke1wg1r	cml80jppv0000crvl8hh8fvb3	uchechukwu.nwafor@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$roh7DdJaefGWYDN+p1xUMQ$3Je02lfvahwoJvMlGdZKgPf1OS5Rjx2aD1CTV6q81/4	Judith Nwafor	Uchechukwu 	07033625503	\N	female		\N	t	f	student	active	2026-02-05 15:09:18.574	2026-02-06 08:28:25.172	0	2026-02-05 15:09:18.574	2026-02-05 15:09:18.574	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlan7tqb004u28m1xsncfxdt	cml80jppv0000crvl8hh8fvb3	ruth@buybooks.ng	$argon2id$v=19$m=65536,t=3,p=4$NNv11YTG43H3UkTCcS09Yg$Tc2lnyXuQ9Nw72K1Hl9dbXGBc4ZsUQTgLdloyLMHMvs	Miss	Iyanu	07033625503	\N	female		\N	t	t	student	active	2026-02-06 08:48:17.219	2026-02-06 08:48:17.219	0	2026-02-06 08:48:17.219	2026-02-06 08:48:17.219	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlana1kp004w28m1l764i7on	cml80jppv0000crvl8hh8fvb3	adminho@accessiblepublishers.com	$argon2id$v=19$m=65536,t=3,p=4$RuZDhPAyDuCfLVjxKdA4Fw$6kelbHrnidRdOr8B6VEqSJcO9w8dVWPl2gCam135fqU	Sodiq Oluwagbenga	Raufu 	07033625503	\N	male		\N	t	t	student	active	2026-02-06 08:50:00.697	2026-02-06 08:50:00.697	0	2026-02-06 08:50:00.697	2026-02-06 08:50:00.697	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlfbp5ek000x5wlk6fn2vjyj	cmlfbp5cw000u5wlkfgpcgols	princejeddy2007@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$PCL4fOjOc61kgpvTl2hPzg$GOqsMKILeow9Gycd/6ZB9ejRg00y3umlkDzzLjQQ0Ks	School	Director	07033625503	\N	other		\N	t	t	school_director	active	2026-02-09 15:24:40.988	2026-02-09 15:24:40.988	0	2026-02-09 15:24:40.988	2026-02-09 15:24:40.988	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlfe01wt00685wlk9eu9uob1	cmlfbp5cw000u5wlkfgpcgols	accessstudy005@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$0um8hfJI836nuaLc/6SdjQ$2Z/n14vW8eiFr6nQvnzvqYV/NkAmI5gnISHBTeVDZiI	oluwagbenga	ige	08012345678	\N	other		\N	t	t	student	active	2026-02-09 16:29:08.909	2026-02-09 16:29:08.909	0	2026-02-09 16:29:08.909	2026-02-09 16:29:08.909	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgn35xx00ah5wlkmm250tqj	cmlfbp5cw000u5wlkfgpcgols	lamidiyusuf88@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$q5JqHfzCA9NLV/4A7VBUTw$k4Q+tCwrLQcHb37F1CQkVltjgiXRXzFVLwegzXw603E	yusuf	lamidi	07033625503	\N	other		\N	t	f	student	active	2026-02-10 13:31:16.821	2026-02-10 13:32:54.803	0	2026-02-10 13:31:16.821	2026-02-10 13:31:16.821	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgnf0bm00ak5wlkp0ydvucu	cmlfbp5cw000u5wlkfgpcgols	oyewosemiloore@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$w1XYU8AQqVrH8EgrHQsXUg$rEI0+6JAMY8XO3tYAymdu/hHblgnQFD0Y19SdPhybz0	semiloore	oyewo	07033625503	\N	other		\N	t	f	student	active	2026-02-10 13:40:29.41	2026-02-10 14:19:10.902	0	2026-02-10 13:40:29.41	2026-02-10 13:40:29.41	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgpei9u00an5wlkgmfvg1z2	cmlfbp5cw000u5wlkfgpcgols	sannioluwaseyi123@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$o3P3+dfcA9la8iZolfGmbg$FG0LaaOviQ0HYKOzCxJxX3H42QJbVPLoUW9kIbSvo3c	oluwaseyi	sanni	07033625503	\N	other		\N	t	f	student	active	2026-02-10 14:36:05.25	2026-02-10 14:37:55.991	0	2026-02-10 14:36:05.25	2026-02-10 14:36:05.25	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgs899n00au5wlkvetsfos2	cmlfbp5cw000u5wlkfgpcgols	oluwafemiadeniran471@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$GXZVYkg1eK2ei1/V24PSQQ$JA8P/p8xjrW09rCloSm55Mr18l4r6dchnacEPH+Vxpw	adeniran	kehinde	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:55:12.491	2026-02-10 15:55:12.491	0	2026-02-10 15:55:12.491	2026-02-10 15:55:12.491	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlh2vfn100bd5wlk96y5uv6c	cmlfbp5cw000u5wlkfgpcgols	oluwagbengataofeekige@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$c6jh+Ci2MvM4WND+oN+EpA$gu9Ey9IxxNjnfWPmhj448olcBUagSK+lmFvJvr5lKIg	oluwagbenga	ige	09029399294	\N	other		\N	t	f	teacher	active	2026-02-10 20:53:09.997	2026-02-10 20:58:37.101	0	2026-02-10 20:53:09.997	2026-02-10 20:53:09.997	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhqm5ey00bg5wlkpirnipyx	cmlfbp5cw000u5wlkfgpcgols	soliatadebayosmart@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$ZjflbAdfPrfdsLhoZI3z3g$Nn6QPg2hh2kOXzBDj0SVdwoYEFcaHhJ1YXcYqyzy6rc	soliat	adebayo	07033625503	\N	other		\N	t	f	student	active	2026-02-11 07:57:47.626	2026-02-11 08:10:52.908	0	2026-02-11 07:57:47.626	2026-02-11 07:57:47.626	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhrvnt600bj5wlk8wbqq5dv	cmlfbp5cw000u5wlkfgpcgols	ramontiawosmart@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$kuaq9BW+b+paogEoNxNc8g$uN8PAt2b3UGb50PoNdqoHkwbX3tPkLVlLDuYe6bm1Eo	tiawo	ramon	07033625503	\N	other	809164	2026-02-11 08:42:22.353	t	t	student	active	2026-02-11 08:33:10.986	2026-02-11 08:37:22.355	0	2026-02-11 08:33:10.986	2026-02-11 08:33:10.986	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhslazt00bs5wlksfywiw4d	cmlfbp5cw000u5wlkfgpcgols	semilooreolabiyi@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$SSCTLGjxCStUVgVlPSYvog$Pena2GxWAjPfpfyyV3O25niN3E9jH9zO/SSZK8OJ20o	semiloore	olabiyi	07033625503	\N	other		\N	t	f	student	active	2026-02-11 08:53:07.433	2026-02-11 08:55:50.405	0	2026-02-11 08:53:07.433	2026-02-11 08:53:07.433	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgsafwk00ax5wlkt6bpealo	cmlfbp5cw000u5wlkfgpcgols	wemimoadelokun@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$lz/WVUG13cDAb8oibxhpoQ$P/OtoVHnz3uO6Ndcrx/4yFHBblkX1plvuWc6/9E/mDE	adelokun	wemimo	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:56:54.404	2026-02-10 15:56:54.404	0	2026-02-10 15:56:54.404	2026-02-10 15:56:54.404	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhrwddb00bm5wlkd3neolp3	cmlfbp5cw000u5wlkfgpcgols	ramonkehindesmart@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$GUVyCCPuIl/41SAixRQpXw$GM9HYM3kXAK69d95dBonW1P1NyG7bAjBngWQVFm+iLw	kehinde	ramon	07033625503	\N	other		\N	t	f	student	active	2026-02-11 08:33:44.111	2026-02-11 08:39:17.902	0	2026-02-11 08:33:44.111	2026-02-11 08:33:44.111	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhsqlvl00bv5wlkxh8urpsu	cmlfbp5cw000u5wlkfgpcgols	olabiyitunmisesmart@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$6esQejy3yy2iXgF4IXIu2A$5u9TCkAMO/AkncgcIx0PQiAe9rAjo5HnVrgdz1+4EmA	tunmise	olabiyi	07033625503	\N	other		\N	t	f	student	active	2026-02-11 08:57:14.817	2026-02-11 08:57:53.9	0	2026-02-11 08:57:14.817	2026-02-11 08:57:14.817	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgsb90500b05wlkvd7xzygl	cmlfbp5cw000u5wlkfgpcgols	gracemayowa240@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$2yoz3E1dpuaMjGBAkWuHdA$EkUPb+6+qtHwWMFJSoRdwnzra/Vyb6NNJAzNJglCteA	mayowa	daramola	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:57:32.117	2026-02-10 15:57:32.117	0	2026-02-10 15:57:32.117	2026-02-10 15:57:32.117	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlhs8h5v00bp5wlkxaszqxjs	cmlfbp5cw000u5wlkfgpcgols	ramontaiwosmart@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$xzZSr10WYof4gApisBh3hA$tU2R77Wlp+KkptXHq5aKtne29QHAgDEGk6fJqDpkSkQ	taiwo	ramon	07033625503	\N	other		\N	t	f	student	active	2026-02-11 08:43:08.899	2026-02-11 08:46:05.506	0	2026-02-11 08:43:08.899	2026-02-11 08:43:08.899	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgsbyiz00b35wlk180yp44n	cmlfbp5cw000u5wlkfgpcgols	olanikebakare5@icloud.com	$argon2id$v=19$m=65536,t=3,p=4$5bXyaI1EqGQS0EBXKr44bQ$EJ/1pPFNwmgpnZv5ioNwT0WnDgqlOI/CSNKwcGHdua8	bakare	olaniran	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:58:05.195	2026-02-10 15:58:05.195	0	2026-02-10 15:58:05.195	2026-02-10 15:58:05.195	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglm2te009e5wlk5cvhyb9u	cmlfbp5cw000u5wlkfgpcgols	adeyemiolaoluwa027@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$rjcws2/FzM0+eUoEnOtXeg$csc562vgL/QZmFykESdhZKSI6NYST0uGaOevOY358+k	olaoluwa	adeyemi	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:50:00.002	2026-02-10 14:45:32.402	0	2026-02-10 12:50:00.002	2026-02-10 12:50:00.002	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglb3an008z5wlkjdwtjsup	cmlfbp5cw000u5wlkfgpcgols	owolabidaniel603@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$JaYOKRumwHpLCylEhQWhVw$4VrnKaBLANiF7v6G8YBC74o+tDcucR127V2Yme48n7w	daniel	owolabi		\N	other		\N	t	f	student	active	2026-02-10 12:41:27.407	2026-02-10 13:26:18.404	0	2026-02-10 12:41:27.407	2026-02-10 12:41:27.407	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgk9wb9008d5wlkby86o8pb	cmlfbp5cw000u5wlkfgpcgols	blessingandrew323@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$qDjrnC4NLTnQxzJITr13mg$DAoxHm5xVx1Ayh0SoGmZnp2roCmye4OhH8AhESL3lcM	blessing	andrew	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:12:32.084	2026-02-10 14:38:49.003	0	2026-02-10 12:12:32.084	2026-02-10 12:12:32.084	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglcm5x00925wlkphonrfrp	cmlfbp5cw000u5wlkfgpcgols	adepojuabidah@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$kAsl3gFDdNdnXn51AMLXew$dSSWV8TetQ4PR2sHs5Y/bo1rbhVnCTbAbvHGIeoPWrg	abidah	adepoju	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:42:38.517	2026-02-10 13:34:18.796	0	2026-02-10 12:42:38.517	2026-02-10 12:42:38.517	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgldma000955wlkvkrqg6vy	cmlfbp5cw000u5wlkfgpcgols	oyeowosemiloore@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$WmgIEgQIlrJQR73e5BlH6w$hAHnfcU8XR/zuT/5kIzSNYyuaWXbp6MOZ3g5kwm4wTY	semiloore	oyewo		\N	other	011220	2026-02-10 13:39:45.676	t	t	student	active	2026-02-10 12:43:25.32	2026-02-10 13:34:45.678	0	2026-02-10 12:43:25.32	2026-02-10 12:43:25.32	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglf95500985wlk606leq1w	cmlfbp5cw000u5wlkfgpcgols	arekhadijat@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$0QD11irqJDo7yCgl1yIZJA$zXJWtC3+eCnSSBjhjUjSdC66jc+05yZ5WsDMK9KQn+Y	khadijat	are	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:44:41.609	2026-02-10 13:37:22.69	0	2026-02-10 12:44:41.609	2026-02-10 12:44:41.609	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgk9wbv008e5wlkgky362ae	cmlfbp5cw000u5wlkfgpcgols	sannioluwasey123@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$a62XVLsEDZcZV3Go9ZARNQ$QkGKAcKcs7hXTzlD0+1xFkB8XRbwpBtAa0X139ru2BI	oluwaseyi	sanni	07033625503	\N	other	595179	2026-02-10 14:25:41.66	t	t	student	active	2026-02-10 12:12:32.107	2026-02-10 14:20:41.662	0	2026-02-10 12:12:32.107	2026-02-10 12:12:32.107	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgk7o0j008a5wlkhwsxr129	cmlfbp5cw000u5wlkfgpcgols	adedapomr@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$l+8ACV+z4Pv5LOeWx7ZLiw$noGRYlfEsQsm2SVKPFaeUfpgv4LEdFIsVHv4QYKeNFg	mary	adedapo	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:10:48.019	2026-02-10 14:39:33.249	0	2026-02-10 12:10:48.019	2026-02-10 12:10:48.019	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglaar2008w5wlkxets2z7q	cmlfbp5cw000u5wlkfgpcgols	lamidiyusuf88@gmai;.com	$argon2id$v=19$m=65536,t=3,p=4$SaJKpGjGgfO5wnZQp+IvWQ$lF6XsBOyrT6qCxAG45bzUjnFoSLcjLNdM9SSjMi0Jtg	yusuf	lamidi	07033625503	\N	other		\N	t	t	student	active	2026-02-10 12:40:50.414	2026-02-10 12:40:50.414	0	2026-02-10 12:40:50.414	2026-02-10 12:40:50.414	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgll5st009b5wlkzqnc0fse	cmlfbp5cw000u5wlkfgpcgols	omoyemiibrahim54@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$C2V1mOIsw+Lng1y7H6VGcw$Ua+APLh7GK59ZaGIdsw1PMDRIFzSpEb/w05Nj6fLgx4	ibrahim	omoyemi	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:49:17.213	2026-02-10 14:46:45.902	0	2026-02-10 12:49:17.213	2026-02-10 12:49:17.213	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgl50ml008q5wlk3h6aytwu	cmlfbp5cw000u5wlkfgpcgols	badekalepeliah@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$0XX/R7+eniqXvrvCY6aGMw$E7a3tfkh9Z/wBrx4Ih/4HtNcNRGMN91RTw2uIvYcoFU	peliah	badekale	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:36:44.013	2026-02-10 13:18:49.207	0	2026-02-10 12:36:44.013	2026-02-10 12:36:44.013	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgkxoce008m5wlkv6xcw7j3	cmlfbp5cw000u5wlkfgpcgols	omosunladedamilare@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$UreJFSuxQKyp2xsPsi/+Sg$3tK0+lrMoG8GEyanWFJc/QjicblxQb7fdaB/vrzhkHU	damilare	omosunlade	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:31:01.502	2026-02-10 13:22:27.601	0	2026-02-10 12:31:01.502	2026-02-10 12:31:01.502	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgl9dn1008t5wlk0o9hocym	cmlfbp5cw000u5wlkfgpcgols	saheedolatunji844@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$3gyb1foKGoh94lwkEGBvkg$YDDKkTL4W3y4XOymOEaCZ+nmdWX7zcxIArcsAOdAkgs	saheed	olatunji	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:40:07.501	2026-02-10 13:24:12.002	0	2026-02-10 12:40:07.501	2026-02-10 12:40:07.501	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglog8s009h5wlkvbjgyqty	cmlfbp5cw000u5wlkfgpcgols	khodijatsalisu@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$3ZeX/zhnl4CX9Vx/GEbWaw$9SllA4kr9rO8Dcfh3GIvPKUWj7dsqU7Il0ttmQK0dZY	khodijhat	salisu	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:51:50.716	2026-02-10 14:47:35.097	0	2026-02-10 12:51:50.716	2026-02-10 12:51:50.716	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgsd09k00b65wlkye34nnf0	cmlfbp5cw000u5wlkfgpcgols	ttijani543@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$uE582JhjdHxNOZkCa83GYw$8+PI0NKtLXZHlcE7GvALL6dJiVtmWn+LyvgDw9AWFmg	deborah	olalekan	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:58:54.104	2026-02-10 15:58:54.104	0	2026-02-10 15:58:54.104	2026-02-10 15:58:54.104	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgsdv1t00b95wlk17reoupv	cmlfbp5cw000u5wlkfgpcgols	akinsuyiayomide3@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$U6zfuClC5TyR9KEZiS8oeA$lTbP8UPt7oKdrgsgFYrcoRAmosLUDnuSCg9iVHw1Oi8	ayomide	akinsuyi	07033625503	\N	other		\N	t	t	teacher	active	2026-02-10 15:59:34.001	2026-02-10 15:59:34.001	0	2026-02-10 15:59:34.001	2026-02-10 15:59:34.001	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglt62j009w5wlkc6vycn9y	cmlfbp5cw000u5wlkfgpcgols	soliatadebayo4@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$uXDd+lOspTBkCrVejUPgrg$L1bzYhR2X97a1JKLlzFwCgT4LPQq7LecD0VhT7fKzEA	soliat	adebayo		\N	other		\N	t	t	student	active	2026-02-10 12:55:30.811	2026-02-10 12:55:30.811	0	2026-02-10 12:55:30.811	2026-02-10 12:55:30.811	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgltzj8009z5wlkkgp1b5hy	cmlfbp5cw000u5wlkfgpcgols	olabiyitummise418@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$S+jxssB3r9RCOHoXp1X2bQ$TW/w6myS9MVVQK0AiQDv9tshy6JdMFAyyD53Dlwp2k0	tunmise	olabiyi	07033625503	\N	other		\N	t	t	student	active	2026-02-10 12:56:08.996	2026-02-10 12:56:08.996	0	2026-02-10 12:56:08.996	2026-02-10 12:56:08.996	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglvgbs00a25wlku670g5km	cmlfbp5cw000u5wlkfgpcgols	adesewaadegbola7@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$E+r/adIQKxy60bvsjoN2og$A2iQoDhm4pPRQa4+uVP/R6Eps8ZkmAytnRnx3lQw+/0	adesewa	adegbola	07033625503	\N	other		\N	t	t	student	active	2026-02-10 12:57:17.416	2026-02-10 12:57:17.416	0	2026-02-10 12:57:17.416	2026-02-10 12:57:17.416	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglw0e200a55wlk5vlyxed8	cmlfbp5cw000u5wlkfgpcgols	ramontiawo@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$Wi73NzIm9SUxZ1jG2sk4rA$vpTmba+gNOhfDqJ+lso20HINc94g6j35kNK1dZmqM2Y	tiawo	ramon	07033625503	\N	other		\N	t	t	student	active	2026-02-10 12:57:43.418	2026-02-10 12:57:43.418	0	2026-02-10 12:57:43.418	2026-02-10 12:57:43.418	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglwtuy00a85wlk8qdaphk1	cmlfbp5cw000u5wlkfgpcgols	ramonkehinde810@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$ZXa7OYjyatdRPjmOqxptbg$8i4cyPLw45K9iLIIfaHKuSzdGlgE82gqvdM0BpFz3vA	kehinde	ramon	07033625503	\N	other		\N	t	t	student	active	2026-02-10 12:58:21.61	2026-02-10 12:58:21.61	0	2026-02-10 12:58:21.61	2026-02-10 12:58:21.61	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgktlzb008i5wlk5pijtx7w	cmlfbp5cw000u5wlkfgpcgols	adenlamoridiya@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$DON9xwBYeM3ar5z9Gj3ong$E+PPeZ+biqZQr7UntVnpNnV1vFODWqp1/IvXAdveFvU	moridiyah	adenla	07033625503	\N	other	584432	2026-02-10 13:13:54.309	t	t	student	active	2026-02-10 12:27:51.815	2026-02-10 13:08:54.311	0	2026-02-10 12:27:51.815	2026-02-10 12:27:51.815	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlgmf9wz00ae5wlk8hkxhlpa	cmlfbp5cw000u5wlkfgpcgols	adenlamoridiyah@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$C3RBGAbGCnZne+InBlyS1w$/wgzmE/Ir4B0p0FzLK79S1/rfp7QPh5/KgdKJoHi7Iw	moridiyah	adenla	07033625503	\N	other		\N	t	f	student	active	2026-02-10 13:12:42.227	2026-02-10 13:14:50.409	0	2026-02-10 13:12:42.227	2026-02-10 13:12:42.227	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglpwbn009k5wlk7hzwatfi	cmlfbp5cw000u5wlkfgpcgols	basitadedotun9@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$tsPaZiADDCg6UYU+I5MQTA$o0c0anTMAQKTB0F+TFI6A2VtSppQIkXpv8tFqwHa0eg	basit	adedotun	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:52:58.211	2026-02-10 14:49:08.904	0	2026-02-10 12:52:58.211	2026-02-10 12:52:58.211	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglqqk3009n5wlksgnc5mmy	cmlfbp5cw000u5wlkfgpcgols	shalombenson4@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$pugFUEHaWeB79fZAR7Xmzw$nQ654MuPeIA5u2Pl6H8LiUmAdxecCq2aHSqnKxwi1KI	shalom	benson	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:53:37.395	2026-02-10 14:50:10.427	0	2026-02-10 12:53:37.395	2026-02-10 12:53:37.395	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglrugn009q5wlk28arfiko	cmlfbp5cw000u5wlkfgpcgols	sanniayomiposi226@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$yAD9fCj8IrSll4N2UAIJ/g$IxtJQirXAIPMA/iA6DN1BFuvOkzA/5JhRb0sy+Ww6yk	ayomiposi	sanni	07033625503	\N	other		\N	t	f	student	active	2026-02-10 12:54:29.11	2026-02-10 15:05:43.304	0	2026-02-10 12:54:29.11	2026-02-10 12:54:29.11	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglsgre009t5wlkev733ua9	cmlfbp5cw000u5wlkfgpcgols	ojop38979@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$VlyVKucnbm7nzMTxe9EKbg$4gOfzkaJhgdPEQRpp0kW/XEUtck7L43MbIvYCQKCEWU	paul	ojo	07033625503	\N	other	689620	2026-02-10 16:09:38.54	t	t	student	active	2026-02-10 12:54:58.01	2026-02-10 16:04:38.542	0	2026-02-10 12:54:58.01	2026-02-10 12:54:58.01	100	10	100	500	50000	50000	0	0	0	0	0	0
cmlglxcu900ab5wlkxkm9z7qa	cmlfbp5cw000u5wlkfgpcgols	olabiyisemiloore@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$orqDoF2HW9TH/ei6JGuMmg$Wzlt3/k3cVyM0Yv3tp3PIFq9cWlzAuyK7gUCdZruUCk	semiloore	olabiyi	07033625503	\N	other	724933	2026-02-11 08:51:20.443	t	t	student	active	2026-02-10 12:58:46.209	2026-02-11 08:46:20.445	0	2026-02-10 12:58:46.209	2026-02-10 12:58:46.209	100	10	100	500	50000	50000	0	0	0	0	0	0
\.


--
-- Data for Name: UserSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserSettings" (id, user_id, school_id, push_notifications, email_notifications, assessment_reminders, grade_notifications, announcement_notifications, dark_mode, sound_effects, haptic_feedback, auto_save, offline_mode, profile_visibility, show_contact_info, show_academic_progress, data_sharing, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VideoContent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VideoContent" (id, title, description, url, "schoolId", "platformId", "uploadedById", "createdAt", "updatedAt", topic_id, duration, size, status, thumbnail, views, "order", "hlsPlaybackUrl", "hlsS3Prefix", "hlsStatus", "videoS3Key") FROM stdin;
cml9idbrs003528m12d8en7qj	introduction to numbers	this video teaches pupils how to recognize and count numbers from 1–10 using simple examples. instruction: watch the video carefully and count along.	https://smart-edu-s3-staging.s3.amazonaws.com/Introduction_to_Numbers_1770299080760.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9al62d000q28kcq0i6bdw4	2026-02-05 13:44:49.559	2026-02-06 09:30:44.423	cml9bj2e0001428kcikjdvhhe	00:05:27	95.54 MB	published	{"public_id": "Introduction_to_Numbers_thumbnail_1770299085730.png", "secure_url": "https://smart-edu-s3-staging.s3.amazonaws.com/Introduction_to_Numbers_thumbnail_1770299085730.png"}	2	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cml9bj2e0001428kcikjdvhhe/cml9idbrs003528m12d8en7qj/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cml9bj2e0001428kcikjdvhhe/cml9idbrs003528m12d8en7qj	completed	Introduction_to_Numbers_1770299080760.mp4
cmlakbvtn004j28m1bx0pl1ql	history	this text outlines the historical progression of nigeria, starting with its diverse indigenous kingdoms and decentralized societies prior to european contact. it examines how early european trade relations eventually transitioned into british colonial dominance, highlighted by the pivotal 1914 amalgamation of the northern and southern protectorates.	https://smart-edu-s3-staging.s3.amazonaws.com/History_1770362840786.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 07:27:27.643	2026-02-06 07:40:14.266	cmlak0z9x004i28m1fr25v3qd	00:07:05	76.10 MB	published	{"public_id": "History_thumbnail_1770362844576.png", "secure_url": "https://smart-edu-s3-staging.s3.amazonaws.com/History_thumbnail_1770362844576.png"}	1	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlak0z9x004i28m1fr25v3qd/cmlakbvtn004j28m1bx0pl1ql/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlak0z9x004i28m1fr25v3qd/cmlakbvtn004j28m1bx0pl1ql	completed	History_1770362840786.mp4
cml9okf17004f28m1xgofy5fl	figure of specch	figures of speech are special ways of using words to make language more interesting, vivid, and expressive. writers, poets, speakers, and even everyday speakers use figures of speech to compare ideas, emphasize meaning, and create strong mental pictures.	https://smart-edu-s3-staging.s3.amazonaws.com/Figure_of_Specch_1770309493144.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-05 16:38:18.081	2026-02-05 16:40:00.982	cml9oas88004d28m1yf6aarjo	00:06:47	40.89 MB	published	{"public_id": "Figure_of_Specch_thumbnail_1770309495673.png", "secure_url": "https://smart-edu-s3-staging.s3.amazonaws.com/Figure_of_Specch_thumbnail_1770309495673.png"}	0	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cml9oas88004d28m1yf6aarjo/cml9okf17004f28m1xgofy5fl/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cml9oas88004d28m1yf6aarjo/cml9okf17004f28m1xgofy5fl	completed	Figure_of_Specch_1770309493144.mp4
cmlalrfbl004p28m1vj4y9axa	national value education	the provided text outlines the fundamental principles of nigerian citizenship, emphasizing how shared standards of behavior foster a strong and unified nation. it defines national values as the ethical benchmarks that guide interpersonal relationships and social progress, specifically highlighting honesty, discipline, and respect for others.	https://smart-edu-s3-staging.s3.amazonaws.com/National_Value_Education_1770365247561.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 08:07:32.368	2026-02-06 08:08:54.714	cmlal8p5e004o28m1dqnh4ksl	00:05:43	35.10 MB	published	{"public_id": "National_Value_Education_thumbnail_1770365250571.png", "secure_url": "https://smart-edu-s3-staging.s3.amazonaws.com/National_Value_Education_thumbnail_1770365250571.png"}	0	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlal8p5e004o28m1dqnh4ksl/cmlalrfbl004p28m1vj4y9axa/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlal8p5e004o28m1dqnh4ksl/cmlalrfbl004p28m1vj4y9axa	completed	National_Value_Education_1770365247561.mp4
cmlapzroj005528m1nudrpsaa	chemistry	this educational resource provides a comprehensive introduction to acidic substances tailored for high school chemistry students. it begins by defining an acid as a compound that generates hydrogen ions in aqueous solutions and details their distinct physical and chemical characteristics, such as a sour taste and low ph. the text organizes these substances into specific categories based on their molecular strength, their natural or mineral origins, and their basicity.	https://smart-edu-s3-staging.s3.amazonaws.com/Chemistry_1770372355450.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9ario5000z28kc88hp8g4i	2026-02-06 10:06:00.099	2026-02-06 10:07:22.469	cmlap834o005428m15whserp8	00:06:26	42.53 MB	published	{"public_id": "Chemistry_thumbnail_1770372358415.png", "secure_url": "https://smart-edu-s3-staging.s3.amazonaws.com/Chemistry_thumbnail_1770372358415.png"}	0	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlap834o005428m15whserp8/cmlapzroj005528m1nudrpsaa/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlap834o005428m15whserp8/cmlapzroj005528m1nudrpsaa	completed	Chemistry_1770372355450.mp4
cmlartgsi005728m1wnkltp70	demand and supply	\N	https://smart-edu-s3-staging.s3.amazonaws.com/Demand_and_Supply_1770375418543.mp4	cml80jppv0000crvl8hh8fvb3	cml9ez5id001v28m1pgullr9h	cml9asnv9001128kcuc4gq69x	2026-02-06 10:57:05.289	2026-02-06 16:53:11.034	cmlal7bag004n28m1z58bgyo5	00:06:34	96.55 MB	published	\N	2	1	https://d2opurokt45j25.cloudfront.net/school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlal7bag004n28m1z58bgyo5/cmlartgsi005728m1wnkltp70/main.m3u8	school/videos-hls/schools/cml80jppv0000crvl8hh8fvb3/topics/cmlal7bag004n28m1z58bgyo5/cmlartgsi005728m1wnkltp70	completed	Demand_and_Supply_1770375418543.mp4
\.


--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wallet" (id, school_id, balance, currency, wallet_type, is_active, last_updated, "createdAt", "updatedAt", "financeId") FROM stdin;
\.


--
-- Data for Name: WalletTransaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WalletTransaction" (id, wallet_id, transaction_type, amount, description, reference, status, metadata, processed_at, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _LibraryResponseOptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_LibraryResponseOptions" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _ResponseOptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_ResponseOptions" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0ca30aa2-17be-4f69-8b46-844351172c55	246cb9c7d5d5204239c2d2afa40eff86f99cd4b284cf7e57915695f2ad64f94c	2026-02-03 06:17:54.632773+00	20260120122050_init	\N	\N	2026-02-03 06:17:51.196582+00	1
aa8eb12b-d860-41ca-b2c4-7215655eda3b	612a3831a480593307b69f4dc8ee814406180cc1f04a667af1be260865602a4e	2026-02-03 06:17:56.193785+00	20260120222511_add_school_video_view_tracking	\N	\N	2026-02-03 06:17:55.10052+00	1
d5cf9c9d-c0b2-4deb-9dc6-550347b28ba4	ec7a54464741d512eae90abbcde8015e06803e1f2cac17fa4c70e01f39ecc78c	2026-02-03 06:17:57.980297+00	20260121133712_remove_library_chapters	\N	\N	2026-02-03 06:17:56.630448+00	1
f772f399-357d-4e7d-9de4-f741d3abf9ef	633830c903ed4dec90aa3415775d11addf5a05aa93f05ac6f2de88e0a12757fc	2026-02-03 06:17:59.660154+00	20260121220419_add_many_to_many_material_classes	\N	\N	2026-02-03 06:17:58.594859+00	1
67b64ac4-9579-4082-b567-ab527de32e33	6c6f2dd427f4d5baaa6c306745e4f8b45af2fa8f7053620d4285927cc807306d	2026-02-03 06:18:01.329791+00	20260122144057_addded_chapter_status	\N	\N	2026-02-03 06:18:00.11976+00	1
ea4aa3c7-ce1a-471c-8ad2-70092e083829	9c4ff19b7775727e4e34e90b742dc6c9188298b5e5c0e34ae30912602e0d64cd	2026-02-03 06:18:02.9828+00	20260123_baseline	\N	\N	2026-02-03 06:18:01.769899+00	1
23afc0e8-b220-4f60-809b-d160d0f1aaf7	210cbaff45992bdfe5a250cda929bf1c81ef52a4df30380e3491b021c319b4a7	2026-02-03 06:18:04.554504+00	20260125140000_add_exam_body_assessment_platform_id	\N	\N	2026-02-03 06:18:03.424672+00	1
0c6cf17e-4d68-4438-85de-f0c41c78a19c	f7e3c7d0abd4bc044c78dfbe1782ee36d19f91029bd641a6c349dd986a3f3b70	2026-02-03 06:18:06.350627+00	20260201225047_add_multi_level_access_control	\N	\N	2026-02-03 06:18:04.985412+00	1
3afc1608-74ae-4861-9ccf-8787d97d67b2	e8daec196bc3f95b5255bb8384a3abbaa91fc06c58b2a8b8a9b2a174d90d23c2	2026-02-03 06:18:07.923848+00	20260202102546_add_school_and_teacher_exclusions	\N	\N	2026-02-03 06:18:06.803672+00	1
4bf1de4e-704b-4b57-8844-5241ef6a9b93	79bd5ee51f1d7fbdbe0ea4e03df57f11c52b1148ab46ac1d01464eee5b49e40d	2026-02-03 06:18:09.377789+00	20260202133834_add_library_permissions_and_user_permission_level	\N	\N	2026-02-03 06:18:08.3374+00	1
4f53f47c-428e-4388-9802-b11c8feb28e1	4bbd259b7733529936ef10fe35420001eb14cdf0f6b80b57fd469593c332735a	2026-02-03 06:18:11.130788+00	20260202140000_add_teacher_exclusion_library_class_id	\N	\N	2026-02-03 06:18:09.7981+00	1
664171f9-2039-4ef7-a996-fc1b576ea41f	a9fc92a4c905e31015e79cab8bdb8014757cb8a139ca066fd238ad6c43b01bb4	2026-02-04 23:24:19.871454+00	20260203141549_add_hls_fields_to_library_video_lesson	\N	\N	2026-02-04 23:24:18.49148+00	1
f57470f7-564d-4faf-a631-a07b3590992e	03117f2de433141379ea7b8b47494290e688508a6567b1963a50a332257c7c8c	2026-02-04 23:24:21.40533+00	20260203141740_add_hls_fields_to_video_content	\N	\N	2026-02-04 23:24:20.296799+00	1
5baf7a69-1f63-44fc-a4b9-f3b2f6f85f1f	a14e403496e5106f77f2bf6ae8874f96d17fc24d0a157d8ee7fc03a2547c2640	2026-02-09 13:02:11.876451+00	20260205230619_added	\N	\N	2026-02-09 13:02:10.726802+00	1
55cfd52c-3569-49be-8e79-88168e660413	8910aec843e880d8476a1e9f3d77d2a8cca346b9adf4b383f643880300b2ca10	2026-02-09 13:02:13.365063+00	20260205231431_added	\N	\N	2026-02-09 13:02:12.308625+00	1
44db9870-6ec4-43d4-9bd3-f0a1b8c28fa0	47433fdddf2ff012a701b9bba4df0dd326b5f9c7891968d8b00add3ae2bb4b0f	2026-02-09 13:02:14.865607+00	20260207120000_add_audit_update_subject	\N	\N	2026-02-09 13:02:13.801175+00	1
6fb2ea07-9c56-447d-ab6e-d4309094aad2	1a00580cda912bab526273212e7c6531c4208d9772b4eb63ed83239fbec4d8e2	2026-02-09 13:02:16.497768+00	20260208200926_added	\N	\N	2026-02-09 13:02:15.280814+00	1
e9785c9e-717c-41f2-82a7-bd7b60e7c8d1	b1f56ffa948d4f0592dc53e3294e473016ecaea1d0375ab01f5ab219cdf7a96e	2026-02-09 13:02:18.056512+00	20260208203155_added	\N	\N	2026-02-09 13:02:16.989554+00	1
c70fc81d-0347-4dac-8bdd-944e6ed7c6aa	7d95992e49ffd10f3f6e5b2a935b7190a5533cf4dcf66e94680207ee418091f6	2026-02-09 13:02:19.592768+00	20260209081032_added	\N	\N	2026-02-09 13:02:18.496479+00	1
\.


--
-- Name: Class_classId_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Class_classId_seq"', 25, true);


--
-- Name: AcademicSession AcademicSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademicSession"
    ADD CONSTRAINT "AcademicSession_pkey" PRIMARY KEY (id);


--
-- Name: AccessControlAuditLog AccessControlAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessControlAuditLog"
    ADD CONSTRAINT "AccessControlAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Achievement Achievement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentAnalytics AssessmentAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAnalytics"
    ADD CONSTRAINT "AssessmentAnalytics_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentAttempt AssessmentAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentCorrectAnswer AssessmentCorrectAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentCorrectAnswer"
    ADD CONSTRAINT "AssessmentCorrectAnswer_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentOption AssessmentOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentOption"
    ADD CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentQuestion AssessmentQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentResponse AssessmentResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY (id);


--
-- Name: AssessmentSubmission AssessmentSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Assessment Assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_pkey" PRIMARY KEY (id);


--
-- Name: AssignmentGrade AssignmentGrade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_pkey" PRIMARY KEY (id);


--
-- Name: AssignmentSubmission AssignmentSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY (id);


--
-- Name: Assignment Assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceRecord AttendanceRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSession AttendanceSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSettings AttendanceSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSettings"
    ADD CONSTRAINT "AttendanceSettings_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSummary AttendanceSummary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSummary"
    ADD CONSTRAINT "AttendanceSummary_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: ChatAnalytics ChatAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatAnalytics"
    ADD CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY (id);


--
-- Name: ChatContext ChatContext_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatContext"
    ADD CONSTRAINT "ChatContext_pkey" PRIMARY KEY (id);


--
-- Name: ChatConversation ChatConversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatConversation"
    ADD CONSTRAINT "ChatConversation_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: Class Class_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_pkey" PRIMARY KEY (id);


--
-- Name: Developer Developer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Developer"
    ADD CONSTRAINT "Developer_pkey" PRIMARY KEY (id);


--
-- Name: DeviceToken DeviceToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceToken"
    ADD CONSTRAINT "DeviceToken_pkey" PRIMARY KEY (id);


--
-- Name: DocumentChunk DocumentChunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentChunk"
    ADD CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessmentAttempt ExamBodyAssessmentAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentAttempt"
    ADD CONSTRAINT "ExamBodyAssessmentAttempt_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessmentCorrectAnswer ExamBodyAssessmentCorrectAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentCorrectAnswer"
    ADD CONSTRAINT "ExamBodyAssessmentCorrectAnswer_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessmentOption ExamBodyAssessmentOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentOption"
    ADD CONSTRAINT "ExamBodyAssessmentOption_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessmentQuestion ExamBodyAssessmentQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentQuestion"
    ADD CONSTRAINT "ExamBodyAssessmentQuestion_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessmentResponse ExamBodyAssessmentResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentResponse"
    ADD CONSTRAINT "ExamBodyAssessmentResponse_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyAssessment ExamBodyAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessment"
    ADD CONSTRAINT "ExamBodyAssessment_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodySubject ExamBodySubject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodySubject"
    ADD CONSTRAINT "ExamBodySubject_pkey" PRIMARY KEY (id);


--
-- Name: ExamBodyYear ExamBodyYear_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyYear"
    ADD CONSTRAINT "ExamBodyYear_pkey" PRIMARY KEY (id);


--
-- Name: ExamBody ExamBody_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBody"
    ADD CONSTRAINT "ExamBody_pkey" PRIMARY KEY (id);


--
-- Name: Finance Finance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Finance"
    ADD CONSTRAINT "Finance_pkey" PRIMARY KEY (id);


--
-- Name: GradingRubric GradingRubric_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradingRubric"
    ADD CONSTRAINT "GradingRubric_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentAnalytics LibraryAssessmentAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAnalytics"
    ADD CONSTRAINT "LibraryAssessmentAnalytics_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentAttempt LibraryAssessmentAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAttempt"
    ADD CONSTRAINT "LibraryAssessmentAttempt_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentCorrectAnswer LibraryAssessmentCorrectAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentCorrectAnswer"
    ADD CONSTRAINT "LibraryAssessmentCorrectAnswer_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentOption LibraryAssessmentOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentOption"
    ADD CONSTRAINT "LibraryAssessmentOption_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentQuestion LibraryAssessmentQuestion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentQuestion"
    ADD CONSTRAINT "LibraryAssessmentQuestion_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessmentResponse LibraryAssessmentResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentResponse"
    ADD CONSTRAINT "LibraryAssessmentResponse_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssessment LibraryAssessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessment"
    ADD CONSTRAINT "LibraryAssessment_pkey" PRIMARY KEY (id);


--
-- Name: LibraryAssignment LibraryAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssignment"
    ADD CONSTRAINT "LibraryAssignment_pkey" PRIMARY KEY (id);


--
-- Name: LibraryClass LibraryClass_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryClass"
    ADD CONSTRAINT "LibraryClass_pkey" PRIMARY KEY (id);


--
-- Name: LibraryComment LibraryComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChapterFile LibraryGeneralMaterialChapterFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapterFile"
    ADD CONSTRAINT "LibraryGeneralMaterialChapterFile_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChapter LibraryGeneralMaterialChapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapter"
    ADD CONSTRAINT "LibraryGeneralMaterialChapter_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChatContext LibraryGeneralMaterialChatContext_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatContext"
    ADD CONSTRAINT "LibraryGeneralMaterialChatContext_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChatConversation LibraryGeneralMaterialChatConversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatConversation"
    ADD CONSTRAINT "LibraryGeneralMaterialChatConversation_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChatMessage LibraryGeneralMaterialChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatMessage"
    ADD CONSTRAINT "LibraryGeneralMaterialChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialChunk LibraryGeneralMaterialChunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChunk"
    ADD CONSTRAINT "LibraryGeneralMaterialChunk_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialClass LibraryGeneralMaterialClass_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialClass"
    ADD CONSTRAINT "LibraryGeneralMaterialClass_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialProcessing LibraryGeneralMaterialProcessing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialProcessing"
    ADD CONSTRAINT "LibraryGeneralMaterialProcessing_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterialPurchase LibraryGeneralMaterialPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialPurchase"
    ADD CONSTRAINT "LibraryGeneralMaterialPurchase_pkey" PRIMARY KEY (id);


--
-- Name: LibraryGeneralMaterial LibraryGeneralMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterial"
    ADD CONSTRAINT "LibraryGeneralMaterial_pkey" PRIMARY KEY (id);


--
-- Name: LibraryLink LibraryLink_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryLink"
    ADD CONSTRAINT "LibraryLink_pkey" PRIMARY KEY (id);


--
-- Name: LibraryMaterial LibraryMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryMaterial"
    ADD CONSTRAINT "LibraryMaterial_pkey" PRIMARY KEY (id);


--
-- Name: LibraryPermissionDefinition LibraryPermissionDefinition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryPermissionDefinition"
    ADD CONSTRAINT "LibraryPermissionDefinition_pkey" PRIMARY KEY (id);


--
-- Name: LibraryPlatform LibraryPlatform_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryPlatform"
    ADD CONSTRAINT "LibraryPlatform_pkey" PRIMARY KEY (id);


--
-- Name: LibraryResourceAccess LibraryResourceAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_pkey" PRIMARY KEY (id);


--
-- Name: LibraryResourceUser LibraryResourceUser_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceUser"
    ADD CONSTRAINT "LibraryResourceUser_pkey" PRIMARY KEY (id);


--
-- Name: LibraryResource LibraryResource_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResource"
    ADD CONSTRAINT "LibraryResource_pkey" PRIMARY KEY (id);


--
-- Name: LibrarySubject LibrarySubject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibrarySubject"
    ADD CONSTRAINT "LibrarySubject_pkey" PRIMARY KEY (id);


--
-- Name: LibraryTopic LibraryTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryTopic"
    ADD CONSTRAINT "LibraryTopic_pkey" PRIMARY KEY (id);


--
-- Name: LibraryVideoLesson LibraryVideoLesson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoLesson"
    ADD CONSTRAINT "LibraryVideoLesson_pkey" PRIMARY KEY (id);


--
-- Name: LibraryVideoView LibraryVideoView_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoView"
    ADD CONSTRAINT "LibraryVideoView_pkey" PRIMARY KEY (id);


--
-- Name: LibraryVideoWatchHistory LibraryVideoWatchHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoWatchHistory"
    ADD CONSTRAINT "LibraryVideoWatchHistory_pkey" PRIMARY KEY (id);


--
-- Name: LiveClass LiveClass_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_pkey" PRIMARY KEY (id);


--
-- Name: MaterialProcessing MaterialProcessing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialProcessing"
    ADD CONSTRAINT "MaterialProcessing_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: Organisation Organisation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organisation"
    ADD CONSTRAINT "Organisation_pkey" PRIMARY KEY (id);


--
-- Name: PDFMaterial PDFMaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PDFMaterial"
    ADD CONSTRAINT "PDFMaterial_pkey" PRIMARY KEY (id);


--
-- Name: Parent Parent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: PlatformSubscriptionPlan PlatformSubscriptionPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlatformSubscriptionPlan"
    ADD CONSTRAINT "PlatformSubscriptionPlan_pkey" PRIMARY KEY (id);


--
-- Name: Result Result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_pkey" PRIMARY KEY (id);


--
-- Name: SchoolResourceAccess SchoolResourceAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_pkey" PRIMARY KEY (id);


--
-- Name: SchoolResourceExclusion SchoolResourceExclusion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceExclusion"
    ADD CONSTRAINT "SchoolResourceExclusion_pkey" PRIMARY KEY (id);


--
-- Name: SchoolVideoView SchoolVideoView_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoView"
    ADD CONSTRAINT "SchoolVideoView_pkey" PRIMARY KEY (id);


--
-- Name: SchoolVideoWatchHistory SchoolVideoWatchHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoWatchHistory"
    ADD CONSTRAINT "SchoolVideoWatchHistory_pkey" PRIMARY KEY (id);


--
-- Name: School School_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_pkey" PRIMARY KEY (id);


--
-- Name: StudentAchievement StudentAchievement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAchievement"
    ADD CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY (id);


--
-- Name: StudentPerformance StudentPerformance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentPerformance"
    ADD CONSTRAINT "StudentPerformance_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Subject Subject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_pkey" PRIMARY KEY (id);


--
-- Name: SupportInfo SupportInfo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportInfo"
    ADD CONSTRAINT "SupportInfo_pkey" PRIMARY KEY (id);


--
-- Name: TeacherResourceAccess TeacherResourceAccess_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_pkey" PRIMARY KEY (id);


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_pkey" PRIMARY KEY (id);


--
-- Name: TeacherSubject TeacherSubject_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherSubject"
    ADD CONSTRAINT "TeacherSubject_pkey" PRIMARY KEY (id);


--
-- Name: Teacher Teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_pkey" PRIMARY KEY (id);


--
-- Name: TimeSlot TimeSlot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimeSlot"
    ADD CONSTRAINT "TimeSlot_pkey" PRIMARY KEY (id);


--
-- Name: TimetableEntry TimetableEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY (id);


--
-- Name: Topic Topic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_pkey" PRIMARY KEY (id);


--
-- Name: UserSettings UserSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VideoContent VideoContent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoContent"
    ADD CONSTRAINT "VideoContent_pkey" PRIMARY KEY (id);


--
-- Name: WalletTransaction WalletTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Wallet Wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY (id);


--
-- Name: _LibraryResponseOptions _LibraryResponseOptions_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LibraryResponseOptions"
    ADD CONSTRAINT "_LibraryResponseOptions_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _ResponseOptions _ResponseOptions_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ResponseOptions"
    ADD CONSTRAINT "_ResponseOptions_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AcademicSession_academic_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademicSession_academic_year_idx" ON public."AcademicSession" USING btree (academic_year);


--
-- Name: AcademicSession_school_id_academic_year_term_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AcademicSession_school_id_academic_year_term_key" ON public."AcademicSession" USING btree (school_id, academic_year, term);


--
-- Name: AcademicSession_school_id_is_current_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademicSession_school_id_is_current_idx" ON public."AcademicSession" USING btree (school_id, is_current);


--
-- Name: AcademicSession_start_year_end_year_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AcademicSession_start_year_end_year_idx" ON public."AcademicSession" USING btree (start_year, end_year);


--
-- Name: AccessControlAuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessControlAuditLog_createdAt_idx" ON public."AccessControlAuditLog" USING btree ("createdAt");


--
-- Name: AccessControlAuditLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessControlAuditLog_entityType_entityId_idx" ON public."AccessControlAuditLog" USING btree ("entityType", "entityId");


--
-- Name: AccessControlAuditLog_performedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessControlAuditLog_performedById_idx" ON public."AccessControlAuditLog" USING btree ("performedById");


--
-- Name: AccessControlAuditLog_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessControlAuditLog_platformId_idx" ON public."AccessControlAuditLog" USING btree ("platformId");


--
-- Name: AccessControlAuditLog_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AccessControlAuditLog_schoolId_idx" ON public."AccessControlAuditLog" USING btree ("schoolId");


--
-- Name: Achievement_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Achievement_academic_session_id_idx" ON public."Achievement" USING btree (academic_session_id);


--
-- Name: Achievement_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Achievement_school_id_idx" ON public."Achievement" USING btree (school_id);


--
-- Name: Achievement_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Achievement_type_idx" ON public."Achievement" USING btree (type);


--
-- Name: AssessmentAnalytics_assessment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentAnalytics_assessment_id_idx" ON public."AssessmentAnalytics" USING btree (assessment_id);


--
-- Name: AssessmentAnalytics_assessment_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssessmentAnalytics_assessment_id_key" ON public."AssessmentAnalytics" USING btree (assessment_id);


--
-- Name: AssessmentAttempt_assessment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentAttempt_assessment_id_idx" ON public."AssessmentAttempt" USING btree (assessment_id);


--
-- Name: AssessmentAttempt_assessment_id_student_id_attempt_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssessmentAttempt_assessment_id_student_id_attempt_number_key" ON public."AssessmentAttempt" USING btree (assessment_id, student_id, attempt_number);


--
-- Name: AssessmentAttempt_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentAttempt_status_idx" ON public."AssessmentAttempt" USING btree (status);


--
-- Name: AssessmentAttempt_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentAttempt_student_id_idx" ON public."AssessmentAttempt" USING btree (student_id);


--
-- Name: AssessmentAttempt_submitted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentAttempt_submitted_at_idx" ON public."AssessmentAttempt" USING btree (submitted_at);


--
-- Name: AssessmentCorrectAnswer_question_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentCorrectAnswer_question_id_idx" ON public."AssessmentCorrectAnswer" USING btree (question_id);


--
-- Name: AssessmentOption_question_id_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentOption_question_id_order_idx" ON public."AssessmentOption" USING btree (question_id, "order");


--
-- Name: AssessmentQuestion_assessment_id_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentQuestion_assessment_id_order_idx" ON public."AssessmentQuestion" USING btree (assessment_id, "order");


--
-- Name: AssessmentQuestion_question_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentQuestion_question_type_idx" ON public."AssessmentQuestion" USING btree (question_type);


--
-- Name: AssessmentResponse_attempt_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentResponse_attempt_id_idx" ON public."AssessmentResponse" USING btree (attempt_id);


--
-- Name: AssessmentResponse_attempt_id_question_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssessmentResponse_attempt_id_question_id_key" ON public."AssessmentResponse" USING btree (attempt_id, question_id);


--
-- Name: AssessmentResponse_question_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentResponse_question_id_idx" ON public."AssessmentResponse" USING btree (question_id);


--
-- Name: AssessmentResponse_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentResponse_student_id_idx" ON public."AssessmentResponse" USING btree (student_id);


--
-- Name: AssessmentSubmission_assessment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentSubmission_assessment_id_idx" ON public."AssessmentSubmission" USING btree (assessment_id);


--
-- Name: AssessmentSubmission_assessment_id_student_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssessmentSubmission_assessment_id_student_id_key" ON public."AssessmentSubmission" USING btree (assessment_id, student_id);


--
-- Name: AssessmentSubmission_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentSubmission_school_id_academic_session_id_idx" ON public."AssessmentSubmission" USING btree (school_id, academic_session_id);


--
-- Name: AssessmentSubmission_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentSubmission_status_idx" ON public."AssessmentSubmission" USING btree (status);


--
-- Name: AssessmentSubmission_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentSubmission_student_id_idx" ON public."AssessmentSubmission" USING btree (student_id);


--
-- Name: AssessmentSubmission_submitted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssessmentSubmission_submitted_at_idx" ON public."AssessmentSubmission" USING btree (submitted_at);


--
-- Name: Assessment_assessment_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_assessment_type_idx" ON public."Assessment" USING btree (assessment_type);


--
-- Name: Assessment_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_created_by_idx" ON public."Assessment" USING btree (created_by);


--
-- Name: Assessment_is_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_is_published_idx" ON public."Assessment" USING btree (is_published);


--
-- Name: Assessment_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_school_id_academic_session_id_idx" ON public."Assessment" USING btree (school_id, academic_session_id);


--
-- Name: Assessment_start_date_end_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_start_date_end_date_idx" ON public."Assessment" USING btree (start_date, end_date);


--
-- Name: Assessment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_status_idx" ON public."Assessment" USING btree (status);


--
-- Name: Assessment_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assessment_topic_id_idx" ON public."Assessment" USING btree (topic_id);


--
-- Name: AssignmentGrade_assignment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentGrade_assignment_id_idx" ON public."AssignmentGrade" USING btree (assignment_id);


--
-- Name: AssignmentGrade_graded_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentGrade_graded_at_idx" ON public."AssignmentGrade" USING btree (graded_at);


--
-- Name: AssignmentGrade_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentGrade_school_id_academic_session_id_idx" ON public."AssignmentGrade" USING btree (school_id, academic_session_id);


--
-- Name: AssignmentGrade_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentGrade_student_id_idx" ON public."AssignmentGrade" USING btree (student_id);


--
-- Name: AssignmentGrade_submission_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssignmentGrade_submission_id_key" ON public."AssignmentGrade" USING btree (submission_id);


--
-- Name: AssignmentGrade_teacher_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentGrade_teacher_id_idx" ON public."AssignmentGrade" USING btree (teacher_id);


--
-- Name: AssignmentSubmission_assignment_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentSubmission_assignment_id_idx" ON public."AssignmentSubmission" USING btree (assignment_id);


--
-- Name: AssignmentSubmission_assignment_id_student_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AssignmentSubmission_assignment_id_student_id_key" ON public."AssignmentSubmission" USING btree (assignment_id, student_id);


--
-- Name: AssignmentSubmission_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentSubmission_school_id_academic_session_id_idx" ON public."AssignmentSubmission" USING btree (school_id, academic_session_id);


--
-- Name: AssignmentSubmission_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentSubmission_student_id_idx" ON public."AssignmentSubmission" USING btree (student_id);


--
-- Name: AssignmentSubmission_submitted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssignmentSubmission_submitted_at_idx" ON public."AssignmentSubmission" USING btree (submitted_at);


--
-- Name: Assignment_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_created_by_idx" ON public."Assignment" USING btree (created_by);


--
-- Name: Assignment_due_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_due_date_idx" ON public."Assignment" USING btree (due_date);


--
-- Name: Assignment_is_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_is_published_idx" ON public."Assignment" USING btree (is_published);


--
-- Name: Assignment_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_school_id_academic_session_id_idx" ON public."Assignment" USING btree (school_id, academic_session_id);


--
-- Name: Assignment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_status_idx" ON public."Assignment" USING btree (status);


--
-- Name: Assignment_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Assignment_topic_id_idx" ON public."Assignment" USING btree (topic_id);


--
-- Name: AttendanceRecord_attendance_session_id_student_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AttendanceRecord_attendance_session_id_student_id_key" ON public."AttendanceRecord" USING btree (attendance_session_id, student_id);


--
-- Name: AttendanceRecord_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceRecord_class_id_idx" ON public."AttendanceRecord" USING btree (class_id);


--
-- Name: AttendanceRecord_marked_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceRecord_marked_at_idx" ON public."AttendanceRecord" USING btree (marked_at);


--
-- Name: AttendanceRecord_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceRecord_school_id_academic_session_id_idx" ON public."AttendanceRecord" USING btree (school_id, academic_session_id);


--
-- Name: AttendanceRecord_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceRecord_status_idx" ON public."AttendanceRecord" USING btree (status);


--
-- Name: AttendanceRecord_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceRecord_student_id_idx" ON public."AttendanceRecord" USING btree (student_id);


--
-- Name: AttendanceSession_attendance_rate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_attendance_rate_idx" ON public."AttendanceSession" USING btree (attendance_rate);


--
-- Name: AttendanceSession_class_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_class_id_date_idx" ON public."AttendanceSession" USING btree (class_id, date);


--
-- Name: AttendanceSession_class_id_date_session_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AttendanceSession_class_id_date_session_type_key" ON public."AttendanceSession" USING btree (class_id, date, session_type);


--
-- Name: AttendanceSession_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_date_idx" ON public."AttendanceSession" USING btree (date);


--
-- Name: AttendanceSession_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_school_id_academic_session_id_idx" ON public."AttendanceSession" USING btree (school_id, academic_session_id);


--
-- Name: AttendanceSession_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_status_idx" ON public."AttendanceSession" USING btree (status);


--
-- Name: AttendanceSession_teacher_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_teacher_id_date_idx" ON public."AttendanceSession" USING btree (teacher_id, date);


--
-- Name: AttendanceSettings_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSettings_school_id_academic_session_id_idx" ON public."AttendanceSettings" USING btree (school_id, academic_session_id);


--
-- Name: AttendanceSettings_school_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AttendanceSettings_school_id_key" ON public."AttendanceSettings" USING btree (school_id);


--
-- Name: AttendanceSummary_attendance_rate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSummary_attendance_rate_idx" ON public."AttendanceSummary" USING btree (attendance_rate);


--
-- Name: AttendanceSummary_class_id_period_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSummary_class_id_period_type_idx" ON public."AttendanceSummary" USING btree (class_id, period_type);


--
-- Name: AttendanceSummary_period_start_period_end_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSummary_period_start_period_end_idx" ON public."AttendanceSummary" USING btree (period_start, period_end);


--
-- Name: AttendanceSummary_school_id_academic_session_id_class_id_st_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AttendanceSummary_school_id_academic_session_id_class_id_st_key" ON public."AttendanceSummary" USING btree (school_id, academic_session_id, class_id, student_id, period_type, period_start);


--
-- Name: AttendanceSummary_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSummary_school_id_academic_session_id_idx" ON public."AttendanceSummary" USING btree (school_id, academic_session_id);


--
-- Name: AttendanceSummary_student_id_period_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSummary_student_id_period_type_idx" ON public."AttendanceSummary" USING btree (student_id, period_type);


--
-- Name: AuditLog_audit_for_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_audit_for_type_idx" ON public."AuditLog" USING btree (audit_for_type);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_performed_by_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_performed_by_id_idx" ON public."AuditLog" USING btree (performed_by_id);


--
-- Name: AuditLog_target_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_target_id_idx" ON public."AuditLog" USING btree (target_id);


--
-- Name: ChatAnalytics_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatAnalytics_date_idx" ON public."ChatAnalytics" USING btree (date);


--
-- Name: ChatAnalytics_material_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatAnalytics_material_id_idx" ON public."ChatAnalytics" USING btree (material_id);


--
-- Name: ChatAnalytics_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatAnalytics_school_id_idx" ON public."ChatAnalytics" USING btree (school_id);


--
-- Name: ChatAnalytics_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatAnalytics_user_id_idx" ON public."ChatAnalytics" USING btree (user_id);


--
-- Name: ChatContext_chunk_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatContext_chunk_id_idx" ON public."ChatContext" USING btree (chunk_id);


--
-- Name: ChatContext_conversation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatContext_conversation_id_idx" ON public."ChatContext" USING btree (conversation_id);


--
-- Name: ChatContext_message_id_chunk_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ChatContext_message_id_chunk_id_key" ON public."ChatContext" USING btree (message_id, chunk_id);


--
-- Name: ChatContext_message_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatContext_message_id_idx" ON public."ChatContext" USING btree (message_id);


--
-- Name: ChatContext_relevance_score_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatContext_relevance_score_idx" ON public."ChatContext" USING btree (relevance_score);


--
-- Name: ChatContext_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatContext_school_id_idx" ON public."ChatContext" USING btree (school_id);


--
-- Name: ChatConversation_last_activity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatConversation_last_activity_idx" ON public."ChatConversation" USING btree (last_activity);


--
-- Name: ChatConversation_material_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatConversation_material_id_idx" ON public."ChatConversation" USING btree (material_id);


--
-- Name: ChatConversation_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatConversation_school_id_idx" ON public."ChatConversation" USING btree (school_id);


--
-- Name: ChatConversation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatConversation_status_idx" ON public."ChatConversation" USING btree (status);


--
-- Name: ChatConversation_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatConversation_user_id_idx" ON public."ChatConversation" USING btree (user_id);


--
-- Name: ChatMessage_conversation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_conversation_id_idx" ON public."ChatMessage" USING btree (conversation_id);


--
-- Name: ChatMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_createdAt_idx" ON public."ChatMessage" USING btree ("createdAt");


--
-- Name: ChatMessage_material_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_material_id_idx" ON public."ChatMessage" USING btree (material_id);


--
-- Name: ChatMessage_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_role_idx" ON public."ChatMessage" USING btree (role);


--
-- Name: ChatMessage_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_school_id_idx" ON public."ChatMessage" USING btree (school_id);


--
-- Name: ChatMessage_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_user_id_idx" ON public."ChatMessage" USING btree (user_id);


--
-- Name: Class_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Class_classId_idx" ON public."Class" USING btree ("classId");


--
-- Name: Class_schoolId_academic_session_id_classId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Class_schoolId_academic_session_id_classId_key" ON public."Class" USING btree ("schoolId", academic_session_id, "classId");


--
-- Name: Class_schoolId_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Class_schoolId_academic_session_id_idx" ON public."Class" USING btree ("schoolId", academic_session_id);


--
-- Name: Developer_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Developer_email_key" ON public."Developer" USING btree (email);


--
-- Name: DeviceToken_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeviceToken_isActive_idx" ON public."DeviceToken" USING btree ("isActive");


--
-- Name: DeviceToken_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeviceToken_school_id_idx" ON public."DeviceToken" USING btree (school_id);


--
-- Name: DeviceToken_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeviceToken_token_idx" ON public."DeviceToken" USING btree (token);


--
-- Name: DeviceToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeviceToken_token_key" ON public."DeviceToken" USING btree (token);


--
-- Name: DeviceToken_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeviceToken_user_id_idx" ON public."DeviceToken" USING btree (user_id);


--
-- Name: DocumentChunk_chunk_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_chunk_type_idx" ON public."DocumentChunk" USING btree (chunk_type);


--
-- Name: DocumentChunk_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_createdAt_idx" ON public."DocumentChunk" USING btree ("createdAt");


--
-- Name: DocumentChunk_material_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_material_id_idx" ON public."DocumentChunk" USING btree (material_id);


--
-- Name: DocumentChunk_order_index_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_order_index_idx" ON public."DocumentChunk" USING btree (order_index);


--
-- Name: DocumentChunk_page_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_page_number_idx" ON public."DocumentChunk" USING btree (page_number);


--
-- Name: DocumentChunk_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DocumentChunk_school_id_idx" ON public."DocumentChunk" USING btree (school_id);


--
-- Name: ExamBodyAssessmentAttempt_assessmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentAttempt_assessmentId_idx" ON public."ExamBodyAssessmentAttempt" USING btree ("assessmentId");


--
-- Name: ExamBodyAssessmentAttempt_assessmentId_userId_attemptNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBodyAssessmentAttempt_assessmentId_userId_attemptNumber_key" ON public."ExamBodyAssessmentAttempt" USING btree ("assessmentId", "userId", "attemptNumber");


--
-- Name: ExamBodyAssessmentAttempt_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentAttempt_status_idx" ON public."ExamBodyAssessmentAttempt" USING btree (status);


--
-- Name: ExamBodyAssessmentAttempt_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentAttempt_userId_idx" ON public."ExamBodyAssessmentAttempt" USING btree ("userId");


--
-- Name: ExamBodyAssessmentCorrectAnswer_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentCorrectAnswer_questionId_idx" ON public."ExamBodyAssessmentCorrectAnswer" USING btree ("questionId");


--
-- Name: ExamBodyAssessmentOption_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentOption_questionId_idx" ON public."ExamBodyAssessmentOption" USING btree ("questionId");


--
-- Name: ExamBodyAssessmentQuestion_assessmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentQuestion_assessmentId_idx" ON public."ExamBodyAssessmentQuestion" USING btree ("assessmentId");


--
-- Name: ExamBodyAssessmentQuestion_questionType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentQuestion_questionType_idx" ON public."ExamBodyAssessmentQuestion" USING btree ("questionType");


--
-- Name: ExamBodyAssessmentResponse_attemptId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentResponse_attemptId_idx" ON public."ExamBodyAssessmentResponse" USING btree ("attemptId");


--
-- Name: ExamBodyAssessmentResponse_attemptId_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBodyAssessmentResponse_attemptId_questionId_key" ON public."ExamBodyAssessmentResponse" USING btree ("attemptId", "questionId");


--
-- Name: ExamBodyAssessmentResponse_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentResponse_questionId_idx" ON public."ExamBodyAssessmentResponse" USING btree ("questionId");


--
-- Name: ExamBodyAssessmentResponse_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessmentResponse_userId_idx" ON public."ExamBodyAssessmentResponse" USING btree ("userId");


--
-- Name: ExamBodyAssessment_examBodyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_examBodyId_idx" ON public."ExamBodyAssessment" USING btree ("examBodyId");


--
-- Name: ExamBodyAssessment_isPublished_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_isPublished_idx" ON public."ExamBodyAssessment" USING btree ("isPublished");


--
-- Name: ExamBodyAssessment_platformId_examBodyId_subjectId_yearId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBodyAssessment_platformId_examBodyId_subjectId_yearId_key" ON public."ExamBodyAssessment" USING btree ("platformId", "examBodyId", "subjectId", "yearId");


--
-- Name: ExamBodyAssessment_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_platformId_idx" ON public."ExamBodyAssessment" USING btree ("platformId");


--
-- Name: ExamBodyAssessment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_status_idx" ON public."ExamBodyAssessment" USING btree (status);


--
-- Name: ExamBodyAssessment_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_subjectId_idx" ON public."ExamBodyAssessment" USING btree ("subjectId");


--
-- Name: ExamBodyAssessment_yearId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyAssessment_yearId_idx" ON public."ExamBodyAssessment" USING btree ("yearId");


--
-- Name: ExamBodySubject_examBodyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBodySubject_examBodyId_code_key" ON public."ExamBodySubject" USING btree ("examBodyId", code);


--
-- Name: ExamBodySubject_examBodyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodySubject_examBodyId_idx" ON public."ExamBodySubject" USING btree ("examBodyId");


--
-- Name: ExamBodySubject_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodySubject_status_idx" ON public."ExamBodySubject" USING btree (status);


--
-- Name: ExamBodyYear_examBodyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyYear_examBodyId_idx" ON public."ExamBodyYear" USING btree ("examBodyId");


--
-- Name: ExamBodyYear_examBodyId_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBodyYear_examBodyId_year_key" ON public."ExamBodyYear" USING btree ("examBodyId", year);


--
-- Name: ExamBodyYear_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExamBodyYear_status_idx" ON public."ExamBodyYear" USING btree (status);


--
-- Name: ExamBody_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBody_code_key" ON public."ExamBody" USING btree (code);


--
-- Name: ExamBody_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ExamBody_name_key" ON public."ExamBody" USING btree (name);


--
-- Name: Finance_school_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Finance_school_id_key" ON public."Finance" USING btree (school_id);


--
-- Name: GradingRubric_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GradingRubric_created_by_idx" ON public."GradingRubric" USING btree (created_by);


--
-- Name: GradingRubric_is_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GradingRubric_is_template_idx" ON public."GradingRubric" USING btree (is_template);


--
-- Name: GradingRubric_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GradingRubric_school_id_academic_session_id_idx" ON public."GradingRubric" USING btree (school_id, academic_session_id);


--
-- Name: LibraryAssessmentAnalytics_assessmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentAnalytics_assessmentId_idx" ON public."LibraryAssessmentAnalytics" USING btree ("assessmentId");


--
-- Name: LibraryAssessmentAnalytics_assessmentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryAssessmentAnalytics_assessmentId_key" ON public."LibraryAssessmentAnalytics" USING btree ("assessmentId");


--
-- Name: LibraryAssessmentAttempt_assessmentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentAttempt_assessmentId_idx" ON public."LibraryAssessmentAttempt" USING btree ("assessmentId");


--
-- Name: LibraryAssessmentAttempt_assessmentId_userId_attemptNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryAssessmentAttempt_assessmentId_userId_attemptNumber_key" ON public."LibraryAssessmentAttempt" USING btree ("assessmentId", "userId", "attemptNumber");


--
-- Name: LibraryAssessmentAttempt_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentAttempt_status_idx" ON public."LibraryAssessmentAttempt" USING btree (status);


--
-- Name: LibraryAssessmentAttempt_submittedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentAttempt_submittedAt_idx" ON public."LibraryAssessmentAttempt" USING btree ("submittedAt");


--
-- Name: LibraryAssessmentAttempt_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentAttempt_userId_idx" ON public."LibraryAssessmentAttempt" USING btree ("userId");


--
-- Name: LibraryAssessmentCorrectAnswer_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentCorrectAnswer_questionId_idx" ON public."LibraryAssessmentCorrectAnswer" USING btree ("questionId");


--
-- Name: LibraryAssessmentOption_questionId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentOption_questionId_order_idx" ON public."LibraryAssessmentOption" USING btree ("questionId", "order");


--
-- Name: LibraryAssessmentQuestion_assessmentId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentQuestion_assessmentId_order_idx" ON public."LibraryAssessmentQuestion" USING btree ("assessmentId", "order");


--
-- Name: LibraryAssessmentQuestion_questionType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentQuestion_questionType_idx" ON public."LibraryAssessmentQuestion" USING btree ("questionType");


--
-- Name: LibraryAssessmentResponse_attemptId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentResponse_attemptId_idx" ON public."LibraryAssessmentResponse" USING btree ("attemptId");


--
-- Name: LibraryAssessmentResponse_attemptId_questionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryAssessmentResponse_attemptId_questionId_key" ON public."LibraryAssessmentResponse" USING btree ("attemptId", "questionId");


--
-- Name: LibraryAssessmentResponse_questionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentResponse_questionId_idx" ON public."LibraryAssessmentResponse" USING btree ("questionId");


--
-- Name: LibraryAssessmentResponse_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessmentResponse_userId_idx" ON public."LibraryAssessmentResponse" USING btree ("userId");


--
-- Name: LibraryAssessment_assessmentType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_assessmentType_idx" ON public."LibraryAssessment" USING btree ("assessmentType");


--
-- Name: LibraryAssessment_createdById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_createdById_idx" ON public."LibraryAssessment" USING btree ("createdById");


--
-- Name: LibraryAssessment_isPublished_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_isPublished_idx" ON public."LibraryAssessment" USING btree ("isPublished");


--
-- Name: LibraryAssessment_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_platformId_idx" ON public."LibraryAssessment" USING btree ("platformId");


--
-- Name: LibraryAssessment_startDate_endDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_startDate_endDate_idx" ON public."LibraryAssessment" USING btree ("startDate", "endDate");


--
-- Name: LibraryAssessment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_status_idx" ON public."LibraryAssessment" USING btree (status);


--
-- Name: LibraryAssessment_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_subjectId_idx" ON public."LibraryAssessment" USING btree ("subjectId");


--
-- Name: LibraryAssessment_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssessment_topicId_idx" ON public."LibraryAssessment" USING btree ("topicId");


--
-- Name: LibraryAssignment_dueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_dueDate_idx" ON public."LibraryAssignment" USING btree ("dueDate");


--
-- Name: LibraryAssignment_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_platformId_idx" ON public."LibraryAssignment" USING btree ("platformId");


--
-- Name: LibraryAssignment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_status_idx" ON public."LibraryAssignment" USING btree (status);


--
-- Name: LibraryAssignment_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_subjectId_idx" ON public."LibraryAssignment" USING btree ("subjectId");


--
-- Name: LibraryAssignment_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_topicId_idx" ON public."LibraryAssignment" USING btree ("topicId");


--
-- Name: LibraryAssignment_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryAssignment_uploadedById_idx" ON public."LibraryAssignment" USING btree ("uploadedById");


--
-- Name: LibraryComment_commentedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_commentedById_idx" ON public."LibraryComment" USING btree ("commentedById");


--
-- Name: LibraryComment_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_createdAt_idx" ON public."LibraryComment" USING btree ("createdAt");


--
-- Name: LibraryComment_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_isDeleted_idx" ON public."LibraryComment" USING btree ("isDeleted");


--
-- Name: LibraryComment_parentCommentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_parentCommentId_idx" ON public."LibraryComment" USING btree ("parentCommentId");


--
-- Name: LibraryComment_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_platformId_idx" ON public."LibraryComment" USING btree ("platformId");


--
-- Name: LibraryComment_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_subjectId_idx" ON public."LibraryComment" USING btree ("subjectId");


--
-- Name: LibraryComment_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_topicId_idx" ON public."LibraryComment" USING btree ("topicId");


--
-- Name: LibraryComment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryComment_userId_idx" ON public."LibraryComment" USING btree ("userId");


--
-- Name: LibraryGeneralMaterialChapterFile_chapterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapterFile_chapterId_idx" ON public."LibraryGeneralMaterialChapterFile" USING btree ("chapterId");


--
-- Name: LibraryGeneralMaterialChapterFile_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapterFile_order_idx" ON public."LibraryGeneralMaterialChapterFile" USING btree ("order");


--
-- Name: LibraryGeneralMaterialChapterFile_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapterFile_platformId_idx" ON public."LibraryGeneralMaterialChapterFile" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialChapterFile_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapterFile_uploadedById_idx" ON public."LibraryGeneralMaterialChapterFile" USING btree ("uploadedById");


--
-- Name: LibraryGeneralMaterialChapter_chapterStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapter_chapterStatus_idx" ON public."LibraryGeneralMaterialChapter" USING btree ("chapterStatus");


--
-- Name: LibraryGeneralMaterialChapter_isAiEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapter_isAiEnabled_idx" ON public."LibraryGeneralMaterialChapter" USING btree ("isAiEnabled");


--
-- Name: LibraryGeneralMaterialChapter_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapter_materialId_idx" ON public."LibraryGeneralMaterialChapter" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialChapter_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapter_order_idx" ON public."LibraryGeneralMaterialChapter" USING btree ("order");


--
-- Name: LibraryGeneralMaterialChapter_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChapter_platformId_idx" ON public."LibraryGeneralMaterialChapter" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialChatContext_chunkId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatContext_chunkId_idx" ON public."LibraryGeneralMaterialChatContext" USING btree ("chunkId");


--
-- Name: LibraryGeneralMaterialChatContext_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatContext_conversationId_idx" ON public."LibraryGeneralMaterialChatContext" USING btree ("conversationId");


--
-- Name: LibraryGeneralMaterialChatContext_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatContext_materialId_idx" ON public."LibraryGeneralMaterialChatContext" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialChatConversation_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatConversation_materialId_idx" ON public."LibraryGeneralMaterialChatConversation" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialChatConversation_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatConversation_platformId_idx" ON public."LibraryGeneralMaterialChatConversation" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialChatConversation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatConversation_status_idx" ON public."LibraryGeneralMaterialChatConversation" USING btree (status);


--
-- Name: LibraryGeneralMaterialChatConversation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatConversation_userId_idx" ON public."LibraryGeneralMaterialChatConversation" USING btree ("userId");


--
-- Name: LibraryGeneralMaterialChatMessage_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatMessage_conversationId_idx" ON public."LibraryGeneralMaterialChatMessage" USING btree ("conversationId");


--
-- Name: LibraryGeneralMaterialChatMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatMessage_createdAt_idx" ON public."LibraryGeneralMaterialChatMessage" USING btree ("createdAt");


--
-- Name: LibraryGeneralMaterialChatMessage_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatMessage_materialId_idx" ON public."LibraryGeneralMaterialChatMessage" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialChatMessage_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChatMessage_userId_idx" ON public."LibraryGeneralMaterialChatMessage" USING btree ("userId");


--
-- Name: LibraryGeneralMaterialChunk_chapterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChunk_chapterId_idx" ON public."LibraryGeneralMaterialChunk" USING btree ("chapterId");


--
-- Name: LibraryGeneralMaterialChunk_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChunk_materialId_idx" ON public."LibraryGeneralMaterialChunk" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialChunk_orderIndex_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChunk_orderIndex_idx" ON public."LibraryGeneralMaterialChunk" USING btree ("orderIndex");


--
-- Name: LibraryGeneralMaterialChunk_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChunk_platformId_idx" ON public."LibraryGeneralMaterialChunk" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialChunk_processingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialChunk_processingId_idx" ON public."LibraryGeneralMaterialChunk" USING btree ("processingId");


--
-- Name: LibraryGeneralMaterialClass_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialClass_classId_idx" ON public."LibraryGeneralMaterialClass" USING btree ("classId");


--
-- Name: LibraryGeneralMaterialClass_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialClass_createdAt_idx" ON public."LibraryGeneralMaterialClass" USING btree ("createdAt");


--
-- Name: LibraryGeneralMaterialClass_materialId_classId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryGeneralMaterialClass_materialId_classId_key" ON public."LibraryGeneralMaterialClass" USING btree ("materialId", "classId");


--
-- Name: LibraryGeneralMaterialClass_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialClass_materialId_idx" ON public."LibraryGeneralMaterialClass" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialProcessing_materialId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryGeneralMaterialProcessing_materialId_key" ON public."LibraryGeneralMaterialProcessing" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialProcessing_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialProcessing_platformId_idx" ON public."LibraryGeneralMaterialProcessing" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialProcessing_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialProcessing_status_idx" ON public."LibraryGeneralMaterialProcessing" USING btree (status);


--
-- Name: LibraryGeneralMaterialPurchase_materialId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialPurchase_materialId_idx" ON public."LibraryGeneralMaterialPurchase" USING btree ("materialId");


--
-- Name: LibraryGeneralMaterialPurchase_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialPurchase_platformId_idx" ON public."LibraryGeneralMaterialPurchase" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterialPurchase_purchasedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialPurchase_purchasedAt_idx" ON public."LibraryGeneralMaterialPurchase" USING btree ("purchasedAt");


--
-- Name: LibraryGeneralMaterialPurchase_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialPurchase_status_idx" ON public."LibraryGeneralMaterialPurchase" USING btree (status);


--
-- Name: LibraryGeneralMaterialPurchase_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterialPurchase_userId_idx" ON public."LibraryGeneralMaterialPurchase" USING btree ("userId");


--
-- Name: LibraryGeneralMaterial_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_createdAt_idx" ON public."LibraryGeneralMaterial" USING btree ("createdAt");


--
-- Name: LibraryGeneralMaterial_isAiEnabled_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_isAiEnabled_idx" ON public."LibraryGeneralMaterial" USING btree ("isAiEnabled");


--
-- Name: LibraryGeneralMaterial_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_platformId_idx" ON public."LibraryGeneralMaterial" USING btree ("platformId");


--
-- Name: LibraryGeneralMaterial_price_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_price_idx" ON public."LibraryGeneralMaterial" USING btree (price);


--
-- Name: LibraryGeneralMaterial_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_status_idx" ON public."LibraryGeneralMaterial" USING btree (status);


--
-- Name: LibraryGeneralMaterial_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_subjectId_idx" ON public."LibraryGeneralMaterial" USING btree ("subjectId");


--
-- Name: LibraryGeneralMaterial_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryGeneralMaterial_uploadedById_idx" ON public."LibraryGeneralMaterial" USING btree ("uploadedById");


--
-- Name: LibraryLink_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryLink_platformId_idx" ON public."LibraryLink" USING btree ("platformId");


--
-- Name: LibraryLink_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryLink_status_idx" ON public."LibraryLink" USING btree (status);


--
-- Name: LibraryLink_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryLink_subjectId_idx" ON public."LibraryLink" USING btree ("subjectId");


--
-- Name: LibraryLink_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryLink_topicId_idx" ON public."LibraryLink" USING btree ("topicId");


--
-- Name: LibraryLink_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryLink_uploadedById_idx" ON public."LibraryLink" USING btree ("uploadedById");


--
-- Name: LibraryMaterial_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryMaterial_platformId_idx" ON public."LibraryMaterial" USING btree ("platformId");


--
-- Name: LibraryMaterial_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryMaterial_status_idx" ON public."LibraryMaterial" USING btree (status);


--
-- Name: LibraryMaterial_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryMaterial_subjectId_idx" ON public."LibraryMaterial" USING btree ("subjectId");


--
-- Name: LibraryMaterial_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryMaterial_topicId_idx" ON public."LibraryMaterial" USING btree ("topicId");


--
-- Name: LibraryMaterial_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryMaterial_uploadedById_idx" ON public."LibraryMaterial" USING btree ("uploadedById");


--
-- Name: LibraryPermissionDefinition_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryPermissionDefinition_code_key" ON public."LibraryPermissionDefinition" USING btree (code);


--
-- Name: LibraryPlatform_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryPlatform_name_key" ON public."LibraryPlatform" USING btree (name);


--
-- Name: LibraryPlatform_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryPlatform_slug_key" ON public."LibraryPlatform" USING btree (slug);


--
-- Name: LibraryResourceAccess_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceAccess_expiresAt_idx" ON public."LibraryResourceAccess" USING btree ("expiresAt");


--
-- Name: LibraryResourceAccess_grantedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceAccess_grantedById_idx" ON public."LibraryResourceAccess" USING btree ("grantedById");


--
-- Name: LibraryResourceAccess_platformId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceAccess_platformId_isActive_idx" ON public."LibraryResourceAccess" USING btree ("platformId", "isActive");


--
-- Name: LibraryResourceAccess_platformId_schoolId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceAccess_platformId_schoolId_isActive_idx" ON public."LibraryResourceAccess" USING btree ("platformId", "schoolId", "isActive");


--
-- Name: LibraryResourceAccess_platformId_schoolId_resourceType_subj_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryResourceAccess_platformId_schoolId_resourceType_subj_key" ON public."LibraryResourceAccess" USING btree ("platformId", "schoolId", "resourceType", "subjectId", "topicId", "videoId", "materialId", "assessmentId");


--
-- Name: LibraryResourceAccess_schoolId_isActive_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceAccess_schoolId_isActive_resourceType_idx" ON public."LibraryResourceAccess" USING btree ("schoolId", "isActive", "resourceType");


--
-- Name: LibraryResourceUser_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryResourceUser_email_key" ON public."LibraryResourceUser" USING btree (email);


--
-- Name: LibraryResourceUser_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResourceUser_platformId_idx" ON public."LibraryResourceUser" USING btree ("platformId");


--
-- Name: LibraryResource_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_createdAt_idx" ON public."LibraryResource" USING btree ("createdAt");


--
-- Name: LibraryResource_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_platformId_idx" ON public."LibraryResource" USING btree ("platformId");


--
-- Name: LibraryResource_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_resourceType_idx" ON public."LibraryResource" USING btree ("resourceType");


--
-- Name: LibraryResource_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_schoolId_idx" ON public."LibraryResource" USING btree ("schoolId");


--
-- Name: LibraryResource_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_status_idx" ON public."LibraryResource" USING btree (status);


--
-- Name: LibraryResource_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryResource_topic_id_idx" ON public."LibraryResource" USING btree (topic_id);


--
-- Name: LibrarySubject_platformId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibrarySubject_platformId_code_key" ON public."LibrarySubject" USING btree ("platformId", code);


--
-- Name: LibrarySubject_platformId_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibrarySubject_platformId_name_idx" ON public."LibrarySubject" USING btree ("platformId", name);


--
-- Name: LibraryTopic_platformId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryTopic_platformId_subjectId_idx" ON public."LibraryTopic" USING btree ("platformId", "subjectId");


--
-- Name: LibraryTopic_subjectId_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryTopic_subjectId_order_idx" ON public."LibraryTopic" USING btree ("subjectId", "order");


--
-- Name: LibraryVideoLesson_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoLesson_platformId_idx" ON public."LibraryVideoLesson" USING btree ("platformId");


--
-- Name: LibraryVideoLesson_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoLesson_status_idx" ON public."LibraryVideoLesson" USING btree (status);


--
-- Name: LibraryVideoLesson_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoLesson_subjectId_idx" ON public."LibraryVideoLesson" USING btree ("subjectId");


--
-- Name: LibraryVideoLesson_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoLesson_topicId_idx" ON public."LibraryVideoLesson" USING btree ("topicId");


--
-- Name: LibraryVideoLesson_uploadedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoLesson_uploadedById_idx" ON public."LibraryVideoLesson" USING btree ("uploadedById");


--
-- Name: LibraryVideoView_libraryResourceUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoView_libraryResourceUserId_idx" ON public."LibraryVideoView" USING btree ("libraryResourceUserId");


--
-- Name: LibraryVideoView_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoView_userId_idx" ON public."LibraryVideoView" USING btree ("userId");


--
-- Name: LibraryVideoView_videoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoView_videoId_idx" ON public."LibraryVideoView" USING btree ("videoId");


--
-- Name: LibraryVideoView_videoId_userId_libraryResourceUserId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LibraryVideoView_videoId_userId_libraryResourceUserId_key" ON public."LibraryVideoView" USING btree ("videoId", "userId", "libraryResourceUserId");


--
-- Name: LibraryVideoView_viewedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoView_viewedAt_idx" ON public."LibraryVideoView" USING btree ("viewedAt");


--
-- Name: LibraryVideoWatchHistory_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_classId_idx" ON public."LibraryVideoWatchHistory" USING btree ("classId");


--
-- Name: LibraryVideoWatchHistory_completionPercentage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_completionPercentage_idx" ON public."LibraryVideoWatchHistory" USING btree ("completionPercentage");


--
-- Name: LibraryVideoWatchHistory_isCompleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_isCompleted_idx" ON public."LibraryVideoWatchHistory" USING btree ("isCompleted");


--
-- Name: LibraryVideoWatchHistory_libraryResourceUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_libraryResourceUserId_idx" ON public."LibraryVideoWatchHistory" USING btree ("libraryResourceUserId");


--
-- Name: LibraryVideoWatchHistory_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_schoolId_idx" ON public."LibraryVideoWatchHistory" USING btree ("schoolId");


--
-- Name: LibraryVideoWatchHistory_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_sessionId_idx" ON public."LibraryVideoWatchHistory" USING btree ("sessionId");


--
-- Name: LibraryVideoWatchHistory_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_userId_idx" ON public."LibraryVideoWatchHistory" USING btree ("userId");


--
-- Name: LibraryVideoWatchHistory_userId_watchedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_userId_watchedAt_idx" ON public."LibraryVideoWatchHistory" USING btree ("userId", "watchedAt");


--
-- Name: LibraryVideoWatchHistory_videoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_videoId_idx" ON public."LibraryVideoWatchHistory" USING btree ("videoId");


--
-- Name: LibraryVideoWatchHistory_videoId_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_videoId_schoolId_idx" ON public."LibraryVideoWatchHistory" USING btree ("videoId", "schoolId");


--
-- Name: LibraryVideoWatchHistory_videoId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_videoId_userId_idx" ON public."LibraryVideoWatchHistory" USING btree ("videoId", "userId");


--
-- Name: LibraryVideoWatchHistory_watchedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LibraryVideoWatchHistory_watchedAt_idx" ON public."LibraryVideoWatchHistory" USING btree ("watchedAt");


--
-- Name: LiveClass_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_createdAt_idx" ON public."LiveClass" USING btree ("createdAt");


--
-- Name: LiveClass_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_platformId_idx" ON public."LiveClass" USING btree ("platformId");


--
-- Name: LiveClass_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_schoolId_idx" ON public."LiveClass" USING btree ("schoolId");


--
-- Name: LiveClass_startTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_startTime_idx" ON public."LiveClass" USING btree ("startTime");


--
-- Name: LiveClass_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_status_idx" ON public."LiveClass" USING btree (status);


--
-- Name: LiveClass_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LiveClass_topic_id_idx" ON public."LiveClass" USING btree (topic_id);


--
-- Name: MaterialProcessing_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaterialProcessing_createdAt_idx" ON public."MaterialProcessing" USING btree ("createdAt");


--
-- Name: MaterialProcessing_material_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MaterialProcessing_material_id_key" ON public."MaterialProcessing" USING btree (material_id);


--
-- Name: MaterialProcessing_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaterialProcessing_school_id_idx" ON public."MaterialProcessing" USING btree (school_id);


--
-- Name: MaterialProcessing_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MaterialProcessing_status_idx" ON public."MaterialProcessing" USING btree (status);


--
-- Name: Organisation_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Organisation_name_key" ON public."Organisation" USING btree (name);


--
-- Name: PDFMaterial_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PDFMaterial_createdAt_idx" ON public."PDFMaterial" USING btree ("createdAt");


--
-- Name: PDFMaterial_materialId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PDFMaterial_materialId_key" ON public."PDFMaterial" USING btree ("materialId");


--
-- Name: PDFMaterial_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PDFMaterial_platformId_idx" ON public."PDFMaterial" USING btree ("platformId");


--
-- Name: PDFMaterial_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PDFMaterial_schoolId_idx" ON public."PDFMaterial" USING btree ("schoolId");


--
-- Name: PDFMaterial_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PDFMaterial_status_idx" ON public."PDFMaterial" USING btree (status);


--
-- Name: PDFMaterial_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PDFMaterial_topic_id_idx" ON public."PDFMaterial" USING btree (topic_id);


--
-- Name: Parent_is_primary_contact_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Parent_is_primary_contact_idx" ON public."Parent" USING btree (is_primary_contact);


--
-- Name: Parent_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Parent_parent_id_idx" ON public."Parent" USING btree (parent_id);


--
-- Name: Parent_parent_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Parent_parent_id_key" ON public."Parent" USING btree (parent_id);


--
-- Name: Parent_relationship_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Parent_relationship_idx" ON public."Parent" USING btree (relationship);


--
-- Name: Parent_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Parent_school_id_idx" ON public."Parent" USING btree (school_id);


--
-- Name: Parent_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Parent_user_id_key" ON public."Parent" USING btree (user_id);


--
-- Name: PlatformSubscriptionPlan_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlatformSubscriptionPlan_is_active_idx" ON public."PlatformSubscriptionPlan" USING btree (is_active);


--
-- Name: PlatformSubscriptionPlan_is_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlatformSubscriptionPlan_is_template_idx" ON public."PlatformSubscriptionPlan" USING btree (is_template);


--
-- Name: PlatformSubscriptionPlan_plan_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlatformSubscriptionPlan_plan_type_idx" ON public."PlatformSubscriptionPlan" USING btree (plan_type);


--
-- Name: PlatformSubscriptionPlan_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlatformSubscriptionPlan_school_id_idx" ON public."PlatformSubscriptionPlan" USING btree (school_id);


--
-- Name: PlatformSubscriptionPlan_school_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PlatformSubscriptionPlan_school_id_key" ON public."PlatformSubscriptionPlan" USING btree (school_id);


--
-- Name: PlatformSubscriptionPlan_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlatformSubscriptionPlan_status_idx" ON public."PlatformSubscriptionPlan" USING btree (status);


--
-- Name: Result_academic_session_id_student_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Result_academic_session_id_student_id_key" ON public."Result" USING btree (academic_session_id, student_id);


--
-- Name: Result_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Result_class_id_idx" ON public."Result" USING btree (class_id);


--
-- Name: Result_released_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Result_released_at_idx" ON public."Result" USING btree (released_at);


--
-- Name: Result_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Result_school_id_academic_session_id_idx" ON public."Result" USING btree (school_id, academic_session_id);


--
-- Name: Result_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Result_student_id_idx" ON public."Result" USING btree (student_id);


--
-- Name: SchoolResourceAccess_classId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_classId_isActive_idx" ON public."SchoolResourceAccess" USING btree ("classId", "isActive");


--
-- Name: SchoolResourceAccess_grantedById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_grantedById_idx" ON public."SchoolResourceAccess" USING btree ("grantedById");


--
-- Name: SchoolResourceAccess_libraryResourceAccessId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_libraryResourceAccessId_idx" ON public."SchoolResourceAccess" USING btree ("libraryResourceAccessId");


--
-- Name: SchoolResourceAccess_roleType_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_roleType_isActive_idx" ON public."SchoolResourceAccess" USING btree ("roleType", "isActive");


--
-- Name: SchoolResourceAccess_schoolId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_schoolId_isActive_idx" ON public."SchoolResourceAccess" USING btree ("schoolId", "isActive");


--
-- Name: SchoolResourceAccess_userId_isActive_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceAccess_userId_isActive_resourceType_idx" ON public."SchoolResourceAccess" USING btree ("userId", "isActive", "resourceType");


--
-- Name: SchoolResourceExclusion_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceExclusion_platformId_idx" ON public."SchoolResourceExclusion" USING btree ("platformId");


--
-- Name: SchoolResourceExclusion_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolResourceExclusion_schoolId_idx" ON public."SchoolResourceExclusion" USING btree ("schoolId");


--
-- Name: SchoolResourceExclusion_schoolId_platformId_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SchoolResourceExclusion_schoolId_platformId_subjectId_key" ON public."SchoolResourceExclusion" USING btree ("schoolId", "platformId", "subjectId");


--
-- Name: SchoolVideoView_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoView_userId_idx" ON public."SchoolVideoView" USING btree ("userId");


--
-- Name: SchoolVideoView_videoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoView_videoId_idx" ON public."SchoolVideoView" USING btree ("videoId");


--
-- Name: SchoolVideoView_videoId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SchoolVideoView_videoId_userId_key" ON public."SchoolVideoView" USING btree ("videoId", "userId");


--
-- Name: SchoolVideoView_viewedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoView_viewedAt_idx" ON public."SchoolVideoView" USING btree ("viewedAt");


--
-- Name: SchoolVideoWatchHistory_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_classId_idx" ON public."SchoolVideoWatchHistory" USING btree ("classId");


--
-- Name: SchoolVideoWatchHistory_completionPercentage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_completionPercentage_idx" ON public."SchoolVideoWatchHistory" USING btree ("completionPercentage");


--
-- Name: SchoolVideoWatchHistory_isCompleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_isCompleted_idx" ON public."SchoolVideoWatchHistory" USING btree ("isCompleted");


--
-- Name: SchoolVideoWatchHistory_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_schoolId_idx" ON public."SchoolVideoWatchHistory" USING btree ("schoolId");


--
-- Name: SchoolVideoWatchHistory_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_sessionId_idx" ON public."SchoolVideoWatchHistory" USING btree ("sessionId");


--
-- Name: SchoolVideoWatchHistory_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_userId_idx" ON public."SchoolVideoWatchHistory" USING btree ("userId");


--
-- Name: SchoolVideoWatchHistory_userId_watchedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_userId_watchedAt_idx" ON public."SchoolVideoWatchHistory" USING btree ("userId", "watchedAt");


--
-- Name: SchoolVideoWatchHistory_videoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_videoId_idx" ON public."SchoolVideoWatchHistory" USING btree ("videoId");


--
-- Name: SchoolVideoWatchHistory_videoId_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_videoId_schoolId_idx" ON public."SchoolVideoWatchHistory" USING btree ("videoId", "schoolId");


--
-- Name: SchoolVideoWatchHistory_videoId_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_videoId_userId_idx" ON public."SchoolVideoWatchHistory" USING btree ("videoId", "userId");


--
-- Name: SchoolVideoWatchHistory_watchedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SchoolVideoWatchHistory_watchedAt_idx" ON public."SchoolVideoWatchHistory" USING btree ("watchedAt");


--
-- Name: School_cacId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "School_cacId_key" ON public."School" USING btree ("cacId");


--
-- Name: School_school_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "School_school_email_key" ON public."School" USING btree (school_email);


--
-- Name: School_taxClearanceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "School_taxClearanceId_key" ON public."School" USING btree ("taxClearanceId");


--
-- Name: School_utilityBillId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "School_utilityBillId_key" ON public."School" USING btree ("utilityBillId");


--
-- Name: StudentAchievement_achievement_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StudentAchievement_achievement_id_idx" ON public."StudentAchievement" USING btree (achievement_id);


--
-- Name: StudentAchievement_student_id_achievement_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "StudentAchievement_student_id_achievement_id_key" ON public."StudentAchievement" USING btree (student_id, achievement_id);


--
-- Name: StudentAchievement_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StudentAchievement_student_id_idx" ON public."StudentAchievement" USING btree (student_id);


--
-- Name: Student_academic_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_academic_level_idx" ON public."Student" USING btree (academic_level);


--
-- Name: Student_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_academic_session_id_idx" ON public."Student" USING btree (academic_session_id);


--
-- Name: Student_admission_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_admission_number_idx" ON public."Student" USING btree (admission_number);


--
-- Name: Student_admission_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Student_admission_number_key" ON public."Student" USING btree (admission_number);


--
-- Name: Student_current_class_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_current_class_id_idx" ON public."Student" USING btree (current_class_id);


--
-- Name: Student_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_parent_id_idx" ON public."Student" USING btree (parent_id);


--
-- Name: Student_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_school_id_idx" ON public."Student" USING btree (school_id);


--
-- Name: Student_student_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Student_student_id_idx" ON public."Student" USING btree (student_id);


--
-- Name: Student_student_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Student_student_id_key" ON public."Student" USING btree (student_id);


--
-- Name: Student_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Student_user_id_key" ON public."Student" USING btree (user_id);


--
-- Name: Subject_code_schoolId_academic_session_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subject_code_schoolId_academic_session_id_key" ON public."Subject" USING btree (code, "schoolId", academic_session_id);


--
-- Name: SupportInfo_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupportInfo_school_id_idx" ON public."SupportInfo" USING btree (school_id);


--
-- Name: SupportInfo_school_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SupportInfo_school_id_key" ON public."SupportInfo" USING btree (school_id);


--
-- Name: TeacherResourceAccess_classId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceAccess_classId_isActive_idx" ON public."TeacherResourceAccess" USING btree ("classId", "isActive");


--
-- Name: TeacherResourceAccess_schoolId_teacherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceAccess_schoolId_teacherId_idx" ON public."TeacherResourceAccess" USING btree ("schoolId", "teacherId");


--
-- Name: TeacherResourceAccess_schoolResourceAccessId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceAccess_schoolResourceAccessId_idx" ON public."TeacherResourceAccess" USING btree ("schoolResourceAccessId");


--
-- Name: TeacherResourceAccess_studentId_isActive_resourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceAccess_studentId_isActive_resourceType_idx" ON public."TeacherResourceAccess" USING btree ("studentId", "isActive", "resourceType");


--
-- Name: TeacherResourceAccess_teacherId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceAccess_teacherId_isActive_idx" ON public."TeacherResourceAccess" USING btree ("teacherId", "isActive");


--
-- Name: TeacherResourceExclusion_classId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceExclusion_classId_idx" ON public."TeacherResourceExclusion" USING btree ("classId");


--
-- Name: TeacherResourceExclusion_libraryClassId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceExclusion_libraryClassId_idx" ON public."TeacherResourceExclusion" USING btree ("libraryClassId");


--
-- Name: TeacherResourceExclusion_schoolId_subjectId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceExclusion_schoolId_subjectId_idx" ON public."TeacherResourceExclusion" USING btree ("schoolId", "subjectId");


--
-- Name: TeacherResourceExclusion_studentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceExclusion_studentId_idx" ON public."TeacherResourceExclusion" USING btree ("studentId");


--
-- Name: TeacherResourceExclusion_teacherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TeacherResourceExclusion_teacherId_idx" ON public."TeacherResourceExclusion" USING btree ("teacherId");


--
-- Name: TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key" ON public."TeacherResourceExclusion" USING btree ("teacherId", "schoolId", "subjectId", "resourceType", "resourceId", "classId", "studentId", "libraryClassId");


--
-- Name: TeacherSubject_teacherId_subjectId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TeacherSubject_teacherId_subjectId_key" ON public."TeacherSubject" USING btree ("teacherId", "subjectId");


--
-- Name: Teacher_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_academic_session_id_idx" ON public."Teacher" USING btree (academic_session_id);


--
-- Name: Teacher_department_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_department_idx" ON public."Teacher" USING btree (department);


--
-- Name: Teacher_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Teacher_email_key" ON public."Teacher" USING btree (email);


--
-- Name: Teacher_employee_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_employee_number_idx" ON public."Teacher" USING btree (employee_number);


--
-- Name: Teacher_employee_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Teacher_employee_number_key" ON public."Teacher" USING btree (employee_number);


--
-- Name: Teacher_is_class_teacher_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_is_class_teacher_idx" ON public."Teacher" USING btree (is_class_teacher);


--
-- Name: Teacher_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_school_id_idx" ON public."Teacher" USING btree (school_id);


--
-- Name: Teacher_teacher_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Teacher_teacher_id_idx" ON public."Teacher" USING btree (teacher_id);


--
-- Name: Teacher_teacher_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Teacher_teacher_id_key" ON public."Teacher" USING btree (teacher_id);


--
-- Name: Teacher_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Teacher_user_id_key" ON public."Teacher" USING btree (user_id);


--
-- Name: TimeSlot_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimeSlot_order_idx" ON public."TimeSlot" USING btree ("order");


--
-- Name: TimeSlot_schoolId_startTime_endTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimeSlot_schoolId_startTime_endTime_idx" ON public."TimeSlot" USING btree ("schoolId", "startTime", "endTime");


--
-- Name: TimeSlot_startTime_endTime_schoolId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TimeSlot_startTime_endTime_schoolId_key" ON public."TimeSlot" USING btree ("startTime", "endTime", "schoolId");


--
-- Name: TimetableEntry_class_id_timeSlotId_day_of_week_academic_ses_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TimetableEntry_class_id_timeSlotId_day_of_week_academic_ses_key" ON public."TimetableEntry" USING btree (class_id, "timeSlotId", day_of_week, academic_session_id);


--
-- Name: TimetableEntry_school_id_day_of_week_timeSlotId_academic_se_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimetableEntry_school_id_day_of_week_timeSlotId_academic_se_idx" ON public."TimetableEntry" USING btree (school_id, day_of_week, "timeSlotId", academic_session_id);


--
-- Name: TimetableEntry_teacher_id_timeSlotId_day_of_week_academic_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimetableEntry_teacher_id_timeSlotId_day_of_week_academic_s_idx" ON public."TimetableEntry" USING btree (teacher_id, "timeSlotId", day_of_week, academic_session_id);


--
-- Name: Topic_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Topic_created_by_idx" ON public."Topic" USING btree (created_by);


--
-- Name: Topic_school_id_academic_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Topic_school_id_academic_session_id_idx" ON public."Topic" USING btree (school_id, academic_session_id);


--
-- Name: Topic_subject_id_order_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Topic_subject_id_order_idx" ON public."Topic" USING btree (subject_id, "order");


--
-- Name: Topic_subject_id_title_academic_session_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Topic_subject_id_title_academic_session_id_key" ON public."Topic" USING btree (subject_id, title, academic_session_id);


--
-- Name: UserSettings_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserSettings_school_id_idx" ON public."UserSettings" USING btree (school_id);


--
-- Name: UserSettings_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserSettings_user_id_idx" ON public."UserSettings" USING btree (user_id);


--
-- Name: UserSettings_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserSettings_user_id_key" ON public."UserSettings" USING btree (user_id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: VideoContent_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoContent_createdAt_idx" ON public."VideoContent" USING btree ("createdAt");


--
-- Name: VideoContent_platformId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoContent_platformId_idx" ON public."VideoContent" USING btree ("platformId");


--
-- Name: VideoContent_schoolId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoContent_schoolId_idx" ON public."VideoContent" USING btree ("schoolId");


--
-- Name: VideoContent_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoContent_status_idx" ON public."VideoContent" USING btree (status);


--
-- Name: VideoContent_topic_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VideoContent_topic_id_idx" ON public."VideoContent" USING btree (topic_id);


--
-- Name: WalletTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WalletTransaction_createdAt_idx" ON public."WalletTransaction" USING btree ("createdAt");


--
-- Name: WalletTransaction_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WalletTransaction_reference_idx" ON public."WalletTransaction" USING btree (reference);


--
-- Name: WalletTransaction_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON public."WalletTransaction" USING btree (reference);


--
-- Name: WalletTransaction_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WalletTransaction_status_idx" ON public."WalletTransaction" USING btree (status);


--
-- Name: WalletTransaction_transaction_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WalletTransaction_transaction_type_idx" ON public."WalletTransaction" USING btree (transaction_type);


--
-- Name: WalletTransaction_wallet_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WalletTransaction_wallet_id_idx" ON public."WalletTransaction" USING btree (wallet_id);


--
-- Name: Wallet_school_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wallet_school_id_idx" ON public."Wallet" USING btree (school_id);


--
-- Name: Wallet_school_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Wallet_school_id_key" ON public."Wallet" USING btree (school_id);


--
-- Name: Wallet_wallet_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wallet_wallet_type_idx" ON public."Wallet" USING btree (wallet_type);


--
-- Name: _LibraryResponseOptions_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_LibraryResponseOptions_B_index" ON public."_LibraryResponseOptions" USING btree ("B");


--
-- Name: _ResponseOptions_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ResponseOptions_B_index" ON public."_ResponseOptions" USING btree ("B");


--
-- Name: AcademicSession AcademicSession_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AcademicSession"
    ADD CONSTRAINT "AcademicSession_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Achievement Achievement_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Achievement Achievement_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Achievement"
    ADD CONSTRAINT "Achievement_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentAnalytics AssessmentAnalytics_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAnalytics"
    ADD CONSTRAINT "AssessmentAnalytics_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public."Assessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentAttempt AssessmentAttempt_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentAttempt AssessmentAttempt_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public."Assessment"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentAttempt AssessmentAttempt_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_graded_by_fkey" FOREIGN KEY (graded_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AssessmentAttempt AssessmentAttempt_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentAttempt AssessmentAttempt_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentAttempt"
    ADD CONSTRAINT "AssessmentAttempt_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentCorrectAnswer AssessmentCorrectAnswer_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentCorrectAnswer"
    ADD CONSTRAINT "AssessmentCorrectAnswer_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public."AssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentOption AssessmentOption_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentOption"
    ADD CONSTRAINT "AssessmentOption_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public."AssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentQuestion AssessmentQuestion_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public."Assessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentResponse AssessmentResponse_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_attempt_id_fkey" FOREIGN KEY (attempt_id) REFERENCES public."AssessmentAttempt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentResponse AssessmentResponse_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public."AssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentResponse AssessmentResponse_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentResponse"
    ADD CONSTRAINT "AssessmentResponse_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentSubmission AssessmentSubmission_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentSubmission AssessmentSubmission_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_assessment_id_fkey" FOREIGN KEY (assessment_id) REFERENCES public."Assessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssessmentSubmission AssessmentSubmission_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_graded_by_fkey" FOREIGN KEY (graded_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AssessmentSubmission AssessmentSubmission_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssessmentSubmission AssessmentSubmission_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssessmentSubmission"
    ADD CONSTRAINT "AssessmentSubmission_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assessment Assessment_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Assessment Assessment_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assessment"
    ADD CONSTRAINT "Assessment_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AssignmentGrade AssignmentGrade_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentGrade AssignmentGrade_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public."Assignment"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentGrade AssignmentGrade_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentGrade AssignmentGrade_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentGrade AssignmentGrade_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_submission_id_fkey" FOREIGN KEY (submission_id) REFERENCES public."AssignmentSubmission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentGrade AssignmentGrade_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentGrade"
    ADD CONSTRAINT "AssignmentGrade_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentSubmission AssignmentSubmission_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentSubmission AssignmentSubmission_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES public."Assignment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssignmentSubmission AssignmentSubmission_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentSubmission AssignmentSubmission_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssignmentSubmission AssignmentSubmission_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssignmentSubmission"
    ADD CONSTRAINT "AssignmentSubmission_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Assignment Assignment_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assignment Assignment_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assignment Assignment_grading_rubric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_grading_rubric_id_fkey" FOREIGN KEY (grading_rubric_id) REFERENCES public."GradingRubric"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Assignment Assignment_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Assignment Assignment_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Assignment"
    ADD CONSTRAINT "Assignment_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceRecord AttendanceRecord_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceRecord AttendanceRecord_attendance_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_attendance_session_id_fkey" FOREIGN KEY (attendance_session_id) REFERENCES public."AttendanceSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceRecord AttendanceRecord_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceRecord AttendanceRecord_marked_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_marked_by_fkey" FOREIGN KEY (marked_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AttendanceRecord AttendanceRecord_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceRecord AttendanceRecord_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceRecord"
    ADD CONSTRAINT "AttendanceRecord_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSession AttendanceSession_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSession AttendanceSession_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AttendanceSession AttendanceSession_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSession AttendanceSession_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSession AttendanceSession_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSettings AttendanceSettings_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSettings"
    ADD CONSTRAINT "AttendanceSettings_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSettings AttendanceSettings_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSettings"
    ADD CONSTRAINT "AttendanceSettings_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSummary AttendanceSummary_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSummary"
    ADD CONSTRAINT "AttendanceSummary_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSummary AttendanceSummary_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSummary"
    ADD CONSTRAINT "AttendanceSummary_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSummary AttendanceSummary_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSummary"
    ADD CONSTRAINT "AttendanceSummary_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceSummary AttendanceSummary_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSummary"
    ADD CONSTRAINT "AttendanceSummary_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatAnalytics ChatAnalytics_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatAnalytics"
    ADD CONSTRAINT "ChatAnalytics_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public."PDFMaterial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatAnalytics ChatAnalytics_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatAnalytics"
    ADD CONSTRAINT "ChatAnalytics_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatAnalytics ChatAnalytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatAnalytics"
    ADD CONSTRAINT "ChatAnalytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatContext ChatContext_chunk_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatContext"
    ADD CONSTRAINT "ChatContext_chunk_id_fkey" FOREIGN KEY (chunk_id) REFERENCES public."DocumentChunk"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatContext ChatContext_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatContext"
    ADD CONSTRAINT "ChatContext_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public."ChatConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatContext ChatContext_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatContext"
    ADD CONSTRAINT "ChatContext_message_id_fkey" FOREIGN KEY (message_id) REFERENCES public."ChatMessage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatContext ChatContext_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatContext"
    ADD CONSTRAINT "ChatContext_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatConversation ChatConversation_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatConversation"
    ADD CONSTRAINT "ChatConversation_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public."PDFMaterial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatConversation ChatConversation_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatConversation"
    ADD CONSTRAINT "ChatConversation_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatConversation ChatConversation_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatConversation"
    ADD CONSTRAINT "ChatConversation_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatMessage ChatMessage_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public."ChatConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public."PDFMaterial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatMessage ChatMessage_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatMessage ChatMessage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Class Class_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Class Class_classTeacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Class Class_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeviceToken DeviceToken_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceToken"
    ADD CONSTRAINT "DeviceToken_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeviceToken DeviceToken_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeviceToken"
    ADD CONSTRAINT "DeviceToken_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentChunk DocumentChunk_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentChunk"
    ADD CONSTRAINT "DocumentChunk_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public."PDFMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentChunk DocumentChunk_material_processing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentChunk"
    ADD CONSTRAINT "DocumentChunk_material_processing_id_fkey" FOREIGN KEY (material_processing_id) REFERENCES public."MaterialProcessing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DocumentChunk DocumentChunk_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DocumentChunk"
    ADD CONSTRAINT "DocumentChunk_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExamBodyAssessmentAttempt ExamBodyAssessmentAttempt_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentAttempt"
    ADD CONSTRAINT "ExamBodyAssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."ExamBodyAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentAttempt ExamBodyAssessmentAttempt_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentAttempt"
    ADD CONSTRAINT "ExamBodyAssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentCorrectAnswer ExamBodyAssessmentCorrectAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentCorrectAnswer"
    ADD CONSTRAINT "ExamBodyAssessmentCorrectAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."ExamBodyAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentOption ExamBodyAssessmentOption_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentOption"
    ADD CONSTRAINT "ExamBodyAssessmentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."ExamBodyAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentQuestion ExamBodyAssessmentQuestion_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentQuestion"
    ADD CONSTRAINT "ExamBodyAssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."ExamBodyAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentResponse ExamBodyAssessmentResponse_attemptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentResponse"
    ADD CONSTRAINT "ExamBodyAssessmentResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES public."ExamBodyAssessmentAttempt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentResponse ExamBodyAssessmentResponse_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentResponse"
    ADD CONSTRAINT "ExamBodyAssessmentResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."ExamBodyAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessmentResponse ExamBodyAssessmentResponse_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessmentResponse"
    ADD CONSTRAINT "ExamBodyAssessmentResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessment ExamBodyAssessment_examBodyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessment"
    ADD CONSTRAINT "ExamBodyAssessment_examBodyId_fkey" FOREIGN KEY ("examBodyId") REFERENCES public."ExamBody"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessment ExamBodyAssessment_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessment"
    ADD CONSTRAINT "ExamBodyAssessment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ExamBodyAssessment ExamBodyAssessment_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessment"
    ADD CONSTRAINT "ExamBodyAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."ExamBodySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyAssessment ExamBodyAssessment_yearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyAssessment"
    ADD CONSTRAINT "ExamBodyAssessment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES public."ExamBodyYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodySubject ExamBodySubject_examBodyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodySubject"
    ADD CONSTRAINT "ExamBodySubject_examBodyId_fkey" FOREIGN KEY ("examBodyId") REFERENCES public."ExamBody"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExamBodyYear ExamBodyYear_examBodyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExamBodyYear"
    ADD CONSTRAINT "ExamBodyYear_examBodyId_fkey" FOREIGN KEY ("examBodyId") REFERENCES public."ExamBody"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Finance Finance_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Finance"
    ADD CONSTRAINT "Finance_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GradingRubric GradingRubric_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradingRubric"
    ADD CONSTRAINT "GradingRubric_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GradingRubric GradingRubric_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradingRubric"
    ADD CONSTRAINT "GradingRubric_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GradingRubric GradingRubric_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradingRubric"
    ADD CONSTRAINT "GradingRubric_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessmentAnalytics LibraryAssessmentAnalytics_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAnalytics"
    ADD CONSTRAINT "LibraryAssessmentAnalytics_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessmentAttempt LibraryAssessmentAttempt_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAttempt"
    ADD CONSTRAINT "LibraryAssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessmentAttempt LibraryAssessmentAttempt_gradedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAttempt"
    ADD CONSTRAINT "LibraryAssessmentAttempt_gradedBy_fkey" FOREIGN KEY ("gradedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryAssessmentAttempt LibraryAssessmentAttempt_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentAttempt"
    ADD CONSTRAINT "LibraryAssessmentAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessmentCorrectAnswer LibraryAssessmentCorrectAnswer_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentCorrectAnswer"
    ADD CONSTRAINT "LibraryAssessmentCorrectAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."LibraryAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessmentOption LibraryAssessmentOption_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentOption"
    ADD CONSTRAINT "LibraryAssessmentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."LibraryAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessmentQuestion LibraryAssessmentQuestion_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentQuestion"
    ADD CONSTRAINT "LibraryAssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessmentResponse LibraryAssessmentResponse_attemptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentResponse"
    ADD CONSTRAINT "LibraryAssessmentResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES public."LibraryAssessmentAttempt"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessmentResponse LibraryAssessmentResponse_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentResponse"
    ADD CONSTRAINT "LibraryAssessmentResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."LibraryAssessmentQuestion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessmentResponse LibraryAssessmentResponse_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessmentResponse"
    ADD CONSTRAINT "LibraryAssessmentResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessment LibraryAssessment_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessment"
    ADD CONSTRAINT "LibraryAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessment LibraryAssessment_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessment"
    ADD CONSTRAINT "LibraryAssessment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssessment LibraryAssessment_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessment"
    ADD CONSTRAINT "LibraryAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssessment LibraryAssessment_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssessment"
    ADD CONSTRAINT "LibraryAssessment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryAssignment LibraryAssignment_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssignment"
    ADD CONSTRAINT "LibraryAssignment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssignment LibraryAssignment_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssignment"
    ADD CONSTRAINT "LibraryAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssignment LibraryAssignment_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssignment"
    ADD CONSTRAINT "LibraryAssignment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryAssignment LibraryAssignment_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryAssignment"
    ADD CONSTRAINT "LibraryAssignment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryComment LibraryComment_commentedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_commentedById_fkey" FOREIGN KEY ("commentedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryComment LibraryComment_parentCommentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES public."LibraryComment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryComment LibraryComment_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryComment LibraryComment_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryComment LibraryComment_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryComment LibraryComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryComment"
    ADD CONSTRAINT "LibraryComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryGeneralMaterialChapterFile LibraryGeneralMaterialChapterFile_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapterFile"
    ADD CONSTRAINT "LibraryGeneralMaterialChapterFile_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."LibraryGeneralMaterialChapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChapterFile LibraryGeneralMaterialChapterFile_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapterFile"
    ADD CONSTRAINT "LibraryGeneralMaterialChapterFile_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChapterFile LibraryGeneralMaterialChapterFile_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapterFile"
    ADD CONSTRAINT "LibraryGeneralMaterialChapterFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChapter LibraryGeneralMaterialChapter_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapter"
    ADD CONSTRAINT "LibraryGeneralMaterialChapter_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChapter LibraryGeneralMaterialChapter_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChapter"
    ADD CONSTRAINT "LibraryGeneralMaterialChapter_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatContext LibraryGeneralMaterialChatContext_chunkId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatContext"
    ADD CONSTRAINT "LibraryGeneralMaterialChatContext_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES public."LibraryGeneralMaterialChunk"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatContext LibraryGeneralMaterialChatContext_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatContext"
    ADD CONSTRAINT "LibraryGeneralMaterialChatContext_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."LibraryGeneralMaterialChatConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChatContext LibraryGeneralMaterialChatContext_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatContext"
    ADD CONSTRAINT "LibraryGeneralMaterialChatContext_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatConversation LibraryGeneralMaterialChatConversation_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatConversation"
    ADD CONSTRAINT "LibraryGeneralMaterialChatConversation_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatConversation LibraryGeneralMaterialChatConversation_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatConversation"
    ADD CONSTRAINT "LibraryGeneralMaterialChatConversation_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatConversation LibraryGeneralMaterialChatConversation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatConversation"
    ADD CONSTRAINT "LibraryGeneralMaterialChatConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatMessage LibraryGeneralMaterialChatMessage_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatMessage"
    ADD CONSTRAINT "LibraryGeneralMaterialChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."LibraryGeneralMaterialChatConversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChatMessage LibraryGeneralMaterialChatMessage_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatMessage"
    ADD CONSTRAINT "LibraryGeneralMaterialChatMessage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChatMessage LibraryGeneralMaterialChatMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChatMessage"
    ADD CONSTRAINT "LibraryGeneralMaterialChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChunk LibraryGeneralMaterialChunk_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChunk"
    ADD CONSTRAINT "LibraryGeneralMaterialChunk_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."LibraryGeneralMaterialChapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChunk LibraryGeneralMaterialChunk_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChunk"
    ADD CONSTRAINT "LibraryGeneralMaterialChunk_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialChunk LibraryGeneralMaterialChunk_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChunk"
    ADD CONSTRAINT "LibraryGeneralMaterialChunk_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialChunk LibraryGeneralMaterialChunk_processingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialChunk"
    ADD CONSTRAINT "LibraryGeneralMaterialChunk_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES public."LibraryGeneralMaterialProcessing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialClass LibraryGeneralMaterialClass_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialClass"
    ADD CONSTRAINT "LibraryGeneralMaterialClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."LibraryClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialClass LibraryGeneralMaterialClass_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialClass"
    ADD CONSTRAINT "LibraryGeneralMaterialClass_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialProcessing LibraryGeneralMaterialProcessing_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialProcessing"
    ADD CONSTRAINT "LibraryGeneralMaterialProcessing_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryGeneralMaterialProcessing LibraryGeneralMaterialProcessing_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialProcessing"
    ADD CONSTRAINT "LibraryGeneralMaterialProcessing_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialPurchase LibraryGeneralMaterialPurchase_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialPurchase"
    ADD CONSTRAINT "LibraryGeneralMaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryGeneralMaterial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialPurchase LibraryGeneralMaterialPurchase_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialPurchase"
    ADD CONSTRAINT "LibraryGeneralMaterialPurchase_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterialPurchase LibraryGeneralMaterialPurchase_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterialPurchase"
    ADD CONSTRAINT "LibraryGeneralMaterialPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterial LibraryGeneralMaterial_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterial"
    ADD CONSTRAINT "LibraryGeneralMaterial_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryGeneralMaterial LibraryGeneralMaterial_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterial"
    ADD CONSTRAINT "LibraryGeneralMaterial_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryGeneralMaterial LibraryGeneralMaterial_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryGeneralMaterial"
    ADD CONSTRAINT "LibraryGeneralMaterial_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryLink LibraryLink_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryLink"
    ADD CONSTRAINT "LibraryLink_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryLink LibraryLink_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryLink"
    ADD CONSTRAINT "LibraryLink_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryLink LibraryLink_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryLink"
    ADD CONSTRAINT "LibraryLink_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryLink LibraryLink_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryLink"
    ADD CONSTRAINT "LibraryLink_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryMaterial LibraryMaterial_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryMaterial"
    ADD CONSTRAINT "LibraryMaterial_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryMaterial LibraryMaterial_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryMaterial"
    ADD CONSTRAINT "LibraryMaterial_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryMaterial LibraryMaterial_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryMaterial"
    ADD CONSTRAINT "LibraryMaterial_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryMaterial LibraryMaterial_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryMaterial"
    ADD CONSTRAINT "LibraryMaterial_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceAccess LibraryResourceAccess_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceAccess"
    ADD CONSTRAINT "LibraryResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."LibraryVideoLesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryResourceUser LibraryResourceUser_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResourceUser"
    ADD CONSTRAINT "LibraryResourceUser_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryResource LibraryResource_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResource"
    ADD CONSTRAINT "LibraryResource_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."Organisation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryResource LibraryResource_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResource"
    ADD CONSTRAINT "LibraryResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryResource LibraryResource_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResource"
    ADD CONSTRAINT "LibraryResource_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryResource LibraryResource_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryResource"
    ADD CONSTRAINT "LibraryResource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibrarySubject LibrarySubject_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibrarySubject"
    ADD CONSTRAINT "LibrarySubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."LibraryClass"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibrarySubject LibrarySubject_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibrarySubject"
    ADD CONSTRAINT "LibrarySubject_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryTopic LibraryTopic_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryTopic"
    ADD CONSTRAINT "LibraryTopic_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryTopic LibraryTopic_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryTopic"
    ADD CONSTRAINT "LibraryTopic_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryVideoLesson LibraryVideoLesson_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoLesson"
    ADD CONSTRAINT "LibraryVideoLesson_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."LibraryPlatform"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryVideoLesson LibraryVideoLesson_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoLesson"
    ADD CONSTRAINT "LibraryVideoLesson_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryVideoLesson LibraryVideoLesson_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoLesson"
    ADD CONSTRAINT "LibraryVideoLesson_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LibraryVideoLesson LibraryVideoLesson_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoLesson"
    ADD CONSTRAINT "LibraryVideoLesson_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LibraryVideoView LibraryVideoView_libraryResourceUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoView"
    ADD CONSTRAINT "LibraryVideoView_libraryResourceUserId_fkey" FOREIGN KEY ("libraryResourceUserId") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryVideoView LibraryVideoView_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoView"
    ADD CONSTRAINT "LibraryVideoView_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryVideoView LibraryVideoView_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoView"
    ADD CONSTRAINT "LibraryVideoView_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."LibraryVideoLesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryVideoWatchHistory LibraryVideoWatchHistory_libraryResourceUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoWatchHistory"
    ADD CONSTRAINT "LibraryVideoWatchHistory_libraryResourceUserId_fkey" FOREIGN KEY ("libraryResourceUserId") REFERENCES public."LibraryResourceUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryVideoWatchHistory LibraryVideoWatchHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoWatchHistory"
    ADD CONSTRAINT "LibraryVideoWatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LibraryVideoWatchHistory LibraryVideoWatchHistory_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LibraryVideoWatchHistory"
    ADD CONSTRAINT "LibraryVideoWatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."LibraryVideoLesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiveClass LiveClass_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LiveClass LiveClass_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."Organisation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LiveClass LiveClass_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LiveClass LiveClass_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveClass"
    ADD CONSTRAINT "LiveClass_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MaterialProcessing MaterialProcessing_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialProcessing"
    ADD CONSTRAINT "MaterialProcessing_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public."PDFMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MaterialProcessing MaterialProcessing_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MaterialProcessing"
    ADD CONSTRAINT "MaterialProcessing_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PDFMaterial PDFMaterial_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PDFMaterial"
    ADD CONSTRAINT "PDFMaterial_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."Organisation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PDFMaterial PDFMaterial_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PDFMaterial"
    ADD CONSTRAINT "PDFMaterial_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PDFMaterial PDFMaterial_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PDFMaterial"
    ADD CONSTRAINT "PDFMaterial_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PDFMaterial PDFMaterial_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PDFMaterial"
    ADD CONSTRAINT "PDFMaterial_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Parent Parent_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Parent Parent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Parent"
    ADD CONSTRAINT "Parent_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_finance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_finance_id_fkey" FOREIGN KEY (finance_id) REFERENCES public."Finance"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlatformSubscriptionPlan PlatformSubscriptionPlan_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlatformSubscriptionPlan"
    ADD CONSTRAINT "PlatformSubscriptionPlan_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Result Result_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Result Result_released_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_released_by_fkey" FOREIGN KEY (released_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Result Result_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Result Result_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Result"
    ADD CONSTRAINT "Result_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_grantedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_libraryResourceAccessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_libraryResourceAccessId_fkey" FOREIGN KEY ("libraryResourceAccessId") REFERENCES public."LibraryResourceAccess"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceAccess SchoolResourceAccess_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceAccess"
    ADD CONSTRAINT "SchoolResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."LibraryVideoLesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceExclusion SchoolResourceExclusion_excludedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceExclusion"
    ADD CONSTRAINT "SchoolResourceExclusion_excludedById_fkey" FOREIGN KEY ("excludedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceExclusion SchoolResourceExclusion_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceExclusion"
    ADD CONSTRAINT "SchoolResourceExclusion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolResourceExclusion SchoolResourceExclusion_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolResourceExclusion"
    ADD CONSTRAINT "SchoolResourceExclusion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolVideoView SchoolVideoView_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoView"
    ADD CONSTRAINT "SchoolVideoView_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolVideoView SchoolVideoView_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoView"
    ADD CONSTRAINT "SchoolVideoView_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."VideoContent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolVideoWatchHistory SchoolVideoWatchHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoWatchHistory"
    ADD CONSTRAINT "SchoolVideoWatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SchoolVideoWatchHistory SchoolVideoWatchHistory_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchoolVideoWatchHistory"
    ADD CONSTRAINT "SchoolVideoWatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."VideoContent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: School School_cacId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_cacId_fkey" FOREIGN KEY ("cacId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: School School_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."Organisation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: School School_taxClearanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_taxClearanceId_fkey" FOREIGN KEY ("taxClearanceId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: School School_utilityBillId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."School"
    ADD CONSTRAINT "School_utilityBillId_fkey" FOREIGN KEY ("utilityBillId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StudentAchievement StudentAchievement_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAchievement"
    ADD CONSTRAINT "StudentAchievement_achievement_id_fkey" FOREIGN KEY (achievement_id) REFERENCES public."Achievement"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentAchievement StudentAchievement_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentAchievement"
    ADD CONSTRAINT "StudentAchievement_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StudentPerformance StudentPerformance_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentPerformance"
    ADD CONSTRAINT "StudentPerformance_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentPerformance StudentPerformance_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentPerformance"
    ADD CONSTRAINT "StudentPerformance_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StudentPerformance StudentPerformance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StudentPerformance"
    ADD CONSTRAINT "StudentPerformance_student_id_fkey" FOREIGN KEY (student_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_current_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_current_class_id_fkey" FOREIGN KEY (current_class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public."Parent"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Student Student_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Student Student_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subject Subject_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Subject Subject_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Subject Subject_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subject"
    ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SupportInfo SupportInfo_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupportInfo"
    ADD CONSTRAINT "SupportInfo_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_assessmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES public."LibraryAssessment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_materialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES public."LibraryMaterial"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_schoolResourceAccessId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_schoolResourceAccessId_fkey" FOREIGN KEY ("schoolResourceAccessId") REFERENCES public."SchoolResourceAccess"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."LibraryTopic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceAccess TeacherResourceAccess_videoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceAccess"
    ADD CONSTRAINT "TeacherResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES public."LibraryVideoLesson"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_libraryClassId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_libraryClassId_fkey" FOREIGN KEY ("libraryClassId") REFERENCES public."LibraryClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."LibrarySubject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherResourceExclusion TeacherResourceExclusion_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TeacherSubject TeacherSubject_subjectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherSubject"
    ADD CONSTRAINT "TeacherSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TeacherSubject TeacherSubject_teacherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TeacherSubject"
    ADD CONSTRAINT "TeacherSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Teacher Teacher_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Teacher Teacher_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Teacher Teacher_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Teacher"
    ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimeSlot TimeSlot_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimeSlot"
    ADD CONSTRAINT "TimeSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES public."Teacher"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TimetableEntry TimetableEntry_timeSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimetableEntry"
    ADD CONSTRAINT "TimetableEntry_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES public."TimeSlot"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Topic Topic_academic_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_academic_session_id_fkey" FOREIGN KEY (academic_session_id) REFERENCES public."AcademicSession"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Topic Topic_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Topic Topic_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Topic Topic_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public."Subject"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSettings UserSettings_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserSettings UserSettings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSettings"
    ADD CONSTRAINT "UserSettings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VideoContent VideoContent_platformId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoContent"
    ADD CONSTRAINT "VideoContent_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES public."Organisation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: VideoContent VideoContent_schoolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoContent"
    ADD CONSTRAINT "VideoContent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VideoContent VideoContent_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoContent"
    ADD CONSTRAINT "VideoContent_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VideoContent VideoContent_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VideoContent"
    ADD CONSTRAINT "VideoContent_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WalletTransaction WalletTransaction_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WalletTransaction"
    ADD CONSTRAINT "WalletTransaction_wallet_id_fkey" FOREIGN KEY (wallet_id) REFERENCES public."Wallet"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Wallet Wallet_financeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_financeId_fkey" FOREIGN KEY ("financeId") REFERENCES public."Finance"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Wallet Wallet_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wallet"
    ADD CONSTRAINT "Wallet_school_id_fkey" FOREIGN KEY (school_id) REFERENCES public."School"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _LibraryResponseOptions _LibraryResponseOptions_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LibraryResponseOptions"
    ADD CONSTRAINT "_LibraryResponseOptions_A_fkey" FOREIGN KEY ("A") REFERENCES public."LibraryAssessmentOption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _LibraryResponseOptions _LibraryResponseOptions_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_LibraryResponseOptions"
    ADD CONSTRAINT "_LibraryResponseOptions_B_fkey" FOREIGN KEY ("B") REFERENCES public."LibraryAssessmentResponse"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ResponseOptions _ResponseOptions_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ResponseOptions"
    ADD CONSTRAINT "_ResponseOptions_A_fkey" FOREIGN KEY ("A") REFERENCES public."AssessmentOption"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ResponseOptions _ResponseOptions_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ResponseOptions"
    ADD CONSTRAINT "_ResponseOptions_B_fkey" FOREIGN KEY ("B") REFERENCES public."AssessmentResponse"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict W0Pgni8NYBDFqellAQghMZJQNBk6cfuFilGdADpjjesdAbnt0lW6jeWV6XyjXdX

