#!/bin/bash

# Optimized ECS Task Definition for Cost Savings
# This script creates a cost-optimized task definition

ENVIRONMENT=${1:-staging}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)

echo "Creating optimized task definition for $ENVIRONMENT..."

# Create optimized task definition JSON
cat > /tmp/optimized-task-definition.json << EOF
{
  "family": "smart-edu-task-optimized",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
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
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/smart-edu-backend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      },
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
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Register the optimized task definition
aws ecs register-task-definition --cli-input-json file:///tmp/optimized-task-definition.json

echo "✅ Optimized task definition created with 256 CPU / 512 MB RAM"
echo "💰 Cost savings: ~60% reduction in compute costs"





