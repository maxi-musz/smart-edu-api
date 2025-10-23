# AWS Services Explained

A practical guide to understanding AWS services used in the Smart Edu Backend deployment.

---

## 📦 ECR (Elastic Container Registry)

### What is ECR?
ECR is AWS's Docker image storage service - like a private Docker Hub for your organization. It stores your application's container images securely in the cloud.

**Think of it as:** A photo album, but for your application versions. Each "photo" is a packaged version of your app ready to run.

### Understanding ECR Images

When you push to ECR, you'll see multiple entries. Here's what they mean:

#### Image Types

**1. Image Index (Manifest)**
- **What it is:** A multi-architecture manifest that points to platform-specific images
- **Purpose:** Allows AWS to automatically select the right image for the server architecture
- **Size:** Usually the largest entry
- **Tags:** Shows your branch name and commit hash (e.g., `staging-27fb0f0`, `staging`)

**2. Platform-Specific Images**
- **AMD64 (linux/amd64):** For Intel/AMD processors (most common)
- **ARM64 (linux/arm64):** For ARM processors (AWS Graviton instances - cheaper and efficient)
- **Why both?** Gives flexibility to run on different server types without rebuilding

**3. Attestation Images**
- **Size:** Very small (0.04 MB)
- **Purpose:** Metadata about the build (who built it, when, from which commit)
- **Why it matters:** Security and traceability

#### Example Breakdown

```
Repository: smart-edu
├── staging-27fb0f0, staging (Image Index) - 230.75 MB
│   ├── linux/amd64 image - 227.97 MB
│   ├── linux/arm64 image - 230.75 MB
│   ├── attestation (amd64) - 0.04 MB
│   └── attestation (arm64) - 0.04 MB
```

#### Image Tags Explained

| Tag Format | Example | Meaning |
|------------|---------|---------|
| `{branch}` | `staging` | Latest image from this branch |
| `{branch}-{sha}` | `staging-27fb0f0` | Specific commit version |
| `main` | `main` | Latest production image |
| `latest` | `latest` | Latest from default branch (main) |

### Why Multiple Images is Good

✅ **Multi-architecture support** - Run on Intel or ARM servers  
✅ **Cost optimization** - Use cheaper ARM-based instances  
✅ **Automatic selection** - AWS picks the right image for your server  
✅ **Version tracking** - Each commit gets a unique tag  
✅ **Rollback capability** - Keep multiple versions for quick rollback

### Common ECR Operations

**View images:**
```bash
aws ecr describe-images --repository-name smart-edu --region us-east-1
```

**Delete old images:**
```bash
aws ecr batch-delete-image --repository-name smart-edu --image-ids imageTag=old-tag
```

**Get repository URI:**
```bash
aws ecr describe-repositories --repository-names smart-edu --query 'repositories[0].repositoryUri' --output text
```

---

## 🚀 ECS (Elastic Container Service)

*Coming soon...*

---

## 📊 CloudWatch

*Coming soon...*

---

## 🔐 Secrets Manager

*Coming soon...*

---

## 🌐 ALB (Application Load Balancer)

*Coming soon...*

---

## 💾 RDS (Relational Database Service)

*Coming soon...*

---

## 📝 Notes

- This document is a living reference - add new services as you encounter them
- Screenshots and examples help clarify concepts
- Keep explanations brief but complete enough to understand independently

