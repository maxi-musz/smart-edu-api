# 🚀 GitHub Actions CI/CD Setup Guide

This guide will help you set up automated CI/CD pipelines using GitHub Actions for your Smart Edu Backend project.

## 📋 **Prerequisites**

- GitHub repository with admin access
- AWS account with ECS, ECR, and IAM permissions
- Docker installed locally (for testing)

## 🔧 **Step 1: Repository Secrets Setup**

### **Required Secrets for GitHub Actions:**

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

#### **Environment-Specific Secrets:**

**Staging Environment:**
```
NODE_ENV_STAGING=staging
DATABASE_URL_STAGING=postgresql://username:password@staging-db-host:5432/smart_edu_staging
JWT_SECRET_STAGING=your-staging-jwt-secret-here
EMAIL_USER_STAGING=your-staging-email@example.com
EMAIL_PASSWORD_STAGING=your-staging-email-password
```

**Production Environment:**
```
NODE_ENV_PRODUCTION=production
DATABASE_URL_PRODUCTION=postgresql://username:password@production-db-host:5432/smart_edu_production
JWT_SECRET_PRODUCTION=your-production-jwt-secret-here
EMAIL_USER_PRODUCTION=your-production-email@example.com
EMAIL_PASSWORD_PRODUCTION=your-production-email-password
```

#### **Shared Secrets (Same for Both Environments):**
```
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
CLOUDINARY_API_SECRET=your-cloudinary-secret-here
AWS_ACCESS_KEY_ID=AKIA-your-aws-access-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
PINECONE_API_KEY=pcsk_your-pinecone-api-key-here
```

## 🔍 **How to Find Your ECS Cluster and Service Names:**

### **If You Already Have ECS Clusters:**

1. Go to AWS ECS Console
2. Note down your cluster names
3. Click on each cluster → Services tab
4. Note down your service names

### **If You Need to Create ECS Clusters:**

Follow the AWS ECS setup guide in the documentation.

## 🚀 **Step 2: Workflow Configuration**

The GitHub Actions workflow is already configured in `.github/workflows/DeployApp.yml`. It includes:

- **Code Quality Checks**: Linting, formatting, testing
- **Docker Build**: Builds and pushes to ECR
- **Security Scanning**: Trivy vulnerability scanning
- **Deployment**: Automatic deployment to staging/production
- **Database Migrations**: Automatic schema updates

## 🔄 **Step 3: Branch Strategy**

The workflow triggers on:
- **Push to `main`**: Deploys to production
- **Push to `staging`**: Deploys to staging
- **Push to `develop`**: Deploys to development
- **Manual trigger**: Choose environment via workflow_dispatch

## 🧪 **Step 4: Testing Your Setup**

1. **Create a test branch:**
   ```bash
   git checkout -b test-deployment
   ```

2. **Make a small change:**
   ```bash
   echo "# Test deployment" >> README.md
   git add README.md
   git commit -m "Test deployment"
   git push origin test-deployment
   ```

3. **Check GitHub Actions:**
   - Go to Actions tab in your repository
   - Watch the workflow run
   - Check for any errors

## 🔧 **Step 5: Environment Variables**

Make sure all required secrets are added to your GitHub repository:

### **Required Secrets Checklist:**
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION`
- [ ] `AWS_ACCOUNT_ID`
- [ ] `AWS_S3_BUCKET`
- [ ] `AWS_STAGING_CLUSTER`
- [ ] `AWS_STAGING_SERVICE`
- [ ] `AWS_PRODUCTION_CLUSTER`
- [ ] `AWS_PRODUCTION_SERVICE`
- [ ] `DATABASE_URL_STAGING`
- [ ] `DATABASE_URL_PRODUCTION`
- [ ] `JWT_SECRET`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `OPENAI_API_KEY`
- [ ] `PINECONE_API_KEY`
- [ ] `PINECONE_ENVIRONMENT`
- [ ] `GOOGLE_SMTP_HOST`
- [ ] `GOOGLE_SMTP_PORT`
- [ ] `FRONTEND_URL`
- [ ] `CORS_ORIGINS`
- [ ] `APP_NAME`
- [ ] `BTECH_ADMIN_EMAIL`
- [ ] `OTP_EXPIRES_AT`

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"CannotPullContainerError"**
   - Check if ECR repository exists
   - Verify AWS credentials have ECR permissions
   - Ensure image was pushed successfully

2. **"Task definition not found"**
   - Verify ECS cluster and service names
   - Check AWS credentials have ECS permissions

3. **"Database connection failed"**
   - Verify database URLs are correct
   - Check database is accessible from ECS

### **Debug Steps:**

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test AWS credentials locally
4. Check ECS task logs in AWS Console

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Documentation](https://docs.docker.com/)

## 🎯 **Next Steps**

1. Set up all required secrets
2. Test the deployment pipeline
3. Configure monitoring and alerts
4. Set up production monitoring

---

**Need Help?** Check the troubleshooting section or refer to the main documentation.
