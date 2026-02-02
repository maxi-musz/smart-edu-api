# Multi-Level Access Control System

A 3-level hierarchical access control system for managing library resource visibility across schools, users, and students.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACCESS CONTROL FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LEVEL 1: Library Owner → Schools                                          │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  Library owners control which schools can see their resources       │  │
│   │  Example: EduContent Ltd grants Adventist School access to 5 subjects│  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│   LEVEL 2: School Owner → Users/Roles/Classes                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  School directors control which users/roles/classes can access      │  │
│   │  Example: Director grants all students access to 3 of those subjects│  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    ↓                                        │
│   LEVEL 3: Teacher → Students                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  Teachers control which students can access specific resources      │  │
│   │  Example: Teacher grants Grade 10A access to only Algebra topic     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Access Check Flow

When a student tries to access a resource:

```
Student clicks on "Algebra Basics" video
           │
           ▼
┌──────────────────────────────────────────┐
│  LEVEL 1: Does library grant school?     │
│  Query: LibraryResourceAccess            │
│  Check: schoolId, resourceType, isActive │
└──────────────────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
   [NO]        [YES]
     │           │
     ▼           ▼
  DENIED   ┌──────────────────────────────────────────┐
           │  LEVEL 2: Does school grant student?     │
           │  Query: SchoolResourceAccess             │
           │  Check: userId OR roleType OR classId    │
           └──────────────────────────────────────────┘
                      │
                ┌─────┴─────┐
                │           │
              [NO]        [YES]
                │           │
                ▼           ▼
             DENIED   ┌──────────────────────────────────────────┐
                      │  LEVEL 3: Teacher restrictions?          │
                      │  Query: TeacherResourceAccess            │
                      │  Check: If exists, student must be in it │
                      └──────────────────────────────────────────┘
                                 │
                           ┌─────┴─────┐
                           │           │
                    [RESTRICTED]   [GRANTED]
                           │           │
                           ▼           ▼
                        DENIED     ACCESS GRANTED
                                   (with access level)
```

---

## Database Models

### New Tables Created

| Table | Purpose |
|-------|---------|
| `LibraryResourceAccess` | Level 1: Library → School grants |
| `SchoolResourceAccess` | Level 2: School → User/Role/Class grants |
| `TeacherResourceAccess` | Level 3: Teacher → Student grants |
| `AccessControlAuditLog` | Audit trail for all changes |

### New Enums

```prisma
enum LibraryResourceType {
  SUBJECT      // Access to subject + all children
  TOPIC        // Access to topic + all children
  VIDEO        // Single video only
  MATERIAL     // Single PDF/material only
  ASSESSMENT   // Single assessment only
  ALL          // Entire platform access
}

enum AccessLevel {
  FULL         // View, interact, download, take assessments
  READ_ONLY    // View only
  LIMITED      // Restricted features
}
```

---

## Resource Inheritance

```
ALL (Platform)
 └── SUBJECT (grants access to subject + everything below)
      └── TOPIC (grants access to topic + everything below)
           ├── VIDEO
           ├── MATERIAL
           └── ASSESSMENT
```

**Example**: Granting SUBJECT access automatically includes all topics, videos, materials, and assessments under that subject.

---

## Access Level Resolution

The **most restrictive** level in the chain wins:

| Library | School | Teacher | Result |
|---------|--------|---------|--------|
| FULL | FULL | FULL | **FULL** |
| FULL | READ_ONLY | FULL | **READ_ONLY** |
| FULL | FULL | LIMITED | **LIMITED** |
| READ_ONLY | FULL | FULL | **READ_ONLY** |

---

## Module Structure

```
src/
├── library-access-control/          # Level 1 endpoints
│   ├── library-access-control.controller.ts
│   ├── library-access-control.service.ts
│   ├── library-access-control.module.ts
│   └── dto/
│       ├── grant-access.dto.ts
│       ├── query-access.dto.ts
│       └── index.ts
│
├── school-access-control/           # Level 2 & 3 endpoints
│   ├── school-access-control.controller.ts
│   ├── school-access-control.service.ts
│   ├── school-access-control.module.ts
│   ├── access-control-helper.service.ts  # Central access checker
│   ├── dto/
│   │   ├── school-grant-access.dto.ts
│   │   ├── school-query-access.dto.ts
│   │   └── index.ts
│   └── teacher/                     # Level 3 sub-module
│       ├── teacher-access-control.controller.ts
│       ├── teacher-access-control.service.ts
│       ├── teacher-access-control.module.ts
│       └── dto/
```

---

## Using the Access Control Helper

The `AccessControlHelperService` is your main tool for checking access in other services:

```typescript
import { AccessControlHelperService } from '../school-access-control/access-control-helper.service';
import { LibraryResourceType } from '../library-access-control/dto';

@Injectable()
export class ExploreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlHelper: AccessControlHelperService,
  ) {}

  // Check single resource
  async getVideo(userId: string, videoId: string) {
    const access = await this.accessControlHelper.checkUserAccess(
      userId,
      LibraryResourceType.VIDEO,
      videoId,
    );

    if (!access.hasAccess) {
      throw new ForbiddenException(access.reason);
    }

    return this.prisma.libraryVideoLesson.findUnique({ where: { id: videoId } });
  }

  // Get all accessible resources (more efficient for lists)
  async getAccessibleSubjects(userId: string) {
    const accessibleIds = await this.accessControlHelper.getUserAccessibleResources(
      userId,
      LibraryResourceType.SUBJECT,
    );

    return this.prisma.librarySubject.findMany({
      where: { id: { in: accessibleIds } },
    });
  }
}
```

---

## Integration Steps

### 1. Import the Module

In `explore.module.ts` or any module that needs access control:

```typescript
import { SchoolAccessControlModule } from '../school-access-control/school-access-control.module';

@Module({
  imports: [
    SchoolAccessControlModule,  // Provides AccessControlHelperService
    // ... other imports
  ],
})
export class ExploreModule {}
```

### 2. Inject and Use

```typescript
constructor(
  private readonly accessControlHelper: AccessControlHelperService,
) {}
```

### 3. Filter Queries

```typescript
// Option A: Check individual resources
const access = await this.accessControlHelper.checkUserAccess(userId, type, id);

// Option B: Get all accessible IDs (better for lists)
const ids = await this.accessControlHelper.getUserAccessibleResources(userId, type);
const resources = await this.prisma.model.findMany({ where: { id: { in: ids } } });
```

---

## Common Scenarios

### Scenario 1: New School Partnership

```typescript
// 1. Library owner grants school access
POST /library-access-control/grant
{
  "schoolId": "adventist_id",
  "resourceType": "SUBJECT",
  "subjectId": "math_id",
  "accessLevel": "FULL"
}

// 2. School director grants all students access
POST /school-access-control/grant
{
  "libraryResourceAccessId": "lib_grant_id",
  "roleType": "student",
  "resourceType": "SUBJECT",
  "accessLevel": "READ_ONLY"
}

// 3. Teacher refines access for their class
POST /school-access-control/teacher/grant
{
  "schoolResourceAccessId": "school_grant_id",
  "classId": "grade_10a_id",
  "resourceType": "TOPIC",
  "topicId": "algebra_id",
  "accessLevel": "FULL"
}
```

### Scenario 2: Time-Limited Trial

```typescript
POST /library-access-control/grant
{
  "schoolId": "school_id",
  "resourceType": "ALL",
  "accessLevel": "FULL",
  "expiresAt": "2026-03-31T23:59:59Z",
  "notes": "3-month trial period"
}
```

### Scenario 3: Bulk Grant to Multiple Schools

```typescript
POST /library-access-control/grant-bulk
{
  "schoolIds": ["school_1", "school_2", "school_3"],
  "resourceType": "SUBJECT",
  "subjectId": "physics_id",
  "accessLevel": "READ_ONLY"
}
```

---

## Best Practices

1. **Grant Broad, Restrict Narrow**: Start with role-based access, use user-specific for exceptions
2. **Use Class-Based Access**: More efficient than individual user grants
3. **Set Expiration Dates**: Align with academic terms
4. **Document Grants**: Use the `notes` field
5. **Audit Regularly**: Check `AccessControlAuditLog` for changes

---

## Troubleshooting

### Student Can't See Resources

Check in order:
1. `LibraryResourceAccess` - Does school have access?
2. `SchoolResourceAccess` - Does student/role/class have access?
3. `TeacherResourceAccess` - Any teacher restrictions?
4. Check `expiresAt` - Is access expired?
5. Check `isActive` - Is access active?

### Debug with Helper

```typescript
const access = await accessControlHelper.checkUserAccess(userId, type, resourceId);
console.log('Has Access:', access.hasAccess);
console.log('Reason:', access.reason);
console.log('Grant Path:', access.grantPath);
// ['library_granted', 'school_granted', 'teacher_granted'] = Access OK
// ['library_granted', 'school_denied'] = School didn't grant
// ['library_denied'] = Library didn't grant school
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `library-access-control.service.ts` | Library owner grant management |
| `school-access-control.service.ts` | School owner grant management |
| `teacher-access-control.service.ts` | Teacher grant management |
| `access-control-helper.service.ts` | Central access checking utility |
