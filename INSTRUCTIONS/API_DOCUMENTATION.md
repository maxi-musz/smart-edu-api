# API Documentation Guidelines

## 📁 Folder Structure
Always create a separate `docs/` folder inside each module for API documentation.

```
src/school/director/module-name/
├── docs/
│   ├── module-name.docs.ts    # Main documentation file
│   └── index.ts               # Export file
├── module-name.controller.ts  # Clean controller
├── module-name.service.ts
└── module-name.module.ts
```

## 🎯 Benefits
- **Clean Controllers**: Keep controllers focused on business logic
- **Reusable Documentation**: Documentation can be reused across endpoints
- **Easy Maintenance**: Centralized API documentation
- **Better Organization**: Consistent structure across modules

## 📝 Implementation Steps

### 1. Create Documentation File
```typescript
// src/school/director/module-name/docs/module-name.docs.ts
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

export class ModuleNameDocs {
    static get bearerAuth() {
        return ApiBearerAuth('JWT-auth');
    }

    static get operation() {
        return ApiOperation({
            summary: 'Endpoint summary',
            description: 'Detailed description'
        });
    }

    static get response200() {
        return ApiResponse({
            status: 200,
            description: 'Success response',
            schema: {
                // Detailed schema definition
            }
        });
    }

    // Add other response codes as needed
}
```

### 2. Create Index File
```typescript
// src/school/director/module-name/docs/index.ts
export * from './module-name.docs';
```

### 3. Use in Controller
```typescript
// src/school/director/module-name/module-name.controller.ts
import { ModuleNameDocs } from './docs';

@Get('endpoint')
@ModuleNameDocs.bearerAuth
@ModuleNameDocs.operation
@ModuleNameDocs.response200
@ModuleNameDocs.response401
@ModuleNameDocs.response404
endpointMethod() {
    // Clean controller logic
}
```

## 🚫 What NOT to Do
```typescript
// ❌ DON'T put documentation directly in controller
@Get('profile')
@ApiBearerAuth('JWT-auth')
@ApiOperation({
    summary: 'Get user profile',
    description: 'Long description...'
})
@ApiResponse({
    status: 200,
    description: 'Success',
    schema: {
        // 50+ lines of schema
    }
})
@ApiResponse({
    status: 401,
    description: 'Unauthorized'
})
@ApiResponse({
    status: 404,
    description: 'Not found'
})
getUserProfile() {
    // Controller logic
}
```

## ✅ What TO Do
```typescript
// ✅ Clean controller with imported documentation
@Get('profile')
@UserDocs.bearerAuth
@UserDocs.operation
@UserDocs.response200
@UserDocs.response401
@UserDocs.response404
getUserProfile() {
    // Clean controller logic
}
```

## 📋 Documentation Standards

### Required Response Codes
- `200` - Success
- `401` - Unauthorized (JWT required)
- `404` - Not Found
- `500` - Internal Server Error

### Schema Guidelines
- Use realistic examples
- Include nullable fields properly
- Provide comprehensive property descriptions
- Use consistent naming conventions

### Naming Conventions
- Documentation class: `ModuleNameDocs`
- File name: `module-name.docs.ts`
- Folder: `docs/`

## 🔄 Migration Process
When refactoring existing modules:

1. Create `docs/` folder
2. Move all `@Api*` decorators to documentation file
3. Create static methods for each decorator
4. Import and use in controller
5. Remove inline documentation from controller

## 📚 Examples
See existing implementations:
- `src/school/director/user/docs/`
- `src/school/director/teachers/docs/`
- `src/school/director/subjects/docs/`
