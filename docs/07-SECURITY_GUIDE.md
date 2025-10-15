# 🔒 Security Guide

## 🚨 **Critical: Never Commit Secrets!**

This guide helps you avoid accidentally committing sensitive information like API keys, passwords, and database credentials.

## ✅ **What's Protected by .gitignore**

Your `.gitignore` file now protects these sensitive files:

```bash
# Environment files (contain secrets)
.env
.env.backup
.env.prod
.env.staging
.env.local
.env.development.local
.env.test.local
.env.production.local

# Backup files
backups/
*.backup
*.bak

# SSL certificates
ssl/
*.pem
*.key
*.crt
*.csr

# Docker volumes
docker-volumes/
```

## 🚫 **Never Commit These Files**

### **❌ Environment Files**
- `.env` - Your local development secrets
- `.env.backup` - Backup of environment files
- `.env.prod` - Production secrets
- `.env.staging` - Staging secrets

### **❌ Backup Files**
- `backups/` - Database backups
- `*.backup` - Any backup files
- `*.bak` - Backup files

### **❌ SSL Certificates**
- `ssl/` - SSL certificate directory
- `*.pem` - Certificate files
- `*.key` - Private key files
- `*.crt` - Certificate files

### **❌ Configuration Files with Secrets**
- Files containing API keys
- Files with database passwords
- Files with JWT secrets
- Files with AWS credentials

## ✅ **Safe to Commit**

### **✅ Template Files**
- `env.example` - Template without real values
- `env.staging.example` - Staging template
- `env.production.example` - Production template

### **✅ Configuration Templates**
- Docker compose files (use environment variables)
- Nginx configs (no secrets)
- Scripts (no hardcoded secrets)

## 🔍 **How to Check Before Committing**

### **1. Check What You're About to Commit**
```bash
git add .
git status
# Review the files being committed
```

### **2. Look for Sensitive Patterns**
```bash
# Check for common secret patterns
grep -r "password\|secret\|key\|token" --include="*.env*" .
grep -r "AKIA\|sk-" .  # AWS keys
grep -r "sk-" .        # OpenAI keys
```

### **3. Use Git Hooks (Optional)**
Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Check for secrets before committing
if git diff --cached --name-only | grep -E "\.env$|\.backup$|\.key$|\.pem$"; then
    echo "❌ SECURITY WARNING: You're about to commit sensitive files!"
    echo "Please remove these files from staging:"
    git diff --cached --name-only | grep -E "\.env$|\.backup$|\.key$|\.pem$"
    exit 1
fi
```

## 🚨 **What to Do If You Accidentally Commit Secrets**

### **If You Haven't Pushed Yet**
```bash
# Remove from staging
git reset HEAD <file>

# Remove from last commit
git reset --soft HEAD~1
git reset HEAD <file>
git commit
```

### **If You've Already Pushed**
```bash
# Remove from git history (what we just did)
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch <file>' --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push
git push origin main --force
```

## 🛡️ **Best Practices**

### **1. Use Environment Variables**
```bash
# ❌ Bad - hardcoded in code
const dbPassword = "mysecretpassword";

# ✅ Good - from environment
const dbPassword = process.env.DB_PASSWORD;
```

### **2. Use Template Files**
```bash
# ✅ Create templates without real values
cp env.example .env
# Then edit .env with your real values
```

### **3. Never Share Real .env Files**
- Don't email `.env` files
- Don't share them in chat
- Don't commit them to git
- Use secure sharing methods if needed

### **4. Regular Security Audits**
```bash
# Check for accidentally committed secrets
git log --all --full-history -- .env*
git log --all --full-history -- "*.key"
git log --all --full-history -- "*.pem"
```

## 🔧 **Environment Setup Checklist**

### **Before Starting Development**
- [ ] Copy `env.example` to `.env`
- [ ] Edit `.env` with your real values
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test that `.env` is not tracked by git

### **Before Committing**
- [ ] Run `git status` and review files
- [ ] Check for any `.env*` files in staging
- [ ] Look for backup files
- [ ] Verify no hardcoded secrets in code

### **Before Pushing**
- [ ] Double-check `git status`
- [ ] Ensure no sensitive files are committed
- [ ] Test push to a private repo first (if available)

## 🚨 **Emergency Response**

### **If Secrets Are Exposed**

1. **Immediately Rotate Credentials**
   - Change all API keys
   - Change all passwords
   - Regenerate JWT secrets
   - Update database passwords

2. **Clean Git History**
   - Use the commands above to remove from history
   - Force push to update remote repository

3. **Audit Access**
   - Check who had access to the repository
   - Monitor for suspicious activity
   - Update team on security incident

## 📚 **Additional Resources**

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Push Protection](https://docs.github.com/en/code-security/secret-scanning/working-with-secret-scanning-and-push-protection)
- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management/)

---

## 🎯 **Quick Security Checklist**

```bash
# Before every commit
git status                    # Check what you're committing
grep -r "password\|key" .     # Search for potential secrets
git diff --cached            # Review staged changes

# If you find secrets
git reset HEAD <file>        # Remove from staging
# Edit .gitignore if needed
# Commit safely
```

**Remember: It's better to be overly cautious than to expose secrets!** 🔒
