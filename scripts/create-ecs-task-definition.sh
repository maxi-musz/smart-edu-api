#!/bin/bash

# Create ECS Task Definition for Smart Edu Backend
# This script creates the initial task definition that GitHub Actions will update

set -e

# Accept environment as parameter (default: staging)
ENVIRONMENT=${1:-staging}

echo "🚀 Creating ECS Task Definition for Smart Edu Backend ($ENVIRONMENT)..."

# Get AWS Account ID and Region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"

# Create the task definition JSON
cat > task-definition.json << EOF
{
  "family": "smart-edu-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "smart-edu-app",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/smart-edu:${ENVIRONMENT}",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "${ENVIRONMENT}"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-create-group": "true",
          "awslogs-group": "/ecs/smart-edu-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

echo "📝 Task definition JSON created"

# Register the task definition
echo "📤 Registering task definition..."
TASK_DEF_ARN=$(aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "✅ Task definition created successfully!"
echo "Task Definition ARN: $TASK_DEF_ARN"

# Clean up
rm task-definition.json

echo "🎉 ECS Task Definition is ready for GitHub Actions deployment!"
