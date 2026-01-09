# Migration Guide: Unique Video Views (YouTube-Style)

## Overview
This migration adds unique view tracking for library videos, ensuring each user is counted only once per video (like YouTube).

## Changes Made

### 1. Database Schema Changes

**New Table: `LibraryVideoView`**
```prisma
model LibraryVideoView {
  id       String   @id @default(cuid())
  videoId  String
  userId   String   // User.id or LibraryResourceUser.id who viewed
  viewedAt DateTime @default(now())

  video LibraryVideoLesson @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([videoId, userId])  // Ensures one view per user per video
  @@index([videoId])
  @@index([userId])
  @@index([viewedAt])
}
```

**Updated Model: `LibraryVideoLesson`**
- Added relation: `videoViews LibraryVideoView[]`

### 2. Service Logic Update

**File:** `src/library/content/content.service.ts`

**Method:** `getVideoForPlayback()`

**Changes:**
- Checks if user has already viewed the video
- Only increments view count for new unique views
- Records view in `LibraryVideoView` table
- Returns `hasViewedBefore` flag in response

## Migration Steps

### Step 1: Run Prisma Migration

```bash
# Generate migration
npx prisma migrate dev --name add_unique_video_views

# Or for production
npx prisma migrate deploy
```

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 3: Restart Application

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## How It Works

### Before (Non-Unique Views)
```typescript
// Every API call incremented views
GET /library/content/video/{videoId}/play
→ views++  (even if same user watches again)
```

### After (Unique Views - YouTube Style)
```typescript
// First time user watches
GET /library/content/video/{videoId}/play
→ Check LibraryVideoView table
→ No record found
→ views++ AND create LibraryVideoView record
→ Response: { hasViewedBefore: false, views: 101 }

// Same user watches again
GET /library/content/video/{videoId}/play
→ Check LibraryVideoView table
→ Record found! 
→ views unchanged (no increment)
→ Response: { hasViewedBefore: true, views: 101 }
```

## API Response Changes

### New Response Field: `hasViewedBefore`

```json
{
  "success": true,
  "message": "Video retrieved successfully",
  "data": {
    "id": "video_123",
    "title": "Introduction to Algebra",
    "videoUrl": "https://...",
    "views": 150,
    "hasViewedBefore": false,  // ← NEW FIELD
    // ... other fields
  }
}
```

**Usage in Frontend:**
```javascript
const response = await fetch('/library/content/video/video_123/play');
const { data } = await response.json();

if (data.hasViewedBefore) {
  console.log('You have watched this before');
} else {
  console.log('First time watching! View counted.');
}
```

## Benefits

✅ **Unique Views** - Each user counted only once per video  
✅ **Like YouTube** - Industry-standard view counting  
✅ **View History** - Track when users watched videos  
✅ **Analytics Ready** - Can query who viewed what and when  
✅ **Performance** - Unique constraint prevents duplicates at DB level  
✅ **User Experience** - Frontend can show "watched" badges  

## Analytics Queries

### Get total unique viewers for a video
```sql
SELECT COUNT(DISTINCT userId) as unique_viewers
FROM "LibraryVideoView"
WHERE "videoId" = 'video_123';
```

### Get videos a user has watched
```sql
SELECT v.*, lv."viewedAt"
FROM "LibraryVideoView" lv
JOIN "LibraryVideoLesson" v ON v.id = lv."videoId"
WHERE lv."userId" = 'user_123'
ORDER BY lv."viewedAt" DESC;
```

### Get most viewed videos (unique views)
```sql
SELECT v.id, v.title, COUNT(lv.id) as unique_views
FROM "LibraryVideoLesson" v
LEFT JOIN "LibraryVideoView" lv ON lv."videoId" = v.id
GROUP BY v.id, v.title
ORDER BY unique_views DESC
LIMIT 10;
```

## Backward Compatibility

### Existing Views Count
- All existing view counts remain unchanged
- New views are tracked uniquely going forward
- No data loss or migration of existing counts

### Frontend Compatibility
- Old frontends will still work (no breaking changes)
- New `hasViewedBefore` field is optional
- Frontends can ignore it if not needed

## Testing

### Test Unique View Logic

```bash
# Test 1: First view (should increment)
curl -X GET http://localhost:3000/api/v1/library/content/video/{videoId}/play \
  -H "Authorization: Bearer {token}"
# Expected: views incremented, hasViewedBefore: false

# Test 2: Second view (should NOT increment)
curl -X GET http://localhost:3000/api/v1/library/content/video/{videoId}/play \
  -H "Authorization: Bearer {token}"
# Expected: views unchanged, hasViewedBefore: true

# Test 3: Different user (should increment)
curl -X GET http://localhost:3000/api/v1/library/content/video/{videoId}/play \
  -H "Authorization: Bearer {different_token}"
# Expected: views incremented, hasViewedBefore: false
```

## Rollback (If Needed)

If you need to rollback:

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back {migration_name}

# Manually drop table (if needed)
DROP TABLE "LibraryVideoView";

# Revert code changes in content.service.ts
```

## Logs to Watch

**New Unique View:**
```
✅ New unique view recorded for video: Introduction to Algebra by user: user_123 (Total views: 151)
```

**Repeat View (Not Counted):**
```
⚠️ User user_123 has already viewed video: Introduction to Algebra (View not counted)
```

---

**Migration Date:** January 9, 2026  
**Status:** ✅ Ready for Production  
**Breaking Changes:** None  
**Requires Downtime:** No

