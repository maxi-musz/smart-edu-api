# Smart Edu Backend Docker Management
# Makefile for common Docker operations

.PHONY: help dev prod build clean logs shell db-migrate db-seed db-reset backup

# Default target
help: ## Show this help message
	@echo "Smart Edu Backend Docker Management"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Development environment started!"
	@echo "API: http://localhost:1000/api/v1"
	@echo "API Docs: http://localhost:1000/api/docs"
	@echo "Prisma Studio: http://localhost:5555"

dev-build: ## Build and start development environment
	docker-compose -f docker-compose.dev.yml up -d --build

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-restart: ## Restart development environment
	docker-compose -f docker-compose.dev.yml restart

# Production commands
prod: ## Start production environment
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "Production environment started!"

prod-build: ## Build and start production environment
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

prod-deploy: ## Deploy to production (full deployment script)
	./scripts/deploy-production.sh

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-stop: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-restart: ## Restart production environment
	docker-compose -f docker-compose.prod.yml restart

# Build commands
build: ## Build production image
	docker-compose -f docker-compose.prod.yml build

build-dev: ## Build development image
	docker-compose -f docker-compose.dev.yml build

build-no-cache: ## Build without cache
	docker-compose -f docker-compose.prod.yml build --no-cache

# Database commands
db-migrate: ## Run database migrations
	docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate

db-migrate-prod: ## Run database migrations in production
	docker-compose -f docker-compose.prod.yml exec app npm run prisma:migrate

db-seed: ## Seed database with sample data
	docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed

db-seed-prod: ## Seed production database (use with caution!)
	docker-compose -f docker-compose.prod.yml exec app npm run prisma:seed

db-reset: ## Reset database (development only)
	docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate reset

db-studio: ## Open Prisma Studio
	@echo "Opening Prisma Studio at http://localhost:5555"
	docker-compose -f docker-compose.dev.yml exec app npx prisma studio --hostname 0.0.0.0 --port 5555

# Shell access
shell: ## Access app container shell
	docker-compose -f docker-compose.dev.yml exec app sh

shell-prod: ## Access production app container shell
	docker-compose -f docker-compose.prod.yml exec app sh

db-shell: ## Access database shell
	docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d smart-edu-db

db-shell-prod: ## Access production database shell
	docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d smart_edu_prod

# Backup and restore
backup: ## Create database backup
	docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh

backup-dev: ## Create development database backup
	docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres -d smart-edu-db > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Monitoring and logs
logs: ## View all logs
	docker-compose -f docker-compose.dev.yml logs -f

logs-app: ## View app logs only
	docker-compose -f docker-compose.dev.yml logs -f app

logs-db: ## View database logs only
	docker-compose -f docker-compose.dev.yml logs -f postgres

logs-redis: ## View Redis logs only
	docker-compose -f docker-compose.dev.yml logs -f redis

status: ## Show container status
	docker-compose -f docker-compose.dev.yml ps

status-prod: ## Show production container status
	docker-compose -f docker-compose.prod.yml ps

# Health checks
health: ## Check application health
	@curl -f http://localhost:1000/api/v1/health || echo "Health check failed"

health-prod: ## Check production application health
	@curl -f http://localhost:1000/api/v1/health || echo "Health check failed"

# Cleanup commands
clean: ## Clean up containers and volumes
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v

clean-images: ## Remove unused Docker images
	docker image prune -f

clean-all: ## Remove all unused Docker resources
	docker system prune -a -f

# Utility commands
install: ## Install dependencies in container
	docker-compose -f docker-compose.dev.yml exec app npm install

test: ## Run tests
	docker-compose -f docker-compose.dev.yml exec app npm test

lint: ## Run linter
	docker-compose -f docker-compose.dev.yml exec app npm run lint

format: ## Format code
	docker-compose -f docker-compose.dev.yml exec app npm run format

# Environment setup
setup: ## Initial setup (copy env file and start dev environment)
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "Created .env file from env.example"; \
		echo "Please edit .env file with your configuration"; \
	fi
	@echo "Starting development environment..."
	@make dev

# Quick development workflow
dev-full: setup db-migrate db-seed ## Full development setup
	@echo "Development environment is ready!"
	@echo "API: http://localhost:1000/api/v1"
	@echo "API Docs: http://localhost:1000/api/docs"
	@echo "Prisma Studio: http://localhost:5555"
