# Library Resources API Integration Guide

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Get Resources Dashboard

**Endpoint:** `GET /api/v1/library/resources/getresourcesdashboard`

### Description
Retrieves comprehensive resources dashboard data for the authenticated library user's platform. Returns all available library classes, statistics, and a breakdown of all library resources (videos, materials, subjects, topics) for the user's platform.

### Request
No request body required. Only requires authentication token.

### Success Response (200)

```json
{
  "success": true,
  "message": "Resources dashboard retrieved successfully",
  "data": {
    "platform": {
      "id": "platform_123",
      "name": "Access Study",
      "slug": "smart-edu-global-library",
      "status": "active",
      "videosCount": 500,
      "materialsCount": 300
    },
    "statistics": {
      "overview": {
        "totalClasses": 5,
        "totalSubjects": 25,
        "totalTopics": 150,
        "totalVideos": 500,
        "totalMaterials": 300
      },
      "videos": {
        "total": 500,
        "published": 450,
        "draft": 30,
        "archived": 20
      },
      "materials": {
        "total": 300,
        "published": 280,
        "draft": 15,
        "archived": 5,
        "byType": {
          "PDF": 200,
          "DOC": 50,
          "PPT": 30,
          "VIDEO": 10,
          "NOTE": 5,
          "LINK": 3,
          "OTHER": 2
        }
      },
      "contributors": {
        "totalUniqueUploaders": 15,
        "videoUploaders": 10,
        "materialUploaders": 8
      }
    },
    "libraryClasses": [
      {
        "id": "class_123",
        "name": "JSS 1",
        "order": 1,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "subjectsCount": 5,
        "videosCount": 100,
        "materialsCount": 60,
        "subjects": [
          {
            "id": "subject_123",
            "name": "Mathematics",
            "code": "MATH",
            "color": "#FF5733",
            "platformId": "platform_123",
            "classId": "class_123",
            "createdAt": "2025-01-01T00:00:00.000Z",
            "videosCount": 20,
            "materialsCount": 12
          }
        ]
      },
      {
        "classId": "class_456",
        "className": "JSS 2",
        "subjectsCount": 5,
        "topicsCount": 30,
        "videosCount": 100,
        "materialsCount": 60
      }
    ],
    "resources": {
      "videos": [
        {
          "id": "video_123",
          "title": "Introduction to Variables",
          "description": "Learn about variables and their usage",
          "videoUrl": "https://bucket.s3.region.amazonaws.com/library/videos/.../video_123.mp4",
          "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/video-thumbnails/.../thumbnail_123.jpg",
          "durationSeconds": 1800,
          "sizeBytes": 52428800,
          "views": 1250,
          "order": 1,
          "status": "published",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "updatedAt": "2025-01-01T00:00:00.000Z",
          "platform": {
            "id": "platform_123",
            "name": "Access Study",
            "slug": "smart-edu-global-library"
          },
          "subject": {
            "id": "subject_123",
            "name": "Mathematics",
            "code": "MATH",
            "classId": "class_123"
          },
          "topic": {
            "id": "topic_123",
            "title": "Introduction to Variables"
          },
          "uploadedBy": {
            "id": "user_123",
            "email": "uploader@example.com",
            "first_name": "John",
            "last_name": "Doe"
          }
        }
      ],
      "materials": [
        {
          "id": "material_123",
          "title": "Variables Study Guide",
          "description": "Comprehensive guide to variables",
          "materialType": "PDF",
          "url": "https://bucket.s3.region.amazonaws.com/library/materials/.../material_123.pdf",
          "sizeBytes": 2048000,
          "pageCount": 25,
          "order": 1,
          "status": "published",
          "createdAt": "2025-01-01T00:00:00.000Z",
          "updatedAt": "2025-01-01T00:00:00.000Z",
          "uploadedBy": {
            "id": "user_123",
            "email": "uploader@example.com",
            "first_name": "John",
            "last_name": "Doe"
          }
        }
      ]
    },
    "subjects": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "platformId": "platform_123",
        "classId": "class_123",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "topics": [
      {
        "id": "topic_123",
        "title": "Introduction to Variables",
        "description": "Learn about variables",
        "platformId": "platform_123",
        "subjectId": "subject_123",
        "chapterId": "chapter_123",
        "order": 1,
        "is_active": true,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Response Structure Breakdown

#### Platform Object
- `id`: Platform ID
- `name`: Platform name
- `slug`: Platform slug
- `status`: Platform status
- `videosCount`: Total number of videos in the platform
- `materialsCount`: Total number of materials in the platform

#### Statistics Object
- `overview`: Summary statistics
  - `totalClasses`: Total library classes
  - `totalSubjects`: Total subjects in user's platform
  - `totalTopics`: Total topics in user's platform
  - `totalVideos`: Total videos in user's platform
  - `totalMaterials`: Total materials in user's platform
- `videos`: Video statistics
  - `total`: Total videos
  - `published`: Published videos count
  - `draft`: Draft videos count
  - `archived`: Archived videos count
- `materials`: Material statistics
  - `total`: Total materials
  - `published`: Published materials count
  - `draft`: Draft materials count
  - `archived`: Archived materials count
  - `byType`: Breakdown by material type (PDF, DOC, PPT, VIDEO, NOTE, LINK, OTHER)
- `contributors`: Contributor statistics
  - `totalUniqueUploaders`: Total unique users who uploaded content
  - `videoUploaders`: Number of unique video uploaders
  - `materialUploaders`: Number of unique material uploaders

#### Library Classes Array
Each class object contains:
- `id`: Library class ID
- `name`: Class name (e.g., "JSS 1")
- `order`: Class order
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `subjectsCount`: Number of subjects in this class for user's platform
- `videosCount`: Number of videos in this class for user's platform
- `materialsCount`: Number of materials in this class for user's platform
- `subjects[]`: Array of subjects in this class with counts
  - Each subject includes: `id`, `name`, `code`, `color`, `platformId`, `classId`, `createdAt`, `videosCount`, `materialsCount`

#### Resources Object
- `videos[]`: Array of all videos in user's platform with full details
- `materials[]`: Array of all materials in user's platform with full details

#### Subjects Array
Array of all subjects in user's platform with basic information.

#### Topics Array
Array of all topics in user's platform with basic information.

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 2. Get Resources by Class

**Endpoint:** `GET /api/v1/library/resources/getresourcesbyclass/:classId`

### Description
Retrieves comprehensive resources for a specific library class within the authenticated user's platform. Returns all subjects, chapters, topics, and their associated videos and materials for the specified class.

### Request Parameters
- `classId` (path parameter): The ID of the library class

### Example Request
```
GET /api/v1/library/resources/getresourcesbyclass/class_123
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Class resources retrieved successfully",
  "data": {
    "platform": {
      "id": "platform_123",
      "name": "Access Study",
      "slug": "smart-edu-global-library"
    },
    "class": {
      "id": "class_123",
      "name": "JSS 1",
      "order": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "subjects": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "color": "#FF5733",
        "description": "Mathematics subject description",
        "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/subjects/thumbnails/1234567890_math.jpg",
        "thumbnailKey": "library/subjects/thumbnails/1234567890_math.jpg",
        "platformId": "platform_123",
        "classId": "class_123",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "chapters": [
          {
            "id": "chapter_123",
            "title": "Chapter 1: Algebra Basics",
            "description": "Introduction to algebra",
            "order": 1,
            "is_active": true,
            "createdAt": "2025-01-01T00:00:00.000Z",
            "updatedAt": "2025-01-01T00:00:00.000Z",
            "topics": [
              {
                "id": "topic_123",
                "title": "Introduction to Variables",
                "description": "Learn about variables",
                "order": 1,
                "is_active": true,
                "createdAt": "2025-01-01T00:00:00.000Z",
                "updatedAt": "2025-01-01T00:00:00.000Z",
                "materials": [
                  {
                    "id": "material_123",
                    "title": "Variables Study Guide",
                    "description": "Comprehensive guide",
                    "materialType": "PDF",
                    "url": "https://bucket.s3.region.amazonaws.com/library/materials/.../material_123.pdf",
                    "sizeBytes": 2048000,
                    "pageCount": 25,
                    "order": 1,
                    "status": "published",
                    "createdAt": "2025-01-01T00:00:00.000Z",
                    "updatedAt": "2025-01-01T00:00:00.000Z",
                    "uploadedBy": {
                      "id": "user_123",
                      "email": "uploader@example.com",
                      "first_name": "John",
                      "last_name": "Doe"
                    }
                  }
                ],
                "videos": [
                  {
                    "id": "video_123",
                    "title": "Introduction to Variables",
                    "description": "Video lesson on variables",
                    "videoUrl": "https://bucket.s3.region.amazonaws.com/library/videos/.../video_123.mp4",
                    "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/video-thumbnails/.../thumbnail_123.jpg",
                    "durationSeconds": 1800,
                    "sizeBytes": 52428800,
                    "views": 1250,
                    "order": 1,
                    "status": "published",
                    "createdAt": "2025-01-01T00:00:00.000Z",
                    "updatedAt": "2025-01-01T00:00:00.000Z",
                    "uploadedBy": {
                      "id": "user_123",
                      "email": "uploader@example.com",
                      "first_name": "John",
                      "last_name": "Doe"
                    }
                  }
                ],
                "materialsCount": 1,
                "videosCount": 1
              }
            ],
            "topicsCount": 1,
            "totalMaterials": 1,
            "totalVideos": 1
          }
        ],
        "chaptersCount": 1,
        "topicsCount": 1,
        "totalMaterials": 1,
        "totalVideos": 1
      }
    ],
    "statistics": {
      "totalSubjects": 1,
      "totalChapters": 1,
      "totalTopics": 1,
      "totalMaterials": 1,
      "totalVideos": 1
    }
  }
}
```

### Response Structure Breakdown

#### Platform Object
- `id`: Platform ID
- `name`: Platform name
- `slug`: Platform slug

#### Class Object
- `id`: Class ID
- `name`: Class name
- `order`: Class order
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

#### Subjects Array
Each subject contains:
- `id`: Subject ID
- `name`: Subject name
- `code`: Subject code
- `color`: Subject color (hex)
- `description`: Subject description
- `thumbnailUrl`: Subject thumbnail URL
- `thumbnailKey`: Subject thumbnail S3 key
- `platformId`: Platform ID
- `classId`: Class ID
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `chapters[]`: Array of chapters (see below)
- `chaptersCount`: Number of chapters
- `topicsCount`: Total number of topics across all chapters
- `totalMaterials`: Total number of materials across all topics
- `totalVideos`: Total number of videos across all topics

#### Chapters Array (within Subject)
Each chapter contains:
- `id`: Chapter ID
- `title`: Chapter title
- `description`: Chapter description
- `order`: Chapter order
- `is_active`: Whether chapter is active
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `topics[]`: Array of topics (see below)
- `topicsCount`: Number of topics in this chapter
- `totalMaterials`: Total materials in this chapter
- `totalVideos`: Total videos in this chapter

#### Topics Array (within Chapter)
Each topic contains:
- `id`: Topic ID
- `title`: Topic title
- `description`: Topic description
- `order`: Topic order
- `is_active`: Whether topic is active
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `materials[]`: Array of materials (see below)
- `videos[]`: Array of videos (see below)
- `materialsCount`: Number of materials
- `videosCount`: Number of videos

#### Materials Array (within Topic)
Each material contains:
- `id`: Material ID
- `title`: Material title
- `description`: Material description
- `materialType`: Type (PDF, DOC, PPT, etc.)
- `url`: Material file URL
- `sizeBytes`: File size in bytes
- `pageCount`: Number of pages (if applicable)
- `order`: Material order
- `status`: Material status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `uploadedBy`: Uploader information

#### Videos Array (within Topic)
Each video contains:
- `id`: Video ID
- `title`: Video title
- `description`: Video description
- `videoUrl`: Video file URL
- `thumbnailUrl`: Thumbnail image URL
- `durationSeconds`: Video duration in seconds
- `sizeBytes`: File size in bytes
- `views`: Number of views
- `order`: Video order
- `status`: Video status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `uploadedBy`: Uploader information

#### Statistics Object
- `totalSubjects`: Total number of subjects in the class
- `totalChapters`: Total number of chapters across all subjects
- `totalTopics`: Total number of topics across all chapters
- `totalMaterials`: Total number of materials across all topics
- `totalVideos`: Total number of videos across all topics

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, platform not found, or class not found
- **500**: Internal server error

---

## Notes

### Platform Scoping
- All resources are scoped to the authenticated user's platform
- Only resources belonging to the user's platform are returned
- Cross-platform access is not allowed

### Ordering
- Classes: Ordered by `order` (ascending)
- Subjects: Ordered by `name` (ascending)
- Chapters: Ordered by `order` (ascending)
- Topics: Ordered by `order` (ascending)
- Videos: Ordered by `order` (ascending)
- Materials: Ordered by `order` (ascending)

### Status Filtering
- Only published videos and materials are included in the response
- Inactive chapters and topics are still included but marked with `is_active: false`

### Performance Considerations
- The `getResourcesByClass` endpoint performs nested queries and may take longer for classes with many subjects/chapters/topics
- Consider implementing pagination for very large datasets in future versions

