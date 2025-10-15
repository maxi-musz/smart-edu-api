# 🚀 Quick Start Guide - Smart Edu Backend

**When you come back to this project after months, follow this exact order:**

## 📋 **Step 1: Check if Docker is Running**
```bash
docker --version
# If not installed, install Docker Desktop
```

## 📋 **Step 2: Start Development Environment**
```bash
# Option A: Use the simple command
make dev

# Option B: If make doesn't work
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 **Step 3: Check if Everything is Working**
```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# Test the API
curl http://localhost:1000/api/v1/health
```

## 📋 **Step 4: Access Your Application**
- **API**: http://localhost:1000/api/v1
- **API Docs**: http://localhost:1000/api/docs
- **Database GUI**: http://localhost:5555

## 🛠 **Common Commands You'll Need**

| What you want to do | Command |
|---------------------|---------|
| Start development | `make dev` |
| Stop everything | `make dev-stop` |
| View logs | `make dev-logs` |
| Restart app | `make dev-restart` |
| Run database migrations | `make db-migrate` |
| Access container shell | `make shell` |

## 🔧 **If Something Goes Wrong**

1. **Containers won't start?**
   ```bash
   make dev-stop
   make dev
   ```

2. **API not responding?**
   ```bash
   make dev-logs
   ```

3. **Database issues?**
   ```bash
   make db-migrate
   ```

4. **Environment variables changed?**
   ```bash
   make dev-restart
   ```

## 🚀 **For Production Deployment**

1. Create production environment:
   ```bash
   cp env.production.example .env.prod
   # Edit .env.prod with your values
   ```

2. Deploy:
   ```bash
   make prod-deploy
   ```

## 📁 **Important Files Explained**

| File | Purpose |
|------|---------|
| `.env` | Your development environment variables |
| `docker-compose.dev.yml` | Development setup |
| `docker-compose.prod.yml` | Production setup |
| `Makefile` | All the commands you need |
| `01-QUICK_START.md` | This file (read this first!) |
| `02-FILE_STRUCTURE.md` | Overview of all files |

## 📚 **More Documentation**

- `03-DOCKER_SETUP.md` - Detailed Docker setup
- `04-DOCKER_SUMMARY.md` - What was implemented  
- `05-PRODUCTION_DEPLOYMENT.md` - Production deployment

## ❓ **Still Confused?**

Just run: `make help` - it shows all available commands.

---

**That's it! This is all you need to know to get started.**
