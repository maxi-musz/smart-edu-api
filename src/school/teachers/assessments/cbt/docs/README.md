# CBT Quiz System Documentation

This folder contains comprehensive documentation for the Computer-Based Test (CBT) Quiz system.

## 📁 Documentation Files

### 1. [API Documentation](./api-documentation.md)
Complete API reference with all endpoints, parameters, and responses.

### 2. [Response Schemas](./response-schemas.md)
Detailed response schemas for all API endpoints with example data structures.

### 3. [Request Examples](./request-examples.md)
Practical examples of request bodies for different types of assessments.

## 🚀 Quick Start

### Creating Your First CBT Quiz

```bash
POST /api/v1/teachers/assessments/cbt
```

```json
{
  "title": "My First Quiz",
  "subject_id": "subject_123",
  "assessment_type": "CBT",
  "duration": 30
}
```

### Getting All Your Quizzes

```bash
GET /api/v1/teachers/assessments/cbt?assessment_type=CBT&page=1&limit=10
```

## 📋 Assessment Types

| Type | Description | Use Case |
|------|-------------|----------|
| `CBT` | Computer-Based Test (default) | Regular quizzes and tests |
| `ASSIGNMENT` | Assignment-based assessment | Projects, essays, problem sets |
| `EXAM` | Major examination | Formal exams, mid-terms, finals |
| `PRACTICE` | Practice test | Learning and skill building |
| `FORMATIVE` | Ongoing assessment | Check understanding during learning |
| `SUMMATIVE` | Final assessment | End-of-term evaluations |
| `DIAGNOSTIC` | Knowledge gap assessment | Identify learning needs |
| `MOCK_EXAM` | Practice examination | Exam preparation |
| `BENCHMARK` | Standardized assessment | Performance comparison |
| `OTHER` | Custom assessment | Special cases |

## 🔧 Key Features

- **Multiple Assessment Types**: Support for various assessment formats
- **Flexible Grading**: Automatic, manual, or mixed grading options
- **Question Types**: Multiple choice, short answer, long answer, and more
- **Media Support**: Images, audio, and video in questions
- **Time Management**: Duration limits and auto-submit options
- **Access Control**: Teacher-based access and permissions
- **Analytics**: Question statistics and performance metrics
- **Pagination**: Efficient data retrieval with pagination

## 📊 Quiz Status Flow

```
DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED
```

1. **DRAFT**: Quiz is being created/edited
2. **PUBLISHED**: Quiz is published and available to students
3. **ACTIVE**: Quiz is currently active
4. **CLOSED**: Quiz is closed for submissions
5. **ARCHIVED**: Quiz is archived

## 🔐 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📝 Common Use Cases

### 1. Create a Quick Quiz
```json
{
  "title": "Quick Math Quiz",
  "subject_id": "math_123",
  "duration": 15,
  "assessment_type": "CBT"
}
```

### 2. Create an Assignment
```json
{
  "title": "Algebra Problem Set",
  "subject_id": "math_123",
  "assessment_type": "ASSIGNMENT",
  "grading_type": "MANUAL",
  "duration": 120
}
```

### 3. Create an Exam
```json
{
  "title": "Mid-Term Exam",
  "subject_id": "math_123",
  "assessment_type": "EXAM",
  "duration": 180,
  "start_date": "2024-01-15T09:00:00Z",
  "end_date": "2024-01-15T12:00:00Z"
}
```

## 🛠️ Development

### Adding New Assessment Types

1. Update the `AssessmentType` enum in `prisma/schema.prisma`
2. Create a migration to add the new enum value
3. Update the DTO validation
4. Update the API documentation

### Adding New Question Types

1. Update the `QuestionType` enum in `prisma/schema.prisma`
2. Create a migration
3. Update the question creation logic
4. Update the response handling

## 📚 Related Documentation

- [CBT System Guide](../CBT_SYSTEM_GUIDE.md) - System overview and architecture
- [Usage Examples](../CBT_USAGE_EXAMPLES.md) - Practical usage examples
- [Mobile API Specification](../MOBILE_API_SPECIFICATION.md) - Mobile-specific API details

## 🤝 Contributing

When adding new features or endpoints:

1. Update the relevant documentation files
2. Add request/response examples
3. Update the API documentation
4. Test all examples

## 📞 Support

For questions or issues with the CBT system:

1. Check the documentation first
2. Review the examples
3. Contact the development team

---

**Last Updated**: January 2024  
**Version**: 1.0.0
