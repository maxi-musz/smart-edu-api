# Assessment Notifications Service

This service handles sending push notifications and emails to students when assessments are published or unpublished.

## Overview

The `AssessmentNotificationsService` is responsible for:
- Finding all students enrolled in classes that have a specific subject
- Sending push notifications to their registered devices
- Sending email notifications to their email addresses

## Usage

### In Assessment Service

```typescript
// When publishing an assessment
await this.assessmentNotificationsService.sendAssessmentPublishedNotifications(quiz, schoolId);

// When unpublishing an assessment
await this.assessmentNotificationsService.sendAssessmentUnpublishedNotifications(quiz, schoolId);
```

## Methods

### `sendAssessmentPublishedNotifications(quiz, schoolId)`

Sends notifications when an assessment is published:
- Finds all classes with the assessment's subject
- Finds all active students in those classes
- Sends push notifications via Expo Push Notification service
- Sends email notifications via SMTP

### `sendAssessmentUnpublishedNotifications(quiz, schoolId)`

Sends notifications when an assessment is unpublished:
- Same process as published notifications
- Different notification content (unpublished message)

## Dependencies

- `PrismaService` - Database access
- `PushNotificationsService` - Core push notification functionality
- Email service functions from `src/common/mailer/send-assessment-notifications`

## Notification Flow

1. Get assessment's subject ID
2. Find current academic session
3. Find all classes with that subject
4. Find all active students in those classes
5. Send push notifications to registered devices
6. Send email notifications to student emails

