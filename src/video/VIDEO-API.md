# Universal Video Playback API

**Base URL:** `/video`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Purpose:** Universal video playback system that works for **all video types** (library videos and school videos) with professional YouTube-like features including view tracking, watch history, and progress tracking.

---

## Table of Contents

1. [Play Video (Universal)](#1-play-video-universal)
2. [Track Watch Progress](#2-track-watch-progress)

---

## IMPORTANT: Response Structure

Successful responses from `ResponseHelper.success` use this shape (global prefix: `/api/v1`):

```typescript
{
  success: true;
  message: string;       // Human-readable message
  data: object | null;   // Payload on success
  statusCode: 200;       // Always present on success paths using ResponseHelper
  length?: number;      // Present when data is an array
  meta?: unknown;        // Optional metadata
}
```

HTTP errors (4xx/5xx) are returned by Nest’s exception layer; the JSON body may differ from the helper shape above.

---

## 1. Play Video (Universal)

Universal video playback endpoint that automatically detects video type (library or school) and provides playback URL with view tracking.

**Endpoint:** `GET /video/:videoId/play`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| videoId | string | Yes | Video ID (works for both LibraryVideoLesson and VideoContent) |

**Example Request:**
```
GET /video/video-uuid-123/play
```

**Success Response (200):**

**For Library Videos:**

Library playback **requires** adaptive HLS to be ready (`hlsStatus === completed` in the database). `videoUrl` is always the **HLS master playlist** (e.g. CloudFront URL ending in `main.m3u8` when using MediaConvert, or `master.m3u8` when using FFmpeg). There is **no MP4 fallback** for library videos on this endpoint.

```json
{
  "success": true,
  "message": "Video retrieved for playback",
  "statusCode": 200,
  "data": {
    "id": "video-uuid-123",
    "title": "Introduction to Mathematics",
    "description": "Basic concepts of mathematics",
    "videoUrl": "https://your-cdn.cloudfront.net/library/videos-hls/video-uuid-123/main.m3u8",
    "streamingType": "hls",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumb.jpg",
    "durationSeconds": 3600,
    "sizeBytes": 52428800,
    "views": 150,
    "order": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "topic": {
      "id": "topic-uuid",
      "title": "Basic Math",
      "description": "Fundamentals"
    },
    "subject": {
      "id": "subject-uuid",
      "name": "Mathematics",
      "code": "MATH101",
      "color": "#3B82F6",
      "thumbnailUrl": "https://..."
    },
    "platform": {
      "id": "platform-uuid",
      "name": "Example Library",
      "slug": "example-library",
      "description": "Platform description"
    },
    "hasViewedBefore": false,
    "viewedAt": null,
    "lastWatchPosition": 0,
    "completionPercentage": 0,
    "isCompleted": false,
    "videoType": "library"
  }
}
```

**For School Videos:**

When HLS transcoding has finished, `videoUrl` points at the HLS playlist and `streamingType` is `"hls"`. If HLS is not ready yet, the API falls back to **MP4** (CloudFront or stored URL) and `streamingType` is `"mp4"`.

```json
{
  "success": true,
  "message": "Video retrieved for playback",
  "statusCode": 200,
  "data": {
    "id": "video-uuid-456",
    "title": "Algebra Basics",
    "description": "Introduction to algebra",
    "videoUrl": "https://s3.amazonaws.com/bucket/school-video.mp4",
    "streamingType": "mp4",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumb.jpg",
    "durationSeconds": 1800,
    "size": "50 MB",
    "views": 75,
    "order": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "topic": {
      "id": "topic-uuid",
      "title": "Algebra",
      "description": "Basic algebra concepts",
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6"
      }
    },
    "school": {
      "id": "school-uuid",
      "school_name": "Example School"
    },
    "hasViewedBefore": false,
    "viewedAt": null,
    "lastWatchPosition": 0,
    "completionPercentage": 0,
    "isCompleted": false,
    "videoType": "school"
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  statusCode: 200;
  data: {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string; // Library: HLS playlist only. School: HLS playlist or MP4 URL
    streamingType: 'hls' | 'mp4'; // Library: always 'hls' when 200 OK
    thumbnailUrl: string | null;
    durationSeconds: number;
    size?: string;
    sizeBytes?: number;
    views: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    topic: {
      id: string;
      title: string;
      description?: string;
      subject?: {
        id: string;
        name: string;
        code: string;
        color: string;
      };
    } | null;
    subject?: {
      id: string;
      name: string;
      code: string;
      color: string;
      thumbnailUrl?: string;
    };
    platform?: {
      id: string;
      name: string;
      slug: string;
      description: string;
    };
    school?: {
      id: string;
      school_name: string;
    };
    hasViewedBefore: boolean;
    viewedAt: Date | null;
    lastWatchPosition: number;
    completionPercentage: number;
    isCompleted: boolean;
    videoType: 'library' | 'school';
  };
}
```

**Important Notes:**

1. **Automatic Detection:** Endpoint automatically detects if video is library or school type
2. **Library HLS only:** For `videoType: 'library'`, playback is returned only after HLS transcoding completes. While processing, the API responds with **503**; if transcoding failed, **422** (see below). Use `hlsStatus` from listing/detail APIs to drive “Preparing…” UI and polling.
3. **Unique View Tracking:** Only counts each user once per video (YouTube-style). Views are incremented only after the video is eligible to play (library: after HLS is ready).
4. **Resume Functionality:** Returns `lastWatchPosition` for resume playback
5. **Completion Status:** Shows if user has completed watching (>90%)
6. **Universal:** Works for all authenticated users (students, teachers, directors, library users)

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Video not found or not published",
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

**503 Service Unavailable** (library video — HLS not ready yet, e.g. `pending` / `processing`):

Shape follows Nest’s `ServiceUnavailableException` payload; `message` explains that adaptive streaming is still being prepared.

```json
{
  "success": false,
  "message": "Video is not ready for playback yet. Adaptive streaming is still being prepared.",
  "hlsStatus": "processing"
}
```

**422 Unprocessable Entity** (library video — HLS transcoding **failed**):

```json
{
  "success": false,
  "message": "Video processing failed. Please re-upload the video or contact support.",
  "hlsStatus": "failed"
}
```

---

## 2. Track Watch Progress

Record detailed watch progress including completion percentage, last position, and engagement metrics. Enables resume functionality and analytics.

**Endpoint:** `POST /video/:videoId/watch-progress`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| videoId | string | Yes | Video ID |

**Request Body:**

```json
{
  "watchDurationSeconds": 120,
  "lastWatchPosition": 120,
  "deviceType": "mobile",
  "platform": "ios",
  "referrerSource": "search",
  "videoQuality": "720p",
  "playbackSpeed": 1.0,
  "bufferingEvents": 2,
  "sessionId": "session-uuid-123",
  "userAgent": "Mozilla/5.0..."
}
```

**Request Body Structure:**

```typescript
{
  watchDurationSeconds?: number;  // How long user watched (seconds)
  lastWatchPosition?: number;      // Last position for resume (seconds)
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'tv';
  platform?: 'ios' | 'android' | 'web';
  referrerSource?: 'direct' | 'search' | 'recommendation' | 'related_video' | 'playlist';
  videoQuality?: '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p';
  playbackSpeed?: number;          // 0.25 - 2.0, default 1.0
  bufferingEvents?: number;        // Number of buffering interruptions
  sessionId?: string;              // Group multiple watch events
  userAgent?: string;              // Browser/app user agent
}
```

**Example Request:**
```
POST /video/video-uuid-123/watch-progress
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Watch progress tracked successfully",
  "data": {
    "watchId": "watch-history-uuid",
    "completionPercentage": 33.3,
    "isCompleted": false,
    "lastWatchPosition": 120
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    watchId: string;
    completionPercentage: number;  // 0-100
    isCompleted: boolean;           // true if >= 90%
    lastWatchPosition: number;      // Last position in seconds
  };
}
```

**Important Notes:**

1. **Completion Threshold:** Videos watched ≥90% are marked as completed
2. **Resume Support:** `lastWatchPosition` enables resume functionality
3. **Analytics:** Rich metadata for engagement analytics
4. **Library Videos Only:** Currently supports library videos (school video tracking coming soon)

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Video not found",
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

## Example Usage (JavaScript/TypeScript)

### Play Video with Resume Functionality

```typescript
const playVideo = async (videoId: string, token: string) => {
  try {
    const response = await fetch(`/video/${videoId}/play`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const video = result.data;
      
      // Set video source
      videoPlayer.src = video.videoUrl;
      
      // Handle resume functionality
      if (video.lastWatchPosition > 0 && !video.isCompleted) {
        // Show resume prompt or auto-resume
        const resumeFrom = formatTime(video.lastWatchPosition);
        const shouldResume = confirm(`Resume from ${resumeFrom}?`);
        
        if (shouldResume) {
          videoPlayer.currentTime = video.lastWatchPosition;
        }
      }
      
      // Play video
      videoPlayer.play();
      
      // Start tracking watch progress
      startWatchProgressTracking(videoId, token);
      
      return video;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to load video');
    return null;
  }
};

// Helper to format seconds to MM:SS or HH:MM:SS
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### Track Watch Progress

```typescript
const trackWatchProgress = async (
  videoId: string,
  token: string,
  watchData: {
    watchDurationSeconds: number;
    lastWatchPosition: number;
    deviceType: string;
    platform: string;
  }
) => {
  try {
    const response = await fetch(`/video/${videoId}/watch-progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(watchData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Watch progress tracked:', result.data);
      return result.data;
    } else {
      console.error('Failed to track progress:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};

// Start watch progress tracking
let progressTrackingInterval: NodeJS.Timeout | null = null;
let sessionId: string;

const startWatchProgressTracking = (videoId: string, token: string) => {
  // Generate session ID for grouping watch events
  sessionId = `session-${Date.now()}`;
  
  // Clear any existing interval
  if (progressTrackingInterval) {
    clearInterval(progressTrackingInterval);
  }
  
  // Track progress every 10 seconds while playing
  progressTrackingInterval = setInterval(() => {
    if (videoPlayer && !videoPlayer.paused && !videoPlayer.ended) {
      trackWatchProgress(videoId, token, {
        watchDurationSeconds: Math.floor(videoPlayer.currentTime),
        lastWatchPosition: Math.floor(videoPlayer.currentTime),
        deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        platform: 'web',
        videoQuality: '720p', // You can detect actual quality if available
        playbackSpeed: videoPlayer.playbackRate,
        sessionId: sessionId,
        userAgent: navigator.userAgent,
        referrerSource: 'direct',
      });
    }
  }, 10000); // Every 10 seconds
  
  // Track final position when video ends or user leaves
  videoPlayer.addEventListener('ended', () => {
    trackWatchProgress(videoId, token, {
      watchDurationSeconds: Math.floor(videoPlayer.duration),
      lastWatchPosition: Math.floor(videoPlayer.duration),
      deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      platform: 'web',
      videoQuality: '720p',
      playbackSpeed: videoPlayer.playbackRate,
      sessionId: sessionId,
      userAgent: navigator.userAgent,
    });
    
    if (progressTrackingInterval) {
      clearInterval(progressTrackingInterval);
      progressTrackingInterval = null;
    }
  });
  
  // Track position when user pauses (save progress)
  videoPlayer.addEventListener('pause', () => {
    trackWatchProgress(videoId, token, {
      watchDurationSeconds: Math.floor(videoPlayer.currentTime),
      lastWatchPosition: Math.floor(videoPlayer.currentTime),
      deviceType: /Mobile|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      platform: 'web',
      videoQuality: '720p',
      playbackSpeed: videoPlayer.playbackRate,
      sessionId: sessionId,
      userAgent: navigator.userAgent,
    });
  });
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (progressTrackingInterval) {
    clearInterval(progressTrackingInterval);
  }
});
```

---

## Features

### ✅ Universal Support
- Works for both library videos (`LibraryVideoLesson`) and school videos (`VideoContent`)
- Automatic video type detection
- Single endpoint for all video types

### ✅ View Tracking
- YouTube-style unique view counting
- Each user counted only once per video
- Automatic view increment on playback

### ✅ Watch History
- Detailed watch history recording
- Completion percentage tracking
- Resume functionality with last watch position
- Rich metadata for analytics

### ✅ Professional Features
- Device and platform tracking
- Video quality tracking
- Playback speed tracking
- Buffering event tracking
- Referrer source tracking
- Session grouping

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Video not found or not published |
| 500 | Internal Server Error - Server error occurred |

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Resume Functionality:** Use `lastWatchPosition` to resume playback
4. **Progress Tracking:** Send watch progress updates periodically (every 10-30 seconds)
5. **Completion Detection:** Check `isCompleted` flag to show completion badges
6. **Error Handling:** Display user-friendly error messages via toasters
7. **Video Type:** Use `videoType` field to handle different video structures

---

**Last Updated:** January 20, 2026

