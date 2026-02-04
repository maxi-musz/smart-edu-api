# AWS MediaConvert Setup for HLS Transcoding

Use this when you want to switch from local FFmpeg to AWS MediaConvert for transcoding (set `HLS_TRANSCODE_PROVIDER=mediaconvert`).

**You do not need to open the MediaConvert console for setup.** The app talks to MediaConvert via the API. You only need to create one IAM role and set env vars.

---

## What you need to do (2 things)

1. **Create an IAM role** so MediaConvert can read/write your S3 bucket.
2. **Add env vars** and restart the app.

No API endpoint to look up. No “Account” page in MediaConvert (the sidebar only has Jobs, Presets, etc.). The app uses the standard regional MediaConvert URL automatically.

---

## Step 1: Create the IAM role

1. In the **AWS Console**, use the top search bar and open **IAM** (Identity and Access Management).
2. In the left menu, click **Roles**.
3. Click **Create role**.
4. **Trusted entity type:** choose **AWS service**.
5. **Use case:** in the dropdown, search for **MediaConvert** and select it.  
   If you don’t see it, choose **Other** and in “Custom trust policy” paste:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "mediaconvert.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```

6. Click **Next**.
7. **Permissions:** attach **AmazonS3FullAccess** (or a custom policy that allows `s3:GetObject` and `s3:PutObject` on your video bucket). Click **Next**.
8. **Role name:** e.g. `MediaConvert-HLS-Role`. Click **Create role**.
9. Open the new role and copy its **ARN** (e.g. `arn:aws:iam::123456789012:role/MediaConvert-HLS-Role`). You’ll use it in Step 2.

---

## Step 2: Set env vars and restart

In your `.env` add or set:

```bash
# Use MediaConvert instead of FFmpeg
HLS_TRANSCODE_PROVIDER=mediaconvert

# The role you created in Step 1 (required)
AWS_MEDIACONVERT_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/MediaConvert-HLS-Role

# Region (e.g. us-east-1). Must match where your S3 bucket is.
AWS_REGION=us-east-1
```

You already have: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`. Keep those; the app uses them to create MediaConvert jobs.

**Do not set** `AWS_MEDIACONVERT_ENDPOINT` unless you have a specific custom endpoint. The app uses `https://mediaconvert.<AWS_REGION>.amazonaws.com` by default.

Restart your app. On startup you should see:

```text
🎬 Active provider: AWS MediaConvert (HLS_TRANSCODE_PROVIDER=mediaconvert)
```

---

## Step 3: Test

1. Upload a short test video (e.g. under 1 minute) through your app.
2. In your app logs, look for:
   - `Submitting MediaConvert job for: ...`
   - `MediaConvert job created: ...`
   - `MediaConvert job completed: ...`
3. Call your play endpoint; when the job is done you should get an HLS URL and `streamingType: "hls"`.

If something fails, open **MediaConvert** in the console → **Jobs** to see the job status and error message. You only need the MediaConvert console for debugging, not for initial setup.

---

## Troubleshooting: "HeadObject failed" / "Unable to open input file"

If you see:

```text
MediaConvert job failed: Unable to open input file [s3://your-bucket/...]: ... HeadObject failed
```

MediaConvert’s IAM role cannot read (or write) your S3 bucket. Fix it like this:

1. Open **IAM** → **Roles** → click the role you use for MediaConvert (e.g. `MediaConvert-HLS-Role`).
2. Ensure it has a policy that allows S3 access **for the same bucket** your app uses (check `AWS_S3_BUCKET` in `.env`; in your case `smart-edu-subjects`).
3. If you attached **AmazonS3FullAccess**: the role can access all buckets in the account. If the bucket is in another account, you need a bucket policy allowing this role.
4. If you use a custom policy, it must allow at least:
   - `s3:GetObject` (read source video)
   - `s3:PutObject` (write HLS outputs)
   on the bucket (e.g. `arn:aws:s3:::smart-edu-subjects` and `arn:aws:s3:::smart-edu-subjects/*`).
5. Save the role and retry the transcode (upload a new video or use the admin retry endpoint).

**Check:** In `.env`, `AWS_S3_BUCKET` must be the bucket where your app uploads videos. MediaConvert will read from and write to that same bucket.

---

## Troubleshooting: Access Denied when opening HLS URL (browser or player)

If the play endpoint returns an HLS URL but opening it (or the video player) gives **Access Denied**, do the following.

### 1. Confirm the object exists in S3

1. Open **AWS Console** → **S3** → open the **same bucket** your app uses for uploads (see `.env`: `AWS_S3_BUCKET` or `AWS_S3_BUCKET_STAGING` for staging).
2. In the bucket, go to the prefix: **`library/videos-hls/platforms/.../subjects/.../topics/.../`** (replace with the path from your video’s URL; the last part is the video ID).
3. Check that **`main.m3u8`** is there (for MediaConvert). If you used FFmpeg, look for **`master.m3u8`**.
4. If the folder is empty or the filename is different, the transcode wrote somewhere else or with different names; fix the transcode/output path first.

### 2. Confirm CloudFront origin is this bucket

1. Open **CloudFront** → **Distributions** → select the distribution whose domain is in your HLS URL (e.g. `d3v8a6w01endbg.cloudfront.net`).
2. Open the **Origins** tab.
3. The **Origin domain** must be the **same S3 bucket** as in step 1 (e.g. `smart-edu-subjects.s3.amazonaws.com` or `bucket-name.s3.region.amazonaws.com`).  
   If the origin is a different bucket, either change the origin to the bucket where HLS files are, or make sure MediaConvert (and the app) use that same bucket.

### 3. Confirm the bucket allows CloudFront to read

1. In **S3** → your bucket → **Permissions** → **Bucket policy**.
2. The policy must allow **CloudFront** (via OAC or OAI) to call **`s3:GetObject`** on this bucket.  
   Example (replace `DISTRIBUTION_ARN` and `BUCKET_ARN`):

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontServicePrincipal",
         "Effect": "Allow",
         "Principal": { "Service": "cloudfront.amazonaws.com" },
         "Action": "s3:GetObject",
         "Resource": "BUCKET_ARN/*",
         "Condition": {
           "StringEquals": { "AWS:SourceArn": "DISTRIBUTION_ARN" }
         }
       }
     ]
   }
   ```

3. **CloudFront** → your distribution → **Origins** → your S3 origin: ensure **Origin access** is “Origin access control settings (recommended)” (OAC) and that the control is created. Then use the **Copy policy** button CloudFront shows and paste it into the bucket policy (or merge with the statement above).

### 4. Same bucket for uploads and HLS

The app uses **env-based bucket** (e.g. `AWS_S3_BUCKET_STAGING` for staging). MediaConvert is now configured to use the **same** env-based bucket. Restart the app so HLS is written to the same bucket your uploads use; then CloudFront (with that bucket as origin) can serve both.

After these checks, open the HLS URL again (or reload the player). If it still returns Access Denied, the response is coming from CloudFront; re-check steps 2 and 3 (origin and bucket policy).

---

## Quick checklist

| Step | Where | What to do |
|------|--------|------------|
| 1 | **IAM** (not MediaConvert) | Create role → trust MediaConvert → attach S3 access → copy role ARN |
| 2 | Your project `.env` | Set `HLS_TRANSCODE_PROVIDER=mediaconvert`, `AWS_MEDIACONVERT_ROLE_ARN`, `AWS_REGION` |
| 3 | Your app | Restart, upload a short video, check logs and play endpoint |

You can switch back to FFmpeg anytime by setting `HLS_TRANSCODE_PROVIDER=ffmpeg` (or removing it, since ffmpeg is the default).
