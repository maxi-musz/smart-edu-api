# 🎭 Staging Environment Guide

## 🎯 **What is Staging?**

Staging is your **testing environment** where you can:
- ✅ Test new features before going live
- ✅ Let your team/clients test the application
- ✅ Verify everything works with production-like setup
- ✅ Catch bugs before they reach real users

## 🏗️ **Environment Structure**

```
Development → Staging → Production
     ↓           ↓         ↓
   Your laptop  Team test  Live users
   (localhost)  (shared)   (real world)
```

## 🚀 **Quick Start Staging**

### **1. Setup Staging Environment**
```bash
# Copy staging environment template
cp env.staging.example .env.staging

# Edit with your staging values
nano .env.staging
```

### **2. Deploy to Staging**
```bash
# Option A: Simple deployment
make staging

# Option B: Full deployment with backup
make staging-deploy
```

### **3. Access Staging**
- **API**: http://localhost:2000/api/v1
- **API Docs**: http://localhost:2000/api/docs
- **Load Balancer**: http://localhost:8080
- **Prisma Studio**: http://localhost:5556

## 🔧 **Staging vs Development vs Production**

| Feature | Development | Staging | Production |
|---------|-------------|---------|------------|
| **Port** | 1000 | 2000 | 1000 |
| **Database** | smart-edu-db | smart_edu_staging | smart_edu_prod |
| **Redis** | 6379 | 6380 | 6379 |
| **Purpose** | Your testing | Team testing | Live users |
| **Data** | Sample/test | Real-like | Real users |
| **Monitoring** | Basic | Enhanced | Full |
| **Backups** | Manual | Daily | Hourly |

## 🛠️ **Staging Management Commands**

### **Basic Operations**
```bash
# Start staging
make staging

# Stop staging
make staging-stop

# Restart staging
make staging-restart

# View logs
make staging-logs

# Check status
make status-staging

# Health check
make health-staging
```

### **Database Operations**
```bash
# Run migrations
make db-migrate-staging

# Seed with sample data
make db-seed-staging

# Access database shell
make db-shell-staging

# Create backup
make backup-staging

# Open Prisma Studio
make db-studio-staging
```

### **Container Access**
```bash
# Access app container
make shell-staging

# Access database directly
make db-shell-staging
```

## 🔐 **Staging Configuration**

### **Environment Variables (.env.staging)**
Key differences from development:

```bash
# Different ports to avoid conflicts
APP_PORT=2000
POSTGRES_PORT=5433
REDIS_PORT=6380
NGINX_PORT=8080

# Separate database
POSTGRES_DB=smart_edu_staging
DATABASE_URL=postgresql://postgres:password@localhost:5433/smart_edu_staging

# Separate Redis
REDIS_URL=redis://:password@localhost:6380

# Staging-specific settings
NODE_ENV=staging
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_PRISMA_STUDIO=true
```

### **Separate Services**
- **Database**: Different database name (`smart_edu_staging`)
- **Redis**: Different port (6380)
- **Storage**: Separate S3 bucket for staging
- **API Keys**: Staging/test versions of external services

## 📊 **Staging Features**

### **Enhanced Monitoring**
- Detailed logging enabled
- Health check endpoints
- Performance monitoring
- Error tracking

### **Load Balancing**
- Nginx reverse proxy
- Rate limiting (more lenient than production)
- SSL ready (commented out initially)

### **Automated Backups**
- Daily database backups
- 7-day retention (vs 30 days for production)
- Automatic backup rotation

## 🔄 **Deployment Workflow**

### **Typical Workflow**
1. **Develop** → Test on your laptop (`make dev`)
2. **Stage** → Deploy to staging (`make staging-deploy`)
3. **Test** → Let team/clients test on staging
4. **Fix** → Address any issues found
5. **Deploy** → Push to production (`make prod-deploy`)

### **Staging Deployment Process**
```bash
# 1. Create backup of current staging
make backup-staging

# 2. Pull latest changes
git pull origin main

# 3. Deploy to staging
make staging-deploy

# 4. Verify deployment
make health-staging

# 5. Test critical features
curl http://localhost:2000/api/v1/health
```

## 🚨 **Troubleshooting Staging**

### **Common Issues**

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :2000
   lsof -i :5433
   lsof -i :6380
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   make staging-logs | grep postgres
   
   # Test database connection
   make db-shell-staging
   ```

3. **Application Won't Start**
   ```bash
   # Check application logs
   make staging-logs | grep app
   
   # Restart staging
   make staging-restart
   ```

4. **Environment Variables**
   ```bash
   # Verify .env.staging exists
   ls -la .env.staging
   
   # Check environment variables in container
   make shell-staging
   env | grep NODE_ENV
   ```

## 🔗 **Integration with CI/CD**

### **GitHub Actions Example**
```yaml
name: Deploy to Staging
on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Staging
        run: |
          cp env.staging.example .env.staging
          # Configure staging environment
          make staging-deploy
```

## 📈 **Best Practices**

### **Data Management**
- Use realistic test data (not production data)
- Regular data refresh from production snapshots
- Separate user accounts for staging testing

### **Security**
- Use separate API keys for staging
- Different JWT secrets
- Staging-specific CORS settings

### **Monitoring**
- Set up alerts for staging failures
- Monitor performance metrics
- Track error rates

### **Team Collaboration**
- Document staging access procedures
- Share staging URLs with stakeholders
- Regular staging environment cleanup

## 🎯 **When to Use Staging**

### **Use Staging When:**
- ✅ Testing new features
- ✅ Client demos
- ✅ Team integration testing
- ✅ Performance testing
- ✅ Security testing

### **Don't Use Staging For:**
- ❌ Personal development (use dev environment)
- ❌ Final production testing (use production)
- ❌ Long-term data storage
- ❌ Critical business operations

---

## 🚀 **Quick Commands Summary**

```bash
# Setup staging
cp env.staging.example .env.staging
# Edit .env.staging

# Deploy staging
make staging-deploy

# Access staging
# API: http://localhost:2000/api/v1
# Docs: http://localhost:2000/api/docs

# Manage staging
make staging-logs    # View logs
make staging-stop    # Stop staging
make health-staging  # Health check
```

**Staging is your safety net before production!** 🛡️
