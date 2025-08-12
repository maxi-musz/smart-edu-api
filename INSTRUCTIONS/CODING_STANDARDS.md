# Coding Standards & Best Practices

## 🎯 General Principles

### 1. Clean Code
- Write self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused
- Follow single responsibility principle

### 2. Consistency
- Use consistent naming conventions
- Follow established patterns
- Maintain consistent formatting
- Use consistent error handling

### 3. Performance
- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Minimize memory usage

## 📝 Naming Conventions

### Variables & Functions
```typescript
// ✅ Correct
const userProfile = await getUserProfile(userId);
const isEmailVerified = user.is_email_verified;
const totalStudents = await countStudents(schoolId);

// ❌ Incorrect
const up = await getUP(uid);
const emv = user.emv;
const ts = await countS(sid);
```

### Classes & Interfaces
```typescript
// ✅ Correct
export class UserService {}
export interface CreateUserDto {}
export enum UserStatus {}

// ❌ Incorrect
export class userService {}
export interface createUserDto {}
export enum userStatus {}
```

### Files & Folders
```typescript
// ✅ Correct
user.service.ts
user.controller.ts
user.module.ts
user.dto.ts

// ❌ Incorrect
UserService.ts
userService.ts
user_service.ts
```

## 🔧 TypeScript Guidelines

### Type Definitions
```typescript
// ✅ Use interfaces for objects
interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

// ✅ Use enums for constants
enum UserRole {
    STUDENT = 'student',
    TEACHER = 'teacher',
    DIRECTOR = 'school_director'
}

// ✅ Use type aliases for unions
type UserStatus = 'active' | 'inactive' | 'suspended';
```

### Async/Await
```typescript
// ✅ Correct
async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
        where: { id: userId }
    });
    return user;
}

// ❌ Incorrect
getUserProfile(userId: string): Promise<UserProfile> {
    return this.prisma.user.findUnique({
        where: { id: userId }
    }).then(user => user);
}
```

### Error Handling
```typescript
// ✅ Proper error handling
try {
    const result = await this.prisma.user.findUnique({
        where: { id: userId }
    });
    
    if (!result) {
        throw new NotFoundException('User not found');
    }
    
    return result;
} catch (error) {
    this.logger.error(`Failed to get user: ${error.message}`);
    throw error;
}
```

## 🗄️ Database Guidelines

### Prisma Best Practices
```typescript
// ✅ Use select for specific fields
const users = await this.prisma.user.findMany({
    where: { school_id: schoolId },
    select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true
    }
});

// ✅ Use include for relations
const userWithSchool = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
        school: {
            select: {
                id: true,
                school_name: true
            }
        }
    }
});

// ✅ Use transactions for multiple operations
const result = await this.prisma.$transaction(async (prisma) => {
    const user = await prisma.user.create({
        data: userData
    });
    
    const profile = await prisma.userProfile.create({
        data: {
            userId: user.id,
            ...profileData
        }
    });
    
    return { user, profile };
});
```

### Query Optimization
```typescript
// ✅ Use proper indexing
const users = await this.prisma.user.findMany({
    where: {
        school_id: schoolId,
        role: 'teacher',
        status: 'active'
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    skip: 0
});

// ✅ Avoid N+1 queries
const usersWithSchools = await this.prisma.user.findMany({
    where: { school_id: schoolId },
    include: {
        school: true
    }
});
```

## 🔐 Security Guidelines

### Input Validation
```typescript
// ✅ Use DTOs with validation
export class CreateUserDto {
    @IsEmail()
    email: string;
    
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;
    
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;
    
    @IsPhoneNumber()
    phoneNumber: string;
}

// ✅ Validate in service
async createUser(dto: CreateUserDto, user: User) {
    // Additional business logic validation
    if (dto.email.includes('admin')) {
        throw new BadRequestException('Invalid email format');
    }
}
```

### Authentication & Authorization
```typescript
// ✅ Check user permissions
async updateUser(userId: string, dto: UpdateUserDto, currentUser: User) {
    // Check if user can update this profile
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
        throw new ForbiddenException('Insufficient permissions');
    }
    
    // Proceed with update
    return this.prisma.user.update({
        where: { id: userId },
        data: dto
    });
}
```

## 📊 Logging Guidelines

### Log Levels
```typescript
// ✅ Use appropriate log levels
this.logger.log(colors.cyan('Starting operation')); // Info
this.logger.warn(colors.yellow('Warning message')); // Warning
this.logger.error(colors.red('Error message')); // Error
this.logger.debug('Debug information'); // Debug
```

### Structured Logging
```typescript
// ✅ Include context in logs
this.logger.log(colors.cyan(`Creating user for school: ${schoolId}`));
this.logger.error(colors.red(`Failed to create user: ${error.message}`), {
    userId,
    schoolId,
    error: error.stack
});
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
describe('UserService', () => {
    let service: UserService;
    let prismaService: PrismaService;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn()
                        }
                    }
                }
            ]
        }).compile();

        service = module.get<UserService>(UserService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    describe('getUserProfile', () => {
        it('should return user profile when user exists', async () => {
            // Test implementation
        });

        it('should throw NotFoundException when user does not exist', async () => {
            // Test implementation
        });
    });
});
```

### Test Naming
```typescript
// ✅ Descriptive test names
it('should return user profile when valid user ID is provided');
it('should throw NotFoundException when user ID does not exist');
it('should filter users by school ID when provided');
it('should return empty array when no users match criteria');
```

## 📚 Documentation Guidelines

### Code Comments
```typescript
// ✅ Use JSDoc for functions
/**
 * Creates a new user in the system
 * @param dto - User creation data
 * @param currentUser - Currently authenticated user
 * @returns Promise<User> - Created user object
 * @throws BadRequestException - When validation fails
 * @throws ConflictException - When user already exists
 */
async createUser(dto: CreateUserDto, currentUser: User): Promise<User> {
    // Implementation
}

// ✅ Use inline comments for complex logic
// Calculate total revenue by summing all successful payments
const totalRevenue = payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
```

### API Documentation
```typescript
// ✅ Comprehensive API documentation
@ApiOperation({
    summary: 'Create new user',
    description: 'Creates a new user account with the provided information'
})
@ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User created successfully' },
            data: { $ref: '#/components/schemas/User' }
        }
    }
})
@ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data provided'
})
@ApiResponse({
    status: 409,
    description: 'Conflict - User already exists'
})
```

## 🚀 Performance Guidelines

### Database Optimization
```typescript
// ✅ Use pagination
const users = await this.prisma.user.findMany({
    where: { school_id: schoolId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
});

// ✅ Use proper indexing
// Add to schema.prisma
model User {
    @@index([school_id, status])
    @@index([email])
}
```

### Caching
```typescript
// ✅ Implement caching for frequently accessed data
@CacheKey('user-profile')
@CacheTTL(300) // 5 minutes
async getUserProfile(userId: string): Promise<UserProfile> {
    return this.prisma.user.findUnique({
        where: { id: userId }
    });
}
```

## 🔄 Code Review Checklist

### Before Submitting
- [ ] Code follows naming conventions
- [ ] All functions have proper error handling
- [ ] Database queries are optimized
- [ ] Input validation is implemented
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] No hardcoded values
- [ ] Proper logging is implemented
- [ ] Security considerations are addressed

### Review Points
- [ ] Code readability
- [ ] Performance implications
- [ ] Security vulnerabilities
- [ ] Test coverage
- [ ] Documentation quality
- [ ] Error handling
- [ ] Database efficiency
- [ ] API design consistency
