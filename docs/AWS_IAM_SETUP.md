# AWS IAM Setup Guide

Complete guide to setting up IAM roles and permissions for ECS deployment.

---

## Overview

You need to create **2 IAM roles** for ECS tasks and update **1 IAM user** with deployment permissions.

### What You'll Create

1. **ecsTaskExecutionRole** - Allows ECS to pull Docker images and create logs
2. **ecsTaskRole** - Allows your app to access AWS services (S3, etc.)
3. **Update github-deploy-user** - Add ECS deployment permissions

---

## Part 1: Create ecsTaskExecutionRole

This role allows ECS to pull your Docker images from ECR and write logs to CloudWatch.

### Steps:

1. **Go to AWS Console → IAM**
   - URL: https://console.aws.amazon.com/iam/

2. **Click "Roles" in the left sidebar**

3. **Click "Create role" button**

4. **Select trusted entity:**
   - Choose: **AWS service**
   - Use case: Select **Elastic Container Service**
   - Then select: **Elastic Container Service Task**
   - Click **Next**

5. **Add permissions:**
   - Search for: `AmazonECSTaskExecutionRolePolicy`
   - Check the box next to it
   - Click **Next**

6. **Name the role:**
   - Role name: `ecsTaskExecutionRole` (exact name, case-sensitive)
   - Description: `Allows ECS tasks to pull images and create logs`
   - Click **Create role**

### ✅ Verification:
- Go to Roles → Search for `ecsTaskExecutionRole`
- You should see it with the `AmazonECSTaskExecutionRolePolicy` attached

---

## Part 2: Create ecsTaskRole

This role allows your running application to access AWS services like S3, Secrets Manager, etc.

### Step 2.1: Create the Policy First

1. **Go to AWS Console → IAM → Policies** (in the left sidebar)

2. **Click "Create policy" button** (top right)

3. **Click the "JSON" tab**

4. **Delete the default content and paste this policy:**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
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
        },
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:*:*:secret:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:DescribeRepositories",
                "ecr:DescribeImages",
                "ecr:BatchDeleteImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage",
                "ecr:ListImages",
                "ecr:GetRepositoryPolicy",
                "ecr:GetRegistryPolicy",
                "ecr:PutImageTagMutability"
            ],
            "Resource": "*"
        }
    ]
}
```

5. **Note:** This policy includes permissions for:
   - **S3:** All three environment buckets (development, staging, production)
   - **Secrets Manager:** To access environment variables
   - **ECR:** To pull Docker images from your container registry

6. **Click "Next"**

7. **Policy details:**
   - Policy name: `SmartEduAppPolicy`
   - Description: `Allows Smart Edu app to access S3 and Secrets Manager`
   - Click **Create policy**

### Step 2.2: Create the Role

1. **Go to AWS Console → IAM → Roles** (in the left sidebar)

2. **Click "Create role" button**

3. **Select trusted entity:**
   - Choose: **AWS service**
   - Use case: Select **Elastic Container Service**
   - Then select: **Elastic Container Service Task**
   - Click **Next**

4. **Add permissions:**
   - Search for: `SmartEduAppPolicy` (the policy you just created)
   - Check the box next to it
   - Click **Next**

5. **Name the role:**
   - Role name: `ecsTaskRole` (exact name, case-sensitive)
   - Description: `Allows Smart Edu app to access S3 and other AWS services`
   - Click **Create role**

### ✅ Verification:
- Go to Roles → Search for `ecsTaskRole`
- Click on it → Permissions tab → You should see `SmartEduAppPolicy`

---

## Part 3: Update github-deploy-user Permissions

Add ECS deployment permissions to your existing IAM user.

### Steps:

1. **Go to AWS Console → IAM → Users**

2. **Click on `github-deploy-user`**

3. **Go to "Permissions" tab**

4. **Click "Add permissions" → "Attach policies directly"**

5. **Search and select these policies:**
   
   ☑️ **AmazonECS_FullAccess** (AWS managed policy)
   - Allows creating and managing ECS clusters, services, tasks
   
   ☑️ **IAMReadOnlyAccess** (AWS managed policy)
   - Allows reading IAM roles (needed to verify roles exist)
   
   ☑️ **CloudWatchLogsFullAccess** (AWS managed policy)
   - Allows creating and managing CloudWatch log groups

6. **Click "Next" → "Add permissions"**

### Alternative: Create Custom Policy (More Secure)

Instead of full access policies, create a custom policy with minimal permissions:

1. **Click "Add permissions" → "Create inline policy"**

2. **Click JSON tab and paste:**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ECSDeployment",
            "Effect": "Allow",
            "Action": [
                "ecs:RegisterTaskDefinition",
                "ecs:DeregisterTaskDefinition",
                "ecs:DescribeTaskDefinition",
                "ecs:ListTaskDefinitions",
                "ecs:CreateCluster",
                "ecs:DescribeClusters",
                "ecs:DeleteCluster",
                "ecs:ListClusters",
                "ecs:CreateService",
                "ecs:UpdateService",
                "ecs:DeleteService",
                "ecs:DescribeServices",
                "ecs:ListServices"
            ],
            "Resource": "*"
        },
        {
            "Sid": "IAMPassRole",
            "Effect": "Allow",
            "Action": [
                "iam:GetRole",
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::429100832717:role/ecsTaskExecutionRole",
                "arn:aws:iam::429100832717:role/ecsTaskRole"
            ]
        },
        {
            "Sid": "CloudWatchLogs",
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ECRAccess",
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:DescribeImages",
                "ecr:ListImages",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        }
    ]
}
```

3. **Policy name:** `GitHubECSDeploymentPolicy`

4. **Click "Create policy"**

### ✅ Verification:

Run these commands to verify:

```bash
# Should show your user info
aws sts get-caller-identity

# Should list ECS clusters (empty list is OK)
aws ecs list-clusters

# Should succeed
aws iam get-role --role-name ecsTaskExecutionRole

# Should succeed
aws iam get-role --role-name ecsTaskRole
```

---

## Part 4: Create ECS Cluster (Before Task Definition)

You need a cluster before you can register a task definition.

### Via AWS Console:

1. **Go to AWS Console → ECS**
   - URL: https://console.aws.amazon.com/ecs/

2. **Click "Clusters" in left sidebar**

3. **Click "Create cluster"**

4. **Cluster configuration:**
   - Cluster name: `smart-edu-staging-cluster`
   - Infrastructure: Select **AWS Fargate (serverless)**
   - Click **Create**

5. **Repeat for production:**
   - Cluster name: `smart-edu-production-cluster`
   - Infrastructure: **AWS Fargate (serverless)**
   - Click **Create**

### Via AWS CLI:

```bash
# Create staging cluster
aws ecs create-cluster --cluster-name smart-edu-staging-cluster --region us-east-1

# Create production cluster
aws ecs create-cluster --cluster-name smart-edu-production-cluster --region us-east-1
```

---

## Part 5: Run the Task Definition Script

Now you're ready to create the task definition!

```bash
# Make script executable
chmod +x scripts/create-ecs-task-definition.sh

# Run the script
./scripts/create-ecs-task-definition.sh
```

---

## Part 6: Create ECS Services

After task definition is created, create the services.

### Via AWS Console:

1. **Go to ECS → Clusters → smart-edu-staging-cluster**

2. **Go to "Services" tab → Click "Create"**

3. **Service configuration:**
   - Launch type: **Fargate**
   - Task Definition: Select `smart-edu-task` (latest)
   - Service name: `smart-edu-staging-service`
   - Desired tasks: `1`

4. **Networking:**
   - VPC: Select your default VPC
   - Subnets: Select all available subnets
   - Security group: Create new or select existing
     - **Important:** Allow inbound on port 3000
   - Public IP: **ENABLED** (for now, until you set up ALB)

5. **Click "Create"**

6. **Repeat for production cluster:**
   - Service name: `smart-edu-production-service`

---

## Troubleshooting

### "Access Denied" errors

**Solution:** Make sure you've added the policies to `github-deploy-user` in Part 3

### "Role does not exist" errors

**Solution:** Verify role names are exactly:
- `ecsTaskExecutionRole` (not ExecutionRole or execution-role)
- `ecsTaskRole` (not TaskRole or task-role)

### "Security group doesn't allow traffic on port 3000"

**Solution:** Edit security group:
1. EC2 → Security Groups → Find your ECS security group
2. Inbound rules → Edit
3. Add rule: Type: Custom TCP, Port: 3000, Source: 0.0.0.0/0

---

## Quick Reference

### Created Resources Checklist

- ☐ IAM Role: `ecsTaskExecutionRole`
- ☐ IAM Role: `ecsTaskRole`
- ☐ IAM Policy: `SmartEduAppPolicy` (attached to ecsTaskRole)
- ☐ IAM User: `github-deploy-user` (updated with ECS permissions)
- ☐ ECS Cluster: `smart-edu-staging-cluster`
- ☐ ECS Cluster: `smart-edu-production-cluster`
- ☐ ECS Task Definition: `smart-edu-task`
- ☐ ECS Service: `smart-edu-staging-service`
- ☐ ECS Service: `smart-edu-production-service`

### GitHub Secrets to Add

After everything is set up, add these to GitHub:

```
AWS_STAGING_CLUSTER = smart-edu-staging-cluster
AWS_STAGING_SERVICE = smart-edu-staging-service
AWS_PRODUCTION_CLUSTER = smart-edu-production-cluster
AWS_PRODUCTION_SERVICE = smart-edu-production-service
```

---

## Next Steps

1. ✅ Complete all steps in this guide
2. ✅ Verify with the commands provided
3. ✅ Run the task definition script
4. ✅ Add GitHub secrets
5. ✅ Push to staging branch to trigger deployment
6. ✅ Monitor deployment in GitHub Actions and AWS ECS Console

