# 🎓 Smart Education Backend API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  <br>
  <strong>A comprehensive school management system built with NestJS</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-documentation">API Documentation</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#database">Database</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## ✨ Features

### 🏫 School Management
- **School Onboarding**: Complete school registration with document verification
- **Multi-role System**: Directors, Teachers, Students, and Admin roles
- **School Settings**: Configurable school terms and academic settings

### 👥 User Management
- **Authentication**: JWT-based authentication with OTP verification
- **Role-based Access**: Secure access control for different user types
- **Profile Management**: Comprehensive user profiles with display pictures

### 📚 Academic Management
- **Class Management**: Create and manage classes
- **Subject Management**: Organize subjects with color coding
- **Student Performance**: Track and analyze student performance
- **Teacher Assignments**: Assign teachers to classes and subjects

### 📅 Scheduling System
- **Timetable Management**: Create and manage class schedules
- **Time Slots**: Flexible time slot configuration
- **Schedule Conflicts**: Automatic conflict detection and resolution

### 💰 Financial Management
- **Payment Tracking**: Monitor school payments and fees
- **Financial Dashboard**: Comprehensive financial analytics
- **Revenue Reports**: Detailed revenue and expense tracking

### 📊 Dashboard & Analytics
- **Director Dashboard**: Overview of school operations
- **Student Analytics**: Performance tracking and statistics
- **Teacher Analytics**: Teaching performance metrics
- **Financial Reports**: Revenue and expense analysis

### 🔔 Notification System
- **Real-time Notifications**: Instant updates for important events
- **Email Notifications**: Automated email alerts
- **Push Notifications**: Mobile-friendly notifications

---

## 🛠 Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Reliable relational database
- **ORM**: [Prisma](https://www.prisma.io/) - Modern database toolkit
- **Authentication**: [JWT](https://jwt.io/) - JSON Web Tokens
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/) - API documentation

### Development Tools
- **Package Manager**: [npm](https://www.npmjs.com/)
- **Code Quality**: [ESLint](https://eslint.org/) - Code linting
- **Testing**: [Jest](https://jestjs.io/) - Testing framework
- **Environment**: [dotenv](https://www.npmjs.com/package/dotenv) - Environment variables

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-edu-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb smart_edu_db
   
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run start:prod
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/smart_edu_db?schema=public"

# Application Configuration
PORT=1000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📚 API Documentation

### Interactive Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:1000/api/docs`
- **API Base URL**: `http://localhost:1000/api/v1`

### API Endpoints

#### Authentication
- `POST /api/v1/auth/onboard-school` - School registration
- `POST /api/v1/auth/signin` - User sign in
- `POST /api/v1/auth/request-login-otp` - Request login OTP
- `POST /api/v1/auth/verify-email-otp` - Verify email OTP
- `POST /api/v1/auth/request-password-reset` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

#### Dashboard
- `GET /api/v1/director/dashboard/fetch-dashboard-data` - Director dashboard
- `GET /api/v1/director/students/dashboard` - Students dashboard
- `GET /api/v1/director/teachers/dashboard` - Teachers dashboard

#### Academic Management
- `GET /api/v1/director/classes/fetch-all-classes` - Get all classes
- `GET /api/v1/director/subjects/fetch-all-subjects` - Get all subjects
- `POST /api/v1/director/subjects/create-subject` - Create subject
- `PUT /api/v1/director/subjects/edit-subject/:id` - Edit subject

#### Finance
- `GET /api/v1/director/finance/dashboard` - Finance dashboard

#### Schedules
- `GET /api/v1/director/schedules/time-slots` - Get time slots
- `POST /api/v1/director/schedules/create-time-slot` - Create time slot
- `GET /api/v1/director/schedules/timetable-entries` - Get timetable entries
- `POST /api/v1/director/schedules/create-timetable-entry` - Create timetable entry

---

## 📁 Project Structure

```
smart-edu-backend/
├── src/
│   ├── admin/                    # Admin module
│   │   ├── auth-admin/          # Admin authentication
│   │   └── school-management/   # School management
│   ├── school/                  # School module
│   │   ├── auth/               # Authentication
│   │   ├── director/           # Director features
│   │   │   ├── dashboard/      # Dashboard management
│   │   │   ├── students/       # Student management
│   │   │   ├── teachers/       # Teacher management
│   │   │   ├── classes/        # Class management
│   │   │   ├── subject/        # Subject management
│   │   │   ├── finance/        # Finance management
│   │   │   ├── schedules/      # Schedule management
│   │   │   ├── notifications/  # Notification system
│   │   │   ├── profiles/       # Profile management
│   │   │   └── settings/       # Settings management
│   │   ├── students/           # Student features
│   │   └── teachers/           # Teacher features
│   ├── shared/                 # Shared utilities
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── guards/            # Authentication guards
│   │   ├── interceptors/      # Request interceptors
│   │   ├── services/          # Shared services
│   │   └── utils/             # Utility functions
│   ├── docs/                  # API documentation
│   │   ├── auth.docs.ts      # Authentication docs
│   │   ├── dashboard.docs.ts # Dashboard docs
│   │   ├── students.docs.ts  # Students docs
│   │   ├── teachers.docs.ts  # Teachers docs
│   │   ├── classes.docs.ts   # Classes docs
│   │   ├── subjects.docs.ts  # Subjects docs
│   │   ├── finance.docs.ts   # Finance docs
│   │   ├── schedules.docs.ts # Schedules docs
│   │   └── index.ts          # Documentation exports
│   ├── config/                # Configuration files
│   ├── prisma/               # Database service
│   └── main.ts              # Application entry point
├── prisma/                    # Database schema and migrations
├── test/                     # Test files
├── DOCS/                     # Project documentation
└── package.json             # Dependencies and scripts
```

---

## 🗄 Database

### Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users**: School directors, teachers, and students
- **Schools**: School information and settings
- **Classes**: Academic classes
- **Subjects**: Academic subjects
- **Students**: Student information and performance
- **Teachers**: Teacher information and assignments
- **Schedules**: Timetables and time slots
- **Finance**: Payment and financial records
- **Notifications**: System notifications

### Database Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Reset database
npm run prisma:reset

# View database in Prisma Studio
npm run prisma:studio
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t smart-edu-backend .

# Run Docker container
docker run -p 1000:1000 smart-edu-backend
```

### Environment Variables for Production

Ensure these environment variables are set in production:

- `DATABASE_URL` - Production database URL
- `JWT_SECRET` - Strong JWT secret
- `NODE_ENV=production`
- Email and file upload service credentials

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: Check the API docs at `http://localhost:1000/api/docs`
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join our community discussions

---

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/) - A progressive Node.js framework
- Database powered by [Prisma](https://www.prisma.io/) - Modern database toolkit
- API documentation with [Swagger](https://swagger.io/) - OpenAPI specification

---

<p align="center">
  Made with ❤️ for better education management
</p>
