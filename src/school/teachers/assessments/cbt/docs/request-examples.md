# CBT Quiz API Request Examples

This document contains practical examples of request bodies for different types of CBT assessments.

## Create Quiz Request Examples

### 1. Basic CBT Assessment (Default)
```json
{
  "title": "Mathematics Quiz - Chapter 1",
  "description": "Test your understanding of basic algebra concepts",
  "instructions": "Answer all questions carefully. You have 30 minutes to complete this quiz.",
  "subject_id": "subject_123",
  "topic_id": "topic_456",
  "duration": 30,
  "max_attempts": 2,
  "passing_score": 60,
  "total_points": 100,
  "assessment_type": "CBT"
}
```

### 2. Assignment Assessment
```json
{
  "title": "Algebra Assignment - Problem Solving",
  "description": "Complete the following algebra problems and show your work",
  "instructions": "Solve each problem step by step. Upload your work as images or PDF.",
  "subject_id": "subject_123",
  "topic_id": "topic_456",
  "duration": 120,
  "max_attempts": 1,
  "passing_score": 70,
  "total_points": 100,
  "assessment_type": "ASSIGNMENT",
  "grading_type": "MANUAL",
  "tags": ["algebra", "problem-solving", "assignment"]
}
```

### 3. Exam Assessment
```json
{
  "title": "Mid-Term Mathematics Exam",
  "description": "Comprehensive exam covering chapters 1-5",
  "instructions": "This is a formal examination. No external help allowed.",
  "subject_id": "subject_123",
  "duration": 180,
  "max_attempts": 1,
  "passing_score": 50,
  "total_points": 100,
  "assessment_type": "EXAM",
  "start_date": "2024-01-15T09:00:00Z",
  "end_date": "2024-01-15T12:00:00Z",
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_correct_answers": false,
  "auto_submit": true,
  "tags": ["exam", "mid-term", "comprehensive"]
}
```

### 4. Practice Assessment
```json
{
  "title": "Practice Quiz - Fractions",
  "description": "Practice questions on fraction operations",
  "instructions": "This is a practice quiz. Take your time and learn from mistakes.",
  "subject_id": "subject_123",
  "topic_id": "topic_789",
  "duration": 45,
  "max_attempts": 5,
  "passing_score": 80,
  "total_points": 100,
  "assessment_type": "PRACTICE",
  "show_correct_answers": true,
  "show_feedback": true,
  "allow_review": true,
  "tags": ["practice", "fractions", "learning"]
}
```

### 5. Formative Assessment
```json
{
  "title": "Formative Assessment - Geometry Basics",
  "description": "Check your understanding of basic geometry concepts",
  "instructions": "This assessment helps identify areas for improvement.",
  "subject_id": "subject_123",
  "topic_id": "topic_101",
  "duration": 20,
  "max_attempts": 3,
  "passing_score": 60,
  "total_points": 50,
  "assessment_type": "FORMATIVE",
  "show_correct_answers": true,
  "show_feedback": true,
  "allow_review": true,
  "tags": ["formative", "geometry", "basics"]
}
```

### 6. Summative Assessment
```json
{
  "title": "End of Term Mathematics Test",
  "description": "Final assessment for the term",
  "instructions": "This is your final test for this term. Do your best!",
  "subject_id": "subject_123",
  "duration": 120,
  "max_attempts": 1,
  "passing_score": 50,
  "total_points": 100,
  "assessment_type": "SUMMATIVE",
  "start_date": "2024-03-15T09:00:00Z",
  "end_date": "2024-03-15T11:00:00Z",
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_correct_answers": false,
  "auto_submit": true,
  "tags": ["summative", "final", "term-test"]
}
```

### 7. Diagnostic Assessment
```json
{
  "title": "Diagnostic Test - Pre-Algebra",
  "description": "Assess current knowledge before starting algebra",
  "instructions": "This test helps identify your current level of understanding.",
  "subject_id": "subject_123",
  "duration": 60,
  "max_attempts": 1,
  "passing_score": 40,
  "total_points": 100,
  "assessment_type": "DIAGNOSTIC",
  "show_correct_answers": true,
  "show_feedback": true,
  "allow_review": true,
  "tags": ["diagnostic", "pre-algebra", "baseline"]
}
```

### 8. Mock Exam
```json
{
  "title": "Mock JAMB Mathematics Exam",
  "description": "Practice exam simulating JAMB conditions",
  "instructions": "This is a mock exam. Treat it like the real thing.",
  "subject_id": "subject_123",
  "duration": 120,
  "max_attempts": 2,
  "passing_score": 50,
  "total_points": 100,
  "assessment_type": "MOCK_EXAM",
  "start_date": "2024-02-01T09:00:00Z",
  "end_date": "2024-02-01T11:00:00Z",
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_correct_answers": false,
  "auto_submit": true,
  "tags": ["mock", "jamb", "practice"]
}
```

### 9. Benchmark Assessment
```json
{
  "title": "Benchmark Test - Grade 10 Mathematics",
  "description": "Standardized assessment for grade 10 students",
  "instructions": "This is a benchmark test to measure progress.",
  "subject_id": "subject_123",
  "duration": 90,
  "max_attempts": 1,
  "passing_score": 60,
  "total_points": 100,
  "assessment_type": "BENCHMARK",
  "start_date": "2024-02-15T10:00:00Z",
  "end_date": "2024-02-15T11:30:00Z",
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_correct_answers": false,
  "auto_submit": true,
  "tags": ["benchmark", "grade-10", "standardized"]
}
```

### 10. Complete Example with All Fields
```json
{
  "title": "Advanced Mathematics Test",
  "description": "Comprehensive test covering advanced topics",
  "instructions": "Read each question carefully. Show all your work for partial credit.",
  "subject_id": "subject_123",
  "topic_id": "topic_456",
  "duration": 90,
  "max_attempts": 2,
  "passing_score": 65,
  "total_points": 150,
  "assessment_type": "TEST",
  "grading_type": "MIXED",
  "shuffle_questions": true,
  "shuffle_options": false,
  "show_correct_answers": true,
  "show_feedback": true,
  "allow_review": true,
  "start_date": "2024-01-20T10:00:00Z",
  "end_date": "2024-01-20T16:00:00Z",
  "time_limit": 90,
  "auto_submit": true,
  "tags": ["advanced", "mathematics", "comprehensive", "test"]
}
```

## Update Quiz Request Examples

### Partial Update
```json
{
  "title": "Updated Mathematics Quiz - Chapter 1",
  "description": "Updated description with more details",
  "duration": 45,
  "passing_score": 70
}
```

### Full Update
```json
{
  "title": "Completely Updated Quiz",
  "description": "New description",
  "instructions": "New instructions",
  "duration": 60,
  "max_attempts": 3,
  "passing_score": 75,
  "total_points": 120,
  "assessment_type": "EXAM",
  "grading_type": "MANUAL",
  "shuffle_questions": true,
  "shuffle_options": true,
  "show_correct_answers": false,
  "show_feedback": true,
  "allow_review": false,
  "start_date": "2024-02-01T09:00:00Z",
  "end_date": "2024-02-01T12:00:00Z",
  "time_limit": 60,
  "auto_submit": true,
  "tags": ["updated", "exam", "comprehensive"]
}
```

## Query Parameter Examples

### Get All Quizzes with Filters
```
GET /api/v1/teachers/assessments/cbt?status=PUBLISHED&assessment_type=CBT&page=1&limit=10
```

### Get Quizzes by Subject
```
GET /api/v1/teachers/assessments/cbt?subject_id=subject_123&status=ACTIVE
```

### Get Quizzes by Topic
```
GET /api/v1/teachers/assessments/cbt?topic_id=topic_456&assessment_type=ASSIGNMENT
```

### Get All Exams
```
GET /api/v1/teachers/assessments/cbt?assessment_type=EXAM&status=PUBLISHED
```

### Get Practice Quizzes
```
GET /api/v1/teachers/assessments/cbt?assessment_type=PRACTICE&page=1&limit=5
```

## Field Descriptions

### Required Fields
- `title` (string): The title of the quiz
- `subject_id` (string): ID of the subject the quiz belongs to

### Optional Fields
- `description` (string): Description of the quiz
- `instructions` (string): Instructions for students
- `topic_id` (string): ID of the topic (for topic-specific quizzes)
- `duration` (number): Duration in minutes (1-300)
- `max_attempts` (number): Maximum attempts allowed (1-10, default: 1)
- `passing_score` (number): Passing percentage (0-100, default: 50)
- `total_points` (number): Total possible points (minimum: 1, default: 100)
- `assessment_type` (string): Type of assessment (default: "CBT")
- `grading_type` (string): "AUTOMATIC", "MANUAL", or "MIXED" (default: "AUTOMATIC")
- `shuffle_questions` (boolean): Whether to shuffle questions (default: false)
- `shuffle_options` (boolean): Whether to shuffle options (default: false)
- `show_correct_answers` (boolean): Show correct answers after submission (default: false)
- `show_feedback` (boolean): Show feedback after submission (default: true)
- `allow_review` (boolean): Allow students to review answers (default: true)
- `start_date` (string): Quiz start date (ISO 8601 format)
- `end_date` (string): Quiz end date (ISO 8601 format)
- `time_limit` (number): Time limit in minutes (1-300)
- `auto_submit` (boolean): Auto-submit when time expires (default: false)
- `tags` (array): Tags for categorization

## Assessment Type Guidelines

### CBT (Computer-Based Test)
- Default type for most quizzes
- Usually automatic grading
- Can include various question types
- Good for regular assessments

### ASSIGNMENT
- Often requires manual grading
- May include file uploads
- Longer duration
- Usually single attempt

### EXAM
- Formal examination
- Strict timing
- Often no correct answers shown
- Single attempt typically

### PRACTICE
- Learning-focused
- Multiple attempts allowed
- Show correct answers and feedback
- Lower pressure

### FORMATIVE
- Ongoing assessment
- Focus on learning
- Show feedback
- Multiple attempts

### SUMMATIVE
- Final assessment
- Formal evaluation
- Strict conditions
- Single attempt

### DIAGNOSTIC
- Identify knowledge gaps
- Show correct answers
- Baseline assessment
- Learning-focused

### MOCK_EXAM
- Practice for real exams
- Simulate exam conditions
- Strict timing
- Limited attempts

### BENCHMARK
- Standardized assessment
- Compare performance
- Formal conditions
- Single attempt

### OTHER
- Custom assessment types
- Flexible configuration
- Use when none of the above fit
