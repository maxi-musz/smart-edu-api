# Explore API Documentation

## Overview
The Explore module provides **public access** to library content for all users. Browse library classes, subjects, videos, and topics with filtering and pagination capabilities.

**Base URL:** `https://your-api-domain.com/api/v1/explore`  
**Authentication:** ❌ None required (Public access for all users)  
**Content-Type:** `application/json`  
**Response Format:** All responses follow `{ success, message, data }` structure

---

## Quick Start

```javascript
// Example: Fetch main explore page
const response = await fetch('https://your-api-domain.com/api/v1/explore');
const data = await response.json();
console.log(data.data.classes);    // All classes
console.log(data.data.subjects);   // All subjects
console.log(data.data.recentVideos); // 20 recent videos
```

---

## Endpoints Summary

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/explore` | GET | ❌ No | Main explore page data (classes, subjects, recent videos) |
| `/explore/subjects` | GET | ❌ No | Filtered & paginated subjects |
| `/explore/videos` | GET | ❌ No | Filtered & paginated videos |
| `/explore/topics/:subjectId` | GET | ⚠️ Optional | Complete subject resources with user submissions (if authenticated) |
| `/explore/videos/:videoId/play` | GET | ✅ Yes | Play video with unique view tracking |

---

## Endpoints

### 1. GET `/explore` - Main Explore Page

**Description:** Returns overview data for the main explore page including all classes, all subjects, and 20 most recent videos.

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "message": "Explore data retrieved successfully",
  "data": {
    "classes": [
      {
        "id": "class_123",
        "name": "SSS 1",
        "order": 1,
        "subjectsCount": 12
      }
    ],
    "subjects": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "description": "Mathematics for senior secondary students",
        "color": "#3B82F6",
        "thumbnailUrl": "https://s3.amazonaws.com/...",
        "videosCount": 45,
        "topicsCount": 20,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "platform": {
          "id": "platform_123",
          "name": "Access Study",
          "slug": "access-study",
          "description": "Platform description",
          "status": "active"
        },
        "class": {
          "id": "class_123",
          "name": "SSS 1",
          "order": 1
        }
      }
    ],
    "recentVideos": [
      {
        "id": "video_123",
        "title": "Introduction to Algebra",
        "description": "Learn the basics of algebra",
        "videoUrl": "https://s3.amazonaws.com/...",
        "thumbnailUrl": "https://s3.amazonaws.com/...",
        "durationSeconds": 1200,
        "sizeBytes": 52428800,
        "views": 150,
        "order": 1,
        "createdAt": "2025-01-09T10:00:00.000Z",
        "updatedAt": "2025-01-09T10:00:00.000Z",
        "topic": {
          "id": "topic_123",
          "title": "Algebraic Expressions",
          "description": "Learn about algebraic expressions",
          "order": 1,
          "chapter": {
            "id": "chapter_123",
            "title": "Introduction to Algebra",
            "order": 1
          }
        },
        "subject": {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH",
          "color": "#3B82F6",
          "thumbnailUrl": "https://s3.amazonaws.com/..."
        },
        "platform": {
          "id": "platform_123",
          "name": "Access Study",
          "slug": "access-study",
          "description": "Platform description",
          "status": "active"
        }
      }
    ],
    "statistics": {
      "totalClasses": 10,
      "totalSubjects": 45,
      "totalVideos": 20
    }
  }
}
```

**Use Case:** Initial page load for explore section

---

### 2. GET `/explore/subjects` - Filtered & Paginated Subjects

**Description:** Returns filtered and paginated library subjects. Supports filtering by class and search.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `classId` | string | No | - | Filter subjects by class ID |
| `search` | string | No | - | Search in subject name, code, or description (case-insensitive) |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Items per page (min: 1, max: 100) |

**Example Requests:**
```javascript
// Filter by class
GET /api/v1/explore/subjects?classId=class_123&page=1&limit=20

// Search for subjects (case-insensitive)
GET /api/v1/explore/subjects?search=mathematics

// Pagination
GET /api/v1/explore/subjects?page=2&limit=30

// Combined filters
GET /api/v1/explore/subjects?classId=class_123&search=math&page=1
```

**Frontend Usage:**
```javascript
// Fetch subjects by class
const fetchSubjectsByClass = async (classId, page = 1) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/subjects?classId=${classId}&page=${page}`
  );
  const data = await response.json();
  return data.data; // { items: [...], meta: {...} }
};

// Search subjects
const searchSubjects = async (searchTerm) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/subjects?search=${encodeURIComponent(searchTerm)}`
  );
  const data = await response.json();
  return data.data;
};
```

**Response:**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": {
    "items": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "description": "Mathematics for senior secondary students",
        "color": "#3B82F6",
        "thumbnailUrl": "https://s3.amazonaws.com/...",
        "thumbnailKey": "library/subjects/...",
        "videosCount": 45,
        "topicsCount": 20,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "platform": {
          "id": "platform_123",
          "name": "Access Study",
          "slug": "access-study",
          "description": "Platform description",
          "status": "active"
        },
        "class": {
          "id": "class_123",
          "name": "SSS 1",
          "order": 1
        }
      }
    ],
    "meta": {
      "totalItems": 45,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

**Use Case:** 
- User clicks on a class (e.g., "SSS 1") → filter subjects by that class
- User searches for a subject → filter by search term
- Pagination for large subject lists

---

### 3. GET `/explore/videos` - Filtered & Paginated Videos

**Description:** Returns filtered and paginated library videos. Supports filtering by class, subject, topic, and search.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `classId` | string | No | - | Filter videos by class ID |
| `subjectId` | string | No | - | Filter videos by subject ID |
| `topicId` | string | No | - | Filter videos by topic ID (highest priority) |
| `search` | string | No | - | Search in video title or description (case-insensitive) |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Items per page (min: 1, max: 100) |

**Example Requests:**
```javascript
// Filter by subject
GET /api/v1/explore/videos?subjectId=subject_123&page=1&limit=20

// Filter by topic (most specific)
GET /api/v1/explore/videos?topicId=topic_123

// Search videos
GET /api/v1/explore/videos?search=algebra&page=2

// Filter by class
GET /api/v1/explore/videos?classId=class_123&limit=50

// Combined: subject + search + pagination
GET /api/v1/explore/videos?subjectId=subject_123&search=introduction&page=1
```

**Frontend Usage:**
```javascript
// Fetch videos by subject
const fetchVideosBySubject = async (subjectId, page = 1) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/videos?subjectId=${subjectId}&page=${page}`
  );
  const data = await response.json();
  return data.data; // { items: [...], meta: {...} }
};

// Fetch videos by topic
const fetchVideosByTopic = async (topicId, page = 1) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/videos?topicId=${topicId}&page=${page}`
  );
  const data = await response.json();
  return data.data;
};

// Search videos with pagination
const searchVideos = async (searchTerm, page = 1) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/videos?search=${encodeURIComponent(searchTerm)}&page=${page}`
  );
  const data = await response.json();
  return data.data;
};
```

**Response:**
```json
{
  "success": true,
  "message": "Videos retrieved successfully",
  "data": {
    "items": [
      {
        "id": "video_123",
        "title": "Introduction to Algebra",
        "description": "Learn the basics of algebra",
        "videoUrl": "https://s3.amazonaws.com/...",
        "thumbnailUrl": "https://s3.amazonaws.com/...",
        "durationSeconds": 1200,
        "sizeBytes": 52428800,
        "views": 150,
        "order": 1,
        "createdAt": "2025-01-09T10:00:00.000Z",
        "updatedAt": "2025-01-09T10:00:00.000Z",
        "topic": {
          "id": "topic_123",
          "title": "Algebraic Expressions",
          "description": "Learn about algebraic expressions",
          "order": 1,
          "chapter": {
            "id": "chapter_123",
            "title": "Introduction to Algebra",
            "order": 1
          }
        },
        "subject": {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH",
          "color": "#3B82F6",
          "thumbnailUrl": "https://s3.amazonaws.com/...",
          "thumbnailKey": "library/subjects/..."
        },
        "platform": {
          "id": "platform_123",
          "name": "Access Study",
          "slug": "access-study",
          "description": "Platform description",
          "status": "active"
        }
      }
    ],
    "meta": {
      "totalItems": 150,
      "totalPages": 8,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

**Video Filtering Priority:**
1. If `topicId` is provided → filter by topic
2. Else if `subjectId` is provided → filter by subject
3. Else if `classId` is provided → filter by class
4. Otherwise → all published videos

**Use Case:**
- User clicks on a subject → show videos for that subject
- User clicks on a topic → show videos for that specific topic
- Real-time video updates when filtering changes

---

### 4. GET `/explore/topics/:subjectId` - Complete Subject Resources

**Description:** Returns comprehensive resources for a subject including all chapters, topics under each chapter, and complete materials (videos, PDF/DOC files, published assessments) for each topic. If user is authenticated, also includes their assessment submissions for topics. This is a complete, fully-loaded response for building rich subject detail pages.

**Authentication:** ⚠️ Optional - If authenticated, includes user's assessment submissions. Works without authentication but won't include submissions.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subjectId` | string | Yes | Subject ID |

**Example Request:**
```javascript
GET /api/v1/explore/topics/subject_123
```

**Frontend Usage:**
```javascript
// Fetch complete subject resources (with optional authentication)
const fetchSubjectResources = async (subjectId, userToken = null) => {
  const headers = userToken ? {
    'Authorization': `Bearer ${userToken}`
  } : {};
  
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/topics/${subjectId}`,
    { headers }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Subject not found');
    }
    throw new Error('Failed to fetch subject resources');
  }
  
  const data = await response.json();
  return data.data; // { subject, chapters, statistics }
};

// Usage example without authentication (no submissions)
try {
  const { subject, chapters, statistics } = await fetchSubjectResources('subject_123');
  
  console.log(`Subject: ${subject.name}`);
  console.log(`Total: ${statistics.chaptersCount} chapters, ${statistics.videosCount} videos`);
  
  chapters.forEach(chapter => {
    console.log(`\nChapter: ${chapter.title}`);
    chapter.topics.forEach(topic => {
      console.log(`  Topic: ${topic.title}`);
      console.log(`    - ${topic.videos.length} videos`);
      console.log(`    - ${topic.materials.length} materials`);
      console.log(`    - ${topic.assessments.length} assessments`);
      console.log(`    - ${topic.submissions.length} submissions`); // Empty if not authenticated
    });
  });
} catch (error) {
  console.error(error.message);
}

// Usage example WITH authentication (includes submissions)
try {
  const userToken = localStorage.getItem('authToken');
  const { subject, chapters } = await fetchSubjectResources('subject_123', userToken);
  
  chapters.forEach(chapter => {
    chapter.topics.forEach(topic => {
      if (topic.submissions.length > 0) {
        console.log(`\n${topic.title} - Your Submissions:`);
        topic.submissions.forEach(submission => {
          console.log(`  - ${submission.assessmentTitle}`);
          console.log(`    Date: ${submission.dateTaken}`);
          console.log(`    Score: ${submission.userScore}/${submission.maxScore} (${submission.percentage}%)`);
          console.log(`    Status: ${submission.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
          console.log(`    Time: ${Math.floor(submission.timeSpent / 60)} minutes`);
        });
      }
    });
  });
} catch (error) {
  console.error(error.message);
}
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Subject resources retrieved successfully",
  "data": {
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Mathematics for senior secondary students",
      "color": "#3B82F6",
      "thumbnailUrl": "https://s3.amazonaws.com/...",
      "thumbnailKey": "library/subjects/...",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "platform": {
        "id": "platform_123",
        "name": "Access Study",
        "slug": "access-study",
        "description": "Platform description",
        "status": "active"
      },
      "class": {
        "id": "class_123",
        "name": "SSS 1",
        "order": 1
      }
    },
    "chapters": [
      {
        "id": "chapter_123",
        "title": "Introduction to Algebra",
        "description": "Basics of algebra",
        "order": 1,
        "is_active": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "topics": [
          {
            "id": "topic_123",
            "title": "Algebraic Expressions",
            "description": "Learn about algebraic expressions",
            "order": 1,
            "is_active": true,
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z",
            "videos": [
              {
                "id": "video_123",
                "title": "Introduction to Algebraic Expressions",
                "description": "Learn the basics",
                "videoUrl": "https://s3.amazonaws.com/...",
                "thumbnailUrl": "https://s3.amazonaws.com/...",
                "durationSeconds": 1200,
                "sizeBytes": 52428800,
                "views": 150,
                "order": 1,
                "status": "published",
                "createdAt": "2025-01-09T10:00:00.000Z",
                "updatedAt": "2025-01-09T10:00:00.000Z",
                "uploadedBy": {
                  "id": "user_123",
                  "email": "teacher@example.com",
                  "first_name": "John",
                  "last_name": "Doe"
                }
              }
            ],
            "materials": [
              {
                "id": "material_123",
                "title": "Algebraic Expressions Notes",
                "description": "Comprehensive notes",
                "url": "https://s3.amazonaws.com/...",
                "s3Key": "library/materials/...",
                "materialType": "PDF",
                "sizeBytes": 1048576,
                "pageCount": 15,
                "status": "published",
                "order": 1,
                "createdAt": "2025-01-01T00:00:00.000Z",
                "updatedAt": "2025-01-01T00:00:00.000Z",
                "uploadedBy": {
                  "id": "user_123",
                  "email": "teacher@example.com",
                  "first_name": "John",
                  "last_name": "Doe"
                }
              }
            ],
            "assessments": [
              {
                "id": "assessment_123",
                "title": "Algebraic Expressions Quiz",
                "description": "Test your knowledge",
                "duration": 30,
                "passingScore": 70,
                "status": "PUBLISHED",
                "questionsCount": 10,
                "createdAt": "2025-01-01T00:00:00.000Z",
                "updatedAt": "2025-01-01T00:00:00.000Z"
              }
            ],
            "submissions": [
              {
                "id": "attempt_123",
                "assessmentId": "assessment_123",
                "assessmentTitle": "Algebraic Expressions Quiz",
                "attemptNumber": 1,
                "status": "SUBMITTED",
                "dateTaken": "Wed, Jan 15 2025",
                "totalQuestions": 10,
                "maxScore": 100,
                "userScore": 75,
                "percentage": 75,
                "passed": true,
                "timeSpent": 1250,
                "passingScore": 70
              }
            ],
            "statistics": {
              "videosCount": 3,
              "materialsCount": 5,
              "assessmentsCount": 2,
              "totalViews": 450,
              "totalDuration": 3600,
              "totalVideoSize": 157286400,
              "totalMaterialSize": 5242880,
              "totalSize": 162529280,
              "totalQuestions": 25
            }
          }
        ],
        "statistics": {
          "topicsCount": 4,
          "videosCount": 12,
          "materialsCount": 15,
          "assessmentsCount": 5,
          "totalViews": 1800,
          "totalDuration": 14400,
          "totalSize": 650000000,
          "totalQuestions": 75
        }
      }
    ],
    "statistics": {
      "chaptersCount": 5,
      "topicsCount": 20,
      "videosCount": 45,
      "materialsCount": 60,
      "assessmentsCount": 15,
      "totalViews": 8500,
      "totalDuration": 54000,
      "totalSize": 3200000000,
      "totalQuestions": 250
    }
  }
}
```

**Resource Types:**

**Videos:**
- All published video lessons
- Includes: title, description, URL, thumbnail, duration, views, uploader info
- Use `/explore/videos/:videoId/play` endpoint to watch (requires auth)

**Materials:**
- All published materials (PDF, DOC, DOCX, PPT, etc.)
- Includes: title, description, download URL, type, size, page count, uploader info
- Direct download via `url` field

**Assessments:**
- **Only PUBLISHED assessments** (students can take)
- Includes: title, description, duration, passing score, question count
- Does NOT include actual questions (use assessment-taking endpoint)

**Submissions:**
- **Only included if user is authenticated** (empty array for public access)
- Shows user's assessment attempt history for assessments in the topic
- Includes: assessment title, date taken (formatted), scores, pass/fail status, time spent
- Sorted by most recent first
- Multiple attempts for same assessment are all included

**Statistics Levels:**

**Topic Level:**
```typescript
{
  videosCount: number          // Number of videos in topic
  materialsCount: number       // Number of materials in topic
  assessmentsCount: number     // Number of published assessments
  totalViews: number           // Total video views
  totalDuration: number        // Total video duration (seconds)
  totalVideoSize: number       // Total video file size (bytes)
  totalMaterialSize: number    // Total material file size (bytes)
  totalSize: number            // Combined size (bytes)
  totalQuestions: number       // Total questions across all assessments
}
```

**Chapter Level:** (Same fields, aggregated from all topics)

**Subject Level:** (Same fields, aggregated from all chapters)

**Error Response (404):**
```json
{
  "success": false,
  "message": "Subject with ID subject_123 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Use Cases:**
- **Subject Detail Page:** Display complete subject structure with chapters and topics
- **Learning Path:** Show progression through chapters → topics → resources
- **Resource Discovery:** Browse all available videos, materials, and assessments
- **Progress Tracking:** Use statistics to show completion percentages
- **Content Preview:** Show what's available before students commit

---

### 5. GET `/explore/videos/:videoId/play` - Play Video (Unique Views)

**Description:** Retrieves video details and URL for playback with YouTube-style unique view tracking. Each user is counted only once per video.

**Authentication:** ✅ Required (JWT Token - works for all user types)

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string | Yes | Video ID |

**Example Request:**
```javascript
GET /api/v1/explore/videos/video_123/play
Authorization: Bearer <jwt_token>
```

**Frontend Usage:**
```javascript
// Play video with authentication
const playVideo = async (videoId, token) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/videos/${videoId}/play`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Please login to watch videos');
    }
    throw new Error('Video not available');
  }
  
  const data = await response.json();
  return data.data;
};

// Usage example
try {
  const video = await playVideo('video_123', userToken);
  
  // Check if user has watched before
  if (video.hasViewedBefore) {
    console.log('You watched this on:', video.viewedAt);
  } else {
    console.log('First time watching! View counted.');
  }
  
  // Play video
  videoPlayer.src = video.videoUrl;
  videoPlayer.play();
  
} catch (error) {
  console.error(error.message);
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Video retrieved for playback",
  "data": {
    "id": "video_123",
    "title": "Introduction to Algebra",
    "description": "Learn the basics of algebra",
    "videoUrl": "https://s3.amazonaws.com/bucket/video.mp4",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumb.jpg",
    "durationSeconds": 1200,
    "sizeBytes": 52428800,
    "views": 151,
    "order": 1,
    "createdAt": "2025-01-09T10:00:00.000Z",
    "updatedAt": "2025-01-09T10:00:00.000Z",
    "hasViewedBefore": false,
    "viewedAt": "2025-01-09T15:30:00.000Z",
    "topic": {
      "id": "topic_123",
      "title": "Algebraic Expressions",
      "description": "Learn about algebraic expressions",
      "chapter": {
        "id": "chapter_123",
        "title": "Introduction to Algebra"
      }
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "color": "#3B82F6",
      "thumbnailUrl": "https://s3.amazonaws.com/..."
    },
    "platform": {
      "id": "platform_123",
      "name": "Access Study",
      "slug": "access-study",
      "description": "Educational platform"
    }
  }
}
```

**Response Fields Explained:**

| Field | Type | Description |
|-------|------|-------------|
| `videoUrl` | string | Direct URL to video file (use this in video player) |
| `views` | number | Total unique views count |
| `hasViewedBefore` | boolean | `true` if user has watched this video before, `false` if first time |
| `viewedAt` | string | Timestamp of when user viewed the video |
| `durationSeconds` | number | Video duration in seconds (may be null if not set) |
| `sizeBytes` | number | Video file size in bytes |

**View Counting Logic:**

**First Time Watching:**
```
User plays video → No record found
→ views++ (151)
→ Record created in LibraryVideoView
→ Response: { hasViewedBefore: false, views: 151 }
✅ View counted!
```

**Watching Again (Same User):**
```
Same user plays video → Record found
→ views unchanged (151)
→ Response: { hasViewedBefore: true, views: 151 }
⚠️ View NOT counted (unique views only)
```

**Different User:**
```
New user plays video → No record for this user
→ views++ (152)
→ Record created
→ Response: { hasViewedBefore: false, views: 152 }
✅ View counted!
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Video not found or not available",
  "statusCode": 404
}
```

**Use Case:**
- User clicks "Play" button on video → Call this endpoint
- Load video URL into video player
- Show "You've watched this before" badge if `hasViewedBefore: true`
- Track viewing history for "Continue Watching" features

---

## User Flow Examples

### Flow 1: Browse by Class
```
1. Load main page
   GET /api/v1/explore

2. User clicks "SSS 1" class
   GET /api/v1/explore/subjects?classId=class_123

3. User clicks "Mathematics" subject
   GET /api/v1/explore/topics/subject_123
   GET /api/v1/explore/videos?subjectId=subject_123

4. User clicks specific topic
   GET /api/v1/explore/videos?topicId=topic_123

5. User clicks "Play" on a video
   GET /api/v1/explore/videos/video_123/play  (Auth required)
```

### Flow 2: Search Videos
```
1. Load main page
   GET /api/v1/explore

2. User searches "algebra"
   GET /api/v1/explore/videos?search=algebra&page=1

3. User scrolls (pagination)
   GET /api/v1/explore/videos?search=algebra&page=2

4. User plays a video from search results
   GET /api/v1/explore/videos/video_456/play  (Auth required)
```

### Flow 3: Subject Deep Dive
```
1. User clicks subject
   GET /api/v1/explore/topics/subject_123
   → Returns complete structure: chapters, topics, videos, materials, assessments
   → Display as organized curriculum with chapters as sections

2. User expands a topic
   → Already have all resources from step 1
   → Display videos, materials (PDFs, DOCs), and assessments

3. User clicks "Play" on a video
   GET /api/v1/explore/videos/video_123/play  (Auth required)
   → Play video with view tracking

4. User clicks "Download" on a material
   → Use `material.url` from step 1 response
   → Direct download, no additional API call needed

5. User clicks "Take Assessment"
   → Navigate to assessment page with assessment.id
   → Use separate assessment-taking endpoint (not part of explore)
```

---

## Response Structure

All endpoints follow the standard response format:

**Success Response:**
```typescript
{
  success: true,
  message: string,
  data: any,
  meta?: {
    totalItems: number,
    totalPages: number,
    currentPage: number,
    limit: number
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  message: string,
  error: any,
  statusCode: number
}
```

---

## Data Models

### LibraryClass
```typescript
{
  id: string
  name: string          // e.g., "SSS 1", "JSS 2"
  order: number
  subjectsCount: number
}
```

### LibrarySubject
```typescript
{
  id: string
  name: string
  code: string
  description: string | null
  color: string          // Hex color
  thumbnailUrl: string | null
  videosCount: number
  topicsCount: number
  platform: Platform
  class: Class | null
}
```

### LibraryVideo
```typescript
{
  id: string
  title: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  views: number
  topic: Topic | null
  subject: Subject
  platform: Platform
}
```

### LibraryTopic (with Resources)
```typescript
{
  id: string
  title: string
  description: string | null
  order: number
  is_active: boolean
  createdAt: string
  updatedAt: string
  videos: Video[]          // All published videos
  materials: Material[]     // All published materials
  assessments: Assessment[] // All published assessments
  submissions: Submission[] // User's assessment attempts (only if authenticated, empty array otherwise)
  statistics: {
    videosCount: number
    materialsCount: number
    assessmentsCount: number
    totalViews: number
    totalDuration: number
    totalVideoSize: number
    totalMaterialSize: number
    totalSize: number
    totalQuestions: number
  }
}
```

### LibraryMaterial
```typescript
{
  id: string
  title: string
  description: string | null
  url: string              // Direct download URL
  s3Key: string | null
  materialType: string     // "PDF", "DOC", "DOCX", "PPT", etc.
  sizeBytes: number | null
  pageCount: number | null
  status: string           // "published"
  order: number
  createdAt: string
  updatedAt: string
  uploadedBy: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}
```

### LibraryAssessment
```typescript
{
  id: string
  title: string
  description: string | null
  duration: number         // Duration in minutes
  passingScore: number     // Percentage (0-100)
  status: string           // "PUBLISHED" only
  questionsCount: number
  createdAt: string
  updatedAt: string
}
```

### LibraryChapter (with Topics)
```typescript
{
  id: string
  title: string
  description: string | null
  order: number
  is_active: boolean
  createdAt: string
  updatedAt: string
  topics: Topic[]
  statistics: {
    topicsCount: number
    videosCount: number
    materialsCount: number
    assessmentsCount: number
    totalViews: number
    totalDuration: number
    totalSize: number
    totalQuestions: number
  }
}
```

### AssessmentSubmission
```typescript
{
  id: string               // Attempt ID
  assessmentId: string     // Assessment ID
  assessmentTitle: string  // Assessment title
  attemptNumber: number    // 1, 2, 3, etc.
  status: string           // "SUBMITTED", "GRADED", etc.
  dateTaken: string        // "Wed, Jan 15 2025" format
  totalQuestions: number   // Total questions in assessment
  maxScore: number         // Maximum possible score
  userScore: number        // User's actual score
  percentage: number       // Score percentage (0-100)
  passed: boolean          // Whether user passed
  timeSpent: number        // Time in seconds
  passingScore: number     // Passing percentage threshold
}
```

---

## Performance Considerations

### Pagination
- Default: 20 items per page
- Maximum: 100 items per page
- Use pagination for large datasets to reduce response time

### Filtering Priority
When multiple filters are provided for videos:
1. `topicId` (most specific)
2. `subjectId` (medium)
3. `classId` (least specific)

### Indexing
Database indexes on:
- `LibrarySubject`: `platformId`, `name`, `classId`
- `LibraryVideoLesson`: `platformId`, `subjectId`, `topicId`, `status`, `createdAt`
- `LibraryTopic`: `platformId`, `subjectId`, `chapterId`, `order`

---

## Status Codes

| Code | Status | Description |
|------|--------|-------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid query parameters (e.g., page < 1, limit > 100) |
| `401` | Unauthorized | Authentication required (only for `/videos/:videoId/play`) |
| `404` | Not Found | Resource doesn't exist (topics or video not found) |
| `500` | Internal Server Error | Server error - contact support if persists |

---

## Authentication Setup

The video playback endpoint requires JWT authentication. Here's how to set it up:

### Backend JWT Configuration
Already configured! The endpoint uses the existing `JwtGuard` that works for all user types:
- ✅ School users (students, teachers, directors)
- ✅ Library users (content creators)
- ✅ Admin users

### Frontend Authentication
```javascript
// Store token after login
localStorage.setItem('authToken', response.data.token);

// Create authenticated fetch wrapper
const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Use it for video playback
const playVideo = async (videoId) => {
  const response = await authenticatedFetch(
    `https://your-api-domain.com/api/v1/explore/videos/${videoId}/play`
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    throw new Error('Video not available');
  }
  
  return response.json();
};
```

### Handling Unauthenticated Users
```javascript
// Check if user is logged in before showing "Play" button
const VideoCard = ({ video }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  const handlePlay = async () => {
    if (!isAuthenticated) {
      // Show login modal or redirect
      showLoginPrompt('Please login to watch videos');
      return;
    }
    
    try {
      const data = await playVideo(video.id);
      // Play video
      videoPlayer.src = data.data.videoUrl;
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
  
  return (
    <div>
      <h3>{video.title}</h3>
      <button onClick={handlePlay}>
        {isAuthenticated ? 'Play Video' : 'Login to Watch'}
      </button>
    </div>
  );
};
```

---

## Frontend Integration Tips

### 1. **Pagination Helper**
```javascript
// Reusable pagination component props
const PaginationComponent = ({ meta, onPageChange }) => {
  // meta = { totalItems, totalPages, currentPage, limit }
  const { currentPage, totalPages } = meta;
  
  return (
    <div>
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      
      <span>Page {currentPage} of {totalPages}</span>
      
      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};
```

### 2. **Infinite Scroll Pattern**
```javascript
// Load more videos on scroll
const [videos, setVideos] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMoreVideos = async () => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/videos?subjectId=${subjectId}&page=${page}`
  );
  const data = await response.json();
  
  setVideos(prev => [...prev, ...data.data.items]);
  setPage(prev => prev + 1);
  setHasMore(page < data.data.meta.totalPages);
};
```

### 3. **Search Debouncing**
```javascript
// Debounce search input
import { useState, useEffect } from 'react';

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm);

useEffect(() => {
  if (debouncedSearch) {
    searchVideos(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 4. **Error Handling**
```javascript
// Centralized error handling
const handleApiError = (error, response) => {
  if (response?.status === 404) {
    return 'Resource not found';
  }
  if (response?.status === 400) {
    return 'Invalid request parameters';
  }
  if (response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  return 'An unexpected error occurred';
};

// Usage in component
try {
  const data = await fetchTopicsBySubject(subjectId);
} catch (error) {
  const errorMessage = handleApiError(error, error.response);
  showToast(errorMessage, 'error');
}
```

### 5. **Caching Strategy**
```javascript
// Simple cache with React Query or SWR
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());

const useExploreData = () => {
  const { data, error, isLoading } = useSWR(
    'https://your-api-domain.com/api/v1/explore',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  
  return {
    exploreData: data?.data,
    isLoading,
    error
  };
};
```

### 6. **Video Player Integration**
```javascript
// Complete video player component with view tracking
const VideoPlayer = ({ videoId }) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  
  useEffect(() => {
    loadVideo();
  }, [videoId]);
  
  const loadVideo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `https://your-api-domain.com/api/v1/explore/videos/${videoId}/play`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to load video');
      
      const result = await response.json();
      setVideoData(result.data);
      
      // Show notification if user has watched before
      if (result.data.hasViewedBefore) {
        showToast('You watched this before', 'info');
      }
      
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading video...</div>;
  if (!videoData) return <div>Video not available</div>;
  
  return (
    <div>
      <video 
        ref={videoRef}
        src={videoData.videoUrl}
        poster={videoData.thumbnailUrl}
        controls
        style={{ width: '100%', maxHeight: '500px' }}
      />
      
      <div className="video-info">
        <h2>{videoData.title}</h2>
        <p>{videoData.description}</p>
        <div className="stats">
          <span>👁️ {videoData.views} views</span>
          <span>📚 {videoData.subject.name}</span>
          <span>🏫 {videoData.platform.name}</span>
        </div>
        
        {videoData.hasViewedBefore && (
          <div className="badge">
            ✓ Watched on {new Date(videoData.viewedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};
```

### 7. **Subject Resources Display**
```javascript
// Display complete subject resources with chapters and topics
const SubjectResourcesPage = ({ subjectId }) => {
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState(null);
  
  useEffect(() => {
    fetchResources();
  }, [subjectId]);
  
  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://your-api-domain.com/api/v1/explore/topics/${subjectId}`
      );
      
      if (!response.ok) throw new Error('Failed to load resources');
      
      const result = await response.json();
      setResources(result.data);
      
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadMaterial = (materialUrl) => {
    window.open(materialUrl, '_blank');
  };
  
  const handlePlayVideo = (videoId) => {
    router.push(`/watch/${videoId}`);
  };
  
  const handleTakeAssessment = (assessmentId) => {
    router.push(`/assessment/${assessmentId}`);
  };
  
  if (loading) return <Spinner />;
  if (!resources) return <ErrorMessage />;
  
  const { subject, chapters, statistics } = resources;
  
  return (
    <div className="subject-resources">
      {/* Subject Header */}
      <div className="subject-header">
        <img src={subject.thumbnailUrl} alt={subject.name} />
        <div>
          <h1>{subject.name}</h1>
          <p>{subject.description}</p>
          <div className="stats">
            <span>📚 {statistics.chaptersCount} Chapters</span>
            <span>📝 {statistics.topicsCount} Topics</span>
            <span>🎥 {statistics.videosCount} Videos</span>
            <span>📄 {statistics.materialsCount} Materials</span>
            <span>✅ {statistics.assessmentsCount} Assessments</span>
          </div>
        </div>
      </div>
      
      {/* Chapters List */}
      <div className="chapters">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="chapter">
            <div 
              className="chapter-header"
              onClick={() => setExpandedChapter(
                expandedChapter === chapter.id ? null : chapter.id
              )}
            >
              <h2>{chapter.title}</h2>
              <p>{chapter.description}</p>
              <div className="chapter-stats">
                {chapter.statistics.topicsCount} topics • 
                {chapter.statistics.videosCount} videos • 
                {chapter.statistics.materialsCount} materials
              </div>
            </div>
            
            {/* Topics (shown when expanded) */}
            {expandedChapter === chapter.id && (
              <div className="topics">
                {chapter.topics.map((topic) => (
                  <div key={topic.id} className="topic">
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                    
                    {/* Videos */}
                    {topic.videos.length > 0 && (
                      <div className="videos">
                        <h4>🎥 Videos ({topic.videos.length})</h4>
                        {topic.videos.map((video) => (
                          <div key={video.id} className="video-item">
                            <img src={video.thumbnailUrl} alt={video.title} />
                            <div>
                              <h5>{video.title}</h5>
                              <p>👁️ {video.views} views • {video.durationSeconds}s</p>
                              <button onClick={() => handlePlayVideo(video.id)}>
                                Play Video
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Materials */}
                    {topic.materials.length > 0 && (
                      <div className="materials">
                        <h4>📄 Materials ({topic.materials.length})</h4>
                        {topic.materials.map((material) => (
                          <div key={material.id} className="material-item">
                            <div className="material-icon">
                              {material.materialType === 'PDF' && '📕'}
                              {material.materialType === 'DOC' && '📘'}
                              {material.materialType === 'PPT' && '📊'}
                            </div>
                            <div>
                              <h5>{material.title}</h5>
                              <p>{material.materialType} • {(material.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                              <button onClick={() => handleDownloadMaterial(material.url)}>
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Assessments */}
                    {topic.assessments.length > 0 && (
                      <div className="assessments">
                        <h4>✅ Assessments ({topic.assessments.length})</h4>
                        {topic.assessments.map((assessment) => (
                          <div key={assessment.id} className="assessment-item">
                            <div>
                              <h5>{assessment.title}</h5>
                              <p>{assessment.questionsCount} questions • {assessment.duration} mins • Pass: {assessment.passingScore}%</p>
                              <button onClick={() => handleTakeAssessment(assessment.id)}>
                                Take Assessment
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Topic Statistics */}
                    <div className="topic-stats">
                      <span>📊 {topic.statistics.totalViews} total views</span>
                      <span>⏱️ {Math.floor(topic.statistics.totalDuration / 60)} mins content</span>
                      <span>💾 {(topic.statistics.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Common UI Patterns

### Pattern 1: Class → Subjects → Videos
```
1. Show all classes (from main explore endpoint)
2. User clicks class → Fetch subjects for that class
3. User clicks subject → Fetch topics AND videos for that subject
4. Display topics as tabs/sections with video counts
5. User clicks topic → Filter videos by that topic
```

### Pattern 2: Search-First
```
1. User types in search bar
2. Show suggestions while typing (optional)
3. Fetch videos with search parameter
4. Display results with pagination
5. User can refine with filters (class/subject/topic dropdowns)
```

### Pattern 3: Subject Deep Dive
```
1. User navigates to subject page
2. Fetch topics with analytics (show overview)
3. Fetch videos for entire subject (paginated)
4. Display videos grouped by topics or as flat list
5. Show analytics (total videos, views, duration per topic)
```

---

## API Response Time Expectations

| Endpoint | Expected Response Time | Notes |
|----------|----------------------|-------|
| `GET /explore` | 100-300ms | Cached data, fast response |
| `GET /explore/subjects` | 50-150ms | Simple query with filters |
| `GET /explore/videos` | 100-250ms | Depends on filters, optimized with indexes |
| `GET /explore/topics/:subjectId` | 500-1500ms | Complete resources with nested data (chapters → topics → materials) |
| `GET /explore/videos/:videoId/play` | 100-250ms | Includes unique view tracking |

---

## Important Notes

### 🎥 Video Playback & Authentication
- **Browse videos:** No authentication required
- **Play videos:** Authentication required (JWT token)
- **Works for all users:** Students, teachers, directors, library users
- **Unique views:** Each user counted only once per video (YouTube-style)
- **View tracking:** Returns `hasViewedBefore` flag to show if user watched before

### 📚 Resource Access
- **Videos:** Requires authentication via `/explore/videos/:videoId/play` endpoint
- **Materials:** Direct download via `material.url` (no additional auth needed for published materials)
- **Assessments:** Only published assessments shown; use dedicated assessment-taking endpoint to access questions
- **Submissions:** Only included in topic resources if user is authenticated; shows user's assessment attempt history
- **Material Types:** PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, and more

### 🔍 Search Behavior
- All search is **case-insensitive**
- Searches in: name, description, code (for subjects) or title, description (for videos)
- Use `encodeURIComponent()` for search terms with special characters

### 📄 Pagination Best Practices
- Default limit is 20 items
- Maximum limit is 100 items
- Always check `meta.totalPages` before requesting next page
- Use `meta.currentPage` to track current position

### 🎯 Filtering Priority (Videos)
When multiple filters are provided:
1. **topicId** (highest priority - most specific)
2. **subjectId** (medium priority)
3. **classId** (lowest priority - most general)

Example: If you provide both `subjectId` and `topicId`, only `topicId` will be used.

### 🚀 Performance Tips
- Cache the main explore page data (classes + subjects rarely change)
- Implement infinite scroll or "Load More" instead of traditional pagination for better UX
- Debounce search inputs (500ms recommended)
- Show loading skeletons while fetching
- Preload next page when user is near the bottom (for infinite scroll)

### ⚠️ Error Scenarios
- **No results**: Empty `items` array with valid meta data
- **Invalid page**: Returns empty array if page > totalPages
- **Invalid subject ID**: Returns 404 with error message
- **Network error**: Handle with try-catch and show user-friendly message

---

**Last Updated:** January 9, 2026  
**API Version:** v1  
**Maintained By:** Smart Edu Hub Backend Team

