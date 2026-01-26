# Exam Body - Frontend Contract

**Base URL:** `/api/v1`  
**Authentication:** Bearer JWT Token (where required)  
**Response wrapper:** `{ "success": boolean, "message": string, "data": any }`

---

## IMPORTANT: Response Structure

**ALL ENDPOINTS** follow this exact response format:

```typescript
{
  success: boolean;      // true for success, false for error
  message: string;       // Human-readable message
  data: object | array | null;   // Response data
}
```

---

## 1. Exam Bodies (Developer CRUD)

### 1.1 Create Exam Body

**Endpoint:** `POST /exam-bodies`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Short name (e.g., "WAEC") |
| fullName | string | Yes | Full official name |
| icon | file | Yes | Icon image (max 2MB, JPEG/PNG/GIF/WEBP/SVG) |
| description | string | No | Description |
| websiteUrl | string | No | Official website |
| status | string | No | "active" | "inactive" | "archived" (default: "active") |

**Success Response (201):**

```json
{
  "success": true,
  "message": "Exam body created successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "description": null,
    "logoUrl": "https://s3.amazonaws.com/exam-bodies/icons/WAEC_1234567890_icon.png",
    "websiteUrl": "https://www.waecgh.org",
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    name: string;
    fullName: string;
    code: string;
    description: string | null;
    logoUrl: string;
    websiteUrl: string | null;
    status: "active" | "inactive" | "archived";
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 1.2 List Exam Bodies

**Endpoint:** `GET /exam-bodies`  
**Auth:** Not Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam bodies retrieved successfully",
  "data": [
    {
      "id": "exambody_123",
      "name": "WAEC",
      "fullName": "West African Examinations Council",
      "code": "WAEC",
      "logoUrl": "https://...",
      "websiteUrl": "https://...",
      "status": "active",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    }
  ]
}
```

---

### 1.3 Get Exam Body (Library Owners)

**Endpoint:** `GET /exam-bodies/:id`  
**Auth:** Required (Library JWT)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam body retrieved successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "logoUrl": "https://...",
    "websiteUrl": "https://...",
    "status": "active",
    "subjects": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "iconUrl": "https://...",
        "order": 1,
        "status": "active"
      }
    ],
    "years": [
      {
        "id": "year_123",
        "year": "2024/2025",
        "description": "First Session",
        "order": 1,
        "status": "active"
      }
    ],
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

---

### 1.4 Update Exam Body

**Endpoint:** `PATCH /exam-bodies/:id`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required

**Form Fields:** Same as create (all optional)

**Success Response (200):** Same structure as create

---

### 1.5 Delete Exam Body

**Endpoint:** `DELETE /exam-bodies/:id`  
**Auth:** Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam body deleted successfully",
  "data": { "id": "exambody_123" }
}
```

---

## 2. Subjects (Library Owners)

### 2.1 Create Subject

**Endpoint:** `POST /exam-bodies/:examBodyId/subjects`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Subject name (e.g., "Mathematics") |
| description | string | No | Description |
| order | number | No | Display order (default: 0) |
| icon | file | No | Subject icon (max 2MB) |

**Success Response (201):**

```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": "subject_123",
    "examBodyId": "exambody_123",
    "name": "Mathematics",
    "code": "MATH",
    "description": null,
    "iconUrl": "https://s3.amazonaws.com/exam-bodies/subjects/icons/WAEC_MATH_1234567890_icon.png",
    "order": 1,
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC"
    }
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    examBodyId: string;
    name: string;
    code: string;
    description: string | null;
    iconUrl: string | null;
    order: number;
    status: "active" | "inactive" | "archived";
    createdAt: string;
    updatedAt: string;
    examBody: {
      id: string;
      name: string;
    };
  };
}
```

---

### 2.2 List Subjects

**Endpoint:** `GET /exam-bodies/:examBodyId/subjects`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "id": "subject_123",
      "examBodyId": "exambody_123",
      "name": "Mathematics",
      "code": "MATH",
      "iconUrl": "https://...",
      "order": 1,
      "status": "active",
      "examBody": {
        "id": "exambody_123",
        "name": "WAEC"
      },
      "_count": {
        "assessments": 5
      }
    }
  ]
}
```

---

### 2.3 Get Subject

**Endpoint:** `GET /exam-bodies/:examBodyId/subjects/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):** Same structure as create

---

### 2.4 Update Subject

**Endpoint:** `PATCH /exam-bodies/:examBodyId/subjects/:id`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Form Fields:** Same as create (all optional)

**Success Response (200):** Same structure as create

---

### 2.5 Delete Subject

**Endpoint:** `DELETE /exam-bodies/:examBodyId/subjects/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subject deleted successfully",
  "data": { "id": "subject_123" }
}
```

---

## 3. Years (Library Owners)

### 3.1 Create Year

**Endpoint:** `POST /exam-bodies/:examBodyId/years`  
**Content-Type:** `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Request Body:**

```json
{
  "year": "2024/2025",
  "description": "First Session",
  "startDate": "2024-05-01T00:00:00.000Z",
  "endDate": "2024-07-31T00:00:00.000Z",
  "order": 1
}
```

**Required Fields:** `year`  
**Optional Fields:** `description`, `startDate`, `endDate`, `order`

**Success Response (201):**

```json
{
  "success": true,
  "message": "Year created successfully",
  "data": {
    "id": "year_123",
    "examBodyId": "exambody_123",
    "year": "2024/2025",
    "description": "First Session",
    "startDate": "2024-05-01T00:00:00.000Z",
    "endDate": "2024-07-31T00:00:00.000Z",
    "order": 1,
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC"
    }
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    examBodyId: string;
    year: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    order: number;
    status: "active" | "inactive" | "archived";
    createdAt: string;
    updatedAt: string;
    examBody: {
      id: string;
      name: string;
    };
  };
}
```

---

### 3.2 List Years

**Endpoint:** `GET /exam-bodies/:examBodyId/years`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Years retrieved successfully",
  "data": [
    {
      "id": "year_123",
      "examBodyId": "exambody_123",
      "year": "2024/2025",
      "description": "First Session",
      "order": 1,
      "status": "active",
      "examBody": {
        "id": "exambody_123",
        "name": "WAEC"
      },
      "_count": {
        "assessments": 10
      }
    }
  ]
}
```

---

### 3.3 Get Year

**Endpoint:** `GET /exam-bodies/:examBodyId/years/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):** Same structure as create

---

### 3.4 Update Year

**Endpoint:** `PATCH /exam-bodies/:examBodyId/years/:id`  
**Content-Type:** `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Request Body:** Same as create (all optional)

**Success Response (200):** Same structure as create

---

### 3.5 Delete Year

**Endpoint:** `DELETE /exam-bodies/:examBodyId/years/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Year deleted successfully",
  "data": { "id": "year_123" }
}
```

---

## 4. Assessments (Library Owners)

### 4.1 Create Assessment

**Endpoint:** `POST /exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx`  
**Content-Type:** `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | string | Yes | Exam body subject ID |
| yearId | string | Yes | Exam body year ID |

**Request Body:**

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

**Required Fields:** `title`  
**Optional Fields:** All others  
**Note:** `maxAttempts: null` means unlimited attempts

**Success Response (201):**

```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": "assessment_123",
    "examBodyId": "exambody_123",
    "subjectId": "subject_123",
    "yearId": "year_123",
    "title": "WAEC Mathematics 2024/2025",
    "description": "Past questions for WAEC Mathematics",
    "instructions": "Read all questions carefully",
    "duration": 120,
    "totalPoints": 0,
    "passingScore": 50,
    "maxAttempts": null,
    "shuffleQuestions": true,
    "shuffleOptions": true,
    "showCorrectAnswers": true,
    "showFeedback": true,
    "showExplanation": true,
    "assessmentType": "CBT",
    "status": "active",
    "isPublished": false,
    "publishedAt": null,
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC"
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics"
    },
    "year": {
      "id": "year_123",
      "year": "2024/2025"
    }
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    examBodyId: string;
    subjectId: string;
    yearId: string;
    title: string;
    description: string | null;
    instructions: string | null;
    duration: number | null;
    totalPoints: number;
    passingScore: number;
    maxAttempts: number | null;  // null = unlimited
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
    showExplanation: boolean;
    assessmentType: "CBT" | "PAPER";
    status: "active" | "inactive" | "archived";
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    examBody: { id: string; name: string };
    subject: { id: string; name: string };
    year: { id: string; year: string };
  };
}
```

---

### 4.2 List Assessments

**Endpoint:** `GET /exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Query Parameters (Optional):**

| Parameter | Type | Description |
|-----------|------|-------------|
| subjectId | string | Filter by subject |
| yearId | string | Filter by year |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": [
    {
      "id": "assessment_123",
      "title": "WAEC Mathematics 2024/2025",
      "totalPoints": 100,
      "isPublished": true,
      "examBody": { "id": "...", "name": "WAEC" },
      "subject": { "id": "...", "name": "Mathematics" },
      "year": { "id": "...", "year": "2024/2025" },
      "_count": {
        "questions": 50,
        "attempts": 150
      }
    }
  ]
}
```

---

### 4.3 Get Assessment

**Endpoint:** `GET /exam-bodies/:examBodyId/assessments/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment retrieved successfully",
  "data": {
    "id": "assessment_123",
    "title": "WAEC Mathematics 2024/2025",
    "description": "...",
    "instructions": "...",
    "duration": 120,
    "totalPoints": 100,
    "passingScore": 50,
    "maxAttempts": null,
    "isPublished": false,
    "examBody": { "id": "...", "name": "WAEC" },
    "subject": { "id": "...", "name": "Mathematics" },
    "year": { "id": "...", "year": "2024/2025" },
    "questions": [
      {
        "id": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 2,
        "order": 1,
        "options": [
          {
            "id": "option_a",
            "optionText": "3",
            "order": 1,
            "isCorrect": false
          },
          {
            "id": "option_b",
            "optionText": "4",
            "order": 2,
            "isCorrect": true
          }
        ],
        "correctAnswers": [
          {
            "id": "correct_123",
            "optionIds": ["option_b"]
          }
        ]
      }
    ],
    "_count": {
      "attempts": 0
    }
  }
}
```

---

### 4.4 Update Assessment

**Endpoint:** `PATCH /exam-bodies/:examBodyId/assessments/:id`  
**Content-Type:** `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Request Body:** Same as create (all optional)

**Success Response (200):** Same structure as create (without questions)

---

### 4.5 Delete Assessment

**Endpoint:** `DELETE /exam-bodies/:examBodyId/assessments/:id`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment deleted successfully",
  "data": { "id": "assessment_123" }
}
```

---

### 4.6 Publish Assessment

**Endpoint:** `PATCH /exam-bodies/:examBodyId/assessments/:id/publish`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment published successfully",
  "data": {
    "id": "assessment_123",
    "isPublished": true,
    "publishedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

---

### 4.7 Unpublish Assessment

**Endpoint:** `PATCH /exam-bodies/:examBodyId/assessments/:id/unpublish`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment unpublished successfully",
  "data": {
    "id": "assessment_123",
    "isPublished": false,
    "publishedAt": null
  }
}
```

---

## 5. Questions (Library Owners)

### 5.1 Create Question

**Endpoint:** `POST /exam-bodies/:examBodyId/assessments/:id/questions`  
**Content-Type:** `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Request Body:**

```json
{
  "questionText": "What is 2 + 2?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "order": 1,
  "explanation": "Addition is a basic arithmetic operation",
  "options": [
    {
      "optionText": "3",
      "order": 1,
      "isCorrect": false
    },
    {
      "optionText": "4",
      "order": 2,
      "isCorrect": true
    },
    {
      "optionText": "5",
      "order": 3,
      "isCorrect": false
    }
  ]
}
```

**Question Types:**
- `MULTIPLE_CHOICE_SINGLE`
- `MULTIPLE_CHOICE_MULTIPLE`
- `TRUE_FALSE`
- `SHORT_ANSWER`
- `FILL_IN_BLANK`
- `LONG_ANSWER`
- `NUMERIC`
- `DATE`

**Required Fields:** `questionText`, `questionType`  
**Optional Fields:** `points` (default: 1), `order`, `explanation`, `options`

**Success Response (201):**

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "question": {
      "id": "question_123",
      "assessmentId": "assessment_123",
      "questionText": "What is 2 + 2?",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "points": 2,
      "order": 1,
      "explanation": "Addition is a basic arithmetic operation",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    },
    "options": [
      {
        "id": "option_a",
        "questionId": "question_123",
        "optionText": "3",
        "order": 1,
        "isCorrect": false,
        "createdAt": "2026-01-14T10:00:00.000Z"
      },
      {
        "id": "option_b",
        "questionId": "question_123",
        "optionText": "4",
        "order": 2,
        "isCorrect": true,
        "createdAt": "2026-01-14T10:00:00.000Z"
      }
    ],
    "correctAnswers": [
      {
        "id": "correct_123",
        "questionId": "question_123",
        "optionIds": ["option_b"],
        "createdAt": "2026-01-14T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    question: {
      id: string;
      assessmentId: string;
      questionText: string;
      questionType: string;
      points: number;
      order: number;
      imageUrl: string | null;
      audioUrl: string | null;
      videoUrl: string | null;
      explanation: string | null;
      createdAt: string;
      updatedAt: string;
    };
    options: Array<{
      id: string;
      questionId: string;
      optionText: string;
      order: number;
      isCorrect: boolean;
      createdAt: string;
    }>;
    correctAnswers: Array<{
      id: string;
      questionId: string;
      optionIds: string[];
      createdAt: string;
    }>;
  };
}
```

---

### 5.1.1 Create Question with Image

**Endpoint:** `POST /exam-bodies/:examBodyId/assessments/:id/questions/with-image`  
**Content-Type:** `multipart/form-data`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questionData | string | Yes | JSON string of question data (see below) |
| image | file | No | Image file (JPEG, PNG, GIF, WEBP, max 5MB) |

**questionData JSON Structure:**
```json
{
  "questionText": "What shape is shown in the image?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "order": 1,
  "explanation": "This is a triangle",
  "options": [
    {
      "optionText": "Circle",
      "order": 1,
      "isCorrect": false
    },
    {
      "optionText": "Triangle",
      "order": 2,
      "isCorrect": true
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "question": {
      "id": "question_123",
      "assessmentId": "assessment_123",
      "questionText": "What shape is shown in the image?",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "points": 2,
      "order": 1,
      "imageUrl": "https://s3.amazonaws.com/.../question_1234567890_image.jpg",
      "explanation": "This is a triangle",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z"
    },
    "options": [
      {
        "id": "option_a",
        "questionId": "question_123",
        "optionText": "Circle",
        "order": 1,
        "isCorrect": false,
        "createdAt": "2026-01-14T10:00:00.000Z"
      },
      {
        "id": "option_b",
        "questionId": "question_123",
        "optionText": "Triangle",
        "order": 2,
        "isCorrect": true,
        "createdAt": "2026-01-14T10:00:00.000Z"
      }
    ],
    "correctAnswers": [
      {
        "id": "correct_123",
        "questionId": "question_123",
        "optionIds": ["option_b"],
        "createdAt": "2026-01-14T10:00:00.000Z"
      }
    ]
  }
}
```

**Note:** If question creation fails after image upload, the image is automatically deleted from S3 (rollback).

---

### 5.2 List Questions

**Endpoint:** `GET /exam-bodies/:examBodyId/assessments/:id/questions`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": [
    {
      "id": "question_123",
      "assessmentId": "assessment_123",
      "questionText": "What is 2 + 2?",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "points": 2,
      "order": 1,
      "imageUrl": null,
      "audioUrl": null,
      "videoUrl": null,
      "explanation": "Addition is a basic arithmetic operation",
      "options": [
        {
          "id": "option_a",
          "optionText": "3",
          "order": 1,
          "isCorrect": false
        },
        {
          "id": "option_b",
          "optionText": "4",
          "order": 2,
          "isCorrect": true
        }
      ],
      "correctAnswers": [
        {
          "id": "correct_123",
          "optionIds": ["option_b"]
        }
      ]
    }
  ]
}
```

---

### 5.3 Update Question

**Endpoint:** `PATCH /exam-bodies/:examBodyId/assessments/questions/:questionId`  
**Content-Type:** `multipart/form-data` (if image provided) or `application/json`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Request Body (JSON):** Same as create (all optional)

**Request Body (Multipart Form-Data):**
- `questionData` (string, optional) - JSON string of question data
- `image` (file, optional) - New image file (replaces existing image)

**Image Handling:**
- If `image` file is provided → replaces existing image
- If `imageUrl: null` in JSON → removes existing image
- If neither provided → keeps existing image

**Note:** If `options` is provided, it replaces all existing options

**Success Response (200):** Same structure as create

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    question: {
      id: string;
      assessmentId: string;
      questionText: string;
      questionType: string;
      points: number;
      order: number;
      imageUrl: string | null;  // Updated image URL
      explanation: string | null;
      createdAt: string;
      updatedAt: string;
    };
    options: Array<{...}>;
    correctAnswers: Array<{...}>;
  };
}
```

---

### 5.4 Delete Question Image

**Endpoint:** `DELETE /exam-bodies/:examBodyId/assessments/questions/:questionId/image`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Description:** Removes the image from a question (keeps the question, only deletes the image from S3 and database).

**Success Response (200):**

```json
{
  "success": true,
  "message": "Question image deleted successfully",
  "data": {
    "questionId": "question_123"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Question does not have an image",
  "data": null
}
```

---

### 5.5 Delete Question

**Endpoint:** `DELETE /exam-bodies/:examBodyId/assessments/questions/:questionId`  
**Auth:** Required (Library JWT + Owner/Manager role)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": { "id": "question_123" }
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized - invalid or missing JWT token",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Forbidden - insufficient permissions",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Resource already exists",
  "data": null
}
```

---

## Important Notes

### Authentication
- ✅ **Exam Bodies (List/Get):** No auth required
- ✅ **Exam Bodies (Create/Update/Delete):** Auth required (developer)
- ✅ **Subjects/Years/Assessments/Questions:** Auth required (library owner/manager)

### Max Attempts
- `maxAttempts: null` = Unlimited attempts
- `maxAttempts: number` = Limited attempts (e.g., 3, 5, 10)

### Platform Scoping
- Assessments created by library owners are automatically scoped to their platform (`platformId`)
- Each library platform can have their own assessments for the same exam body/subject/year combination

---

**Last Updated:** January 25, 2026  
**API Version:** v1
