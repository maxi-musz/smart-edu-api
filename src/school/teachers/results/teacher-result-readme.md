## Teacher Results Main Page (Class Teacher View)

- **Endpoint:** `GET /api/v1/teachers/results/main-page`
- **Auth:** Bearer JWT (teacher – class teacher)
- **Purpose:** For a class teacher to view students in their managed classes and see released results (prepared by the director) for a chosen academic session/term.

### Query Parameters
- `sessionId` (optional): Academic session ID to view. If omitted, current session is used.
- `term` (optional): Term to pair with `sessionId` when filtering.
- `page` (optional): Student page number per class. Default: `1`.
- `limit` (optional): Page size per class. Default: `30`.

### Response Shape
```json
{
  "success": true,
  "message": "Result main page data retrieved successfully",
  "data": {
    "current_session": {
      "id": "session-id",
      "academic_year": "2024-2025",
      "term": "first"
    },
    "sessions": [
      {
        "id": "session-id",
        "academic_year": "2024-2025",
        "term": "first",
        "is_current": true
      }
      // ...other sessions/terms the director has released results for
    ],
    "classes": [
      {
        "id": "class-id",
        "name": "Grade 10A",
        "classId": "10A",
        "subjects": [
          { "id": "subj-id", "name": "Mathematics", "code": "MATH", "color": "#FF5733" }
          // all subjects offered in the class (not teacher-specific)
        ],
        "students": [
          {
            "student_id": "student-id",
            "student_name": "John Doe",
            "roll_number": "STU001",
            "display_picture": "https://...",
            "total_ca_score": 45,
            "total_exam_score": 60,
            "total_score": 105,
            "total_max_score": 150,
            "overall_percentage": 70,
            "overall_grade": "B",
            "class_position": 5,
            "total_students": 25,
            "subjects": [
              {
                "subject_id": "subj-id",
                "subject_name": "Mathematics",
                "subject_code": "MATH",
                "ca_score": 25,
                "exam_score": 60,
                "total_score": 85,
                "total_max_score": 100,
                "percentage": 85,
                "grade": "A"
              }
              // ...one entry per subject result released by director
            ]
          }
          // ...students for this page
        ],
        "page": 1,
        "limit": 30,
        "total_students": 120
      }
      // ...other classes managed by the teacher
    ],
    "page": 1,
    "limit": 30
  }
}
```

### Notes for Frontend
- Use `sessions` to populate a session/term selector; when a user chooses one, pass `sessionId` (and optionally `term`) to filter.
- Student pagination is applied per class; send `page` and `limit` to page through students in each class table. Default limit is 30.
- Results originate from director-released records; grades/percentages are already computed. No recalculation needed on the client.
