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
| `/explore` | GET | ❌ No | Main explore page data |
| `/explore/subjects` | GET | ❌ No | Filtered & paginated subjects |
| `/explore/videos` | GET | ❌ No | Filtered & paginated videos |
| `/explore/topics/:subjectId` | GET | ❌ No | Topics with video analytics |
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

### 4. GET `/explore/topics/:subjectId` - Topics with Video Analytics

**Description:** Returns all topics under a specific subject along with video analytics for each topic.

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
// Fetch topics with analytics
const fetchTopicsBySubject = async (subjectId) => {
  const response = await fetch(
    `https://your-api-domain.com/api/v1/explore/topics/${subjectId}`
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Subject not found');
    }
    throw new Error('Failed to fetch topics');
  }
  
  const data = await response.json();
  return data.data; // { subject: {...}, topics: [...] }
};

// Usage example
try {
  const { subject, topics } = await fetchTopicsBySubject('subject_123');
  console.log('Subject:', subject.name);
  topics.forEach(topic => {
    console.log(`${topic.title}: ${topic.analytics.videosCount} videos`);
  });
} catch (error) {
  console.error(error.message);
}
```

**Response:**
```json
{
  "success": true,
  "message": "Topics retrieved successfully",
  "data": {
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Mathematics for senior secondary students",
      "color": "#3B82F6",
      "thumbnailUrl": "https://s3.amazonaws.com/...",
      "thumbnailKey": "library/subjects/...",
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
    "topics": [
      {
        "id": "topic_123",
        "title": "Algebraic Expressions",
        "description": "Learn about algebraic expressions",
        "order": 1,
        "is_active": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "chapter": {
          "id": "chapter_123",
          "title": "Introduction to Algebra",
          "description": "Basics of algebra",
          "order": 1
        },
        "analytics": {
          "videosCount": 12,
          "totalViews": 3450,
          "totalDuration": 14400
        },
        "recentVideos": [
          {
            "id": "video_123",
            "title": "Introduction to Algebraic Expressions",
            "thumbnailUrl": "https://s3.amazonaws.com/...",
            "durationSeconds": 1200,
            "views": 150,
            "createdAt": "2025-01-09T10:00:00.000Z"
          }
        ]
      }
    ]
  }
}
```

**Analytics Explanation:**
- `videosCount`: Total number of published videos in this topic
- `totalViews`: Sum of all video views in this topic
- `totalDuration`: Total duration of all videos in seconds
- `recentVideos`: Up to 3 most recent videos for preview

**Error Response (404):**
```json
{
  "success": false,
  "message": "Subject with ID subject_123 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Use Case:**
- User clicks on a subject → show all topics with video counts and analytics
- Display topic-level statistics for better navigation

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
   GET /api/v1/explore/topics/subject_123  (Get topics + analytics)
   GET /api/v1/explore/videos?subjectId=subject_123  (Get all videos)

2. User filters by specific topic
   GET /api/v1/explore/videos?topicId=topic_123
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

### LibraryTopic
```typescript
{
  id: string
  title: string
  description: string | null
  order: number
  chapter: Chapter
  analytics: {
    videosCount: number
    totalViews: number
    totalDuration: number
  }
  recentVideos: Video[]  // Up to 3 recent videos
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
| `GET /explore/topics/:subjectId` | 200-400ms | Includes analytics aggregation |

---

## Important Notes

### 🎥 Video Playback & Authentication
- **Browse videos:** No authentication required
- **Play videos:** Authentication required (JWT token)
- **Works for all users:** Students, teachers, directors, library users
- **Unique views:** Each user counted only once per video (YouTube-style)
- **View tracking:** Returns `hasViewedBefore` flag to show if user watched before

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

