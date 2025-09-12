# API Testing Guide for User Profile

## Overview
This guide provides comprehensive testing strategies for the User Profile API endpoint.

## Test Environment Setup

### Prerequisites
- Node.js and npm installed
- Application running on `http://localhost:3000`
- Valid JWT token for authentication
- Test database with sample data

### Test Tools
- **Postman**: For manual API testing
- **Jest**: For automated unit/integration tests
- **cURL**: For command-line testing
- **Swagger UI**: For interactive testing

## Manual Testing

### 1. Swagger UI Testing

#### Steps:
1. Start the application: `npm run start:dev`
2. Open Swagger UI: `http://localhost:3000/api/docs`
3. Find the "User Profile" section
4. Click "Authorize" and enter your JWT token
5. Click on `GET /api/v1/user/profile`
6. Click "Try it out"
7. Click "Execute"

#### Expected Results:
- Status: 200 OK
- Response contains all required sections
- Data structure matches the schema

### 2. Postman Testing

#### Collection Setup:
```json
{
  "info": {
    "name": "User Profile API Tests",
    "description": "Test collection for user profile endpoints"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "auth_token",
      "value": "your-jwt-token-here"
    }
  ],
  "item": [
    {
      "name": "Get User Profile - Success",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/user/profile",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "user", "profile"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response has success property', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property('success', true);",
              "});",
              "",
              "pm.test('Response has all required sections', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data).to.have.property('general_info');",
              "    pm.expect(jsonData.data).to.have.property('academic_info');",
              "    pm.expect(jsonData.data).to.have.property('settings');",
              "    pm.expect(jsonData.data).to.have.property('support_info');",
              "});"
            ]
          }
        }
      ]
    }
  ]
}
```

### 3. cURL Testing

#### Basic Test:
```bash
curl -X GET "http://localhost:3000/api/v1/user/profile" \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json"
```

#### With Verbose Output:
```bash
curl -v -X GET "http://localhost:3000/api/v1/user/profile" \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json"
```

## Automated Testing

### 1. Jest Unit Tests

#### Test File: `user.service.spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            class: {
              findUnique: jest.fn(),
            },
            subject: {
              findMany: jest.fn(),
            },
            cBTQuizAttempt: {
              findMany: jest.fn(),
            },
            student: {
              count: jest.fn(),
            },
            academicSession: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      // Mock data
      const mockUser = {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@school.com',
        phone_number: '+2348012345678',
        student: {
          id: 'stu_123',
          current_class_id: 'class_123',
          student_id: 'STU/2024/001',
          date_of_birth: new Date('2005-01-15'),
          address: '123 Education Street',
          emergency_contact: 'Jane Doe',
        },
      };

      const mockClass = {
        id: 'class_123',
        name: 'SS 3A',
      };

      const mockSubjects = [
        {
          id: 'subj_123',
          name: 'Mathematics',
          code: 'MATH301',
          teacherSubjects: [
            {
              teacher: {
                first_name: 'Dr. Sarah',
                last_name: 'Johnson',
              },
            },
          ],
        },
      ];

      const mockAttempts = [
        {
          total_score: 80,
          max_score: 100,
          passed: true,
        },
      ];

      // Setup mocks
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.class, 'findUnique').mockResolvedValue(mockClass as any);
      jest.spyOn(prismaService.subject, 'findMany').mockResolvedValue(mockSubjects as any);
      jest.spyOn(prismaService.cBTQuizAttempt, 'findMany').mockResolvedValue(mockAttempts as any);
      jest.spyOn(prismaService.student, 'count').mockResolvedValue(45);
      jest.spyOn(prismaService.academicSession, 'findFirst').mockResolvedValue({
        id: 'session_123',
        academic_year: '2024/2025',
        term: 'First Term',
        start_date: new Date('2024-09-01'),
        end_date: new Date('2024-12-20'),
      } as any);

      // Execute
      const result = await service.getUserProfile({ sub: 'user_123' });

      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('general_info');
      expect(result.data).toHaveProperty('academic_info');
      expect(result.data).toHaveProperty('settings');
      expect(result.data).toHaveProperty('support_info');
    });

    it('should return error when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      const result = await service.getUserProfile({ sub: 'invalid_user' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('User not found');
    });

    it('should return error when student record not found', async () => {
      const mockUser = {
        id: 'user_123',
        student: null,
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.getUserProfile({ sub: 'user_123' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Student record not found');
    });
  });
});
```

### 2. Integration Tests

#### Test File: `user.e2e-spec.ts`
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('User Profile (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token (you'll need to implement this)
    authToken = await getAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user/profile (GET)', () => {
    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('general_info');
          expect(res.body.data).toHaveProperty('academic_info');
          expect(res.body.data).toHaveProperty('settings');
          expect(res.body.data).toHaveProperty('support_info');
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

## Performance Testing

### 1. Load Testing with Artillery

#### Artillery Config: `artillery-config.yml`
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  headers:
    Authorization: 'Bearer your-jwt-token-here'

scenarios:
  - name: 'Get User Profile'
    weight: 100
    flow:
      - get:
          url: '/api/v1/user/profile'
```

#### Run Load Test:
```bash
artillery run artillery-config.yml
```

### 2. Response Time Testing

#### Expected Performance:
- **Response Time**: < 500ms for 95th percentile
- **Throughput**: > 100 requests/second
- **Error Rate**: < 1%

## Security Testing

### 1. Authentication Testing
- Test with missing token
- Test with invalid token format
- Test with expired token
- Test with token for different user

### 2. Authorization Testing
- Test with different user roles
- Test with different user permissions
- Test access to other users' data

### 3. Input Validation Testing
- Test with malformed requests
- Test with SQL injection attempts
- Test with XSS attempts

## Error Scenario Testing

### 1. Database Errors
- Test with database connection issues
- Test with missing data
- Test with corrupted data

### 2. Network Errors
- Test with timeout scenarios
- Test with connection failures
- Test with rate limiting

### 3. Business Logic Errors
- Test with users without student records
- Test with students without classes
- Test with missing academic sessions

## Test Data Setup

### 1. Sample Users
```sql
-- Insert test user
INSERT INTO "User" (id, email, first_name, last_name, phone_number, role, school_id)
VALUES ('test_user_123', 'test@school.com', 'Test', 'User', '+2348012345678', 'student', 'school_123');

-- Insert test student
INSERT INTO "Student" (id, user_id, student_id, current_class_id, school_id, academic_session_id)
VALUES ('test_student_123', 'test_user_123', 'STU/2024/001', 'test_class_123', 'school_123', 'session_123');
```

### 2. Sample Classes and Subjects
```sql
-- Insert test class
INSERT INTO "Class" (id, name, schoolId, academic_session_id)
VALUES ('test_class_123', 'SS 3A', 'school_123', 'session_123');

-- Insert test subjects
INSERT INTO "Subject" (id, name, code, classId, schoolId, academic_session_id)
VALUES ('test_subject_123', 'Mathematics', 'MATH301', 'test_class_123', 'school_123', 'session_123');
```

## Continuous Integration

### 1. GitHub Actions Workflow
```yaml
name: User Profile API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:e2e
      
    - name: Run load tests
      run: npm run test:load
```

### 2. Test Scripts in package.json
```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=spec.ts",
    "test:e2e": "jest --testPathPattern=e2e-spec.ts",
    "test:load": "artillery run artillery-config.yml",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

## Monitoring and Alerting

### 1. Key Metrics to Monitor
- Response time percentiles
- Error rates by endpoint
- Authentication failure rates
- Database query performance

### 2. Alert Thresholds
- Response time > 1 second
- Error rate > 5%
- Authentication failures > 10%
- Database connection failures

### 3. Health Checks
```typescript
@Get('health')
@ApiOperation({ summary: 'Health check for user profile service' })
async healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'user-profile'
  };
}
```
