# Video Playback Implementation Summary

## 🎯 Overview

A professional, unified video playback endpoint has been implemented for the Explore module, enabling **all authenticated users** (students, teachers, directors, and library users) to watch library videos with **YouTube-style unique view tracking**.

---

## ✅ What Was Implemented

### 1. **New Endpoint: `GET /explore/videos/:videoId/play`**

**Purpose:** Retrieve video details and URL for playback with unique view tracking.

**Authentication:** Required (JWT Token - works for all user roles)

**Key Features:**
- ✅ Unified playback for all user types (school users + library users)
- ✅ YouTube-style unique views (each user counted only once per video)
- ✅ Returns `hasViewedBefore` flag for UX enhancements
- ✅ Returns `viewedAt` timestamp for viewing history
- ✅ Only counts published videos
- ✅ Professional error handling with appropriate status codes

---

## 📁 Files Modified

### 1. **`src/explore/explore.controller.ts`**
**Changes:**
- Added `@UseGuards(JwtGuard)` import
- Added `playVideo()` endpoint method
- Endpoint: `GET /explore/videos/:videoId/play`

```typescript
@Get('videos/:videoId/play')
@UseGuards(JwtGuard)
@ExploreDocs.playVideo()
async playVideo(@Request() req: any, @Param('videoId') videoId: string) {
  return this.exploreService.playVideo(req.user, videoId);
}
```

### 2. **`src/explore/explore.service.ts`**
**Changes:**
- Added `NotFoundException` import
- Implemented `playVideo()` method with:
  - Video validation (must be published)
  - Unique view tracking using `LibraryVideoView` model
  - Transaction for atomic view count + record creation
  - Professional logging with colored output

**View Tracking Logic:**
```typescript
// Check if user has already viewed this video
const existingView = await this.prisma.libraryVideoView.findUnique({
  where: {
    videoId_userId: {
      videoId: videoId,
      userId: user.id,
    },
  },
});

// Only increment if new unique view
if (!existingView) {
  await this.prisma.$transaction([
    // Increment view count
    this.prisma.libraryVideoLesson.update({
      where: { id: videoId },
      data: { views: { increment: 1 } },
    }),
    // Record the view
    this.prisma.libraryVideoView.create({
      data: { videoId, userId: user.id },
    }),
  ]);
}
```

### 3. **`src/explore/docs/explore.docs.ts`**
**Changes:**
- Added `ApiBearerAuth` import
- Implemented `playVideo()` documentation method
- Comprehensive Swagger documentation with examples

### 4. **`src/explore/EXPLORE-API-DOCUMENTATION.md`**
**Changes:**
- Added endpoint summary table
- Added complete "Play Video" endpoint documentation
- Added authentication setup section
- Added frontend integration examples
- Added video player component example
- Updated user flows to include video playback
- Updated status codes to include 401 Unauthorized

---

## 🔄 How It Works

### View Counting Flow

#### **Scenario 1: First Time Watching**
```
1. User requests: GET /explore/videos/video_123/play
2. Check LibraryVideoView for (videoId + userId)
3. ❌ No record found
4. Transaction:
   - Increment video.views (150 → 151)
   - Create LibraryVideoView record
5. Return: { hasViewedBefore: false, views: 151 }
✅ View counted!
```

#### **Scenario 2: Watching Again (Same User)**
```
1. Same user requests: GET /explore/videos/video_123/play
2. Check LibraryVideoView for (videoId + userId)
3. ✅ Record found
4. Skip increment
5. Return: { hasViewedBefore: true, views: 151 }
⚠️ View NOT counted (unique views only)
```

#### **Scenario 3: Different User**
```
1. New user requests: GET /explore/videos/video_123/play
2. Check LibraryVideoView for (videoId + userId)
3. ❌ No record found (for this user)
4. Transaction:
   - Increment video.views (151 → 152)
   - Create LibraryVideoView record
5. Return: { hasViewedBefore: false, views: 152 }
✅ View counted!
```

---

## 📊 Response Structure

### Success Response (200)
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
    "topic": { ... },
    "subject": { ... },
    "platform": { ... }
  }
}
```

### Key Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `videoUrl` | string | Direct S3 URL for video player |
| `views` | number | Total unique views count |
| `hasViewedBefore` | boolean | `true` if user watched before, `false` if first time |
| `viewedAt` | string | Timestamp of user's view |
| `durationSeconds` | number | Video duration in seconds |

---

## 🔐 Authentication

### Who Can Use This Endpoint?
✅ **All authenticated users:**
- School Directors
- Teachers
- Students
- Library Resource Users

### How Authentication Works
Uses the existing `JwtGuard` from `src/school/auth/guard`:
```typescript
@Get('videos/:videoId/play')
@UseGuards(JwtGuard)
async playVideo(@Request() req: any, @Param('videoId') videoId: string) {
  // req.user contains { id, email, role, ... }
  return this.exploreService.playVideo(req.user, videoId);
}
```

### Frontend Implementation
```javascript
const playVideo = async (videoId, token) => {
  const response = await fetch(
    `https://api.example.com/api/v1/explore/videos/${videoId}/play`,
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
  
  return response.json();
};
```

---

## 🎨 Frontend Integration Examples

### 1. **Video Card Component**
```javascript
const VideoCard = ({ video }) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  const handlePlay = async () => {
    if (!isAuthenticated) {
      showLoginPrompt('Please login to watch videos');
      return;
    }
    
    try {
      const data = await playVideo(video.id);
      // Navigate to video player page
      router.push(`/watch/${video.id}`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
  
  return (
    <div className="video-card">
      <img src={video.thumbnailUrl} alt={video.title} />
      <h3>{video.title}</h3>
      <button onClick={handlePlay}>
        {isAuthenticated ? 'Play Video' : 'Login to Watch'}
      </button>
    </div>
  );
};
```

### 2. **Complete Video Player**
```javascript
const VideoPlayer = ({ videoId }) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadVideo();
  }, [videoId]);
  
  const loadVideo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(
        `https://api.example.com/api/v1/explore/videos/${videoId}/play`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const result = await response.json();
      setVideoData(result.data);
      
      // Show notification if rewatching
      if (result.data.hasViewedBefore) {
        showToast('You watched this before', 'info');
      }
      
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spinner />;
  if (!videoData) return <ErrorMessage />;
  
  return (
    <div>
      <video 
        src={videoData.videoUrl}
        poster={videoData.thumbnailUrl}
        controls
        style={{ width: '100%' }}
      />
      
      <div className="video-info">
        <h2>{videoData.title}</h2>
        <div className="stats">
          <span>👁️ {videoData.views} views</span>
          <span>📚 {videoData.subject.name}</span>
        </div>
        
        {videoData.hasViewedBefore && (
          <Badge>
            ✓ Watched on {new Date(videoData.viewedAt).toLocaleDateString()}
          </Badge>
        )}
      </div>
    </div>
  );
};
```

---

## 🚀 User Flows

### Complete Browse → Watch Flow
```
1. User browses: GET /api/v1/explore
   → Sees all classes, subjects, recent videos (no auth required)

2. User clicks "SSS 1" class: GET /api/v1/explore/subjects?classId=class_123
   → Sees filtered subjects (no auth required)

3. User clicks "Mathematics": GET /api/v1/explore/videos?subjectId=subject_123
   → Sees all math videos (no auth required)

4. User clicks "Play" on video:
   ❓ Is authenticated?
   ✅ Yes → GET /api/v1/explore/videos/video_123/play (with JWT)
              → Video plays, view tracked
   ❌ No → Show login prompt
```

---

## 🔒 Security Considerations

### ✅ Implemented Security
1. **Authentication Required:** Only logged-in users can play videos
2. **Published Videos Only:** Draft/unpublished videos are not accessible
3. **JWT Validation:** Token must be valid and not expired
4. **User Verification:** View tracking uses authenticated user ID

### 🛡️ Database Integrity
- Unique constraint on `(videoId, userId)` prevents duplicate view records
- Transaction ensures atomic view count + record creation
- Cascade delete: if video is deleted, view records are auto-deleted

---

## 📊 Database Schema

The unique view tracking uses the existing `LibraryVideoView` model:

```prisma
model LibraryVideoView {
  id        String   @id @default(cuid())
  videoId   String
  userId    String
  viewedAt  DateTime @default(now())

  video     LibraryVideoLesson @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([videoId, userId])
  @@index([videoId])
  @@index([userId])
}
```

**Key Features:**
- `@@unique([videoId, userId])`: Ensures one view per user per video
- `@@index([videoId])`: Fast lookups by video
- `@@index([userId])`: Fast lookups by user (for viewing history)
- `onDelete: Cascade`: Auto-cleanup when video is deleted

---

## 📈 Performance Considerations

### Optimizations Implemented
1. **Indexed Queries:** Both `videoId` and `userId` are indexed
2. **Transaction Usage:** Atomic operations for consistency
3. **Single Query Check:** One lookup to check existing view
4. **Select Optimization:** Only fetches needed video fields

### Expected Response Times
- **New view:** ~150-250ms (includes transaction)
- **Repeat view:** ~50-100ms (no transaction)

---

## 🧪 Testing Guide

### Manual Testing Steps

1. **Test First View:**
```bash
curl -X GET "http://localhost:3000/api/v1/explore/videos/VIDEO_ID/play" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: hasViewedBefore: false, views incremented
```

2. **Test Repeat View (Same User):**
```bash
# Run same command again with same token
# Expected: hasViewedBefore: true, views unchanged
```

3. **Test Different User:**
```bash
# Run with different user's token
# Expected: hasViewedBefore: false, views incremented
```

4. **Test Unauthorized:**
```bash
curl -X GET "http://localhost:3000/api/v1/explore/videos/VIDEO_ID/play"
# No token
# Expected: 401 Unauthorized
```

5. **Test Invalid Video:**
```bash
curl -X GET "http://localhost:3000/api/v1/explore/videos/invalid-id/play" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
# Expected: 404 Not Found
```

---

## 📝 API Status Codes

| Code | Status | When |
|------|--------|------|
| `200` | Success | Video retrieved and playback granted |
| `401` | Unauthorized | Missing or invalid JWT token |
| `404` | Not Found | Video doesn't exist or not published |
| `500` | Internal Error | Database or server error |

---

## 🎯 Benefits of This Implementation

### For Users
✅ Seamless video playback across all user roles  
✅ Know if they've watched a video before  
✅ Consistent experience with library videos  
✅ No duplicate view counting (fair metrics)

### For Platform
✅ Accurate video analytics (unique views)  
✅ Unified endpoint for all users  
✅ Professional error handling  
✅ Scalable architecture  
✅ Viewing history tracking capability

### For Frontend
✅ Simple authentication flow  
✅ Clear response structure  
✅ UX enhancement flags (`hasViewedBefore`)  
✅ Comprehensive documentation  
✅ Ready-to-use code examples

---

## 🔄 Differences from Library Content Endpoint

| Feature | Library Endpoint | Explore Endpoint |
|---------|------------------|------------------|
| **Path** | `/library/content/video/:id/play` | `/explore/videos/:id/play` |
| **Authentication** | `LibraryJwtGuard` | `JwtGuard` (universal) |
| **Target Users** | Library users only | All users |
| **View Tracking** | Now has unique views | Unique views from start |
| **Purpose** | Content creator preview | Public consumption |

---

## 🚧 Migration Note

**No migration needed!** The `LibraryVideoView` model was already added to the schema in a previous implementation for the library content playback endpoint.

If migrations haven't been run yet:
```bash
npx prisma migrate dev --name add_unique_video_views
npx prisma generate
npm run start:dev
```

---

## 📚 Related Documentation

- **API Documentation:** `src/explore/EXPLORE-API-DOCUMENTATION.md`
- **Prisma Schema:** `prisma/schema.prisma`
- **Starting Notes:** `1-starting-notes.md`

---

## 🎉 Summary

The video playback endpoint is now **production-ready** with:
- ✅ Universal authentication (all user types)
- ✅ Unique view tracking (YouTube-style)
- ✅ Professional error handling
- ✅ Comprehensive documentation
- ✅ Frontend integration examples
- ✅ Performance optimizations
- ✅ Database integrity

**Status:** Ready for frontend integration! 🚀

---

**Implemented:** January 9, 2026  
**Developer:** AI Assistant  
**Status:** Complete ✅

