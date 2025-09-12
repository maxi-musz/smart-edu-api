# User Profile Error Responses

## Error Response Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## HTTP Status Codes

### 401 Unauthorized
**Description**: Authentication token is missing, invalid, or expired.

**Response**:
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Common Causes**:
- Missing `Authorization` header
- Invalid JWT token format
- Expired JWT token
- Malformed JWT token

**Resolution**:
- Ensure the `Authorization` header is present
- Verify the JWT token is valid and not expired
- Re-authenticate to get a new token

### 404 Not Found

#### User Not Found
**Description**: The user with the provided ID does not exist in the database.

**Response**:
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

**Common Causes**:
- User ID in JWT token is invalid
- User has been deleted from the database
- JWT token contains incorrect user ID

**Resolution**:
- Verify the user exists in the database
- Check if the JWT token contains the correct user ID
- Re-authenticate if necessary

#### Student Record Not Found
**Description**: The user exists but does not have an associated student record.

**Response**:
```json
{
  "success": false,
  "message": "Student record not found",
  "statusCode": 404
}
```

**Common Causes**:
- User is not a student (e.g., teacher, admin)
- Student record was deleted
- Data inconsistency between User and Student tables

**Resolution**:
- Verify the user has a student role
- Check if student record exists in the database
- Ensure data consistency

#### Student Class Not Found
**Description**: The student's assigned class does not exist.

**Response**:
```json
{
  "success": false,
  "message": "Student class not found",
  "statusCode": 404
}
```

**Common Causes**:
- Student's `current_class_id` is null or invalid
- Class was deleted from the database
- Data inconsistency

**Resolution**:
- Verify the student has an assigned class
- Check if the class exists in the database
- Assign a valid class to the student

### 500 Internal Server Error
**Description**: An unexpected error occurred on the server.

**Response**:
```json
{
  "success": false,
  "message": "Failed to fetch profile data",
  "statusCode": 500
}
```

**Common Causes**:
- Database connection issues
- Server configuration problems
- Unexpected runtime errors
- Memory or resource constraints

**Resolution**:
- Check server logs for detailed error information
- Verify database connectivity
- Restart the application if necessary
- Contact system administrator

## Error Handling Best Practices

### Client-Side Error Handling

```javascript
const fetchUserProfile = async () => {
  try {
    const response = await fetch('/api/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      switch (response.status) {
        case 401:
          // Handle unauthorized - redirect to login
          redirectToLogin();
          break;
        case 404:
          // Handle not found - show error message
          showError(data.message);
          break;
        case 500:
          // Handle server error - show generic error
          showError('Something went wrong. Please try again later.');
          break;
        default:
          showError(data.message);
      }
      return;
    }

    // Success - use the data
    setUserProfile(data.data);
  } catch (error) {
    // Handle network errors
    showError('Network error. Please check your connection.');
  }
};
```

### Server-Side Error Logging

```typescript
// Example from the service
try {
  // ... profile fetching logic
} catch (error) {
  this.logger.error(colors.red(`❌ Error fetching user profile: ${error.message}`));
  return new ApiResponse(false, 'Failed to fetch profile data', null);
}
```

## Debugging Tips

### 1. Check Authentication
- Verify JWT token is valid and not expired
- Ensure the token contains the correct user ID
- Check if the user has the required permissions

### 2. Verify Database State
- Confirm the user exists in the User table
- Check if the user has a corresponding Student record
- Verify the student has an assigned class

### 3. Check Server Logs
- Look for detailed error messages in server logs
- Check for database connection issues
- Verify all required services are running

### 4. Test with Different Users
- Try with different user accounts
- Test with users in different classes
- Verify the issue is not user-specific

## Common Error Scenarios

### Scenario 1: New User Registration
**Issue**: User registers but student record is not created
**Error**: "Student record not found"
**Solution**: Ensure student record creation is part of user registration flow

### Scenario 2: Class Assignment
**Issue**: Student is created but not assigned to a class
**Error**: "Student class not found"
**Solution**: Ensure class assignment is part of student creation or provide a way to assign classes

### Scenario 3: Token Expiration
**Issue**: User's session expires while using the app
**Error**: "Unauthorized"
**Solution**: Implement token refresh mechanism or redirect to login

### Scenario 4: Database Connection
**Issue**: Database is temporarily unavailable
**Error**: "Failed to fetch profile data"
**Solution**: Implement retry logic and proper error handling

## Monitoring and Alerting

### Key Metrics to Monitor
- 401 errors (authentication issues)
- 404 errors (data consistency issues)
- 500 errors (server health issues)
- Response times
- Error rates by endpoint

### Recommended Alerts
- High 500 error rate (>5%)
- Sudden spike in 401 errors
- Database connection failures
- Response time degradation
