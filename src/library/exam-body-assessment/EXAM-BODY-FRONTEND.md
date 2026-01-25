# Exam Body - Frontend Contract (Library Owner)

Base URL: `/api/v1`  
Auth: `Authorization: Bearer <library_token>`  
Roles: `admin`, `manager`  
Response wrapper: `{ "success": boolean, "message": string, "data": any }`

Base routes:
- Exam bodies: `/exam-bodies`
- Subjects: `/exam-bodies/:examBodyId/subjects`
- Years: `/exam-bodies/:examBodyId/years`
- Assessments: `/exam-bodies/:examBodyId/assessments`

## Fetch exam bodies
`GET /exam-bodies`

Response `data` (example shape):
```json
[
  {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "logoUrl": "https://...",
    "subjects": [{ "id": "subject_1", "name": "Mathematics", "code": "MATH" }],
    "years": [{ "id": "year_1", "year": "2024/2025" }]
  }
]
```

## Create subject under exam body
`POST /exam-bodies/:examBodyId/subjects`  
Content-Type: `multipart/form-data`

Form fields:
- `name` (string, required)
- `description` (string, optional)
- `order` (number, optional)
- `icon` (file, optional)

## List subjects under exam body
`GET /exam-bodies/:examBodyId/subjects`

## Create year under exam body
`POST /exam-bodies/:examBodyId/years`  
Content-Type: `application/json`

Body:
```json
{
  "year": "2024/2025",
  "description": "First Session",
  "startDate": "2024-05-01T00:00:00.000Z",
  "endDate": "2024-07-31T00:00:00.000Z",
  "order": 1
}
```

## List years under exam body
`GET /exam-bodies/:examBodyId/years`

## Create assessment (under exam body + subject + year)
`POST /exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx`

Body (all optional except `title`):
```json
{
  "title": "WAEC Mathematics 2024/2025",
  "description": "Past questions for WAEC Mathematics",
  "instructions": "Read all questions carefully",
  "duration": 120,
  "passingScore": 50,
  "maxAttempts": null,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "showCorrectAnswers": true,
  "showFeedback": true,
  "showExplanation": true,
  "assessmentType": "CBT"
}
```

Notes:
- `maxAttempts: null` => unlimited attempts
- Assessments are scoped to the library platform (platformId)

Response `data` (example shape):
```json
{
  "id": "assessment_123",
  "examBodyId": "exambody_123",
  "subjectId": "subject_123",
  "yearId": "year_123",
  "title": "WAEC Mathematics 2024/2025",
  "duration": 120,
  "totalPoints": 0,
  "passingScore": 50,
  "maxAttempts": null,
  "isPublished": false
}
```

## List assessments
`GET /exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx`

## Get assessment
`GET /exam-bodies/:examBodyId/assessments/:id`

## Update assessment
`PATCH /exam-bodies/:examBodyId/assessments/:id`  
Body: same shape as create (all optional)

## Delete assessment
`DELETE /exam-bodies/:examBodyId/assessments/:id`

## Publish / Unpublish
`PATCH /exam-bodies/:examBodyId/assessments/:id/publish`  
`PATCH /exam-bodies/:examBodyId/assessments/:id/unpublish`

## Create question
`POST /exam-bodies/:examBodyId/assessments/:id/questions`  
Content-Type: `application/json`

Body:
```json
{
  "questionText": "What is 2 + 2?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "order": 1,
  "explanation": "Addition is a basic arithmetic operation",
  "options": [
    { "optionText": "3", "order": 1, "isCorrect": false },
    { "optionText": "4", "order": 2, "isCorrect": true }
  ]
}
```

Response `data` (example shape):
```json
{
  "question": { "id": "question_123", "questionText": "...", "questionType": "MULTIPLE_CHOICE_SINGLE" },
  "options": [{ "id": "option_1", "optionText": "3", "isCorrect": false }],
  "correctAnswers": [{ "id": "correct_1", "optionIds": ["option_2"] }]
}
```

## Create question with image
`POST /exam-bodies/:examBodyId/assessments/:id/questions/with-image`  
Content-Type: `multipart/form-data`

Form fields:
- `questionData` (string, required) - JSON string of question data
- `image` (file, optional) - Image file (JPEG, PNG, GIF, WEBP, max 5MB)

Example `questionData` JSON:
```json
{
  "questionText": "What shape is shown in the image?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "order": 1,
  "explanation": "This is a triangle",
  "options": [
    { "optionText": "Circle", "order": 1, "isCorrect": false },
    { "optionText": "Triangle", "order": 2, "isCorrect": true }
  ]
}
```

Response `data` (example shape):
```json
{
  "question": {
    "id": "question_123",
    "questionText": "What shape is shown in the image?",
    "questionType": "MULTIPLE_CHOICE_SINGLE",
    "imageUrl": "https://s3.amazonaws.com/.../question_1234567890_image.jpg",
    "points": 2,
    "order": 1
  },
  "options": [...],
  "correctAnswers": [...]
}
```

## List questions
`GET /exam-bodies/:examBodyId/assessments/:id/questions`

## Update question
`PATCH /exam-bodies/:examBodyId/assessments/questions/:questionId`  
Content-Type: `multipart/form-data` (if image provided) or `application/json`

Form fields (if using multipart):
- `questionData` (string, optional) - JSON string of question data
- `image` (file, optional) - New image file (replaces existing image)

Body (any fields optional, JSON or form-data):
```json
{
  "questionText": "Updated text",
  "points": 3,
  "options": [
    { "optionText": "A", "order": 1, "isCorrect": false },
    { "optionText": "B", "order": 2, "isCorrect": true }
  ],
  "imageUrl": null  // Set to null to remove image
}
```

**Note:** If `image` file is provided, it replaces the existing image. If `imageUrl: null` is set, the image is removed.

## Delete question image
`DELETE /exam-bodies/:examBodyId/assessments/questions/:questionId/image`

Removes the image from a question (keeps the question, only deletes the image).

## Delete question
`DELETE /exam-bodies/:examBodyId/assessments/questions/:questionId`
