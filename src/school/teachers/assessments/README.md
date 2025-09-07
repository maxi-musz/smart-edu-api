# Assessments Module

## Overview
The Assessments module provides comprehensive functionality for teachers to create, manage, and grade various types of assessments including assignments, CBT quizzes, and live classes.

## Features

### 🎯 **Assessment Types**
- **Assignments**: Create and manage written assignments with due dates and scoring
- **CBT Quizzes**: Computer-based tests with automatic grading capabilities
- **Exams**: Formal examinations with scheduling, proctoring, and comprehensive grading
- **Live Classes**: Schedule and manage interactive online sessions

### 📊 **Grading & Analytics**
- **Manual Grading**: Grade assignments with feedback and comments
- **Automatic Grading**: CBT quizzes are automatically graded
- **Analytics**: Track assessment performance and engagement

### 🔒 **Security & Validation**
- **User Authentication**: JWT-based authentication required
- **School Validation**: Teachers can only access their school's data
- **Topic Validation**: Assessments must belong to valid topics

## Module Structure

```
assessments/
├── assessments.module.ts          # Main module configuration
├── assignments/                   # Assignment management
│   ├── assignments.module.ts
│   ├── assignments.service.ts
│   ├── assignments.controller.ts
│   └── index.ts
├── quizzes/                       # CBT Quiz management
│   ├── quizzes.module.ts
│   ├── quizzes.service.ts
│   ├── quizzes.controller.ts
│   └── index.ts
├── exams/                         # Exam management
│   ├── exams.module.ts
│   ├── exams.service.ts
│   ├── exams.controller.ts
│   ├── dto/
│   │   ├── create-exam.dto.ts
│   │   ├── grade-exam.dto.ts
│   │   └── index.ts
│   └── index.ts
├── live-classes/                  # Live class management
│   ├── live-classes.module.ts
│   ├── live-classes.service.ts
│   ├── live-classes.controller.ts
│   └── index.ts
├── grading/                       # Grading system
│   ├── grading.module.ts
│   ├── grading.service.ts
│   ├── grading.controller.ts
│   └── index.ts
├── dto/                          # Shared DTOs
│   ├── create-assignment.dto.ts
│   ├── create-cbt-quiz.dto.ts
│   ├── create-live-class.dto.ts
│   ├── grade-assignment.dto.ts
│   ├── grade-cbt-quiz.dto.ts
│   └── index.ts
├── shared/                       # Shared components
│   ├── base-assessment.dto.ts
│   └── index.ts
├── index.ts                      # Module exports
└── README.md                     # This file
```

## API Endpoints (To Be Implemented)

### 📝 **Assignments**
- `POST /teachers/assessments/assignments` - Create assignment
- `GET /teachers/assessments/assignments/topic/:topicId` - Get topic assignments
- `PUT /teachers/assessments/assignments/:id` - Update assignment
- `DELETE /teachers/assessments/assignments/:id` - Delete assignment

### 🧠 **CBT Quizzes**
- `POST /teachers/assessments/quizzes` - Create CBT quiz
- `GET /teachers/assessments/quizzes/topic/:topicId` - Get topic quizzes
- `PUT /teachers/assessments/quizzes/:id` - Update CBT quiz
- `DELETE /teachers/assessments/quizzes/:id` - Delete CBT quiz

### 📚 **Exams**
- `POST /teachers/assessments/exams` - Create exam
- `GET /teachers/assessments/exams/topic/:topicId` - Get topic exams
- `GET /teachers/assessments/exams/:id` - Get single exam
- `PUT /teachers/assessments/exams/:id` - Update exam
- `DELETE /teachers/assessments/exams/:id` - Delete exam
- `POST /teachers/assessments/exams/:id/schedule` - Schedule exam
- `POST /teachers/assessments/exams/:id/start` - Start exam session
- `POST /teachers/assessments/exams/:id/end` - End exam session
- `GET /teachers/assessments/exams/:id/results` - Get exam results

### 🎥 **Live Classes**
- `POST /teachers/assessments/live-classes` - Create live class
- `GET /teachers/assessments/live-classes/topic/:topicId` - Get topic live classes
- `PUT /teachers/assessments/live-classes/:id` - Update live class
- `DELETE /teachers/assessments/live-classes/:id` - Delete live class

### 📊 **Grading**
- `POST /teachers/assessments/assignments/:id/grade/:submissionId` - Grade assignment
- `POST /teachers/assessments/quizzes/:id/grade/:submissionId` - Grade CBT quiz
- `GET /teachers/assessments/submissions/:id` - Get student submissions
- `GET /teachers/assessments/grading-history` - Get grading history

### 📈 **Analytics**
- `GET /teachers/assessments/analytics/topic/:topicId` - Get topic analytics
- `GET /teachers/assessments/analytics/teacher/:teacherId` - Get teacher analytics

## Response Format

All endpoints return responses in the standard format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "statusCode": 200
}
```

## Database Models

The module works with the following Prisma models:
- `Assignment` - Assignment records
- `CBTQuiz` - CBT quiz records  
- `LiveClass` - Live class records
- `Topic` - Topic relationships
- `User` - Teacher authentication

**Note**: Exams will likely use the existing `CBTQuiz` model or a new `Exam` model can be created if needed.

## Usage Examples (To Be Implemented)

### Create Assignment
```typescript
// TODO: Implement this method
const assignment = await assessmentsService.createAssignment({
  title: "Algebra Problem Set 1",
  description: "Solve the following equations",
  topic_id: "topic123",
  dueDate: "2025-02-15T23:59:59.000Z",
  maxScore: 100,
  timeLimit: 60
}, user);
```

### Create CBT Quiz
```typescript
// TODO: Implement this method
const quiz = await assessmentsService.createCBTQuiz({
  title: "Mathematics Quiz - Chapter 1",
  description: "Test your algebra knowledge",
  topic_id: "topic123",
  duration: 30,
  totalQuestions: 20,
  passingScore: 50
}, user);
```

### Grade Assignment
```typescript
// TODO: Implement this method
const grade = await assessmentsService.gradeAssignment(
  "assignment123",
  "submission456",
  {
    grade: 85,
    feedback: "Good work! Show more steps next time."
  },
  user
);
```

## Future Enhancements

- **Question Bank**: Manage reusable questions for quizzes
- **Bulk Grading**: Grade multiple submissions at once
- **Advanced Analytics**: Detailed performance reports
- **Notification System**: Alert students about new assessments
- **File Attachments**: Support for assignment file uploads
- **Rubric System**: Structured grading criteria
- **Peer Review**: Student peer assessment features

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/swagger` - API documentation
- `class-validator` - DTO validation
- `prisma` - Database ORM
- `colors` - Console logging colors

## Security Considerations

- All endpoints require JWT authentication
- Teachers can only access their school's data
- Input validation on all DTOs
- SQL injection protection via Prisma
- Rate limiting recommended for production

## Testing

The module is designed to be easily testable with:
- Unit tests for service methods
- Integration tests for API endpoints
- Mock data for development
- Test database for isolated testing
