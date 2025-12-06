# S3 Bucket Policy Setup for Public Access

## Overview
To make uploaded files publicly accessible forever, you need to configure a bucket policy on your S3 bucket.

## Step 1: Go to Your S3 Bucket

1. Open [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click on your bucket (e.g., `smart-edu-staging-bucket`)
3. Go to the **Permissions** tab

## Step 2: Disable Block Public Access (REQUIRED FIRST!)

**⚠️ IMPORTANT: You MUST do this BEFORE adding the bucket policy, otherwise you'll get an error.**

1. In the **Permissions** tab, scroll to **Block public access (bucket settings)**
2. Click **Edit**
3. **Uncheck ALL 4 boxes**:
   - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
   - ❌ Block public and cross-account access to buckets and objects through any public bucket or access point policies
4. Type `confirm` in the confirmation box
5. Click **Save changes**

## Step 3: Edit Bucket Policy

1. Scroll down to **Bucket policy**
2. Click **Edit**
3. Paste the following policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

**Example for `smart-edu-staging-bucket`:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::smart-edu-staging-bucket/*"
    }
  ]
}
```

## Step 4: Verify

After setting up the policy, your files will be publicly accessible via URLs like:
```
https://smart-edu-staging-bucket.s3.us-east-1.amazonaws.com/path/to/file.jpg
```

## Security Considerations

⚠️ **Important**: This makes ALL files in the bucket publicly readable. If you need more security:

1. Use presigned URLs instead (temporary access)
2. Use CloudFront with signed URLs
3. Implement application-level authentication
4. Use separate buckets for public vs private files

## For Multiple Buckets

If you have multiple buckets (dev, staging, prod), apply the same policy to each bucket with the respective bucket name.

