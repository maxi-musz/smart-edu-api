# AWS Cost Optimization Guide
**Target: $15-20/month (Similar to Render)**

## Current Costs: ~$28-37/month
- ECS Fargate: $8-12/month
- ALB: $16/month (biggest cost!)
- ECR: $1/month
- CloudWatch: $2-5/month
- S3: $1-3/month

## 🎯 Cost Optimization Strategies

### 1. **Reduce ECS Resources (Save 50%)**
```bash
# Current: 512 CPU, 1024 MB RAM
# Optimized: 256 CPU, 512 MB RAM
./scripts/create-optimized-task-definition.sh staging
```

**Savings: ~$4-6/month**

### 2. **Use Fargate Spot (Save 60-70%)**
```bash
# Update service to use Spot pricing
aws ecs update-service \
  --cluster smart-edu-cluster \
  --service smart-edu-staging-service \
  --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
```

**Savings: ~$5-8/month**

### 3. **Scale Down When Not in Use**
```bash
# Scale to 0 when not developing
aws ecs update-service \
  --cluster smart-edu-cluster \
  --service smart-edu-staging-service \
  --desired-count 0

# Scale back up when needed
aws ecs update-service \
  --cluster smart-edu-cluster \
  --service smart-edu-staging-service \
  --desired-count 1
```

**Savings: ~$8-12/month (when scaled down)**

### 4. **Replace ALB with CloudFront (Save $16/month)**
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**Savings: ~$16/month**

### 5. **Optimize CloudWatch Logs**
```bash
# Set log retention to 7 days (instead of forever)
aws logs put-retention-policy \
  --log-group-name /ecs/smart-edu-backend \
  --retention-in-days 7
```

**Savings: ~$2-3/month**

### 6. **Use S3 Intelligent Tiering**
```bash
# Enable intelligent tiering for S3
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket smart-edu-subjects-staging \
  --id EntireBucket \
  --intelligent-tiering-configuration Id=EntireBucket,Status=Enabled
```

**Savings: ~$1-2/month**

## 🚀 Complete Optimization Setup

### Step 1: Create Optimized Task Definition
```bash
./scripts/create-optimized-task-definition.sh staging
```

### Step 2: Update Service to Use Spot
```bash
aws ecs update-service \
  --cluster smart-edu-cluster \
  --service smart-edu-staging-service \
  --task-definition smart-edu-task-optimized:1 \
  --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
```

### Step 3: Set Up Auto-Scaling
```bash
# Scale down at night (2 AM)
aws events put-rule \
  --name "scale-down-staging" \
  --schedule-expression "cron(0 2 * * ? *)"

# Scale up in morning (8 AM)
aws events put-rule \
  --name "scale-up-staging" \
  --schedule-expression "cron(0 8 * * ? *)"
```

### Step 4: Replace ALB with CloudFront
```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

## 📊 Expected Results

### Before Optimization:
- ECS Fargate: $8-12/month
- ALB: $16/month
- ECR: $1/month
- CloudWatch: $2-5/month
- S3: $1-3/month
- **Total: $28-37/month**

### After Optimization:
- ECS Fargate Spot: $3-5/month
- CloudFront: $1-2/month
- ECR: $1/month
- CloudWatch: $1-2/month
- S3: $1-2/month
- **Total: $7-12/month**

## 🎯 Development vs Production

### Development (24/7):
- Use Spot instances
- Smaller resources
- **Cost: ~$7-12/month**

### Production (24/7):
- Use regular Fargate
- Keep ALB for reliability
- **Cost: ~$20-25/month**

### Development (Part-time):
- Scale to 0 when not coding
- **Cost: ~$3-5/month**

## 🔧 Monitoring Costs

### Set Up Billing Alerts
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "AWS-Billing-Alert" \
  --alarm-description "Alert when AWS costs exceed $20" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold
```

### Cost Monitoring Dashboard
1. Go to AWS Console → Billing Dashboard
2. Set up Cost Explorer
3. Create budgets and alerts
4. Monitor daily costs

## 🎉 Final Result
**Target achieved: $7-15/month (similar to Render's $20/month)**





