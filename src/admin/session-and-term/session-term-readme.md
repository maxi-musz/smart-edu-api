# Session and Term Management Module

## Overview
This module provides endpoints for managing academic sessions and terms for schools. It allows administrators to create, update, and manage academic sessions that define the time periods for school activities.

## Module Location
`src/admin/session-and-term/`

## Endpoints

### 1. Create Academic Session

**POST** `/api/v1/admin/session-and-term/academic-session`

Creates a new academic session for a school.

**Authentication:** Required (Bearer Token - JWT)

**Request Body:**
```json
{
  "school_id": "cmiu4ti150000mkcyxggp8dik",
  "academic_year": "2024/2025",
  "start_year": 2024,
  "end_year": 2025,
  "start_date": "2024-09-01",
  "end_date": "2025-08-31",
  "status": "active",
  "is_current": false
}
```

**Minimal Request Body (dates optional):**
```json
{
  "school_id": "cmiu4ti150000mkcyxggp8dik",
  "academic_year": "2024/2025",
  "start_year": 2024,
  "end_year": 2025
}
```

**Request Fields:**
- `school_id` (string, required): The ID of the school
- `academic_year` (string, required): Academic year in format "2024/2025" or "2024-2025"
- `start_year` (number, required): Start year (2000-2100)
- `end_year` (number, required): End year (2000-2100)
- `start_date` (string, optional): Date string in format YYYY-MM-DD for first term start date. If not provided, defaults to September 1st of `start_year`
- `end_date` (string, optional): Date string in format YYYY-MM-DD for last term end date. If not provided, defaults to August 31st of `end_year`
- `number_of_terms` (number, optional): Number of terms for this academic session. Must be between 1 and 3. Defaults to 3 if not provided
  - `1`: Creates only "first" term
  - `2`: Creates "first" and "second" terms
  - `3`: Creates "first", "second", and "third" terms (default)
- `status` (enum, optional): Session status for all terms - `active`, `inactive`, or `completed` (default: `active`)
- `is_current` (boolean, optional): Whether the first term should be marked as current (default: `false`)

**Note:** This endpoint automatically creates the specified number of terms for the academic year. Terms are created with dates evenly distributed across the academic year:
- If `number_of_terms` is 2: The academic year is divided into 2 equal periods
- If `number_of_terms` is 3: The academic year is divided into 3 equal periods (default)
- Terms are always named "first", "second", "third" but only the specified number will be created

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Academic session created successfully with 3 term(s)",
  "data": {
    "academic_year": "2024/2025",
    "number_of_terms": 3,
    "terms": [
      {
        "id": "cmiu4ti1y0004mkcywi8w62s2",
        "school_id": "cmiu4ti150000mkcyxggp8dik",
        "academic_year": "2024/2025",
        "start_year": 2024,
        "end_year": 2025,
        "term": "first",
        "start_date": "2024-09-01",
        "end_date": "2025-01-01",
        "status": "active",
        "is_current": false,
        "createdAt": "2024-08-28T10:00:00.000Z",
        "updatedAt": "2024-08-28T10:00:00.000Z"
      },
      {
        "id": "cmiu4ti1y0004mkcywi8w62s3",
        "school_id": "cmiu4ti150000mkcyxggp8dik",
        "academic_year": "2024/2025",
        "start_year": 2024,
        "end_year": 2025,
        "term": "second",
        "start_date": "2025-01-02",
        "end_date": "2025-05-02",
        "status": "active",
        "is_current": false,
        "createdAt": "2024-08-28T10:00:00.000Z",
        "updatedAt": "2024-08-28T10:00:00.000Z"
      },
      {
        "id": "cmiu4ti1y0004mkcywi8w62s4",
        "school_id": "cmiu4ti150000mkcyxggp8dik",
        "academic_year": "2024/2025",
        "start_year": 2024,
        "end_year": 2025,
        "term": "third",
        "start_date": "2025-05-03",
        "end_date": "2025-08-31",
        "status": "active",
        "is_current": false,
        "createdAt": "2024-08-28T10:00:00.000Z",
        "updatedAt": "2024-08-28T10:00:00.000Z"
      }
    ]
  },
  "statusCode": 201
}
```

**Error Responses:**

**400 Bad Request:**
- School not found
- Academic session with same year already exists (all three terms must not exist)
- Validation errors (invalid dates, years out of range, etc.)

```json
{
  "success": false,
  "message": "Academic session with this year already exists. Please delete existing sessions first.",
  "data": null,
  "statusCode": 400
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null,
  "statusCode": 401
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to create academic session: [error message]",
  "data": null,
  "statusCode": 500
}
```

---

### 2. Update Academic Session

**PATCH** `/api/v1/admin/session-and-term/academic-session/:sessionId`

Updates an academic session (all terms in the session). Can update start_date, end_date, and set as active session.

**Authentication:** Required (Bearer Token - JWT)

**Path Parameters:**
- `sessionId` (string, required): Academic session ID (any term ID from the session)

**Request Body:**
```json
{
  "start_date": "2024-09-01",
  "end_date": "2025-08-31",
  "is_current": true
}
```

**Request Fields:**
- `start_date` (string, optional): Date string in format YYYY-MM-DD for first term start date
- `end_date` (string, optional): Date string in format YYYY-MM-DD for last term end date
- `is_current` (boolean, optional): Whether this session should be marked as the current active session. If set to true, all other sessions for the school will be set to inactive, and the first term will be set as the active term

**Note:** 
- If `is_current` is set to `true`, the first term is automatically set as the active term
- `start_date` and `end_date` must have at least 30 days between them
- Only the first term's start_date and last term's end_date are updated when dates are provided

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Academic session updated successfully",
  "data": {
    "academic_year": "2024/2025",
    "terms": [
      {
        "id": "cmiu4ti1y0004mkcywi8w62s2",
        "school_id": "cmiu4ti150000mkcyxggp8dik",
        "academic_year": "2024/2025",
        "start_year": 2024,
        "end_year": 2025,
        "term": "first",
        "start_date": "2024-09-01",
        "end_date": "2025-01-01",
        "status": "active",
        "is_current": true,
        "createdAt": "2024-08-28T10:00:00.000Z",
        "updatedAt": "2024-08-28T10:00:00.000Z"
      }
    ]
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request:**
- Date validation failed (less than 30 days between start and end dates)

```json
{
  "success": false,
  "message": "Start date and end date must have at least 30 days between them",
  "data": null,
  "statusCode": 400
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Academic session not found",
  "data": null,
  "statusCode": 404
}
```

---

### 3. Update Term

**PATCH** `/api/v1/admin/session-and-term/term/:termId`

Updates a specific term. Can update start_date, end_date, and set as active term.

**Authentication:** Required (Bearer Token - JWT)

**Path Parameters:**
- `termId` (string, required): Term ID (academic session ID)

**Request Body:**
```json
{
  "start_date": "2024-09-01",
  "end_date": "2024-12-20",
  "is_current": true
}
```

**Request Fields:**
- `start_date` (string, optional): Date string in format YYYY-MM-DD for term start date
- `end_date` (string, optional): Date string in format YYYY-MM-DD for term end date
- `is_current` (boolean, optional): Whether this term should be marked as the current active term. If set to true, all other terms in the session will be set to inactive

**Note:** 
- `start_date` and `end_date` must have at least 30 days between them
- If `is_current` is set to `true`, all other terms in the same session are automatically deactivated

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Term updated successfully",
  "data": {
    "id": "cmiu4ti1y0004mkcywi8w62s2",
    "school_id": "cmiu4ti150000mkcyxggp8dik",
    "academic_year": "2024/2025",
    "start_year": 2024,
    "end_year": 2025,
    "term": "first",
    "start_date": "2024-09-01",
    "end_date": "2024-12-20",
    "status": "active",
    "is_current": true,
    "createdAt": "2024-08-28T10:00:00.000Z",
    "updatedAt": "2024-08-28T10:00:00.000Z"
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request:**
- Date validation failed (less than 30 days between start and end dates)

```json
{
  "success": false,
  "message": "Start date and end date must have at least 30 days between them",
  "data": null,
  "statusCode": 400
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Term not found",
  "data": null,
  "statusCode": 404
}
```

---

## Business Logic

### Session Creation Rules:
1. **School Validation**: The school must exist in the database
2. **Uniqueness**: A school cannot have duplicate sessions with the same `academic_year` (all terms are checked)
3. **Automatic Term Creation**: Terms are automatically created based on `number_of_terms`:
   - **Default**: 3 terms (first, second, third) if `number_of_terms` is not provided
   - **Custom**: Can be 1, 2, or 3 terms based on school preference
   - Terms are evenly distributed across the academic year period
   - Terms are always named "first", "second", "third" but only the specified number are created
4. **Current Session**: If `is_current` is set to `true`, only the first term is marked as current, and all other current sessions for that school are automatically set to `false`
5. **Date Validation**: 
   - `start_date` must be before `end_date` (if provided)
   - `start_date` and `end_date` must have at least 30 days between them (applies to both create and update)
6. **Year Validation**: Years must be between 2000 and 2100
7. **Term Count Validation**: `number_of_terms` must be between 1 and 3

### Session Update Rules:
1. **Session Activation**: If `is_current` is set to `true` for a session:
   - All other current sessions for the school are deactivated
   - The first term of the activated session is automatically set as the active term
2. **Term Activation**: If `is_current` is set to `true` for a term:
   - All other current terms in the same session are deactivated
3. **Date Updates**: 
   - When updating a session, only the first term's `start_date` and last term's `end_date` are updated
   - When updating a term, only that specific term's dates are updated
4. **Minimum Date Range**: All date updates must maintain at least 30 days between start and end dates

### Academic Terms:
- `first`: First term (typically September - December)
- `second`: Second term (typically January - April)
- `third`: Third term (typically May - August)

### Session Status:
- `active`: Session is currently active
- `inactive`: Session is not active
- `completed`: Session has ended

## Database Schema

The module uses the `AcademicSession` model from Prisma:

```prisma
model AcademicSession {
  id                    String                 @id @default(cuid())
  school_id             String
  academic_year         String
  start_year            Int
  end_year              Int
  term                  AcademicTerm
  start_date            DateTime
  end_date              DateTime
  status                AcademicSessionStatus  @default(active)
  is_current            Boolean                @default(false)
  createdAt             DateTime               @default(now())
  updatedAt             DateTime               @updatedAt
  // ... relations
}
```

## Usage Examples

### cURL
```bash
curl -X POST "https://api.example.com/api/v1/admin/session-and-term/academic-session" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": "cmiu4ti150000mkcyxggp8dik",
    "academic_year": "2024/2025",
    "start_year": 2024,
    "end_year": 2025,
    "term": "first",
    "start_date": "2024-09-01",
    "end_date": "2024-12-20",
    "status": "active",
    "is_current": true
  }'
```

### JavaScript/TypeScript (Axios)
```typescript
import axios from 'axios';

const createAcademicSession = async (sessionData) => {
  try {
    const response = await axios.post(
      '/api/v1/admin/session-and-term/academic-session',
      sessionData,
      {
        headers: {
          'Authorization': `Bearer ${yourJwtToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating academic session:', error.response?.data);
    throw error;
  }
};

// Usage
await createAcademicSession({
  school_id: 'cmiu4ti150000mkcyxggp8dik',
  academic_year: '2024/2025',
  start_year: 2024,
  end_year: 2025,
  term: 'first',
  start_date: '2024-09-01',
  end_date: '2024-12-20',
  status: 'active',
  is_current: true
});
```

## File Structure

```
src/admin/session-and-term/
├── api-docs/
│   └── session-and-term.docs.ts    # Swagger API documentation
├── dto/
│   └── create-academic-session.dto.ts  # DTO for creating sessions
├── session-and-term.controller.ts      # Controller with endpoints
├── session-and-term.service.ts         # Business logic
├── session-and-term.module.ts          # NestJS module definition
└── session-term-readme.md              # This file
```

## Related Modules

- **Academic Session Module**: `src/academic-session/` - General academic session management
- **Admin Module**: `src/admin/` - Parent admin module
- **School Module**: `src/school/` - School-related operations

## Future Endpoints

Planned endpoints for this module:
- Get all academic sessions (with filters)
- Get academic session by ID
- Delete academic session
- Get current academic session for a school

## Notes

- All dates should be in YYYY-MM-DD format (e.g., "2024-09-01")
- The `is_current` flag ensures only one session per school is marked as current
- Academic sessions are tied to specific schools and cannot be shared across schools
- When creating a new current session, previous current sessions are automatically deactivated

