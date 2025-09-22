Based on the current AttendanceScreen UI, here's the JSON response structure needed from the backend:

## **API Endpoint Structure**

### **1. Get Classes for Teacher/Director**
```
GET /api/attendance/classes
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "id": "class_1",
        "name": "Grade 10A",
        "code": "G10A",
        "subject": "Mathematics",
        "teacher_name": "John Smith",
        "room": "Room 101",
        "total_students": 25
      },
      {
        "id": "class_2", 
        "name": "Grade 10B",
        "code": "G10B",
        "subject": "English",
        "teacher_name": "Jane Doe",
        "room": "Room 102",
        "total_students": 20
      }
    ]
  }
}
```

### **2. Get Students for Selected Class**
```
GET /api/attendance/classes/{classId}/students
```

**Response:**
```json
{
  "success": true,
  "data": {
    "class_info": {
      "id": "class_1",
      "name": "Grade 10A",
      "code": "G10A",
      "subject": "Mathematics",
      "teacher_name": "John Smith",
      "room": "Room 101"
    },
    "students": [
      {
        "id": "student_1",
        "name": "John Doe",
        "display_picture": "https://api.school.com/images/students/student_1.jpg",
        "email": "john.doe@school.com",
        "phone": "+1234567890",
        "gender": "Male",
        "student_id": "STU001",
        "roll_number": "001"
      },
      {
        "id": "student_2",
        "name": "Jane Smith", 
        "display_picture": "https://api.school.com/images/students/student_2.jpg",
        "email": "jane.smith@school.com",
        "phone": "+1234567891",
        "gender": "Female",
        "student_id": "STU002",
        "roll_number": "002"
      }
    ]
  }
}
```

### **3. Get Attendance for Specific Date**
```
GET /api/attendance/classes/{classId}/date/{date}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "class_id": "class_1",
    "attendance_status": "pending", // pending, submitted, approved
    "attendance_records": [
      {
        "student_id": "student_1",
        "is_present": true,
        "marked_at": "2024-01-15T08:30:00Z",
        "marked_by": "teacher_1"
      },
      {
        "student_id": "student_2", 
        "is_present": false,
        "marked_at": "2024-01-15T08:30:00Z",
        "marked_by": "teacher_1"
      }
    ]
  }
}
```

### **4. Submit Attendance**
```
POST /api/attendance/submit
```

**Request Body:**
```json
{
  "class_id": "class_1",
  "date": "2024-01-15",
  "attendance_records": [
    {
      "student_id": "student_1",
      "is_present": true
    },
    {
      "student_id": "student_2",
      "is_present": false
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance submitted successfully",
  "data": {
    "attendance_id": "att_123",
    "class_id": "class_1",
    "date": "2024-01-15",
    "total_present": 20,
    "total_absent": 5,
    "submitted_at": "2024-01-15T09:00:00Z"
  }
}
```

### **5. Get Academic Session Info**
```
GET /api/academic/session/current
```

**Response:**
```json
{
  "success": true,
  "data": {
    "academic_year": "2024-2025",
    "term": "Term 1",
    "term_start_date": "2024-09-01",
    "term_end_date": "2024-12-15",
    "current_date": "2024-01-15"
  }
}
```

## **Key Data Points Needed**

1. **Class Information**: ID, name, code, subject, teacher, room
2. **Student Details**: ID, name, photo, email, phone, gender, student ID, roll number
3. **Attendance Records**: Student presence status, timestamps, who marked it
4. **Academic Session**: Current year, term, dates
5. **Role-based Access**: Different data based on user role (teacher/director/student)

## **Error Handling**

```json
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_001",
    "message": "Class not found",
    "details": "The requested class does not exist or you don't have access to it"
  }
}
```

This structure provides all the data needed for the current UI while being flexible enough for future enhancements.