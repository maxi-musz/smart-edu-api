# 📊 Bulk Onboarding Guide

## Overview

The bulk onboarding feature allows schools to upload large datasets of teachers, students, and directors via Excel files, making it much more efficient than adding users one by one.

## 🚀 Features

- **Excel File Upload**: Upload `.xlsx` or `.xls` files with user data
- **Data Validation**: Automatic validation of email formats, phone numbers, classes, and roles
- **Error Reporting**: Detailed error reports for failed entries
- **Email Notifications**: Automatic congratulatory emails sent to all successfully created users
- **Template Download**: Download a pre-formatted Excel template
- **Progress Tracking**: Real-time progress updates during processing

## 📋 Required Excel Format

Your Excel file must have the following columns in the exact order:

| Column | Description | Required | Valid Values |
|--------|-------------|----------|--------------|
| **First Name** | User's first name | ✅ | Any text |
| **Last Name** | User's last name | ✅ | Any text |
| **Email** | User's email address | ✅ | Valid email format |
| **Phone** | User's phone number | ✅ | Valid phone format |
| **Class** | Class assignment | ✅ | See valid classes below |
| **Role** | User role | ✅ | `student`, `teacher`, `school_director` |

### Valid Classes

- **Primary**: `pry-1`, `pry-2`, `pry-3`, `pry-4`, `pry-5`, `pry-6`
- **Kindergarten**: `kg-1`, `kg-2`
- **Nursery**: `nur-1`, `nur-2`
- **Junior Secondary**: `jss1`, `jss2`, `jss3`
- **Senior Secondary**: `ss1`, `ss2`, `ss3`

### Valid Roles

- `student` - For students
- `teacher` - For teachers
- `school_director` - For school directors

## 📥 API Endpoints

### 1. Download Excel Template

**GET** `/api/v1/auth/download-template`

Download a pre-formatted Excel template with the correct headers and example data.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:** Excel file download

### 2. Bulk Onboard Users

**POST** `/api/v1/auth/bulk-onboard`

Upload an Excel file to bulk onboard users.

**Headers:**
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

**Body:**
```
excel_file: <your-excel-file>
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk onboarding completed successfully",
  "data": {
    "total": 50,
    "successful": 48,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "email": "invalid@email.com",
        "error": "Invalid email format"
      }
    ],
    "createdUsers": {
      "teachers": [...],
      "students": [...],
      "directors": [...]
    }
  }
}
```

## 📝 Example Excel Data

| First Name | Last Name | Email | Phone | Class | Role |
|------------|-----------|-------|-------|-------|------|
| John | Doe | john.doe@school.com | 08012345678 | pry-1 | student |
| Jane | Smith | jane.smith@school.com | 08087654321 | pry-2 | teacher |
| Mike | Johnson | mike.johnson@school.com | 08011223344 | jss1 | school_director |

## ✅ Validation Rules

### Email Validation
- Must be a valid email format
- Must be unique (not already in the system)
- Will be converted to lowercase

### Phone Validation
- Must contain only numbers, spaces, hyphens, and parentheses
- Example: `08012345678`, `080-123-4567`, `(080) 123-4567`

### Class Validation
- Must be one of the valid classes listed above
- Case-insensitive (will be converted to lowercase)
- For students only (teachers and directors don't need valid classes)

### Role Validation
- Must be exactly: `student`, `teacher`, or `school_director`
- Case-insensitive (will be converted to lowercase)

## 🔄 Processing Flow

1. **File Upload**: Excel file is uploaded via multipart form data
2. **File Processing**: Excel file is read and converted to JSON
3. **Data Validation**: Each row is validated for format and business rules
4. **Database Transaction**: Valid users are created in a database transaction
5. **Email Sending**: Congratulatory emails are sent to all created users
6. **Response**: Summary report with success/failure counts and error details

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Bulk onboarding completed successfully",
  "data": {
    "total": 50,
    "successful": 48,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "email": "invalid@email.com",
        "error": "Invalid email format"
      },
      {
        "row": 7,
        "email": "existing@email.com",
        "error": "Email already exists in the system"
      }
    ],
    "createdUsers": {
      "teachers": [
        {
          "id": "uuid",
          "first_name": "jane",
          "last_name": "smith",
          "email": "jane.smith@school.com",
          "phone_number": "08087654321",
          "role": "teacher",
          "school_id": "school-uuid",
          "created_at": "2024-01-01T00:00:00.000Z",
          "updated_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "students": [...],
      "directors": [...]
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error in bulk onboarding",
  "error": "Detailed error message",
  "statusCode": 500
}
```

## ⚠️ Common Errors

### File Errors
- **Missing Excel file**: "Excel file is required"
- **Invalid file format**: "Error processing Excel file: Invalid file format"
- **Missing headers**: "Missing required headers: First Name, Last Name, Email, Phone, Class, Role"

### Data Errors
- **Invalid email**: "Row 3: Invalid email format"
- **Duplicate email**: "Email already exists in the system"
- **Invalid class**: "Row 5: Invalid class. Must be one of: pry-1, pry-2, ..."
- **Invalid role**: "Row 7: Invalid role. Must be one of: student, teacher, school_director"
- **Missing data**: "Row 2: Missing or empty First Name"

## 🔐 Security Features

- **JWT Authentication**: All endpoints require valid JWT token
- **School Isolation**: Users can only be created for their own school
- **Data Validation**: Comprehensive input validation
- **Error Handling**: Secure error messages without exposing system details

## 📧 Email Notifications

All successfully created users will receive congratulatory emails with:
- Welcome message
- School name
- Auto-generated login credentials
- Role-specific content

## 🚀 Best Practices

1. **Use the Template**: Download and use the provided Excel template
2. **Test with Small Files**: Start with a few rows to test the process
3. **Validate Data**: Ensure all data is correct before uploading
4. **Check Errors**: Review the error report for any issues
5. **Backup Data**: Keep a backup of your Excel file

## 📞 Support

If you encounter any issues:
1. Check the error messages in the response
2. Verify your Excel format matches the template
3. Ensure all required fields are filled
4. Contact support if problems persist

---

**Note**: This feature is designed for schools with large datasets. For small numbers of users, consider using the individual onboarding endpoints for better control and feedback. 