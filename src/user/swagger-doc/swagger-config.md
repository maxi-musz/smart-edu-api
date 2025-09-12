# Swagger Configuration for User Module

## Controller Decorators

The user controller uses the following Swagger decorators:

```typescript
@ApiTags('User Profile')
@Controller('user')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class UserController {
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            general_info: { type: 'object' },
            academic_info: { type: 'object' },
            settings: { type: 'object' },
            support_info: { type: 'object' }
          }
        },
        statusCode: { type: 'number' }
      }
    }
  })
  async getUserProfile(@Request() req: any) {
    return this.userService.getUserProfile(req.user);
  }
}
```

## Swagger UI Integration

### Main Swagger Setup
The user module endpoints are automatically included in the main Swagger documentation when the application starts.

### Accessing Documentation
- **Swagger UI**: `http://localhost:3000/api/docs`
- **JSON Schema**: `http://localhost:3000/api/docs-json`

### Authentication in Swagger UI
1. Click the "Authorize" button in Swagger UI
2. Enter your JWT token in the format: `Bearer <your-jwt-token>`
3. Click "Authorize"
4. Now you can test the endpoints

## DTOs and Schemas

### Response DTOs
While the current implementation uses inline schemas, consider creating dedicated DTOs for better type safety:

```typescript
// user-profile-response.dto.ts
export class UserProfileResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: UserProfileDataDto;

  @ApiProperty()
  statusCode: number;
}

export class UserProfileDataDto {
  @ApiProperty()
  general_info: GeneralInfoDto;

  @ApiProperty()
  academic_info: AcademicInfoDto;

  @ApiProperty()
  settings: SettingsDto;

  @ApiProperty()
  support_info: SupportInfoDto;
}
```

### Request DTOs
Currently, the profile endpoint doesn't require request DTOs, but you might want to add query parameters:

```typescript
export class GetUserProfileQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  include_settings?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  include_support?: boolean;
}
```

## Enhanced Swagger Documentation

### Adding More Detailed Schemas

```typescript
@ApiResponse({
  status: 200,
  description: 'Profile data retrieved successfully',
  type: UserProfileResponseDto,
  examples: {
    success: {
      summary: 'Successful response',
      value: {
        success: true,
        message: 'Profile data retrieved successfully',
        data: {
          general_info: {
            student: {
              id: 'stu_123456',
              name: 'John Doe',
              email: 'john.doe@school.com',
              // ... more fields
            }
          }
          // ... other sections
        },
        statusCode: 200
      }
    }
  }
})
```

### Adding Error Response Examples

```typescript
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing token',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Unauthorized' },
      statusCode: { type: 'number', example: 401 }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'User or student record not found',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'User not found' },
      statusCode: { type: 'number', example: 404 }
    }
  }
})
@ApiResponse({
  status: 500,
  description: 'Internal server error',
  schema: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Failed to fetch profile data' },
      statusCode: { type: 'number', example: 500 }
    }
  }
})
```

## Testing with Swagger UI

### Step-by-Step Testing
1. **Start the application**: `npm run start:dev`
2. **Open Swagger UI**: Navigate to `http://localhost:3000/api/docs`
3. **Authorize**: Click "Authorize" and enter your JWT token
4. **Test endpoint**: Click on the user profile endpoint and "Try it out"
5. **Execute**: Click "Execute" to test the endpoint

### Sample JWT Token
For testing purposes, you can use a sample JWT token (make sure it's valid for your application):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1NiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQxMDAyNDAwfQ.example_signature
```

## Documentation Maintenance

### Keeping Documentation Updated
1. **Update schemas** when response structure changes
2. **Add new examples** for different scenarios
3. **Update error responses** when new error cases are added
4. **Test examples** to ensure they work correctly

### Version Control
- Keep documentation files in version control
- Update documentation with each API change
- Tag documentation versions with API versions

### Review Process
- Review documentation changes in pull requests
- Test all examples before merging
- Ensure consistency across all documentation files
