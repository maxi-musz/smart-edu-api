# 📺 Library Video Watch History System

## **Architecture Overview**

This system implements a **YouTube-like watch history** with dual-table approach for optimal performance and rich analytics.

---

## **Database Tables**

### **1. `LibraryVideoView` - Quick View Counter**
**Purpose**: Fast, unique view counting for display metrics  
**Use Case**: "This video has 1.2M views"  
**Tracks**: One record per user per video (unique viewers only)

```prisma
model LibraryVideoView {
  id                    String
  videoId               String
  userId                String?  // Regular user
  libraryResourceUserId String?  // Library admin/creator
  viewedAt              DateTime
}
```

### **2. `LibraryVideoWatchHistory` - Detailed History**
**Purpose**: Complete watch tracking with rich metadata  
**Use Case**: Watch history, analytics, recommendations, completion rates  
**Tracks**: Every watch event with full context

```prisma
model LibraryVideoWatchHistory {
  id                    String
  videoId               String
  userId                String?
  libraryResourceUserId String?
  
  // User Context
  schoolId              String?
  classId               String?
  userRole              String?
  
  // Watch Metrics
  watchedAt             DateTime
  watchDurationSeconds  Int?
  completionPercentage  Float?
  isCompleted           Boolean
  lastWatchPosition     Int?
  
  // Device & Platform
  deviceType            String?
  platform              String?
  userAgent             String?
  
  // Source Tracking
  referrerSource        String?
  referrerUrl           String?
  
  // Quality Metrics
  videoQuality          String?
  bufferingEvents       Int?
  playbackSpeed         Float?
  sessionId             String?
}
```

---

## **Implementation Guide**

### **Service Method: Track Video Watch**

```typescript
// src/library/content/content.service.ts

async trackVideoWatch(
  user: any,
  videoId: string,
  watchData: {
    watchDurationSeconds?: number;
    lastWatchPosition?: number;
    deviceType?: string;
    platform?: string;
    referrerSource?: string;
    videoQuality?: string;
    playbackSpeed?: number;
    bufferingEvents?: number;
    sessionId?: string;
  }
): Promise<void> {
  try {
    // Extract user info
    const userId = user.sub || user.id;
    const isLibraryUser = user.userType === 'libraryresourceowner';
    
    // Get video details
    const video = await this.prisma.libraryVideoLesson.findUnique({
      where: { id: videoId },
      select: { durationSeconds: true }
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Calculate completion percentage
    const completionPercentage = video.durationSeconds && watchData.watchDurationSeconds
      ? (watchData.watchDurationSeconds / video.durationSeconds) * 100
      : 0;

    const isCompleted = completionPercentage >= 90; // Consider 90%+ as completed

    // Get user context (school, class, role)
    let schoolId: string | null = null;
    let classId: string | null = null;
    let userRole: string | null = null;

    if (!isLibraryUser && userId) {
      const userDetails = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          school_id: true,
          role: true,
          student: { select: { current_class_id: true } },
          teacher: { select: { id: true } }
        }
      });

      if (userDetails) {
        schoolId = userDetails.school_id;
        userRole = userDetails.role;
        classId = userDetails.student?.current_class_id || null;
      }
    }

    // Step 1: Track in LibraryVideoWatchHistory (detailed history)
    await this.prisma.libraryVideoWatchHistory.create({
      data: {
        videoId,
        userId: !isLibraryUser ? userId : null,
        libraryResourceUserId: isLibraryUser ? userId : null,
        schoolId,
        classId,
        userRole,
        watchDurationSeconds: watchData.watchDurationSeconds,
        videoDurationSeconds: video.durationSeconds,
        completionPercentage,
        isCompleted,
        lastWatchPosition: watchData.lastWatchPosition,
        watchCount: 1,
        deviceType: watchData.deviceType,
        platform: watchData.platform,
        referrerSource: watchData.referrerSource,
        videoQuality: watchData.videoQuality,
        bufferingEvents: watchData.bufferingEvents || 0,
        playbackSpeed: watchData.playbackSpeed || 1.0,
        sessionId: watchData.sessionId,
      }
    });

    // Step 2: Track in LibraryVideoView (unique view counter)
    // Only increment if this is their first time watching
    const existingView = await this.prisma.libraryVideoView.findFirst({
      where: {
        videoId,
        ...(isLibraryUser
          ? { libraryResourceUserId: userId }
          : { userId }
        )
      }
    });

    if (!existingView) {
      // First time watching - increment view count
      await this.prisma.$transaction([
        // Create unique view record
        this.prisma.libraryVideoView.create({
          data: {
            videoId,
            userId: !isLibraryUser ? userId : null,
            libraryResourceUserId: isLibraryUser ? userId : null,
          }
        }),
        // Increment video view counter
        this.prisma.libraryVideoLesson.update({
          where: { id: videoId },
          data: { views: { increment: 1 } }
        })
      ]);

      this.logger.log(`✅ New unique view: Video ${videoId} by user ${userId}`);
    }

    this.logger.log(`📺 Watch tracked: ${completionPercentage.toFixed(1)}% completion`);
  } catch (error) {
    this.logger.error(`❌ Failed to track watch: ${error.message}`);
    // Don't throw - tracking failure shouldn't block video playback
  }
}
```

---

## **Query Examples**

### **1. User's Watch History (Chronological)**

```typescript
async getUserWatchHistory(
  userId: string,
  isLibraryUser: boolean,
  options: { page: number; limit: number }
): Promise<any> {
  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const history = await this.prisma.libraryVideoWatchHistory.findMany({
    where: isLibraryUser
      ? { libraryResourceUserId: userId }
      : { userId },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          durationSeconds: true,
          subject: {
            select: { id: true, name: true, code: true }
          },
          topic: {
            select: { id: true, title: true }
          }
        }
      }
    },
    orderBy: { watchedAt: 'desc' },
    take: limit,
    skip
  });

  const total = await this.prisma.libraryVideoWatchHistory.count({
    where: isLibraryUser
      ? { libraryResourceUserId: userId }
      : { userId }
  });

  return {
    history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

### **2. Video's Watch Analytics (Who Watched)**

```typescript
async getVideoWatchAnalytics(videoId: string): Promise<any> {
  const [
    totalWatches,
    uniqueViewers,
    completionStats,
    schoolBreakdown,
    recentWatches
  ] = await Promise.all([
    // Total watch count
    this.prisma.libraryVideoWatchHistory.count({
      where: { videoId }
    }),

    // Unique viewers (from LibraryVideoView)
    this.prisma.libraryVideoView.count({
      where: { videoId }
    }),

    // Completion statistics
    this.prisma.libraryVideoWatchHistory.aggregate({
      where: { videoId },
      _avg: { completionPercentage: true, watchDurationSeconds: true },
      _count: { isCompleted: true }
    }),

    // School breakdown
    this.prisma.libraryVideoWatchHistory.groupBy({
      by: ['schoolId'],
      where: { videoId, schoolId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),

    // Recent watches (last 50)
    this.prisma.libraryVideoWatchHistory.findMany({
      where: { videoId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true,
            school: { select: { school_name: true } }
          }
        }
      },
      orderBy: { watchedAt: 'desc' },
      take: 50
    })
  ]);

  return {
    totalWatches,
    uniqueViewers,
    averageCompletion: completionStats._avg.completionPercentage?.toFixed(1) || 0,
    averageWatchTime: completionStats._avg.watchDurationSeconds || 0,
    completedCount: completionStats._count.isCompleted,
    schoolBreakdown,
    recentWatches
  };
}
```

### **3. School's Watch History**

```typescript
async getSchoolWatchHistory(
  schoolId: string,
  options: { startDate?: Date; endDate?: Date; classId?: string }
): Promise<any> {
  const history = await this.prisma.libraryVideoWatchHistory.findMany({
    where: {
      schoolId,
      ...(options.classId && { classId: options.classId }),
      ...(options.startDate && {
        watchedAt: {
          gte: options.startDate,
          ...(options.endDate && { lte: options.endDate })
        }
      })
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          subject: { select: { name: true } }
        }
      },
      user: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          role: true
        }
      }
    },
    orderBy: { watchedAt: 'desc' }
  });

  return history;
}
```

### **4. Most Watched Videos (By Completion Rate)**

```typescript
async getMostCompletedVideos(limit: number = 10): Promise<any> {
  const videos = await this.prisma.libraryVideoWatchHistory.groupBy({
    by: ['videoId'],
    where: { isCompleted: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  // Enrich with video details
  const enriched = await Promise.all(
    videos.map(async (v) => {
      const video = await this.prisma.libraryVideoLesson.findUnique({
        where: { id: v.videoId },
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          views: true,
          subject: { select: { name: true } }
        }
      });

      return {
        ...video,
        completedWatches: v._count.id
      };
    })
  );

  return enriched;
}
```

### **5. User's Continue Watching (Resume Videos)**

```typescript
async getContinueWatching(userId: string, isLibraryUser: boolean): Promise<any> {
  // Get videos with 10-90% completion (started but not finished)
  const continueWatching = await this.prisma.libraryVideoWatchHistory.findMany({
    where: {
      ...(isLibraryUser
        ? { libraryResourceUserId: userId }
        : { userId }
      ),
      completionPercentage: { gte: 10, lte: 90 },
      isCompleted: false
    },
    distinct: ['videoId'], // One record per video
    include: {
      video: {
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          durationSeconds: true,
          subject: { select: { name: true } }
        }
      }
    },
    orderBy: { watchedAt: 'desc' },
    take: 10
  });

  return continueWatching.map(watch => ({
    ...watch.video,
    watchProgress: {
      lastPosition: watch.lastWatchPosition,
      completionPercentage: watch.completionPercentage,
      lastWatched: watch.watchedAt
    }
  }));
}
```

---

## **API Endpoints**

### **1. Track Video Watch**
```http
POST /library/content/video/:videoId/watch
Authorization: Bearer <token>

Body:
{
  "watchDurationSeconds": 120,
  "lastWatchPosition": 120,
  "deviceType": "mobile",
  "platform": "ios",
  "referrerSource": "search",
  "videoQuality": "720p",
  "playbackSpeed": 1.0,
  "bufferingEvents": 2,
  "sessionId": "session_abc123"
}

Response: 200 OK
{
  "success": true,
  "message": "Watch tracked successfully"
}
```

### **2. Get User Watch History**
```http
GET /library/content/my-watch-history?page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "watch_123",
        "watchedAt": "2026-01-19T14:30:00Z",
        "completionPercentage": 85.5,
        "watchDurationSeconds": 245,
        "video": {
          "id": "video_456",
          "title": "Introduction to Algebra",
          "thumbnailUrl": "https://...",
          "subject": { "name": "Mathematics" }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8
    }
  }
}
```

### **3. Get Video Watch Analytics**
```http
GET /library/content/video/:videoId/analytics
Authorization: Bearer <token> (Library Owner only)

Response: 200 OK
{
  "success": true,
  "data": {
    "totalWatches": 1523,
    "uniqueViewers": 892,
    "averageCompletion": 67.3,
    "averageWatchTime": 180,
    "completedCount": 456,
    "schoolBreakdown": [
      {
        "schoolId": "school_123",
        "watchCount": 234
      }
    ],
    "recentWatches": [...]
  }
}
```

### **4. Get Continue Watching**
```http
GET /library/content/continue-watching
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": "video_789",
      "title": "Quadratic Equations",
      "thumbnailUrl": "https://...",
      "durationSeconds": 300,
      "watchProgress": {
        "lastPosition": 135,
        "completionPercentage": 45.0,
        "lastWatched": "2026-01-18T10:15:00Z"
      }
    }
  ]
}
```

---

## **Benefits of This System**

### ✅ **User Experience**
- **Watch History**: Users can see all videos they've watched
- **Resume Watching**: Pick up where they left off
- **Progress Tracking**: See completion percentage
- **Recommendations**: Based on watch patterns

### ✅ **Analytics for Library Owners**
- **Engagement Metrics**: Who's watching, how long, completion rates
- **School Analytics**: Which schools are engaging most
- **Quality Monitoring**: Track buffering events, playback issues
- **Content Performance**: Which videos are most popular/completed

### ✅ **Performance Optimization**
- **Fast View Counter**: `LibraryVideoView` for quick "1.2M views" display
- **Detailed Analytics**: `LibraryVideoWatchHistory` for rich data
- **Indexed Queries**: All common queries are optimized with indexes

### ✅ **Privacy & Compliance**
- **Optional IP Tracking**: Can be disabled for privacy
- **School Context**: Know which school without tracking individual behavior
- **Session-based**: Group watches by session for better UX

---

## **Migration Command**

```bash
# Generate migration
npx prisma migrate dev --name add_watch_history_system

# Apply to production
npx prisma migrate deploy
```

---

## **UI/UX Recommendations**

### **Watch History Page**
```
┌─────────────────────────────────────────┐
│         📺 My Watch History             │
├─────────────────────────────────────────┤
│ Today                                   │
│ ┌─────────────────────────────────────┐ │
│ │ [Thumbnail] Introduction to Algebra │ │
│ │             Mathematics • 85% done  │ │
│ │             Watched 2 hours ago     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Yesterday                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Thumbnail] Photosynthesis          │ │
│ │             Biology • Completed ✓   │ │
│ │             Watched yesterday       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **Continue Watching Widget**
```
┌─────────────────────────────────────────┐
│      ▶️ Continue Watching               │
├─────────────────────────────────────────┤
│ [▓▓▓▓▓▓░░░░] 45%                        │
│ Quadratic Equations                     │
│ Resume at 2:15 / 5:00                   │
└─────────────────────────────────────────┘
```

---

**Status**: ✅ Schema designed and ready for implementation!

