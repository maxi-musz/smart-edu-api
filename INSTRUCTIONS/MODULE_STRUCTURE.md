# Module Structure Guidelines

## 📁 Standard Module Structure
Every module should follow this consistent structure:

```
src/school/director/module-name/
├── docs/                          # API Documentation
│   ├── module-name.docs.ts
│   └── index.ts
├── dto/                           # Data Transfer Objects
│   ├── module-name.dto.ts
│   └── index.ts
├── module-name.controller.ts      # Controller
├── module-name.service.ts         # Service
├── module-name.module.ts          # Module
└── README.md                      # Module documentation
```

## 🎯 Module Creation Checklist

### 1. Create Module Files
- [ ] `module-name.controller.ts`
- [ ] `module-name.service.ts`
- [ ] `module-name.module.ts`

### 2. Create Documentation
- [ ] `docs/` folder
- [ ] `docs/module-name.docs.ts`
- [ ] `docs/index.ts`

### 3. Create DTOs (if needed)
- [ ] `dto/` folder
- [ ] `dto/module-name.dto.ts`
- [ ] `dto/index.ts`

### 4. Update Parent Module
- [ ] Import new module in parent module
- [ ] Add to imports array

## 📝 File Naming Conventions

### Controllers
```typescript
// ✅ Correct
user.controller.ts
teachers.controller.ts
students.controller.ts

// ❌ Incorrect
UserController.ts
userController.ts
user_controller.ts
```

### Services
```typescript
// ✅ Correct
user.service.ts
teachers.service.ts
students.service.ts

// ❌ Incorrect
UserService.ts
userService.ts
user_service.ts
```

### Modules
```typescript
// ✅ Correct
user.module.ts
teachers.module.ts
students.module.ts

// ❌ Incorrect
UserModule.ts
userModule.ts
user_module.ts
```

## 🔧 Controller Guidelines

### Required Decorators
```typescript
@ApiTags('ModuleName')
@Controller('director/module-name')
@UseGuards(JwtGuard)
export class ModuleNameController {
    constructor(private readonly moduleNameService: ModuleNameService) {}
}
```

### Method Structure
```typescript
@Get('endpoint')
@ModuleNameDocs.bearerAuth
@ModuleNameDocs.operation
@ModuleNameDocs.response200
@ModuleNameDocs.response401
@ModuleNameDocs.response404
methodName(@GetUser() user: User) {
    return this.moduleNameService.methodName(user);
}
```

## 🛠️ Service Guidelines

### Required Imports
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
```

### Service Structure
```typescript
@Injectable()
export class ModuleNameService {
    private readonly logger = new Logger(ModuleNameService.name);

    constructor(private readonly prisma: PrismaService) {}

    async methodName(user: User) {
        this.logger.log(colors.cyan(`Method description`));
        
        try {
            // Implementation
            return ResponseHelper.success('Success message', data);
        } catch (error) {
            this.logger.error(colors.red(`Error message: ${error.message}`));
            throw error;
        }
    }
}
```

## 📦 Module Guidelines

### Standard Module Structure
```typescript
import { Module } from '@nestjs/common';
import { ModuleNameController } from './module-name.controller';
import { ModuleNameService } from './module-name.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ModuleNameController],
  providers: [ModuleNameService],
  exports: [ModuleNameService]
})
export class ModuleNameModule {}
```

## 🎨 Response Format Standards

### Success Response
```typescript
return ResponseHelper.success(
    'Operation completed successfully',
    {
        // Data object
        id: 'uuid',
        name: 'string',
        // ... other fields
    }
);
```

### Error Response
```typescript
return ResponseHelper.error(
    'Error message',
    error,
    400 // status code
);
```

## 🔐 Authentication & Authorization

### JWT Guard
- All director endpoints must use `@UseGuards(JwtGuard)`
- Use `@GetUser()` decorator to get authenticated user
- Validate user permissions in service layer

### User Context
```typescript
async methodName(@GetUser() user: User) {
    // user.id - User ID
    // user.email - User email
    // user.school_id - School ID
    // user.role - User role
}
```

## 📊 Database Guidelines

### Prisma Usage
```typescript
// ✅ Use select for specific fields
const data = await this.prisma.model.findMany({
    where: { schoolId: user.school_id },
    select: {
        id: true,
        name: true,
        // Only needed fields
    }
});

// ✅ Use include for relations
const data = await this.prisma.model.findMany({
    where: { schoolId: user.school_id },
    include: {
        relation: {
            select: {
                id: true,
                name: true
            }
        }
    }
});
```

### Error Handling
```typescript
try {
    const result = await this.prisma.model.findUnique({
        where: { id }
    });
    
    if (!result) {
        throw new NotFoundException('Resource not found');
    }
    
    return result;
} catch (error) {
    this.logger.error(colors.red(`Database error: ${error.message}`));
    throw error;
}
```

## 🧪 Testing Guidelines

### Test File Structure
```
src/school/director/module-name/
├── module-name.controller.spec.ts
├── module-name.service.spec.ts
└── __mocks__/
    └── module-name.mock.ts
```

### Test Naming
```typescript
describe('ModuleNameService', () => {
    describe('methodName', () => {
        it('should return success when valid data provided', () => {
            // Test implementation
        });
        
        it('should throw error when invalid data provided', () => {
            // Test implementation
        });
    });
});
```

## 📚 Documentation Standards

### README.md Template
```markdown
# Module Name

## Description
Brief description of the module's purpose.

## Endpoints
- `GET /api/v1/director/module-name/endpoint` - Description
- `POST /api/v1/director/module-name/endpoint` - Description

## Dependencies
- PrismaService
- Other services...

## Usage Examples
```typescript
// Example usage
```

## Testing
```bash
npm run test src/school/director/module-name
```
```

## 🔄 Migration Checklist

When creating a new module:

1. **Create Files**
   - [ ] Controller file
   - [ ] Service file
   - [ ] Module file

2. **Add Documentation**
   - [ ] Create docs folder
   - [ ] Add API documentation
   - [ ] Create index file

3. **Add DTOs**
   - [ ] Create dto folder
   - [ ] Define DTOs
   - [ ] Create index file

4. **Update Parent Module**
   - [ ] Import new module
   - [ ] Add to imports array

5. **Test**
   - [ ] Create test files
   - [ ] Write unit tests
   - [ ] Test endpoints

6. **Document**
   - [ ] Create README.md
   - [ ] Update API documentation
   - [ ] Add usage examples
