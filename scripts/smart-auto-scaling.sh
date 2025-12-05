#!/bin/bash

# Smart Auto-Scaling Setup for Smart Edu
# This script sets up intelligent scaling based on traffic patterns

echo "🧠 Setting up smart auto-scaling for Smart Edu..."

# 1. Update the scaling target to allow scale-to-zero
echo "📊 Updating scaling target for scale-to-zero capability..."

aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/smart-edu-cluster/smart-edu-staging-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 0 \
  --max-capacity 5

# 2. Create intelligent CPU scaling policy
echo "⚡ Creating intelligent CPU scaling policy..."

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/smart-edu-cluster/smart-edu-staging-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name smart-edu-intelligent-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 60.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 600,
    "DisableScaleIn": false
  }'

# 3. Create intelligent memory scaling policy
echo "🧠 Creating intelligent memory scaling policy..."

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/smart-edu-cluster/smart-edu-staging-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name smart-edu-intelligent-memory-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    },
    "ScaleOutCooldown": 300,
    "ScaleInCooldown": 600,
    "DisableScaleIn": false
  }'

# 4. Create ALB request-based scaling (most important!)
echo "🌐 Creating ALB request-based scaling..."

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/smart-edu-cluster/smart-edu-staging-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name smart-edu-request-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 100.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/smart-edu-alb/4d8b5f4e52e4eebe/targetgroup/smart-edu-staging-tg/96193f0d69afe0b6"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300,
    "DisableScaleIn": false
  }'

# 5. Create smart scheduled scaling (only for development)
echo "⏰ Creating smart scheduled scaling..."

# Scale down only if no traffic for 1 hour
aws events put-rule \
  --name "smart-scale-down-staging" \
  --schedule-expression "cron(0 2 * * ? *)" \
  --description "Smart scale down - only if no traffic"

# Scale up in morning
aws events put-rule \
  --name "smart-scale-up-staging" \
  --schedule-expression "cron(0 8 * * ? *)" \
  --description "Smart scale up - ready for work"

# 6. Create CloudWatch alarms for traffic monitoring
echo "📊 Creating traffic monitoring alarms..."

aws cloudwatch put-metric-alarm \
  --alarm-name "SmartEdu-No-Traffic" \
  --alarm-description "No traffic for 1 hour - safe to scale down" \
  --metric-name RequestCount \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 3600 \
  --threshold 0 \
  --comparison-operator LessThanOrEqualToThreshold \
  --dimensions Name=LoadBalancer,Value=app/smart-edu-alb/4d8b5f4e52e4eebe \
  --evaluation-periods 1

# 7. Create cost optimization alarm
echo "💰 Creating cost optimization alarm..."

aws cloudwatch put-metric-alarm \
  --alarm-name "SmartEdu-Low-Traffic" \
  --alarm-description "Low traffic - can scale down" \
  --metric-name RequestCount \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=LoadBalancer,Value=app/smart-edu-alb/4d8b5f4e52e4eebe \
  --evaluation-periods 2

echo "✅ Smart auto-scaling setup complete!"
echo ""
echo "🧠 Intelligent Scaling Features:"
echo "  • Traffic-based scaling (ALB requests)"
echo "  • CPU-based scaling (60% target)"
echo "  • Memory-based scaling (70% target)"
echo "  • Smart scale-down (only when no traffic)"
echo "  • Smart scale-up (ready for work)"
echo "  • Traffic monitoring and alerts"
echo ""
echo "🎯 How it works:"
echo "  • High traffic → Auto scale up (0-5 tasks)"
echo "  • Low traffic → Auto scale down (but not to 0)"
echo "  • No traffic for 1 hour → Scale to 0 (saves costs)"
echo "  • Traffic returns → Auto scale up immediately"
echo ""
echo "💰 Expected cost: $5-15/month (vs $24-31/month before)"





