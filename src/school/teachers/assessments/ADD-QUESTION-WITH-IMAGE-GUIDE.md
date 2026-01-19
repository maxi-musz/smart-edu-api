# Complete Guide: Adding Questions with Images to Assessments

**For Frontend Development Team**

This guide shows the complete payload structure for adding questions to assessments, especially questions with images.

---

## Table of Contents

1. [🌟 RECOMMENDED: Single Request (Atomic)](#-recommended-single-request-atomic)
2. [Alternative: Two-Step Process](#alternative-two-step-process)
3. [Complete Payload Examples](#complete-payload-examples)
4. [TypeScript Interfaces](#typescript-interfaces)
5. [Important Notes](#important-notes)

---

## 🌟 RECOMMENDED: Single Request (Atomic)

**Use this method to avoid orphaned images in S3!**

This endpoint uploads the image and creates the question in **one atomic operation**. If question creation fails, the image is **automatically deleted** from S3.

### Endpoint

```
POST /teachers/assessments/{assessmentId}/questions/with-image
```

### Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

### Request (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questionData | string (JSON) | Yes | Stringified JSON of question data |
| image | File | No | Image file (JPEG, PNG, GIF, WEBP, max 5MB) |

### Example Request (JavaScript)

```javascript
const createQuestionWithImage = async (assessmentId, questionData, imageFile) => {
  const formData = new FormData();
  
  // Add question data as JSON string
  formData.append('questionData', JSON.stringify({
    question_text: "What shape is shown in the image?",
    question_type: "MULTIPLE_CHOICE_SINGLE",
    points: 2,
    difficulty_level: "EASY",
    explanation: "A triangle has three sides",
    options: [
      { option_text: "Triangle", order: 1, is_correct: true },
      { option_text: "Square", order: 2, is_correct: false },
      { option_text: "Circle", order: 3, is_correct: false }
    ]
  }));
  
  // Add image file (optional)
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  const response = await fetch(
    `/teachers/assessments/${assessmentId}/questions/with-image`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // DON'T set Content-Type - browser handles it
      },
      body: formData
    }
  );
  
  return await response.json();
};
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "question-uuid-456",
    "assessment_id": "assessment-uuid-123",
    "question_text": "What shape is shown in the image?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "points": 2,
    "image_url": "https://s3.amazonaws.com/bucket/assessment-images/...",
    "image_s3_key": "assessment-images/schools/...",
    "options": [...]
  }
}
```

### Benefits

✅ **No orphaned images** - If question creation fails, image is automatically deleted  
✅ **Single request** - Simpler frontend logic  
✅ **Atomic operation** - Both succeed or both fail  
✅ **Better UX** - User can't abandon mid-process  

---

## Alternative: Two-Step Process

⚠️ **NOT RECOMMENDED** - Can leave orphaned images in S3 if user closes modal after uploading

To add a question **WITH an image** using the old method:

1. **First:** Upload the image file to get `image_url` and `image_s3_key`
2. **Then:** Create the question with the returned image data

For questions **WITHOUT images**, use the JSON endpoint directly.

---

## Step 1: Upload Question Image

### Endpoint

```
POST /teachers/assessments/{assessmentId}/questions/upload-image
```

### Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

### Request (Form Data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | File | Yes | Image file (JPEG, PNG, GIF, WEBP) |

### Constraints

- **Max File Size:** 5 MB
- **Supported Formats:** JPEG, PNG, GIF, WEBP
- **Storage:** AWS S3

### Success Response (201)

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image_url": "https://s3.amazonaws.com/bucket/assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
    "image_s3_key": "assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg"
  },
  "statusCode": 201
}
```

### Error Responses

**400 Bad Request - Invalid File:**
```json
{
  "success": false,
  "message": "Invalid image file",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

---

## Step 2: Create Question

### Endpoint

```
POST /teachers/assessments/{assessmentId}/questions
```

### Headers

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

### Request Body Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| **question_text** | string | **Yes** | - | The question text |
| **question_type** | string (enum) | **Yes** | - | Type of question (see below) |
| order | number | No | Auto | Question order in assessment |
| points | number | No | 1.0 | Points for this question (min: 0.1) |
| is_required | boolean | No | true | Whether question is required |
| time_limit | number | No | - | Time limit in seconds (min: 10) |
| **image_url** | string | No | - | **From Step 1** upload response |
| **image_s3_key** | string | No | - | **From Step 1** upload response |
| audio_url | string | No | - | Audio URL (if applicable) |
| video_url | string | No | - | Video URL (if applicable) |
| allow_multiple_attempts | boolean | No | false | Allow multiple attempts |
| show_hint | boolean | No | false | Show hint to students |
| hint_text | string | No | - | Hint text content |
| min_length | number | No | - | Min length for text answers (min: 1) |
| max_length | number | No | - | Max length for text answers (min: 1) |
| min_value | number | No | - | Min value for numeric answers |
| max_value | number | No | - | Max value for numeric answers |
| explanation | string | No | - | Explanation for correct answer |
| difficulty_level | string (enum) | No | "MEDIUM" | Difficulty level |
| **options** | array | No | - | **Required for multiple choice questions** |
| correct_answers | array | No | - | Correct answers (optional for auto-grading) |

### Question Type Enum

```typescript
type QuestionType = 
  | 'MULTIPLE_CHOICE_SINGLE'      // Single correct answer
  | 'MULTIPLE_CHOICE_MULTIPLE'    // Multiple correct answers
  | 'SHORT_ANSWER'                // Short text response
  | 'LONG_ANSWER'                 // Long text response
  | 'TRUE_FALSE'                  // True/False question
  | 'FILL_IN_BLANK'              // Fill in the blank
  | 'MATCHING'                   // Match items
  | 'ORDERING'                   // Order items
  | 'FILE_UPLOAD'                // File upload response
  | 'NUMERIC'                    // Numeric answer
  | 'DATE'                       // Date answer
  | 'RATING_SCALE';              // Rating scale
```

### Difficulty Level Enum

```typescript
type DifficultyLevel = 
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'
  | 'EXPERT';
```

### Option Structure (for Multiple Choice)

```typescript
{
  option_text: string;      // Required - Option text
  order: number;            // Required - Display order (1, 2, 3...)
  is_correct: boolean;      // Required - Whether this is correct
  image_url?: string;       // Optional - Image for this option
  audio_url?: string;       // Optional - Audio for this option
}
```

### Correct Answer Structure

```typescript
{
  answer_text?: string;          // For text-based questions
  answer_number?: number;        // For numeric questions
  answer_date?: string;          // For date questions (ISO 8601)
  option_ids?: string[];         // For multiple choice (after creation)
  answer_json?: any;             // For complex answers (matching, ordering)
}
```

---

## Complete Payload Examples

### Example 1: Multiple Choice Question WITH Image

**Step 1: Upload Image**

```javascript
const formData = new FormData();
formData.append('image', imageFile); // imageFile is from <input type="file">

const uploadResponse = await fetch(
  '/teachers/assessments/assessment-uuid-123/questions/upload-image',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // DON'T set Content-Type for FormData - browser sets it automatically
    },
    body: formData
  }
);

const uploadResult = await uploadResponse.json();
// uploadResult.data.image_url = "https://s3.amazonaws.com/..."
// uploadResult.data.image_s3_key = "assessment-images/schools/..."
```

**Step 2: Create Question with Image**

```json
{
  "question_text": "What geometric shape is shown in the image?",
  "question_type": "MULTIPLE_CHOICE_SINGLE",
  "order": 1,
  "points": 2,
  "is_required": true,
  "time_limit": 60,
  "image_url": "https://s3.amazonaws.com/bucket/assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
  "image_s3_key": "assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
  "show_hint": true,
  "hint_text": "Count the number of sides",
  "explanation": "A triangle has three sides and three angles",
  "difficulty_level": "EASY",
  "options": [
    {
      "option_text": "Triangle",
      "order": 1,
      "is_correct": true
    },
    {
      "option_text": "Square",
      "order": 2,
      "is_correct": false
    },
    {
      "option_text": "Circle",
      "order": 3,
      "is_correct": false
    },
    {
      "option_text": "Pentagon",
      "order": 4,
      "is_correct": false
    }
  ]
}
```

### Example 2: Multiple Choice Question WITHOUT Image

```json
{
  "question_text": "What is the capital of France?",
  "question_type": "MULTIPLE_CHOICE_SINGLE",
  "order": 2,
  "points": 1,
  "is_required": true,
  "explanation": "Paris is the capital and largest city of France",
  "difficulty_level": "EASY",
  "options": [
    {
      "option_text": "Paris",
      "order": 1,
      "is_correct": true
    },
    {
      "option_text": "London",
      "order": 2,
      "is_correct": false
    },
    {
      "option_text": "Berlin",
      "order": 3,
      "is_correct": false
    },
    {
      "option_text": "Madrid",
      "order": 4,
      "is_correct": false
    }
  ]
}
```

### Example 3: Multiple Select (Multiple Correct Answers)

```json
{
  "question_text": "Which of the following are programming languages?",
  "question_type": "MULTIPLE_CHOICE_MULTIPLE",
  "order": 3,
  "points": 3,
  "is_required": true,
  "explanation": "Python, JavaScript, and Java are all programming languages",
  "difficulty_level": "MEDIUM",
  "options": [
    {
      "option_text": "Python",
      "order": 1,
      "is_correct": true
    },
    {
      "option_text": "JavaScript",
      "order": 2,
      "is_correct": true
    },
    {
      "option_text": "HTML",
      "order": 3,
      "is_correct": false
    },
    {
      "option_text": "Java",
      "order": 4,
      "is_correct": true
    }
  ]
}
```

### Example 4: True/False Question

```json
{
  "question_text": "The sun is a planet.",
  "question_type": "TRUE_FALSE",
  "order": 4,
  "points": 1,
  "is_required": true,
  "explanation": "The sun is a star, not a planet",
  "difficulty_level": "EASY",
  "options": [
    {
      "option_text": "True",
      "order": 1,
      "is_correct": false
    },
    {
      "option_text": "False",
      "order": 2,
      "is_correct": true
    }
  ]
}
```

### Example 5: Short Answer Question

```json
{
  "question_text": "Explain the process of photosynthesis in 2-3 sentences.",
  "question_type": "SHORT_ANSWER",
  "order": 5,
  "points": 5,
  "is_required": true,
  "min_length": 50,
  "max_length": 300,
  "explanation": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of sugar",
  "difficulty_level": "MEDIUM"
}
```

### Example 6: Numeric Question

```json
{
  "question_text": "What is 15% of 200?",
  "question_type": "NUMERIC",
  "order": 6,
  "points": 2,
  "is_required": true,
  "min_value": 0,
  "max_value": 200,
  "explanation": "15% of 200 = (15/100) × 200 = 30",
  "difficulty_level": "EASY",
  "correct_answers": [
    {
      "answer_number": 30
    }
  ]
}
```

### Example 7: Fill in the Blank

```json
{
  "question_text": "The largest ocean on Earth is the ________ Ocean.",
  "question_type": "FILL_IN_BLANK",
  "order": 7,
  "points": 1,
  "is_required": true,
  "explanation": "The Pacific Ocean is the largest ocean on Earth",
  "difficulty_level": "EASY",
  "correct_answers": [
    {
      "answer_text": "Pacific"
    }
  ]
}
```

### Example 8: Long Answer / Essay Question

```json
{
  "question_text": "Discuss the causes and effects of climate change. Include at least 3 causes and 3 effects in your answer.",
  "question_type": "LONG_ANSWER",
  "order": 8,
  "points": 10,
  "is_required": true,
  "min_length": 200,
  "max_length": 1000,
  "show_hint": true,
  "hint_text": "Think about greenhouse gases, deforestation, and rising temperatures",
  "difficulty_level": "HARD"
}
```

---

## Success Response (201)

When a question is successfully created:

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "question-uuid-456",
    "assessment_id": "assessment-uuid-123",
    "question_text": "What geometric shape is shown in the image?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "order": 1,
    "points": 2,
    "is_required": true,
    "time_limit": 60,
    "image_url": "https://s3.amazonaws.com/bucket/assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
    "image_s3_key": "assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
    "audio_url": null,
    "video_url": null,
    "allow_multiple_attempts": false,
    "show_hint": true,
    "hint_text": "Count the number of sides",
    "min_length": null,
    "max_length": null,
    "min_value": null,
    "max_value": null,
    "explanation": "A triangle has three sides and three angles",
    "difficulty_level": "EASY",
    "created_at": "2024-01-16T10:35:00.000Z",
    "updated_at": "2024-01-16T10:35:00.000Z",
    "options": [
      {
        "id": "option-uuid-1",
        "question_id": "question-uuid-456",
        "option_text": "Triangle",
        "order": 1,
        "is_correct": true,
        "image_url": null,
        "audio_url": null
      },
      {
        "id": "option-uuid-2",
        "question_id": "question-uuid-456",
        "option_text": "Square",
        "order": 2,
        "is_correct": false,
        "image_url": null,
        "audio_url": null
      },
      {
        "id": "option-uuid-3",
        "question_id": "question-uuid-456",
        "option_text": "Circle",
        "order": 3,
        "is_correct": false,
        "image_url": null,
        "audio_url": null
      },
      {
        "id": "option-uuid-4",
        "question_id": "question-uuid-456",
        "option_text": "Pentagon",
        "order": 4,
        "is_correct": false,
        "image_url": null,
        "audio_url": null
      }
    ],
    "correct_answers": []
  },
  "statusCode": 201
}
```

---

## TypeScript Interfaces

### Complete Request Interface

```typescript
interface CreateQuestionRequest {
  // Required fields
  question_text: string;
  question_type: QuestionType;
  
  // Optional basic fields
  order?: number;
  points?: number;
  is_required?: boolean;
  time_limit?: number;
  
  // Media fields (from upload endpoints)
  image_url?: string;
  image_s3_key?: string;
  audio_url?: string;
  video_url?: string;
  
  // Answer constraints
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  
  // Help and feedback
  allow_multiple_attempts?: boolean;
  show_hint?: boolean;
  hint_text?: string;
  explanation?: string;
  difficulty_level?: DifficultyLevel;
  
  // Question-specific data
  options?: QuestionOption[];
  correct_answers?: CorrectAnswer[];
}

interface QuestionOption {
  option_text: string;
  order: number;
  is_correct: boolean;
  image_url?: string;
  audio_url?: string;
}

interface CorrectAnswer {
  answer_text?: string;
  answer_number?: number;
  answer_date?: string;
  option_ids?: string[];
  answer_json?: any;
}

type QuestionType = 
  | 'MULTIPLE_CHOICE_SINGLE'
  | 'MULTIPLE_CHOICE_MULTIPLE'
  | 'SHORT_ANSWER'
  | 'LONG_ANSWER'
  | 'TRUE_FALSE'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'ORDERING'
  | 'FILE_UPLOAD'
  | 'NUMERIC'
  | 'DATE'
  | 'RATING_SCALE';

type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
```

### Complete Response Interface

```typescript
interface CreateQuestionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    assessment_id: string;
    question_text: string;
    question_type: QuestionType;
    order: number;
    points: number;
    is_required: boolean;
    time_limit: number | null;
    image_url: string | null;
    image_s3_key: string | null;
    audio_url: string | null;
    video_url: string | null;
    allow_multiple_attempts: boolean;
    show_hint: boolean;
    hint_text: string | null;
    min_length: number | null;
    max_length: number | null;
    min_value: number | null;
    max_value: number | null;
    explanation: string | null;
    difficulty_level: DifficultyLevel;
    created_at: string;
    updated_at: string;
    options: Array<{
      id: string;
      question_id: string;
      option_text: string;
      order: number;
      is_correct: boolean;
      image_url: string | null;
      audio_url: string | null;
    }>;
    correct_answers: Array<{
      id: string;
      question_id: string;
      answer_text: string | null;
      answer_number: number | null;
      answer_date: string | null;
      option_ids: string[] | null;
      answer_json: any | null;
    }>;
  };
  statusCode: number;
}
```

---

## Important Notes

### 1. Image Upload Process

- **Always upload images BEFORE creating the question**
- Save the returned `image_url` and `image_s3_key`
- Use these values when creating the question
- If image upload fails, don't proceed with question creation

### 2. Question Types Requirements

| Question Type | Requires Options? | Supports Image? |
|--------------|-------------------|-----------------|
| MULTIPLE_CHOICE_SINGLE | ✅ Yes | ✅ Yes |
| MULTIPLE_CHOICE_MULTIPLE | ✅ Yes | ✅ Yes |
| TRUE_FALSE | ✅ Yes (2 options) | ✅ Yes |
| SHORT_ANSWER | ❌ No | ✅ Yes |
| LONG_ANSWER | ❌ No | ✅ Yes |
| NUMERIC | ❌ No | ✅ Yes |
| FILL_IN_BLANK | ❌ No | ✅ Yes |
| DATE | ❌ No | ✅ Yes |

### 3. Options Array

**For Multiple Choice Questions:**
- `options` array is **REQUIRED**
- Each option must have `option_text`, `order`, and `is_correct`
- At least one option must have `is_correct: true`
- For `MULTIPLE_CHOICE_MULTIPLE`, multiple options can be correct
- For `MULTIPLE_CHOICE_SINGLE`, only one option should be correct

**For TRUE_FALSE Questions:**
- Must have exactly 2 options: "True" and "False"
- Mark the correct one with `is_correct: true`

### 4. Order Field

- If not provided, backend auto-assigns the next available order
- If provided order already exists, backend will find next available
- Order starts from 1

### 5. Points

- Default is 1.0
- Minimum is 0.1
- Can be decimal (e.g., 0.5, 1.5, 2.5)

### 6. Time Limit

- Optional per-question time limit in **seconds**
- Minimum is 10 seconds if specified
- If not specified, assessment-level duration applies

### 7. Text Answer Constraints

For `SHORT_ANSWER` and `LONG_ANSWER`:
- `min_length`: Minimum characters required
- `max_length`: Maximum characters allowed
- Both are optional

### 8. Numeric Answer Constraints

For `NUMERIC` questions:
- `min_value`: Minimum acceptable value
- `max_value`: Maximum acceptable value
- Both are optional

### 9. Hints

- Set `show_hint: true` to enable
- Provide `hint_text` content
- Hints are shown to students during the assessment

### 10. Explanation

- Shows after student submits answer
- Explains the correct answer
- Helpful for learning

### 11. Assessment Status

You **cannot** add questions to assessments with status:
- `CLOSED`
- `ARCHIVED`

Only these statuses allow adding questions:
- `DRAFT`
- `PUBLISHED`
- `ACTIVE`

---

## Complete JavaScript Examples

### Method 1: Atomic (RECOMMENDED) ✅

```javascript
/**
 * Create question with image in single atomic request
 * Automatically handles rollback if creation fails
 */
const createQuestionAtomic = async (assessmentId, questionData, imageFile) => {
  try {
    const formData = new FormData();
    
    // Add question data as JSON string
    formData.append('questionData', JSON.stringify({
      question_text: questionData.questionText,
      question_type: questionData.questionType,
      points: questionData.points,
      is_required: questionData.isRequired,
      time_limit: questionData.timeLimit,
      show_hint: questionData.showHint,
      hint_text: questionData.hintText,
      explanation: questionData.explanation,
      difficulty_level: questionData.difficultyLevel,
      options: questionData.options,
      correct_answers: questionData.correctAnswers,
      min_length: questionData.minLength,
      max_length: questionData.maxLength,
      min_value: questionData.minValue,
      max_value: questionData.maxValue
    }));
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const response = await fetch(
      `/teachers/assessments/${assessmentId}/questions/with-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
          // DON'T set Content-Type for FormData
        },
        body: formData
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Question created successfully');
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error creating question:', error);
    showToast('error', 'Failed to create question');
    return null;
  }
};

// Usage
const questionData = {
  questionText: 'What shape is shown in the image?',
  questionType: 'MULTIPLE_CHOICE_SINGLE',
  points: 2,
  isRequired: true,
  timeLimit: 60,
  showHint: true,
  hintText: 'Count the sides',
  explanation: 'A triangle has three sides',
  difficultyLevel: 'EASY',
  options: [
    { option_text: 'Triangle', order: 1, is_correct: true },
    { option_text: 'Square', order: 2, is_correct: false },
    { option_text: 'Circle', order: 3, is_correct: false }
  ]
};

const imageFile = document.querySelector('#image-input').files[0];
const newQuestion = await createQuestionAtomic('assessment-123', questionData, imageFile);
```

### Method 2: Two-Step (NOT RECOMMENDED) ⚠️

```javascript
/**
 * OLD METHOD - Can leave orphaned images
 * Only use if you have specific requirements
 */
const addQuestionTwoStep = async (assessmentId, questionData, imageFile) => {
  try {
    let imageUrl = null;
    let imageS3Key = null;
    
    // Step 1: Upload image if provided
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const uploadResponse = await fetch(
        `/teachers/assessments/${assessmentId}/questions/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          body: formData
        }
      );
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        showToast('error', uploadResult.message);
        return null;
      }
      
      imageUrl = uploadResult.data.image_url;
      imageS3Key = uploadResult.data.image_s3_key;
      
      // ⚠️ RISK: If user closes modal here, image is orphaned!
    }
    
    // Step 2: Create question
    const response = await fetch(
      `/teachers/assessments/${assessmentId}/questions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_text: questionData.questionText,
          question_type: questionData.questionType,
          points: questionData.points,
          image_url: imageUrl,
          image_s3_key: imageS3Key,
          explanation: questionData.explanation,
          difficulty_level: questionData.difficultyLevel,
          options: questionData.options
        })
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Question added successfully');
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error adding question:', error);
    showToast('error', 'Failed to add question');
    return null;
  }
};
```

### Comparison Table

| Feature | Atomic (with-image) | Two-Step |
|---------|---------------------|----------|
| Orphaned images | ✅ No - Auto rollback | ❌ Yes - Possible |
| Number of requests | 1 | 2 |
| Complexity | Low | Medium |
| Error handling | Automatic | Manual |
| User can abandon | ❌ No risk | ✅ High risk |
| **Recommendation** | **✅ USE THIS** | ⚠️ Avoid |

---

## Error Responses

**400 Bad Request - Invalid Data:**
```json
{
  "success": false,
  "message": "Invalid question data",
  "data": null
}
```

**400 Bad Request - Closed Assessment:**
```json
{
  "success": false,
  "message": "Cannot add questions to a closed or archived assessment",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or you do not have access to it",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## Testing with cURL

### Upload Image

```bash
curl -X POST "/teachers/assessments/assessment-123/questions/upload-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Create Question (No Image)

```bash
curl -X POST "/teachers/assessments/assessment-123/questions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "What is 2 + 2?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "points": 1,
    "difficulty_level": "EASY",
    "options": [
      {"option_text": "3", "order": 1, "is_correct": false},
      {"option_text": "4", "order": 2, "is_correct": true},
      {"option_text": "5", "order": 3, "is_correct": false}
    ]
  }'
```

---

## Support

For questions or issues with the API, contact the backend development team.

**Last Updated:** January 19, 2026

