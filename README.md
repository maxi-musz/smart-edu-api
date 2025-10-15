# Smart Edu Hub Backend

A comprehensive NestJS backend API for managing school operations, authentication, and educational resources.

## 🚀 Quick Start

**👋 Coming back to this project? Read [docs/](./docs/) folder first!**

### Option 1: Docker (Recommended)
```bash
# Quick setup with Docker
make dev

# Or use the interactive setup script
./scripts/docker-setup.sh
```

### Option 2: Local Development
#### Prerequisites
- Node.js 18.19.0+
- PostgreSQL database
- npm or yarn

#### Installation
```bash
npm install
```

#### Development
```bash
npm run start:dev
```

#### Production Build
```bash
npm run build
npm run start:prod
```

## 🐳 Docker Setup

This project includes comprehensive Docker configurations for both development and production environments.

### Quick Docker Commands
```bash
# Development
make dev              # Start development environment
make dev-logs         # View development logs
make db-migrate       # Run database migrations
make db-seed          # Seed database

# Production
make prod             # Start production environment
make prod-logs        # View production logs
make backup           # Create database backup

# Utilities
make health           # Check application health
make clean            # Clean up containers
```

### Docker Services
- **Development**: App, PostgreSQL, Redis, Prisma Studio
- **Staging**: App, PostgreSQL, Redis, Nginx, Prisma Studio, Backup service
- **Production**: App, PostgreSQL, Redis, Nginx, Backup service

For detailed Docker setup instructions, see [docs/03-DOCKER_SETUP.md](./docs/03-DOCKER_SETUP.md).

## 📚 Documentation

All documentation is organized in the [`docs/`](./docs/) folder:

- **[docs/README.md](./docs/README.md)** - Documentation index
- **[01-QUICK_START.md](./docs/01-QUICK_START.md)** - Start here when you return
- **[02-FILE_STRUCTURE.md](./docs/02-FILE_STRUCTURE.md)** - File overview
- **[03-DOCKER_SETUP.md](./docs/03-DOCKER_SETUP.md)** - Detailed setup
- **[04-DOCKER_SUMMARY.md](./docs/04-DOCKER_SUMMARY.md)** - Implementation summary
- **[05-PRODUCTION_DEPLOYMENT.md](./docs/05-PRODUCTION_DEPLOYMENT.md)** - Production guide
- **[06-STAGING_ENVIRONMENT.md](./docs/06-STAGING_ENVIRONMENT.md)** - Staging environment guide
- **[07-SECURITY_GUIDE.md](./docs/07-SECURITY_GUIDE.md)** - Security and secrets management

## 📋 Available Scripts

- `npm run start` - Start production server with memory optimization
- `npm run start:dev` - Start development server with hot reload
- `npm run start:prod` - Start production server
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🗄️ Database

### Prisma Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:seed` - Seed the database

### Database Migration
To migrate from local to production database:

1. **Backup local database:**
   ```bash
   pg_dump "postgresql://user:password@localhost:5432/database" --verbose --clean --no-owner --no-privileges --format=custom --file=backup.dump
   ```

2. **Apply migrations to production:**
   ```bash
   DATABASE_URL="your_production_url" npx prisma migrate deploy
   ```

3. **Restore data:**
   ```bash
   pg_restore --verbose --no-owner --no-privileges --dbname="your_production_url" backup.dump
   ```

## 🚀 Deployment

### Render.com Deployment

This project is optimized for deployment on Render.com with the following configurations:

#### Memory Optimization
- Node.js heap size increased to 1GB (`--max-old-space-size=1024`)
- Optimized build process
- Proper health check endpoint at `/health`

#### Required Environment Variables
```env
DATABASE_URL=your_database_connection_string
NODE_ENV=production
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=your_frontend_urls
```

#### Deployment Files
- `render.yaml` - Render deployment configuration
- `.nvmrc` - Node.js version specification
- `.dockerignore` - Optimized build exclusions

#### Health Check
The application provides a health check endpoint:
- **URL:** `/health`
- **Response:** `{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z" }`

### Common Deployment Issues & Solutions

#### 1. JavaScript Heap Out of Memory
**Error:** `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`

**Solution:** Already fixed in package.json with `--max-old-space-size=1024`

#### 2. Module Not Found
**Error:** `Cannot find module '/opt/render/project/src/dist/main'`

**Solution:** Use `./dist/main` instead of `dist/main` in start commands

#### 3. Database Connection Issues
**Error:** Database connection failures

**Solution:** 
- Ensure `DATABASE_URL` is correctly set
- Check database permissions
- Verify network connectivity

#### 4. Build Failures
**Error:** Build process fails

**Solution:**
- Ensure all dependencies are in `package.json`
- Check for TypeScript compilation errors
- Verify Prisma schema is valid

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build process successful
- [ ] Health check endpoint responding
- [ ] CORS settings configured
- [ ] JWT secret set

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** `http://localhost:1000/api/docs`
- **Health Check:** `http://localhost:1000/health`
- **API Base:** `http://localhost:1000/api/v1`

## 🔧 Configuration

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
FRONTEND_URL=http://localhost:3000

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# OpenAI (Optional)
OPENAI_API_KEY=your_openai_key

# Pinecone (Optional)
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_environment
```

## 🏗️ Project Structure

```
src/
├── academic-session/     # Academic session management
├── admin/               # Admin operations
├── common/              # Shared utilities
├── config/              # Configuration files
├── docs/                # API documentation
├── school/              # School management
├── shared/              # Shared modules
├── user/                # User management
├── app.controller.ts    # Main app controller
├── app.module.ts        # Root module
├── app.service.ts       # App service
└── main.ts              # Application entry point
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in `main.ts` or set `PORT` environment variable

2. **Database connection timeout**
   - Check database URL and network connectivity
   - Verify database server is running

3. **Prisma client not generated**
   - Run `npm run prisma:generate`

4. **Build errors**
   - Check TypeScript compilation
   - Verify all imports are correct
   - Run `npm run lint` to check for issues

### Getting Help

- Check the logs for detailed error messages
- Verify environment variables are set correctly
- Ensure all dependencies are installed
- Check database connectivity and permissions
