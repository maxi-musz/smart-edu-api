# Smart Edu Hub Backend - Complete Project Overview

**Last Updated:** January 9, 2026  
**Version:** 1.0  
**Tech Stack:** NestJS + PostgreSQL + Prisma + AWS S3 + OpenAI

---

## 🎯 PROJECT SUMMARY

**Smart Edu Hub** is a comprehensive **school management and e-learning platform** that combines:
- Complete school administration (students, teachers, classes, subjects, schedules)
- Learning management system (content, assessments, assignments)
- AI-powered document chat (chat with PDFs using OpenAI)
- Public library marketplace (textbooks/ebooks accessible by multiple schools)
- Results & attendance tracking
- Financial management
- Push notifications

---

## 🏗️ ARCHITECTURE OVERVIEW

### Tech Stack
- **Backend Framework:** NestJS (Node.js + TypeScript)
- **Database:** PostgreSQL with Prisma ORM
- **Vector Database:** PostgreSQL with pgvector extension (for AI embeddings)
- **File Storage:** AWS S3 (primary) + Cloudinary (legacy support)
- **AI Integration:** OpenAI (embeddings + chat)
- **Authentication:** JWT with Passport
- **API Documentation:** Swagger/OpenAPI
- **Deployment:** Docker + Docker Compose (dev/staging/prod)

### Project Structure
```
src/
├── academic-session/       # Academic year/term management
├── admin/                  # Admin operations
├── ai-chat-latest/         # AI chat with documents (OpenAI + pgvector)
├── common/                 # Shared utilities, decorators
├── config/                 # Configuration (app, database)
├── developer/              # Developer identity & library dev tools
├── docs/                   # API documentation setup
├── hello/                  # Health check module
├── library/                # Public library marketplace
│   ├── assessment/         # Library CBT assessments
│   ├── content/            # Videos, PDFs, materials
│   ├── general-materials/  # Textbooks/ebooks
│   ├── library-auth/       # Library user authentication
│   ├── profile/            # Library user profiles
│   ├── resources/          # Library resources
│   ├── schools/            # Schools accessing library
│   └── subject/            # Library subjects & chapters
├── prisma/                 # Prisma client & migrations
├── push-notifications/     # Push notification system
├── school/                 # Main school operations
│   ├── auth/               # School authentication (JWT)
│   ├── director/           # School director operations
│   │   ├── assessments/    # View all teacher assessments
│   │   ├── classes/        # Class management
│   │   ├── dashboard/      # Director dashboards
│   │   ├── finance/        # Financial operations
│   │   ├── notifications/  # School-wide notifications
│   │   ├── profiles/       # Director profile
│   │   ├── results/        # Results release management
│   │   ├── schedules/      # Timetable management
│   │   ├── students/       # Student management
│   │   ├── subject/        # Subject management
│   │   ├── teachers/       # Teacher management
│   │   └── user/           # User management
│   ├── students/           # Student operations
│   │   └── results/        # View results
│   ├── teachers/           # Teacher operations
│   │   ├── assessments/    # Create/manage assessments
│   │   ├── attendance-teacher/ # Mark attendance
│   │   ├── profiles/       # Teacher profile
│   │   ├── results/        # Release results
│   │   ├── subjects/       # View assigned subjects
│   │   └── topics/         # Create/manage topics & content
│   └── ai-chat/            # School-scoped AI chat
├── shared/                 # Shared services & helpers
│   ├── helper-functions/   # Response helpers, formatters, OTP
│   ├── services/           # S3, storage providers, Excel processor
│   └── middleware/         # Request logger
├── user/                   # User module
└── main.ts                 # Application entry point
```

---

## 🗄️ DATABASE SCHEMA OVERVIEW

### Core Entities

**School Hierarchy:**
- `School` - Main school entity
- `AcademicSession` - Academic year & term (e.g., "2024/2025 - First Term")
- `Class` - Classes (e.g., "JSS 1", "SS 2")
- `Subject` - Subjects (e.g., "Mathematics", "English")
- `Topic` - Topics within subjects

**Users:**
- `User` - Base user entity (all users)
- `Student` - Student-specific data
- `Teacher` - Teacher-specific data
- `Parent` - Parent-specific data
- `Developer` - Smart Edu Hub internal developers

**Learning Management:**
- `Topic` - Topics within subjects
- `VideoContent` - Video lessons
- `PDFMaterial` - PDF materials
- `LibraryResource` - General learning resources
- `Assignment` - Assignments
- `Assessment` - Assessments (CBT, exams)
- `AssessmentQuestion` - Questions
- `AssessmentResponse` - Student answers
- `AssessmentAttempt` - Student attempts
- `Result` - Academic results

**Scheduling & Attendance:**
- `TimetableEntry` - Class schedules
- `TimeSlot` - Time periods
- `AttendanceSession` - Attendance tracking
- `AttendanceRecord` - Individual attendance records
- `AttendanceSummary` - Attendance summaries

**Finance:**
- `Finance` - School finances
- `Payment` - Fee payments
- `Wallet` - School/student wallets
- `WalletTransaction` - Wallet transactions

**AI Chat System:**
- `ChatConversation` - Chat sessions
- `ChatMessage` - Chat messages
- `PDFMaterial` - Uploaded PDFs
- `MaterialProcessing` - Processing status
- `DocumentChunk` - Text chunks with embeddings (pgvector)
- `ChatContext` - Chat context
- `ChatAnalytics` - Usage analytics

**Library (Public Marketplace):**
- `Organisation` (Platform) - Library platforms
- `LibraryUser` - Library users (platform owners)
- `LibraryClass` - Library classes
- `LibrarySubject` - Library subjects
- `LibraryGeneralMaterial` - Textbooks/ebooks
- `LibraryGeneralMaterialChapter` - Book chapters
- `LibraryGeneralMaterialChapterFile` - Chapter files
- `LibraryAssessment` - Library assessments
- `LibraryAssessmentQuestion` - Library questions
- `LibraryAssessmentAttempt` - User attempts

**Notifications:**
- `Notification` - System notifications
- `DeviceToken` - Push notification tokens

**Subscriptions:**
- `PlatformSubscriptionPlan` - Subscription plans (FREE, BASIC, PREMIUM, ENTERPRISE)

### Key Enums

**Roles:**
```typescript
enum Roles {
  student
  teacher
  school_director
  school_admin
  parent
  super_admin
  ict_staff
}
```

**School Types:**
```typescript
enum SchoolType {
  primary
  secondary
  primary_and_secondary
}
```

**Assessment Types:**
```typescript
enum AssessmentType {
  FORMATIVE | SUMMATIVE | DIAGNOSTIC | BENCHMARK
  PRACTICE | MOCK_EXAM | QUIZ | TEST | EXAM
  ASSIGNMENT | CBT | OTHER
}
```

**Question Types:**
```typescript
enum QuestionType {
  MULTIPLE_CHOICE_SINGLE | MULTIPLE_CHOICE_MULTIPLE
  SHORT_ANSWER | LONG_ANSWER | TRUE_FALSE
  FILL_IN_BLANK | MATCHING | ORDERING
  FILE_UPLOAD | NUMERIC | DATE | RATING_SCALE
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Authentication Flow
1. **School Users:** JWT-based authentication via `/api/v1/auth/*`
2. **Library Users:** Separate JWT via `/api/v1/library/library-auth/*`
3. **Developers:** Developer JWT via `/api/v1/developer/identity/*`

### Guards
- `JwtGuard` - Main authentication guard (school users)
- `LibraryJwtGuard` - Library authentication guard
- Both use Passport JWT strategy

### User Context
- Use `@GetUser()` decorator to get authenticated user in controllers
- User object includes: `id`, `email`, `role`, `school_id`, etc.

### Role-Based Access
- **School Director:** Full school management access
- **Teacher:** Create assessments, mark attendance, upload content, view assigned classes
- **Student:** Take assessments, view results, access content, view attendance
- **Parent:** View children's results & attendance
- **Library User:** Manage library materials, assessments, content

---

## 📦 KEY FEATURES BY MODULE

### 1. School Module (`src/school/`)

#### Authentication (`school/auth/`)
- School registration & login
- OTP verification
- Password reset
- JWT token generation
- Bulk onboarding (Excel upload)

#### Director Operations (`school/director/`)
- **Dashboard:** School-wide statistics (students, teachers, finance, assessments, results)
- **Student Management:** Enroll, view, update, delete students
- **Teacher Management:** Add teachers, assign subjects, assign class teachers
- **Class Management:** Create/manage classes
- **Subject Management:** Create/manage subjects
- **Timetable/Schedules:** Create time slots, build timetables, assign teachers
- **Results Management:** Release/unrelease results (school-wide, class-level, individual)
- **Assessments:** View all teacher-created assessments
- **Finance:** View payments, transactions, revenue
- **Notifications:** Send school-wide notifications

#### Teacher Operations (`school/teachers/`)
- **Assessments:** Create CBT, exams, assignments with auto-grading
- **Attendance:** Mark daily attendance for assigned classes
- **Topics:** Create topics, upload videos/PDFs, organize content
- **Results:** Release assessment results to students
- **Profile:** View/update teacher profile

#### Student Operations (`school/students/`)
- **Assessments:** Take CBT, submit answers, view attempts
- **Results:** View released results (current/past sessions)
- **Content:** Access videos, PDFs, materials
- **Timetable:** View personal timetable
- **Attendance:** View attendance records
- **Profile:** View/update student profile

### 2. Library Module (`src/library/`)

**Purpose:** Public marketplace for textbooks/ebooks accessible by multiple schools based on subscription tiers.

#### Library Authentication (`library/library-auth/`)
- Separate authentication for library users
- Library users manage their platform's content

#### General Materials (`library/general-materials/`)
- Upload textbooks/ebooks (up to 300MB)
- Create chapters with page ranges
- Attach multiple files per chapter
- AI-enabled materials for chat
- Thumbnail support
- Progress tracking for uploads
- Dashboard with statistics

#### Library Assessments (`library/assessment/`)
- Create CBT assessments for library content
- Question types: multiple choice, true/false, essay, etc.
- Image upload support for questions
- Auto-grading capabilities
- Publish/unpublish assessments

#### Library Subjects & Chapters (`library/subject/`)
- Library-specific subject hierarchy
- Subject → Chapter → Topic structure
- Content organization

### 3. AI Chat Module (`src/ai-chat-latest/`)

**Purpose:** Chat with uploaded PDFs using OpenAI and vector search.

**How It Works:**
1. **Document Upload:** PDF uploaded to S3
2. **Text Extraction:** Extract text from PDF
3. **Chunking:** Break text into 600-1000 word chunks
4. **Embeddings:** Generate OpenAI embeddings (text-embedding-3-small, 1536 dimensions)
5. **Vector Storage:** Store in PostgreSQL with pgvector extension
6. **Chat:** Search relevant chunks, generate responses with OpenAI

**Key Services:**
- `DocumentProcessingService` - Orchestrates the flow
- `TextExtractionService` - Extracts text from PDFs
- `DocumentChunkingService` - Chunks text
- `EmbeddingService` - Generates embeddings
- `ChatService` - Handles chat conversations

**Endpoints:**
- `POST /ai-chat/start-upload` - Upload document & auto-process
- `GET /ai-chat/processing-status/:materialId` - Check processing status
- `GET /ai-chat/search-chunks/:materialId` - Search chunks by query
- `POST /ai-chat/chat` - Chat with document

### 4. Academic Session Module (`src/academic-session/`)
- Create academic sessions (year + term)
- Set current session
- All operations are scoped to academic session

### 5. Push Notifications Module (`src/push-notifications/`)
- Store device tokens
- Send push notifications
- Support for iOS & Android

### 6. Developer Module (`src/developer/`)
- Developer authentication
- Library class/subject management
- Platform configuration

---

## 📝 API RESPONSE FORMAT

**Standard Response Structure:**
```typescript
// Success Response
{
  success: true,
  message: "Operation completed successfully",
  data: { /* actual data */ },
  length: 10,  // For arrays
  meta: { /* pagination, etc */ }
}

// Error Response
{
  success: false,
  message: "Error message",
  error: "Detailed error info",
  statusCode: 400
}
```

**Using ResponseHelper:**
```typescript
import { ResponseHelper } from '@shared/helper-functions/response.helpers';

// Success
return ResponseHelper.success('Data retrieved', data);

// Created
return ResponseHelper.created('Resource created', resource);

// Error
return ResponseHelper.error('Validation failed', error, 400);
```

---

## 📤 FILE UPLOAD STRATEGY

### AWS S3 (Primary)
- **Service:** `S3Service` (`src/shared/services/s3.service.ts`)
- **Provider:** `S3StorageProvider` (`src/shared/services/providers/aws-provider/`)
- **Configuration:** AWS credentials in `.env`
- **File Types:** Videos, PDFs, images, thumbnails
- **Max Size:** Configurable (default: 300MB for documents, 5MB for images)

### File Upload Patterns

**Pattern 1: Direct Upload**
```typescript
const file = req.file;  // From multer
const result = await this.s3Service.uploadFile(
  file,
  'library/general-materials/platforms',
  ['pdf', 'doc', 'docx']
);
// Returns: { url, s3Key, sizeBytes }
```

**Pattern 2: Upload with Progress Tracking**
```typescript
// Start upload session
const sessionId = await this.uploadProgressService.startUploadSession();

// Upload file
await this.s3Service.uploadFile(file, path);

// Complete session
await this.uploadProgressService.completeUploadSession(sessionId);
```

**S3 Path Structure:**
```
library/general-materials/
  platforms/{platformId}/
    {materialId}.pdf              # Full material file
  thumbnails/
    platforms/{platformId}/
      {thumbnailId}.jpg            # Thumbnail
  chapters/
    {platformId}/{materialId}/{chapterId}/
      {fileId}.pdf                 # Chapter files

school/{schoolId}/
  topics/{topicId}/
    videos/{videoId}.mp4           # Video content
    materials/{materialId}.pdf     # PDF materials
```

---

## 🎨 CODING STANDARDS & PATTERNS

### Module Structure (Standard Pattern)
```
module-name/
├── docs/                      # API documentation
│   └── module-name.docs.ts
├── dto/                       # Data Transfer Objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── module-name.controller.ts  # HTTP routes
├── module-name.service.ts     # Business logic
└── module-name.module.ts      # Module definition
```

### Controller Pattern
```typescript
@ApiTags('ModuleName')
@Controller('director/module-name')
@UseGuards(JwtGuard)
export class ModuleNameController {
  constructor(private readonly moduleNameService: ModuleNameService) {}

  @Get('endpoint')
  @ApiOperation({ summary: 'Endpoint description' })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async methodName(@GetUser() user: User) {
    return this.moduleNameService.methodName(user);
  }
}
```

### Service Pattern
```typescript
@Injectable()
export class ModuleNameService {
  private readonly logger = new Logger(ModuleNameService.name);

  constructor(private readonly prisma: PrismaService) {}

  async methodName(user: User) {
    this.logger.log(colors.cyan('Fetching data...'));
    
    try {
      const data = await this.prisma.model.findMany({
        where: { school_id: user.school_id }
      });
      
      return ResponseHelper.success('Data retrieved', data);
    } catch (error) {
      this.logger.error(colors.red(`Error: ${error.message}`));
      throw error;
    }
  }
}
```

### Best Practices
1. **No database operations in controllers** - All DB logic in services
2. **Use toaster notifications** - Not modals for messages
3. **Always use "assessment"** - Not "quiz"
4. **API responses:** Use `{ success, message, data }` format
5. **File uploads:** Always use AWS S3
6. **Validation:** Use DTOs with class-validator decorators
7. **Logging:** Use colors package for readable logs
8. **Error handling:** Try-catch in services, throw appropriate exceptions

---

## 🚀 DEPLOYMENT

### Environments
- **Development:** `docker-compose.dev.yml` - Hot reload, Prisma Studio
- **Staging:** `docker-compose.staging.yml` - Team testing, Nginx, SSL
- **Production:** `docker-compose.prod.yml` - Optimized, backups, Nginx

### Docker Commands (via Makefile)
```bash
# Development
make dev              # Start dev environment
make dev-logs         # View logs
make dev-stop         # Stop dev environment

# Staging
make staging          # Start staging
make staging-logs     # View logs
make staging-stop     # Stop staging

# Production
make prod             # Start production
make prod-logs        # View logs
make prod-stop        # Stop production

# Database
make db-migrate       # Run migrations
make db-seed          # Seed database
```

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# OpenAI (for AI chat)
OPENAI_API_KEY="your-openai-key"

# App
NODE_ENV="development|staging|production"
PORT="3000"
CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

### Production Deployment
- **Platform:** AWS ECS, Render.com, or any Docker-compatible host
- **Database:** PostgreSQL with pgvector extension (Supabase recommended)
- **Storage:** AWS S3
- **Health Check:** `/health` endpoint
- **Memory:** Node.js configured with `--max-old-space-size=1024`

---

## 🔑 KEY BUSINESS RULES

### Academic Sessions
- All operations are scoped to an academic session
- One session can be marked as "current"
- Sessions format: "2024/2025 - First Term"

### Assessments
- **Types:** CBT, Exam, Assignment
- **Auto-grading:** Multiple choice, true/false automatically graded
- **Manual grading:** Essays, file uploads need manual grading
- **Attempts:** Configurable max attempts per student
- **Results:** Released by teachers or directors

### Results
- Can be released at: School level, Class level, Individual student level
- Can be unreleased if needed
- Show subject-wise scores, grades, positions

### Library General Materials
- **Tier-based access:** Schools access based on subscription tier (FREE, BASIC, PREMIUM)
- **Not direct purchase:** Students don't buy books individually
- **AI-enabled:** Materials can have AI chat enabled
- **Chapters:** Materials can have chapters with page ranges for better AI context

### Bulk Onboarding
- Upload Excel file with users (students, teachers, directors)
- Auto-generates passwords
- Sends welcome emails
- Validates data before creation

---

## 📊 IMPORTANT RELATIONSHIPS

### School Scoping
- Almost all entities are scoped to `school_id`
- Academic sessions are scoped to school
- Users, students, teachers belong to schools
- Classes, subjects, assessments all scoped to school

### Academic Session Scoping
- Students enrolled per session
- Teachers assigned per session
- Classes created per session
- Subjects created per session
- Assessments created per session

### Library vs School
- **School:** Specific school instance
- **Library (Organisation/Platform):** Public marketplace
- **Schools can access library content** based on their subscription
- **Library has separate authentication** from school

---

## 🧪 TESTING

### Available Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Key Test Files
- `src/app.controller.spec.ts`
- `src/school/auth/auth.service.spec.ts`
- `test/app.e2e-spec.ts`

---

## 📚 DOCUMENTATION REFERENCES

**Essential Docs:**
- `/docs/01-QUICK_START.md` - Quick start guide
- `/docs/02-FILE_STRUCTURE.md` - File structure overview
- `/docs/03-DOCKER_SETUP.md` - Docker setup guide
- `/INSTRUCTIONS/README.md` - Coding standards
- `/readme/MAJOR_APP_FUNCTIONALITIES.md` - Feature overview
- `/readme/AI_CHAT_BUSINESS_OVERVIEW.md` - AI chat explanation
- `/readme/BULK_ONBOARDING_GUIDE.md` - Bulk onboarding guide
- `/src/library/assessment/library-cbt-readme.md` - Library CBT API docs
- `/src/library/general-materials/general-materials-readme.md` - General materials API

---

## 🎯 COMMON TASKS QUICK REFERENCE

### Add New School User
```typescript
// 1. Create User record
const user = await prisma.user.create({...});

// 2. Create role-specific record (Student/Teacher)
const student = await prisma.student.create({
  user_id: user.id,
  school_id: user.school_id,
  ...
});
```

### Create Assessment
```typescript
// 1. Create Assessment
const assessment = await prisma.assessment.create({...});

// 2. Create Questions
const questions = await prisma.assessmentQuestion.createMany({
  data: questionsArray
});
```

### Upload File to S3
```typescript
const result = await this.s3Service.uploadFile(
  file,
  'path/in/s3',
  ['pdf', 'doc'],  // allowed extensions
  10  // max size MB
);
// Returns: { url, s3Key, sizeBytes }
```

### Process Document for AI Chat
```typescript
// 1. Upload to S3
const { url, s3Key } = await this.s3Service.uploadFile(file, path);

// 2. Create material record
const material = await prisma.pDFMaterial.create({...});

// 3. Auto-process (happens in background)
await this.documentProcessingService.processDocument(material.id);

// 4. Check status
const status = await prisma.materialProcessing.findUnique({
  where: { materialId: material.id }
});
```

---

## 🔧 TROUBLESHOOTING

### Common Issues
1. **JWT errors:** Check `JWT_SECRET` in `.env`
2. **Database connection:** Verify `DATABASE_URL`
3. **File upload fails:** Check AWS credentials & bucket permissions
4. **AI chat not working:** Ensure pgvector extension installed
5. **Prisma client errors:** Run `npx prisma generate`

### Logs Location
- Development: Console output with colors
- Docker: `make dev-logs`, `make staging-logs`, `make prod-logs`

---

## 💡 NOTES FOR NEW CHAT SESSIONS

When starting a new chat:
1. This is a **NestJS + PostgreSQL + Prisma** project
2. **User roles:** student, teacher, school_director, parent, super_admin
3. **Response format:** Always use `{ success, message, data }`
4. **Database ops:** Never in controllers, always in services
5. **File uploads:** Use AWS S3 via `S3Service`
6. **Authentication:** JWT with `@UseGuards(JwtGuard)` and `@GetUser()`
7. **Scoping:** Almost everything is scoped to `school_id` and `academic_session_id`
8. **Assessments:** Use "assessment" not "quiz"
9. **Library:** Separate authentication, tier-based access model

---

**This document covers the complete architecture and should serve as your reference for understanding the entire Smart Edu Hub backend system.**

