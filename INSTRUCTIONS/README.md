# Smart Edu Backend - Development Instructions

Welcome to the Smart Edu Backend project! This folder contains comprehensive guidelines and best practices to maintain code quality and consistency across the project.

## 📚 Available Guidelines

### 1. [API Documentation Guidelines](./API_DOCUMENTATION.md)
Learn how to properly structure API documentation to keep controllers clean and maintainable.

**Key Points:**
- Always create a separate `docs/` folder for API documentation
- Use static methods for reusable documentation
- Keep controllers focused on business logic
- Follow consistent naming conventions

### 2. [Module Structure Guidelines](./MODULE_STRUCTURE.md)
Understand the standard module structure and organization patterns.

**Key Points:**
- Consistent folder structure across all modules
- Proper file naming conventions
- Standard controller, service, and module patterns
- Authentication and authorization guidelines

### 3. [Coding Standards & Best Practices](./CODING_STANDARDS.md)
Comprehensive coding standards for maintaining high-quality code.

**Key Points:**
- TypeScript best practices
- Database optimization guidelines
- Security considerations
- Testing standards
- Performance optimization

## 🎯 Quick Start Checklist

When creating a new module, follow this checklist:

### 1. Create Module Structure
```bash
src/school/director/module-name/
├── docs/
│   ├── module-name.docs.ts
│   └── index.ts
├── dto/
│   ├── module-name.dto.ts
│   └── index.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.module.ts
└── README.md
```

### 2. Follow Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `user-profile.controller.ts`)
- **Classes**: `PascalCase` (e.g., `UserProfileController`)
- **Variables**: `camelCase` (e.g., `userProfile`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)

### 3. Implement Required Patterns
- JWT authentication with `@UseGuards(JwtGuard)`
- User context with `@GetUser()`
- Proper error handling with try-catch blocks
- Comprehensive logging with colors
- Input validation with DTOs

### 4. Add Documentation
- Create API documentation in `docs/` folder
- Use Swagger decorators for comprehensive API docs
- Include all response codes (200, 401, 404, 500)
- Provide realistic examples

## 🚀 Best Practices Summary

### Code Quality
- ✅ Write self-documenting code
- ✅ Use meaningful variable names
- ✅ Keep functions small and focused
- ✅ Follow single responsibility principle

### Performance
- ✅ Optimize database queries with proper indexing
- ✅ Use `select` for specific fields
- ✅ Implement pagination for large datasets
- ✅ Use transactions for multiple operations

### Security
- ✅ Validate all inputs with DTOs
- ✅ Check user permissions before operations
- ✅ Use proper authentication guards
- ✅ Sanitize user inputs

### Testing
- ✅ Write unit tests for all services
- ✅ Test both success and error scenarios
- ✅ Use descriptive test names
- ✅ Mock external dependencies

## 📋 Common Patterns

### Controller Pattern
```typescript
@ApiTags('ModuleName')
@Controller('director/module-name')
@UseGuards(JwtGuard)
export class ModuleNameController {
    constructor(private readonly moduleNameService: ModuleNameService) {}

    @Get('endpoint')
    @ModuleNameDocs.bearerAuth
    @ModuleNameDocs.operation
    @ModuleNameDocs.response200
    @ModuleNameDocs.response401
    @ModuleNameDocs.response404
    methodName(@GetUser() user: User) {
        return this.moduleNameService.methodName(user);
    }
}
```

### Service Pattern
```typescript
@Injectable()
export class ModuleNameService {
    private readonly logger = new Logger(ModuleNameService.name);

    constructor(private readonly prisma: PrismaService) {}

    async methodName(user: User) {
        this.logger.log(colors.cyan('Method description'));
        
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

### Response Pattern
```typescript
// Success Response
return ResponseHelper.success(
    'Operation completed successfully',
    {
        id: 'uuid',
        name: 'string',
        // ... other fields
    }
);

// Error Response
return ResponseHelper.error(
    'Error message',
    error,
    400 // status code
);
```

## 🔄 Migration Guide

When refactoring existing modules:

1. **Create Documentation Structure**
   - Create `docs/` folder
   - Move all `@Api*` decorators to documentation file
   - Create static methods for each decorator

2. **Update Controller**
   - Import documentation from `./docs`
   - Replace inline decorators with imported ones
   - Clean up controller code

3. **Add DTOs**
   - Create `dto/` folder if needed
   - Define proper validation rules
   - Use class-validator decorators

4. **Update Module**
   - Ensure proper imports
   - Add to parent module if needed

## 📞 Getting Help

If you have questions about these guidelines:

1. **Check existing modules** for examples
2. **Review the detailed guidelines** in each file
3. **Follow the patterns** established in the codebase
4. **Ask for code review** when implementing new features

## 🎉 Contributing

When contributing to the project:

1. Follow all guidelines in this folder
2. Maintain consistency with existing code
3. Write comprehensive tests
4. Update documentation as needed
5. Request code review before merging

---

**Remember**: Consistency is key! Follow these guidelines to maintain a clean, maintainable, and scalable codebase.
