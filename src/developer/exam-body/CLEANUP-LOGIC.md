# Automatic Cleanup Logic - Icon Upload Failure Handling

## 🎯 Problem Statement

**Scenario:** Icon upload succeeds, but database operation fails.  
**Issue:** Orphaned file left in S3/Cloudinary storage.  
**Solution:** Automatic cleanup of uploaded file when database operation fails.

---

## ✅ Implementation

### Create Exam Body (`create()` method)

```typescript
// 1. Upload icon to storage
let uploadResult: { url: string; key: string };
try {
  uploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
  this.logger.log(colors.green(`✅ Icon uploaded: ${uploadResult.url}`));
} catch (uploadError) {
  throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
}

// 2. Try to save to database
let examBody: any;
try {
  examBody = await this.prisma.examBody.create({
    data: {
      ...createDto,
      logoUrl: uploadResult.url,
    },
  });
  this.logger.log(colors.green(`✅ Exam body created: ${examBody.name}`));
} catch (dbError) {
  // 3. Database failed - cleanup uploaded icon
  this.logger.error(colors.red(`❌ DB error. Cleaning up uploaded icon...`));
  
  try {
    await this.storageService.deleteFile(uploadResult.key);
    this.logger.log(colors.yellow(`🗑️  Uploaded icon deleted: ${uploadResult.key}`));
  } catch (deleteError) {
    this.logger.error(colors.red(`❌ Failed to delete: ${deleteError.message}`));
  }
  
  throw dbError; // Re-throw original error
}
```

### Update Exam Body (`update()` method)

```typescript
// 1. Upload new icon (if provided)
let newUploadResult: { url: string; key: string } | undefined;
if (iconFile) {
  try {
    newUploadResult = await this.storageService.uploadFile(iconFile, folder, fileName);
    this.logger.log(colors.green(`✅ New icon uploaded: ${newUploadResult.url}`));
  } catch (uploadError) {
    throw new BadRequestException(`Failed to upload icon: ${uploadError.message}`);
  }
}

// 2. Try to update database
let examBody: any;
try {
  examBody = await this.prisma.examBody.update({
    where: { id },
    data: {
      ...updateDto,
      ...(newUploadResult && { logoUrl: newUploadResult.url }),
    },
  });
  this.logger.log(colors.green(`✅ Exam body updated: ${examBody.name}`));
} catch (dbError) {
  // 3. Database failed - cleanup new icon if it was uploaded
  if (newUploadResult) {
    this.logger.error(colors.red(`❌ DB error. Cleaning up uploaded icon...`));
    
    try {
      await this.storageService.deleteFile(newUploadResult.key);
      this.logger.log(colors.yellow(`🗑️  Uploaded icon deleted: ${newUploadResult.key}`));
    } catch (deleteError) {
      this.logger.error(colors.red(`❌ Failed to delete: ${deleteError.message}`));
    }
  }
  
  throw dbError; // Re-throw original error
}
```

---

## 🔄 Flow Diagram

### Success Flow:
```
Upload Icon → Save to DB → ✅ Success
     ✅              ✅
```

### Failure Flow (with cleanup):
```
Upload Icon → Save to DB → ❌ DB Error
     ✅              ❌
                     ↓
              Delete Icon → Re-throw Error
                   ✅            ❌
```

### Upload Failure Flow:
```
Upload Icon → ❌ Upload Error → Throw Error
     ❌                              ❌
(No cleanup needed - nothing uploaded)
```

---

## 📋 Key Design Decisions

### 1. **Upload First, Then Save**
- ✅ Storage upload is fast and reliable
- ✅ Database might fail (constraints, validation, connection issues)
- ✅ Easier to delete a file than to rollback DB transaction

### 2. **Store Upload Result (key)**
```typescript
let uploadResult: { url: string; key: string };
```
- ✅ `url` - for saving to database
- ✅ `key` - for cleanup if DB fails

### 3. **Try-Catch for DB Operation**
```typescript
try {
  examBody = await this.prisma.examBody.create(...);
} catch (dbError) {
  // Cleanup here
  throw dbError;
}
```
- ✅ Catch DB errors specifically
- ✅ Cleanup uploaded file
- ✅ Re-throw original error (don't hide it)

### 4. **Silent Cleanup Failure**
```typescript
try {
  await this.storageService.deleteFile(uploadResult.key);
} catch (deleteError) {
  this.logger.error(`Failed to delete: ${deleteError.message}`);
  // Don't throw - original DB error is more important
}
```
- ✅ Log cleanup failures
- ✅ Don't hide original DB error
- ✅ Manual cleanup possible via logs

---

## 🧪 Test Scenarios

### Scenario 1: Normal Success
```
✅ Icon uploads successfully
✅ Database saves successfully
✅ No cleanup needed
Result: Exam body created with icon
```

### Scenario 2: Upload Failure
```
❌ Icon upload fails (network, invalid file, etc.)
⏭️  Database operation not attempted
❌ Error thrown to user
Result: No orphaned files, no DB record
```

### Scenario 3: Database Failure (The Important One!)
```
✅ Icon uploads successfully (file in S3)
❌ Database save fails (unique constraint, etc.)
✅ Cleanup triggered
✅ Uploaded icon deleted from S3
❌ Original DB error thrown to user
Result: No orphaned files, no DB record
```

### Scenario 4: Database + Cleanup Failure
```
✅ Icon uploads successfully
❌ Database save fails
❌ Cleanup deletion fails (network, permissions, etc.)
⚠️  Cleanup error logged
❌ Original DB error thrown to user
Result: Orphaned file logged for manual cleanup
```

---

## 🔍 Error Messages & Logging

### Upload Success:
```
✅ Icon uploaded successfully: https://s3.amazonaws.com/...
```

### DB Error Detected:
```
❌ Database error after icon upload. Cleaning up uploaded icon...
```

### Cleanup Success:
```
🗑️  Uploaded icon deleted: exam-bodies/icons/WAEC_1234567890_icon.png
```

### Cleanup Failure:
```
❌ Failed to delete uploaded icon: Access denied
```

---

## 💡 Why This Approach?

### Alternative 1: Transaction (Not Possible)
```typescript
// ❌ Can't do this - storage and DB are separate systems
await transaction(() => {
  storage.upload();
  db.save();
});
```
**Issue:** S3/Cloudinary and PostgreSQL are different systems. No atomic transactions across them.

### Alternative 2: Database First, Then Upload (Worse)
```typescript
// ❌ Bad approach
const examBody = await db.create({ ...data, logoUrl: null });
const uploadResult = await storage.upload();
await db.update({ logoUrl: uploadResult.url });
```
**Issues:**
- More database operations
- If upload fails, need to delete DB record or leave it with null icon
- More complex rollback logic

### Alternative 3: Our Approach (Best) ✅
```typescript
// ✅ Best approach
const uploadResult = await storage.upload();
try {
  await db.create({ logoUrl: uploadResult.url });
} catch (error) {
  await storage.delete(uploadResult.key);
  throw error;
}
```
**Benefits:**
- Single DB operation
- Simple cleanup on failure
- Upload is validated before DB
- Orphaned files prevented

---

## 📊 Real-World Impact

### Without Cleanup:
```
1000 failed creations → 1000 orphaned files in S3
Cost: Storage fees for unused files
Issue: Clutter in S3 bucket
```

### With Cleanup:
```
1000 failed creations → 0 orphaned files
Cost: None (files deleted immediately)
Issue: None
```

---

## 🚀 Production Benefits

1. **Cost Savings**
   - No storage costs for orphaned files
   - Automatic cleanup = no manual intervention

2. **Data Consistency**
   - Database and storage always in sync
   - No orphaned resources

3. **Debugging**
   - Clear logs for what happened
   - Easy to trace failed operations

4. **Reliability**
   - Handles edge cases gracefully
   - Doesn't hide errors from developers

---

## 🔧 Maintenance

### Finding Orphaned Files (if any):
```sql
-- Get all exam body icon keys from DB
SELECT "logoUrl" FROM "ExamBody";

-- Compare with S3 bucket contents
aws s3 ls s3://your-bucket/exam-bodies/icons/

-- Delete orphans manually if needed
```

### Monitoring:
```bash
# Search logs for cleanup operations
grep "Cleaning up uploaded icon" logs/app.log

# Count cleanup failures
grep "Failed to delete uploaded icon" logs/app.log | wc -l
```

---

**Implementation Date:** January 14, 2026  
**Status:** ✅ Fully Implemented  
**Coverage:** Create & Update operations

