# User Module API Documentation

Welcome to the comprehensive API documentation for the User module. This documentation covers the user profile endpoint and provides everything you need to integrate with the API.

## 📚 Documentation Structure

### Core Documentation
- **[README.md](./README.md)** - Overview and quick reference
- **[user-profile-endpoint.md](./user-profile-endpoint.md)** - Detailed endpoint documentation
- **[response-schemas.md](./response-schemas.md)** - Complete response schema definitions
- **[request-examples.md](./request-examples.md)** - Example requests and responses
- **[error-responses.md](./error-responses.md)** - Error handling and troubleshooting

### Technical Documentation
- **[swagger-config.md](./swagger-config.md)** - Swagger configuration and setup
- **[api-testing.md](./api-testing.md)** - Comprehensive testing guide

## 🚀 Quick Start

### 1. Get User Profile
```bash
curl -X GET "https://api.school.com/api/v1/user/profile" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json"
```

### 2. Response Format
```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "data": {
    "general_info": { /* Personal information */ },
    "academic_info": { /* Academic performance */ },
    "settings": { /* User preferences */ },
    "support_info": { /* Help and support */ }
  },
  "statusCode": 200
}
```

## 🔧 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/user/profile` | Get comprehensive user profile | ✅ JWT |

## 📋 Response Sections

### General Info
- **Student Details**: Personal information, contact details, address
- **Student Class**: Class information and academic level
- **Current Session**: Active academic session details

### Academic Info
- **Subjects Enrolled**: All subjects with teacher assignments
- **Performance Summary**: Grades, rankings, attendance
- **Recent Achievements**: Academic accomplishments

### Settings
- **Notifications**: Push, email, and reminder preferences
- **App Preferences**: UI and behavior settings
- **Privacy**: Data sharing and visibility controls

### Support Info
- **Help Center**: FAQ and support resources
- **Contact Options**: Support channels and response times
- **App Info**: Version and compatibility information

## 🛡️ Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer <jwt-token>
```

### Token Requirements
- Valid JWT token
- Token must not be expired
- User must have student role
- Student record must exist

## 📊 Data Sources

The API aggregates data from multiple database tables:

- **User Table**: Basic user information
- **Student Table**: Student-specific data
- **Class Table**: Class and academic level information
- **Subject Table**: Subject details and teacher assignments
- **CBTQuizAttempt Table**: Assessment performance data
- **AcademicSession Table**: Current academic session

## 🔍 Error Handling

### Common Error Codes
- **401 Unauthorized**: Invalid or missing token
- **404 Not Found**: User, student, or class not found
- **500 Internal Server Error**: Server-side issues

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

## 🧪 Testing

### Interactive Testing
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Postman Collection**: Available in request-examples.md
- **cURL Examples**: Command-line testing examples

### Automated Testing
- **Unit Tests**: Jest-based service tests
- **Integration Tests**: End-to-end API tests
- **Load Tests**: Performance and scalability tests

## 📱 Mobile Integration

### React Native Example
```javascript
const fetchUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch('/api/v1/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (data.success) {
      setUserProfile(data.data);
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
  }
};
```

### Flutter Example
```dart
Future<Map<String, dynamic>> fetchUserProfile() async {
  final token = await storage.read(key: 'authToken');
  final response = await http.get(
    Uri.parse('$baseUrl/api/v1/user/profile'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  }
  throw Exception('Failed to load profile');
}
```

## 🔄 Versioning

### Current Version
- **API Version**: v1
- **Last Updated**: 2024-01-21
- **Compatibility**: Backward compatible

### Version History
- **v1.0.0**: Initial release with basic profile endpoint
- **v1.1.0**: Added comprehensive academic info
- **v1.2.0**: Enhanced settings and support info

## 📈 Performance

### Response Times
- **Average**: < 200ms
- **95th Percentile**: < 500ms
- **99th Percentile**: < 1000ms

### Rate Limits
- **Requests per minute**: 100
- **Burst limit**: 20 requests
- **Daily limit**: 10,000 requests

## 🔒 Security

### Data Protection
- All data encrypted in transit (HTTPS)
- Sensitive data masked in logs
- JWT tokens have expiration times
- Rate limiting prevents abuse

### Privacy Controls
- User can control data visibility
- Emergency contact info is optional
- Academic progress sharing is configurable

## 🆘 Support

### Getting Help
- **Email**: support@school.com
- **Phone**: +234 800 123 4567
- **Live Chat**: Available in app
- **Response Time**: 24 hours

### Common Issues
- **Token Expired**: Re-authenticate to get new token
- **Profile Not Found**: Ensure user has student record
- **Class Not Found**: Verify student is assigned to a class

## 📝 Changelog

### Recent Updates
- **2024-01-21**: Added comprehensive Swagger documentation
- **2024-01-20**: Enhanced error handling and logging
- **2024-01-19**: Added performance metrics calculation
- **2024-01-18**: Initial profile endpoint implementation

### Upcoming Features
- Profile update endpoints
- Settings management
- Achievement tracking
- Performance analytics

## 🤝 Contributing

### Documentation Updates
1. Update relevant markdown files
2. Test all examples
3. Submit pull request
4. Review and merge

### Code Changes
1. Update Swagger decorators
2. Add/update tests
3. Update documentation
4. Submit pull request

## 📄 License

This API documentation is part of the Smart Education Backend project and follows the same licensing terms.

---

**Last Updated**: January 21, 2024  
**Maintained By**: Development Team  
**Contact**: dev@school.com
