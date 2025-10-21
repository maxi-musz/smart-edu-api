# 🔐 AWS Secrets Manager Setup Guide

This guide will help you set up AWS Secrets Manager to securely store and manage your application secrets.

## 📋 **Prerequisites**

- AWS account with appropriate permissions
- AWS CLI configured locally
- Application secrets ready to store

## 🔧 **Step 1: Create Secrets in AWS Secrets Manager**

### **Using AWS Console:**

1. Go to AWS Secrets Manager Console
2. Click "Store a new secret"
3. Choose "Other type of secret"
4. Add your key-value pairs

### **Using AWS CLI:**

```bash
# Create a secret with your application configuration
aws secretsmanager create-secret \
    --name "smart-edu-backend/secrets" \
    --description "Smart Edu Backend Application Secrets" \
    --secret-string '{
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://username:password@host:5432/database",
    "JWT_SECRET": "your-jwt-secret-here",
    "EMAIL_USER": "your-email@example.com",
    "EMAIL_PASSWORD": "your-email-password",
    "BTECH_ADMIN_EMAIL": "developerr.besttech@gmail.com",
    "OTP_EXPIRES_AT": "24",
    "CLOUDINARY_CLOUD_NAME": "dlfmcah3j",
    "CLOUDINARY_API_KEY": "922444669929244",
    "CLOUDINARY_API_SECRET": "your-cloudinary-secret-here",
    "AWS_ACCESS_KEY_ID": "AKIA-your-aws-access-key-here",
    "AWS_SECRET_ACCESS_KEY": "your-aws-secret-access-key-here",
    "AWS_REGION": "eu-north-1",
    "AWS_S3_BUCKET": "smart-edu-subjects",
    "OPENAI_API_KEY": "sk-proj-your-openai-api-key-here",
    "PINECONE_API_KEY": "pcsk_your-pinecone-api-key-here",
    "PINECONE_ENVIRONMENT": "us-east-1-aws",
    "REDIS_URL": "redis://localhost:6379",
    "LOG_LEVEL": "info",
    "RATE_LIMIT_TTL": "60",
    "RATE_LIMIT_LIMIT": "100"
}'
```

## 🔄 **Step 2: Update Your Application to Use Secrets Manager**

### **Install AWS SDK:**

```bash
npm install @aws-sdk/client-secrets-manager
```

### **Create Secrets Manager Service:**

```typescript
// src/config/secrets-manager.service.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class SecretsManagerService {
  private client: SecretsManagerClient;

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getSecret(secretName: string): Promise<any> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);
      
      if (response.SecretString) {
        return JSON.parse(response.SecretString);
      }
      
      throw new Error('Secret not found');
    } catch (error) {
      console.error('Error retrieving secret:', error);
      throw error;
    }
  }
}
```

### **Update Your Application Configuration:**

```typescript
// src/config/app.config.ts
import { SecretsManagerService } from './secrets-manager.service';

export async function loadSecrets() {
  const secretsManager = new SecretsManagerService();
  
  try {
    const secrets = await secretsManager.getSecret('smart-edu-backend/secrets');
    
    return {
      nodeEnv: secrets.NODE_ENV || 'development',
      databaseUrl: secrets.DATABASE_URL,
      jwtSecret: secrets.JWT_SECRET,
      emailUser: secrets.EMAIL_USER,
      emailPassword: secrets.EMAIL_PASSWORD,
      // ... other configuration
    };
  } catch (error) {
    console.error('Failed to load secrets from AWS Secrets Manager:', error);
    // Fallback to environment variables
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      emailUser: process.env.EMAIL_USER,
      emailPassword: process.env.EMAIL_PASSWORD,
      // ... other configuration
    };
  }
}
```

## 🔐 **Step 3: IAM Permissions**

### **Create IAM Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:smart-edu-backend/*"
    }
  ]
}
```

### **Attach Policy to ECS Task Role:**

1. Go to IAM Console
2. Find your ECS task role
3. Attach the policy created above

## 🚀 **Step 4: Update ECS Task Definition**

### **Add Secrets Manager Access:**

```json
{
  "taskDefinition": {
    "family": "smart-edu-backend",
    "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
    "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
    "containerDefinitions": [
      {
        "name": "smart-edu-backend",
        "image": "YOUR_ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/smart-edu:latest",
        "secrets": [
          {
            "name": "DATABASE_URL",
            "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:smart-edu-backend/secrets:DATABASE_URL::"
          },
          {
            "name": "JWT_SECRET",
            "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:smart-edu-backend/secrets:JWT_SECRET::"
          }
        ]
      }
    ]
  }
}
```

## 🔄 **Step 5: Update GitHub Actions**

### **Remove Secrets from GitHub:**

1. Go to your repository settings
2. Remove the secrets that are now in AWS Secrets Manager
3. Keep only the AWS credentials and ECS configuration

### **Update Workflow:**

The workflow will now use AWS Secrets Manager instead of GitHub secrets for application configuration.

## 🧪 **Step 6: Testing**

### **Local Testing:**

```bash
# Set AWS credentials
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=your-region

# Test secret retrieval
node -e "
const { SecretsManagerService } = require('./dist/config/secrets-manager.service');
const service = new SecretsManagerService();
service.getSecret('smart-edu-backend/secrets').then(console.log);
"
```

### **ECS Testing:**

1. Deploy your updated application
2. Check ECS task logs
3. Verify secrets are loaded correctly

## 🔐 **Security Best Practices**

### **Secret Rotation:**

```bash
# Rotate a secret
aws secretsmanager rotate-secret \
    --secret-id "smart-edu-backend/secrets" \
    --rotation-lambda-arn "arn:aws:lambda:REGION:ACCOUNT_ID:function:rotate-secret"
```

### **Access Logging:**

Enable CloudTrail to log all Secrets Manager API calls:

```bash
aws cloudtrail create-trail \
    --name "secrets-manager-trail" \
    --s3-bucket-name "your-logging-bucket"
```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Access Denied"**
   - Check IAM permissions
   - Verify task role has access

2. **"Secret not found"**
   - Verify secret name and ARN
   - Check AWS region

3. **"Invalid JSON"**
   - Verify secret format
   - Check for special characters

### **Debug Steps:**

1. Check ECS task logs
2. Verify IAM permissions
3. Test secret retrieval locally
4. Check AWS CloudTrail logs

## 📚 **Additional Resources**

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [ECS Task Definition Secrets](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [IAM Policies for Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access.html)

## 🎯 **Next Steps**

1. Set up secret rotation
2. Configure monitoring and alerts
3. Implement secret versioning
4. Set up backup and recovery

---

**Need Help?** Check the troubleshooting section or refer to the main documentation.
