# 🐳 Docker Setup Guide for Smart Edu Backend

This guide provides comprehensive instructions for dockerizing the Smart Edu Backend application with both development and production configurations.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🛠 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- Basic knowledge of Docker and Docker Compose

## 📁 Project Structure

```
smart-edu-backend/
├── Dockerfile                 # Production multi-stage build
├── Dockerfile.dev            # Development build with hot reload
├── docker-compose.dev.yml    # Development environment
├── docker-compose.prod.yml   # Production environment
├── .dockerignore             # Docker build context exclusions
├── nginx/
│   └── nginx.conf            # Nginx reverse proxy configuration
├── scripts/
│   └── backup.sh             # Database backup script
├── env.example               # Environment variables template
└── DOCKER_SETUP.md          # This documentation
```

## 🚀 Development Setup

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd smart-edu-backend

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### 2. Start Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### 3. Development Services

The development environment includes:

- **App**: NestJS application with hot reload
- **PostgreSQL**: Database on port 5434
- **Redis**: Cache and session store on port 6379
- **Prisma Studio**: Database GUI on port 5555

### 4. Database Operations

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate

# Seed database
docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed

# Open Prisma Studio
# Visit: http://localhost:5555
```

### 5. Development URLs

- **API**: http://localhost:1000/api/v1
- **API Docs**: http://localhost:1000/api/docs
- **Prisma Studio**: http://localhost:5555
- **Database**: localhost:5434

## 🏭 Production Setup

### 1. Environment Configuration

```bash
# Copy and configure production environment
cp env.example .env.prod

# Edit production variables
nano .env.prod
```

### 2. Build and Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Production Services

The production environment includes:

- **App**: Optimized NestJS application
- **PostgreSQL**: Production database
- **Redis**: Cache and session store
- **Nginx**: Reverse proxy and load balancer
- **Backup**: Automated database backups

### 4. SSL Configuration (Optional)

For HTTPS in production:

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy your SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Uncomment HTTPS server block in nginx.conf
```

### 5. Production URLs

- **API**: http://your-domain.com/api/v1
- **API Docs**: http://your-domain.com/api/docs
- **Health Check**: http://your-domain.com/health

## ⚙️ Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password
POSTGRES_DB=smart_edu_prod

# Application
NODE_ENV=production
PORT=1000
JWT_SECRET=your-super-secret-jwt-key

# External Services
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key
```

### Environment-Specific Variables

#### Development
```bash
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Production
```bash
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🗄️ Database Management

### Migrations

```bash
# Development
docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate

# Production
docker-compose -f docker-compose.prod.yml exec app npm run prisma:migrate
```

### Seeding

```bash
# Development
docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed

# Production (be careful!)
docker-compose -f docker-compose.prod.yml exec app npm run prisma:seed
```

### Backups

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh

# Automated backups (configure cron)
# Add to crontab: 0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh
```

### Database Access

```bash
# Connect to database
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d smart-edu-db

# Production database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d smart_edu_prod
```

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 app
```

### Health Checks

```bash
# Check service health
docker-compose -f docker-compose.prod.yml ps

# Test API health
curl http://localhost:1000/api/v1/health
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats smart-edu-prod-app
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :1000

# Kill the process or change port in docker-compose.yml
```

#### 2. Database Connection Issues

```bash
# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

#### 3. Build Failures

```bash
# Clean build
docker-compose -f docker-compose.prod.yml build --no-cache

# Remove unused images
docker system prune -a
```

#### 4. Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Rebuild with proper permissions
docker-compose -f docker-compose.dev.yml build --no-cache
```

### Debug Mode

```bash
# Run container in debug mode
docker-compose -f docker-compose.dev.yml run --rm app sh

# Check container environment
docker-compose -f docker-compose.dev.yml exec app env
```

## 🏆 Best Practices

### Security

1. **Never commit `.env` files**
2. **Use strong passwords and secrets**
3. **Enable SSL in production**
4. **Regular security updates**
5. **Limit container privileges**

### Performance

1. **Use multi-stage builds**
2. **Optimize Docker layers**
3. **Use `.dockerignore`**
4. **Monitor resource usage**
5. **Implement health checks**

### Maintenance

1. **Regular backups**
2. **Monitor logs**
3. **Update dependencies**
4. **Clean up unused images**
5. **Document changes**

### Development

1. **Use development compose file**
2. **Enable hot reload**
3. **Use volume mounts for code**
4. **Separate dev/prod configs**
5. **Test in production-like environment**

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all services are healthy
4. Check network connectivity
5. Review this documentation

For additional help, please refer to the project's main README or create an issue in the repository.
