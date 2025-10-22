#!/bin/bash

# Setup AWS Resources for Smart Edu Backend
# This script creates the necessary AWS resources for ECS deployment

set -e

echo "🚀 Setting up AWS resources for Smart Edu Backend..."

# Get AWS Account ID and Region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}

echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Create CloudWatch Log Group
echo "📝 Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name "/ecs/smart-edu-backend" \
  --region $AWS_REGION \
  || echo "Log group already exists"

# Create ECS Cluster (if it doesn't exist)
echo "📝 Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name smart-edu-backend-cluster \
  --region $AWS_REGION \
  || echo "Cluster already exists"

# Create ECS Service (if it doesn't exist)
echo "📝 Creating ECS service..."
aws ecs create-service \
  --cluster smart-edu-backend-cluster \
  --service-name smart-edu-backend-service \
  --task-definition smart-edu-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-12345],securityGroups=[sg-12345],assignPublicIp=ENABLED}" \
  --region $AWS_REGION \
  || echo "Service already exists or needs VPC configuration"

echo "✅ AWS resources setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the VPC configuration in the ECS service"
echo "2. Add your GitHub secrets for AWS deployment"
echo "3. Run the GitHub Actions workflow again"
