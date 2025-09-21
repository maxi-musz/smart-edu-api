# User Profile Endpoint Documentation

## Overview
The user profile endpoint provides comprehensive user data including personal information, academic details, settings, and support information.

## Endpoint Details

### GET /api/v1/user/profile

**Description**: Retrieve complete user profile data for the authenticated user.

**Authentication**: JWT Bearer token required

**Tags**: User Profile

## Request

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Path Parameters
None

### Query Parameters
None

### Request Body
None

## Response

### Success Response (200 OK)

**Description**: Profile data retrieved successfully

**Content-Type**: `application/json`

**Schema**: See `response-schemas.md` for detailed schema

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch profile data",
  "statusCode": 500
}
```

## Response Structure

The response contains four main sections:

1. **general_info**: Personal and basic information
2. **academic_info**: Academic performance and subjects
3. **settings**: User preferences and app settings
4. **support_info**: Help and support information

## Data Sources

- **User Data**: From `User` and `Student` tables
- **Academic Data**: From `Class`, `Subject`, `AssessmentAttempt` tables
- **Performance Metrics**: Calculated from assessment attempts
- **Settings**: Default values (can be made configurable)

## Notes

- All timestamps are in ISO 8601 format
- Phone numbers follow international format
- Image URLs are absolute URLs
- Performance metrics are calculated in real-time
- Some fields may contain mock data (noted in code comments)
