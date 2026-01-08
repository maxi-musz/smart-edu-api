# Library CBT Endpoints - Quick Reference

## Base URL: `/library/assessment/cbt`
**Authentication**: Bearer Token (Library JWT)

---

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/assessment/cbt` | List/filter all CBTs |
| POST | `/library/assessment/cbt` | Create new CBT |
| POST | `/library/assessment/cbt/:id/questions/upload-image` | Upload question image |
| POST | `/library/assessment/cbt/:id/questions` | Create question |
| GET | `/library/assessment/cbt/:id/questions` | Get all questions |
| PATCH | `/library/assessment/cbt/:assessmentId/questions/:questionId` | Update question |
| DELETE | `/library/assessment/cbt/:assessmentId/questions/:questionId/image` | Delete question image |
| DELETE | `/library/assessment/cbt/:assessmentId/questions/:questionId` | Delete question |
| PATCH | `/library/assessment/cbt/:id` | Update CBT |
| DELETE | `/library/assessment/cbt/:id` | Delete CBT |
| POST | `/library/assessment/cbt/:id/publish` | Publish CBT |
| POST | `/library/assessment/cbt/:id/unpublish` | Unpublish CBT |
| GET | `/library/assessment/cbt/:id` | Get CBT by ID |

---

## Quick Examples

### 1. List All CBTs
```bash
GET /library/assessment/cbt
```

**Response:**
```json
{
  "success": true,
  "message": "CBT assessments retrieved successfully",
  "data": {
    "assessments": [
      {
        "id": "cmjb9cbt123",
        "title": "Algebra Basics CBT",
        "assessmentType": "CBT",
        "status": "PUBLISHED",
        "isPublished": true,
        "duration": 30,
        "totalPoints": 100,
        "passingScore": 50,
        "_count": {
          "questions": 10,
          "attempts": 25
        },
        "subject": {
          "id": "cmjb9sub456",
          "name": "Mathematics"
        },
        "createdAt": "2025-01-08T10:00:00Z"
      }
    ],
    "totalCount": 1
  }
}
```

### 2. Create CBT
```bash
POST /library/assessment/cbt
{
  "title": "Math Quiz",
  "subjectId": "cmjb9sub123",
  "topicId": "cmjb9topic456",
  "duration": 30,
  "maxAttempts": 3,
  "passingScore": 50
}
```

### 2. Upload Image
```bash
POST /library/assessment/cbt/{cbtId}/questions/upload-image
Content-Type: multipart/form-data

Form Data:
  image: [File]
```

### 3. Create Multiple Choice Question
```bash
POST /library/assessment/cbt/{cbtId}/questions
{
  "questionText": "What is 2 + 2?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "options": [
    { "optionText": "3", "order": 1, "isCorrect": false },
    { "optionText": "4", "order": 2, "isCorrect": true },
    { "optionText": "5", "order": 3, "isCorrect": false }
  ]
}
```

### 4. Create True/False Question
```bash
POST /library/assessment/cbt/{cbtId}/questions
{
  "questionText": "The Earth is round.",
  "questionType": "TRUE_FALSE",
  "points": 1,
  "options": [
    { "optionText": "True", "order": 1, "isCorrect": true },
    { "optionText": "False", "order": 2, "isCorrect": false }
  ]
}
```

### 5. Publish CBT
```bash
POST /library/assessment/cbt/{cbtId}/publish
```

---

## Question Types

- `MULTIPLE_CHOICE_SINGLE` - Single correct answer
- `MULTIPLE_CHOICE_MULTIPLE` - Multiple correct answers
- `TRUE_FALSE` - True/False question
- `FILL_IN_BLANK` - Fill in the blank
- `FILE_UPLOAD` - Upload a file
- `NUMERIC` - Numeric answer
- `DATE` - Date answer
- `RATING_SCALE` - Rating scale

---

## CBT Status Flow

```
DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED
```

---

## Important Notes

✅ **DO's**
- Upload images BEFORE creating questions
- Publish CBT only when it has at least one question
- Use `order` field to control question/option sequence
- Provide clear `instructions` for users

❌ **DON'Ts**
- Don't delete questions after users have attempted the CBT
- Don't delete CBT after users have attempted it (archive instead)
- Don't publish CBT without questions
- Don't forget to set `isCorrect: true` for correct options

---

## Workflow

1. **Create CBT** → Returns CBT ID
2. **Upload Images** (optional) → Returns imageUrl & imageS3Key
3. **Create Questions** → Add all questions with options
4. **Publish CBT** → Make available to users
5. **Manage** → Update, unpublish, or archive as needed

---

## Authentication Header

```javascript
headers: {
  'Authorization': 'Bearer YOUR_LIBRARY_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

For image uploads:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_LIBRARY_JWT_TOKEN',
  // Don't set Content-Type for FormData - browser sets it automatically
}
```

---

For detailed documentation, see `library-cbt-readme.md`

