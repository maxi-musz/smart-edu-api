# Exam Body API Documentation

## Overview
This module manages Nigerian Examination Bodies (WAEC, JAMB, NECO, etc.) that will create assessments and past questions for students.

**Base URL:** `https://your-api-domain.com/api/v1/developer/exam-bodies`  
**Authentication:** ✅ Required (JWT Token - Developer/Admin access)  
**Content-Type:** `application/json`

---

## Endpoints

### 1. POST `/developer/exam-bodies` - Create Exam Body

**Description:** Creates a new examination body with icon upload.

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Short name (e.g., "WAEC") |
| `fullName` | string | ✅ Yes | Full official name |
| `code` | string | ✅ Yes | Unique code |
| `icon` | file | ✅ Yes | Icon image (JPEG, PNG, GIF, WEBP, SVG - max 2MB) |
| `description` | string | No | Description of the exam body |
| `websiteUrl` | string | No | Official website URL |
| `status` | string | No | "active", "inactive", or "archived" (default: "active") |

**Example Request (using FormData):**
```javascript
const formData = new FormData();
formData.append('name', 'WAEC');
formData.append('fullName', 'West African Examinations Council');
formData.append('code', 'WAEC');
formData.append('description', 'The West African Examinations Council...');
formData.append('websiteUrl', 'https://www.waecgh.org');
formData.append('status', 'active');
formData.append('icon', iconFile); // File object from input[type="file"]

fetch('/api/v1/developer/exam-bodies', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Example Request (using cURL):**
```bash
curl -X POST "http://localhost:3000/api/v1/developer/exam-bodies" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=WAEC" \
  -F "fullName=West African Examinations Council" \
  -F "code=WAEC" \
  -F "description=Conducts standardized examinations in West Africa" \
  -F "websiteUrl=https://www.waecgh.org" \
  -F "status=active" \
  -F "icon=@/path/to/waec-icon.png"
```

**Response (201):**
```json
{
  "success": true,
  "message": "Exam body created successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "description": "The West African Examinations Council...",
    "logoUrl": "https://smart-edu-bucket.s3.amazonaws.com/exam-bodies/icons/WAEC_1705307284123_icon.png",
    "websiteUrl": "https://www.waecgh.org",
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

**Errors:**
- **400 Bad Request:** Icon file missing, invalid type, or exceeds size limit
- **409 Conflict:** Exam body with same name or code already exists

---

### 2. GET `/developer/exam-bodies` - Get All Exam Bodies

**Description:** Retrieves all registered examination bodies.

**Response (200):**
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
      "description": "...",
      "logoUrl": "https://example.com/waec-logo.png",
      "websiteUrl": "https://www.waecgh.org",
      "status": "active",
      "createdAt": "2026-01-09T10:00:00.000Z",
      "updatedAt": "2026-01-09T10:00:00.000Z"
    },
    {
      "id": "exambody_456",
      "name": "JAMB",
      "fullName": "Joint Admissions and Matriculation Board",
      "code": "JAMB",
      "description": "...",
      "logoUrl": "https://example.com/jamb-logo.png",
      "websiteUrl": "https://www.jamb.gov.ng",
      "status": "active",
      "createdAt": "2026-01-09T11:00:00.000Z",
      "updatedAt": "2026-01-09T11:00:00.000Z"
    }
  ]
}
```

---

### 3. GET `/developer/exam-bodies/:id` - Get Single Exam Body

**Description:** Retrieves details of a specific examination body.

**Path Parameters:**
- `id` (string, required) - Exam body ID

**Response (200):**
```json
{
  "success": true,
  "message": "Exam body retrieved successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "description": "...",
    "logoUrl": "https://example.com/waec-logo.png",
    "websiteUrl": "https://www.waecgh.org",
    "status": "active",
    "createdAt": "2026-01-09T10:00:00.000Z",
    "updatedAt": "2026-01-09T10:00:00.000Z"
  }
}
```

**Error (404):** Exam body not found

---

### 4. PATCH `/developer/exam-bodies/:id` - Update Exam Body

**Description:** Updates an existing examination body. Can optionally update icon.

**Content-Type:** `multipart/form-data`

**Path Parameters:**
- `id` (string, required) - Exam body ID

**Request Body (Form Data):** (All fields optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Short name |
| `fullName` | string | No | Full official name |
| `code` | string | No | Unique code |
| `icon` | file | No | New icon image (JPEG, PNG, GIF, WEBP, SVG - max 2MB) |
| `description` | string | No | Description |
| `websiteUrl` | string | No | Website URL |
| `status` | string | No | Status ("active", "inactive", "archived") |

**Example Request:**
```javascript
const formData = new FormData();
formData.append('name', 'WAEC Nigeria');
formData.append('description', 'Updated description');
formData.append('status', 'inactive');
// Optionally update icon
if (newIconFile) {
  formData.append('icon', newIconFile);
}

fetch(`/api/v1/developer/exam-bodies/${examBodyId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exam body updated successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC Nigeria",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "description": "Updated description",
    "logoUrl": "https://smart-edu-bucket.s3.amazonaws.com/exam-bodies/icons/WAEC_1705307999999_new-icon.png",
    "websiteUrl": "https://www.waecgh.org",
    "status": "inactive",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T15:30:00.000Z"
  }
}
```

**Errors:**
- `400` - Bad request (invalid icon file)
- `404` - Exam body not found
- `409` - Exam body with same name/code already exists

---

### 5. DELETE `/developer/exam-bodies/:id` - Delete Exam Body

**Description:** Permanently deletes an examination body.

**Path Parameters:**
- `id` (string, required) - Exam body ID

**Response (200):**
```json
{
  "success": true,
  "message": "Exam body deleted successfully",
  "data": {
    "id": "exambody_123"
  }
}
```

**Error (404):** Exam body not found

---

## Data Model

```typescript
{
  id: string              // Unique identifier
  name: string            // Short name (e.g., "WAEC", "JAMB")
  fullName: string        // Full official name
  code: string            // Unique code (e.g., "WAEC")
  description?: string    // Optional description
  logoUrl?: string        // Optional logo URL
  websiteUrl?: string     // Optional official website
  status: ExamBodyStatus  // "active" | "inactive" | "archived"
  createdAt: DateTime     // Creation timestamp
  updatedAt: DateTime     // Last update timestamp
}
```

---

## Common Exam Bodies in Nigeria

- **WAEC** - West African Examinations Council
- **JAMB** - Joint Admissions and Matriculation Board
- **NECO** - National Examinations Council
- **NABTEB** - National Business and Technical Examinations Board
- **GCE** - General Certificate of Education

---

## Future Features (Coming Soon)

- Link exam bodies to assessments/past questions
- Past question upload and management
- Student access to past questions
- Performance analytics per exam body

---

**Created:** January 9, 2026  
**Module:** Developer - Exam Bodies  
**Status:** Active

