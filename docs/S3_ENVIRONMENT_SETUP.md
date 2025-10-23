# S3 Environment-Specific Bucket Setup

## Overview
Smart Edu backend now uses environment-specific S3 buckets to ensure data isolation between development, staging, and production environments.

## Bucket Structure
```
smart-edu-subjects-dev      # Development environment
smart-edu-subjects-staging  # Staging environment  
smart-edu-subjects-prod     # Production environment
```

## Environment Variables Required

### GitHub Secrets (Repository Settings)
Add these secrets to your GitHub repository:

```bash
# S3 Bucket Names
AWS_S3_BUCKET_DEV=smart-edu-subjects-dev
AWS_S3_BUCKET_STAGING=smart-edu-subjects-staging
AWS_S3_BUCKET_PROD=smart-edu-subjects-prod

# Database URLs (if using separate DBs)
DATABASE_URL_STAGING=postgresql://user:pass@host:port/staging_db
DATABASE_URL_PRODUCTION=postgresql://user:pass@host:port/production_db
```

### Local Development (.env)
```bash
# For local development
NODE_ENV=development
AWS_S3_BUCKET_DEV=smart-edu-subjects-dev
AWS_S3_BUCKET_STAGING=smart-edu-subjects-staging
AWS_S3_BUCKET_PROD=smart-edu-subjects-prod
```

## How It Works

### 1. Dynamic Bucket Selection
The S3 service automatically selects the correct bucket based on `NODE_ENV`:

```typescript
// S3Service automatically chooses:
// - smart-edu-subjects-dev for NODE_ENV=development
// - smart-edu-subjects-staging for NODE_ENV=staging  
// - smart-edu-subjects-prod for NODE_ENV=production
```

### 2. Fallback Strategy
If environment-specific bucket is not configured, it falls back to:
1. Default bucket for that environment
2. Any available environment bucket
3. Generic `AWS_S3_BUCKET` (legacy support)

### 3. GitHub Actions Integration
The deployment workflow now passes all bucket environment variables to ECS tasks:

```yaml
# Staging deployment gets:
AWS_S3_BUCKET_STAGING=smart-edu-subjects-staging
AWS_S3_BUCKET_PROD=smart-edu-subjects-prod
AWS_S3_BUCKET_DEV=smart-edu-subjects-dev

# Production deployment gets:
AWS_S3_BUCKET_STAGING=smart-edu-subjects-staging
AWS_S3_BUCKET_PROD=smart-edu-subjects-prod
AWS_S3_BUCKET_DEV=smart-edu-subjects-dev
```

## Benefits

### 🔒 **Data Isolation**
- Development files won't mix with production data
- Staging can test with realistic data without affecting production
- Clear separation of concerns

### 🚀 **Deployment Safety**
- Staging deployments use staging bucket
- Production deployments use production bucket
- No accidental data overwrites

### 🧪 **Testing**
- Test file uploads in staging without affecting production
- Safe to experiment with new features
- Easy to clean up test data

## AWS IAM Permissions

The `SmartEduAppPolicy` includes permissions for all three buckets:

```json
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject",
        "s3:ListBucket"
    ],
    "Resource": [
        "arn:aws:s3:::smart-edu-subjects-dev",
        "arn:aws:s3:::smart-edu-subjects-dev/*",
        "arn:aws:s3:::smart-edu-subjects-staging", 
        "arn:aws:s3:::smart-edu-subjects-staging/*",
        "arn:aws:s3:::smart-edu-subjects-prod",
        "arn:aws:s3:::smart-edu-subjects-prod/*"
    ]
}
```

## Migration Notes

### Existing Data
If you have existing data in a single bucket, you can:
1. **Copy data** to environment-specific buckets
2. **Keep legacy bucket** as fallback
3. **Gradually migrate** data as needed

### Backward Compatibility
The system maintains backward compatibility:
- If environment-specific bucket is not set, falls back to `AWS_S3_BUCKET`
- Existing code continues to work
- Gradual migration is supported

## Next Steps

1. **Create S3 buckets** in AWS Console:
   - `smart-edu-subjects-dev`
   - `smart-edu-subjects-staging` 
   - `smart-edu-subjects-prod`

2. **Add GitHub secrets** for bucket names

3. **Test deployment** to verify correct bucket usage

4. **Monitor logs** to confirm bucket selection

## Verification

Check deployment logs for:
```
✅ S3 Service initialized for bucket: smart-edu-subjects-staging in region: us-east-1
```

This confirms the correct bucket is being used for each environment.
