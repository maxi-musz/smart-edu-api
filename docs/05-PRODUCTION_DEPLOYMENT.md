# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Required Before Production:**

1. **Environment Configuration**
   - [ ] Copy `env.production.example` to `.env.prod`
   - [ ] Update all environment variables with production values
   - [ ] Use strong, unique passwords and secrets
   - [ ] Configure production domain names

2. **SSL/TLS Setup**
   - [ ] Obtain SSL certificates (Let's Encrypt recommended)
   - [ ] Configure HTTPS in nginx.conf
   - [ ] Test SSL configuration

3. **Database Setup**
   - [ ] Create production database
   - [ ] Run migrations: `make db-migrate-prod`
   - [ ] Seed initial data if needed

4. **External Services**
   - [ ] Configure production AWS S3 bucket
   - [ ] Set up production email service (SendGrid/AWS SES)
   - [ ] Configure production OpenAI API key
   - [ ] Set up production Pinecone environment

5. **Monitoring & Logging**
   - [ ] Set up Sentry for error tracking
   - [ ] Configure log aggregation
   - [ ] Set up monitoring alerts

## 🔧 Production Deployment Steps

### 1. Environment Setup

```bash
# Copy production environment template
cp env.production.example .env.prod

# Edit with your production values
nano .env.prod
```

### 2. SSL Certificate Setup

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Option 1: Let's Encrypt (Recommended)
# Install certbot and get certificates
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem

# Option 2: Self-signed (Development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem
```

### 3. Enable HTTPS in Nginx

Uncomment the HTTPS server block in `nginx/nginx.conf`:

```nginx
# Uncomment lines 115-171 in nginx/nginx.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... rest of SSL configuration
}
```

### 4. Deploy to Production

```bash
# Build and start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run prisma:migrate

# Check service health
docker-compose -f docker-compose.prod.yml ps
```

### 5. Verify Deployment

```bash
# Test health endpoint
curl https://yourdomain.com/health

# Test API endpoint
curl https://yourdomain.com/api/v1/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔒 Security Considerations

### 1. Environment Variables
- Use strong, unique passwords (minimum 32 characters)
- Rotate secrets regularly
- Never commit `.env.prod` to version control
- Use Docker secrets or external secret management

### 2. Network Security
- Configure firewall rules
- Use VPN for database access
- Implement IP whitelisting if needed
- Enable DDoS protection

### 3. SSL/TLS
- Use strong cipher suites
- Enable HSTS headers
- Implement certificate pinning
- Regular certificate renewal

### 4. Database Security
- Use strong database passwords
- Enable SSL for database connections
- Regular security updates
- Backup encryption

## 📊 Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Check container health
docker-compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats

# Check application logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 2. Database Backups

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh

# Automated backups (add to crontab)
# 0 2 * * * cd /path/to/project && docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh
```

### 3. Updates & Maintenance

```bash
# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Update dependencies
docker-compose -f docker-compose.prod.yml exec app npm update
docker-compose -f docker-compose.prod.yml build --no-cache app
```

## 🚨 Troubleshooting

### Common Issues

1. **SSL Certificate Errors**
   ```bash
   # Check certificate validity
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   
   # Test SSL configuration
   nginx -t
   ```

2. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d smart_edu_prod
   ```

3. **Application Crashes**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs app
   
   # Restart application
   docker-compose -f docker-compose.prod.yml restart app
   ```

## 📈 Performance Optimization

### 1. Resource Limits
- Monitor memory usage and adjust limits
- Scale horizontally if needed
- Use load balancers for high traffic

### 2. Database Optimization
- Regular VACUUM and ANALYZE
- Monitor query performance
- Implement connection pooling

### 3. Caching
- Redis for session storage
- Application-level caching
- CDN for static assets

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
          docker-compose -f docker-compose.prod.yml exec app npm run prisma:migrate
```

## 📞 Support

For production deployment issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs -f`
2. Verify environment variables
3. Test individual services
4. Check network connectivity
5. Review security configurations

Your Smart Edu Backend is now ready for production deployment! 🚀
