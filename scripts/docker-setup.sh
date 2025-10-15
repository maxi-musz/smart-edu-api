#!/bin/bash

# Smart Edu Backend Docker Setup Script
# This script helps you quickly set up the Docker environment

set -e

echo "🐳 Smart Edu Backend Docker Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_status "Created .env file from env.example"
        print_warning "Please edit .env file with your configuration before continuing"
        echo ""
        echo "Press Enter to continue after editing .env file..."
        read
    else
        print_status ".env file exists"
    fi
}

# Setup development environment
setup_dev() {
    print_info "Setting up development environment..."
    
    # Build and start development containers
    docker-compose -f docker-compose.dev.yml up -d --build
    
    print_status "Development environment started"
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    print_info "Running database migrations..."
    docker-compose -f docker-compose.dev.yml exec app npm run prisma:migrate
    
    # Seed database
    print_info "Seeding database..."
    docker-compose -f docker-compose.dev.yml exec app npm run prisma:seed
    
    print_status "Development environment setup complete!"
}

# Setup production environment
setup_prod() {
    print_info "Setting up production environment..."
    
    # Build and start production containers
    docker-compose -f docker-compose.prod.yml up -d --build
    
    print_status "Production environment started"
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 15
    
    # Run migrations
    print_info "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec app npm run prisma:migrate
    
    print_status "Production environment setup complete!"
}

# Show status
show_status() {
    echo ""
    print_info "Container Status:"
    docker-compose -f docker-compose.dev.yml ps
}

# Show URLs
show_urls() {
    echo ""
    print_info "Application URLs:"
    echo "  API: http://localhost:1000/api/v1"
    echo "  API Docs: http://localhost:1000/api/docs"
    echo "  Prisma Studio: http://localhost:5555"
    echo "  Health Check: http://localhost:1000/api/v1/health"
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1) Setup development environment"
    echo "2) Setup production environment"
    echo "3) Show container status"
    echo "4) View logs"
    echo "5) Stop all containers"
    echo "6) Clean up (remove containers and volumes)"
    echo "7) Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
}

# View logs
view_logs() {
    echo ""
    echo "Which logs would you like to view?"
    echo "1) All logs"
    echo "2) App logs only"
    echo "3) Database logs only"
    echo "4) Redis logs only"
    echo ""
    read -p "Enter your choice (1-4): " log_choice
    
    case $log_choice in
        1) docker-compose -f docker-compose.dev.yml logs -f ;;
        2) docker-compose -f docker-compose.dev.yml logs -f app ;;
        3) docker-compose -f docker-compose.dev.yml logs -f postgres ;;
        4) docker-compose -f docker-compose.dev.yml logs -f redis ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Stop containers
stop_containers() {
    print_info "Stopping all containers..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.prod.yml down
    print_status "All containers stopped"
}

# Clean up
cleanup() {
    print_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -p "> " confirm
    
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        print_info "Cleaning up..."
        docker-compose -f docker-compose.dev.yml down -v
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -f
        print_status "Cleanup complete"
    else
        print_info "Cleanup cancelled"
    fi
}

# Main execution
main() {
    check_docker
    check_env_file
    
    while true; do
        show_menu
        
        case $choice in
            1)
                setup_dev
                show_urls
                ;;
            2)
                setup_prod
                ;;
            3)
                show_status
                ;;
            4)
                view_logs
                ;;
            5)
                stop_containers
                ;;
            6)
                cleanup
                ;;
            7)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        echo "Press Enter to continue..."
        read
    done
}

# Run main function
main
