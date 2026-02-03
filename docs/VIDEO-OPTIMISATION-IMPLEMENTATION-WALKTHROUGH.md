# Video Optimisation — Implementation Walkthrough

This document is the **step-by-step plan** to move from direct S3 read/write for videos to a production-ready setup: **CloudFront in front of S3**, optional **HLS adaptive streaming**, and optional **signed URLs**. It is written so that:

- **Existing production code is not changed** until you explicitly approve each change.
- All code-level changes are **additive or config-driven** where possible (feature flags / env vars).
- You know exactly **what to create in AWS** (no separate “CloudFront account” — CloudFront is part of your existing AWS account).

---

## Do I need a new account? (CloudFront, etc.)

**No.** You do **not** need a separate CloudFront account or a new AWS account.

- **CloudFront** is an AWS service in the **same AWS account** you already use for S3.
- You will:
  1. **Create a CloudFront distribution** in the AWS Console (or IaC), with your existing S3 bucket as the origin.
  2. **Optionally** create a **CloudFront key pair** (for signed URLs) in the same account — still no new account.

So: same AWS account, same billing, new **resources** (distribution, optional key pair), not a new “account” anywhere.

---

## Current state (summary)

| Area | Current behaviour | Where it lives |
|------|-------------------|----------------|
| **Upload (library)** | MP4 uploaded to S3; `videoUrl` = direct S3 URL from `getFileUrl(key)`; `videoS3Key` stored. | `ContentService` → `S3Service.uploadFile()` → DB `LibraryVideoLesson.videoUrl` / `videoS3Key` |
| **Play (library)** | Response returns `video.videoUrl` (stored S3 URL) as-is. No presigning at play time. | `VideoService.playLibraryVideo()` |
| **Play (school)** | Response returns `video.url` (stored URL). | `VideoService.playSchoolVideo()` |
| **Storage** | S3 only (bucket per env). URLs are direct S3 (`https://bucket.s3.region.amazonaws.com/key`). | `S3Service.getFileUrl()`, `uploadFile()` |

**Design principle for this walkthrough:** we do **not** touch the above flows until you agree. We add **new** config, **new** optional behaviour, and **new** paths (e.g. HLS) so existing behaviour remains valid.

---

## Phase 0 — AWS and config only (no code changes)

Goal: have CloudFront in front of S3 and know the URLs that will be used later. **No application code or database changes.**

### 0.1 Create CloudFront distribution (same AWS account)

1. In **AWS Console** → **CloudFront** → **Create distribution**.
2. **Origin**:
   - Origin domain: choose your **S3 bucket** (e.g. `smart-edu-subjects-prod.amazonaws.com`).
   - If the bucket is **private** (recommended for LMS):
     - Use **Origin Access Control (OAC)** (recommended) or Legacy OAI.
     - CloudFront will show a policy snippet to add to the S3 bucket; apply it so only CloudFront can read from the bucket.
   - If the bucket is currently **public**: you can still use CloudFront; lock down the bucket later and use OAC.
3. **Default cache behavior**:
   - Viewer protocol policy: **Redirect HTTP to HTTPS** (or HTTPS only).
   - Allowed methods: **GET, HEAD, OPTIONS** (no PUT/POST from viewers).
   - Cache policy: e.g. **CachingOptimized** or a custom policy that forwards `Origin` and necessary headers; for signed URLs you often cache minimally (e.g. 0 s) or use a dedicated “no-cache” policy for private content.
4. **Settings**:
   - Price class: **Use only North America and Europe** (or your target regions) to reduce cost.
   - Alternate domain (CNAME): optional (e.g. `videos.yourdomain.com`).
5. Create the distribution. Note:
   - **Distribution domain name** (e.g. `d1234abcd.cloudfront.net`).
   - **Distribution ID**.

You do **not** need a separate “CloudFront account”; this is all under your existing AWS account.

### 0.2 Optional: custom domain and HTTPS

- If you want `videos.yourdomain.com`:
  - Request or import an **ACM certificate** (in **us-east-1** for CloudFront).
  - In CloudFront, add the CNAME and attach the certificate.
  - In your DNS, add a CNAME from `videos.yourdomain.com` to the CloudFront domain.

### 0.3 Env vars (for later code phases — no code change yet)

Add these only when you are ready to implement the next phases. Until then, you can leave them unset and the app will keep using current behaviour if we implement a “use CloudFront only when configured” check.

- `CLOUDFRONT_DOMAIN` — e.g. `d1234abcd.cloudfront.net` or `videos.yourdomain.com`.
- `CLOUDFRONT_DISTRIBUTION_ID` — (optional, for cache invalidation or future use).
- For **signed URLs** (Phase 3):
  - `CLOUDFRONT_KEY_PAIR_ID` — from the CloudFront key pair.
  - `CLOUDFRONT_PRIVATE_KEY` — PEM private key (e.g. in secrets manager / env, not in repo).

### 0.4 S3 bucket policy (if bucket is private)

- Apply the **bucket policy** that CloudFront gives you when you create the distribution with OAC, so CloudFront (and only CloudFront) can read from the bucket. This does not require any code change.

**Checkpoint:** After Phase 0, you have a working CloudFront distribution. You can manually build a URL like `https://<CLOUDFRONT_DOMAIN>/<same-path-as-S3-key>` and test that a known S3 object is reachable via CloudFront (if the bucket is public or the policy is applied). **No app code has been changed.**

---

## Phase 1 — Serve playback URLs via CloudFront (additive, optional)

Goal: when the app returns a “play” URL, it can return a **CloudFront URL** instead of the direct S3 URL, **only if** you configure it. Existing behaviour (direct S3 URL) remains the default.

### 1.1 Design (no change to existing fields)

- **DB:** No schema change. We keep storing `videoUrl` (and `videoS3Key`) as today. `videoUrl` can remain the S3 URL for backward compatibility; we only **compute** a CloudFront URL at **read time** when configured.
- **Logic:** In the **play** flow (e.g. `VideoService.playLibraryVideo`), **before** returning the response:
  - If `CLOUDFRONT_DOMAIN` is set and we have a key (e.g. `videoS3Key` or we can derive the key from `videoUrl`), then set the **playback URL** in the response to the CloudFront URL for that key (e.g. `https://<CLOUDFRONT_DOMAIN>/<key>`).
  - Otherwise, keep returning the existing `videoUrl` (S3) as today.

So: **one small, guarded change** in the place that builds the play response. No change to upload, no change to DB schema.

### 1.2 What we would change (only after your approval)

- **File:** `src/video/video.service.ts` (or wherever the play response is built for library videos).
- **Change:** Add a helper that, when `CLOUDFRONT_DOMAIN` is set, builds `https://<CLOUDFRONT_DOMAIN>/<videoS3Key>` and use that as the playback URL in the response; otherwise use `video.videoUrl`.
- **Upload:** Unchanged. Videos still upload to S3; `videoUrl` and `videoS3Key` still stored as today.

### 1.3 School videos

- Same idea: if you have an S3 key (or can map `url` to a key) and CloudFront is configured, we can return a CloudFront URL for playback; otherwise keep returning `video.url`. We only do this when you confirm and after we’ve done library.

**Checkpoint:** After Phase 1, playback can go through CloudFront without changing upload or DB. Old clients that expect `videoUrl` still get a valid URL (either S3 or CloudFront depending on config).

---

## Phase 2 — HLS (additive, new pipeline)

Goal: support **HLS** for better streaming (adaptive bitrate, faster start, less buffering) without removing or breaking existing MP4 behaviour.

### 2.1 Design (additive only)

- **Upload:** Unchanged. We still upload the **source MP4** to S3 and store `videoUrl` / `videoS3Key` as today.
- **New pipeline:** After a library video is successfully uploaded and the DB record is created:
  - A **transcode job** (e.g. FFmpeg or AWS MediaConvert) produces HLS (e.g. `.m3u8` + segments) and uploads to a **new S3 prefix**, e.g. `library/videos-hls/platforms/.../topics/.../<videoId>/` (or similar).
  - We store the **HLS manifest URL** in a **new field** (e.g. `hlsPlaybackUrl` or `playbackManifestUrl`) on `LibraryVideoLesson`, or in a separate table. We do **not** overwrite `videoUrl`.
- **Play:** When returning the play response:
  - If `hlsPlaybackUrl` (or equivalent) is present and you want to prefer HLS, return that as the primary playback URL (e.g. for the frontend HLS player).
  - Fallback: existing `videoUrl` (MP4) so old clients and existing flows keep working.

So: **new field**, **new background job**, **no removal** of current MP4 upload or `videoUrl`.

### 2.2 What we would add (only after your approval)

- **DB:** New optional field on `LibraryVideoLesson`, e.g. `hlsPlaybackUrl String?` (or `playbackManifestUrl`), plus migration.
- **Transcode worker/job:** Triggered after a library video is created (or from a queue). Uses FFmpeg (or MediaConvert) to generate HLS; uploads to S3 under the chosen prefix; updates the new field with the CloudFront URL of the manifest (e.g. `https://<CLOUDFRONT_DOMAIN>/<hls-manifest-key>`).
- **Play response:** If `hlsPlaybackUrl` is set, include it in the response (e.g. `playbackUrl` or `hlsUrl`) and keep `videoUrl` for fallback. No change to existing `videoUrl` semantics.

We will **not** remove or repurpose `videoUrl` or change the existing upload API.

### 2.3 FFmpeg vs MediaConvert

- **FFmpeg:** Run on your own (e.g. EC2, Lambda with layer, or a worker container). Cheaper at scale, more control; you manage runtime and scaling.
- **AWS MediaConvert:** Managed; you submit a job per video; pricing per minute of output. Simpler ops, higher cost at volume.

Choice can be made when we implement; the walkthrough stays the same (output HLS to S3, store manifest URL, serve via CloudFront).

**Checkpoint:** After Phase 2, new/updated videos can have HLS; existing videos continue to play via `videoUrl`. No breaking change to current code paths.

---

## Phase 3 — Signed URLs (optional, for tighter security)

Goal: prevent sharing of playback links by making URLs **time-limited** (e.g. 5–15 minutes).

### 3.1 CloudFront signed URLs (recommended)

- Create a **CloudFront key pair** (in AWS Console → CloudFront → Key management → Public keys / key groups), and store the **private key** securely (e.g. AWS Secrets Manager; env var in ECS).
- When building the playback URL (in the same place we added CloudFront URL in Phase 1/2), generate a **signed URL** (or signed cookie) for `https://<CLOUDFRONT_DOMAIN>/<key>` with expiry 5–15 minutes.
- Frontend uses this URL once; no long-lived shareable link.

### 3.2 What we would change (only after your approval)

- **New dependency:** e.g. a small util (or library) to generate CloudFront signed URLs using `CLOUDFRONT_KEY_PAIR_ID` and `CLOUDFRONT_PRIVATE_KEY`.
- **Play response:** Where we currently return the CloudFront URL (Phase 1) or HLS URL (Phase 2), we would instead return a **signed** CloudFront URL (or set a signed cookie). No change to upload or to DB schema for existing fields.

**Checkpoint:** After Phase 3, playback is behind short-lived signed URLs. Upload and existing fields remain unchanged.

---

## Phase 4 — Cost and ops (optional)

- **CloudFront:** Restrict price class to regions you need; use cache policies to avoid over-caching private content if needed.
- **S3:** Lifecycle rules to move old/unused objects to cheaper storage (e.g. Glacier) if appropriate.
- **HLS segment length:** 4–6 seconds is a good default; we can set this when we add the transcode job.

No application code change required for lifecycle or price class; these are AWS console/IaC settings.

---

## Summary: what to create in AWS (no new account)

| What | Where | Notes |
|------|--------|--------|
| **CloudFront distribution** | Same AWS account | Origin = your S3 bucket; use OAC if bucket is private. |
| **S3 bucket policy** | Your existing bucket | Allow CloudFront (OAC) to read; applied once per bucket. |
| **CloudFront key pair** (optional) | Same AWS account | Only if you want signed URLs (Phase 3). |
| **Custom domain + ACM** (optional) | Same AWS account | Only if you want e.g. `videos.yourdomain.com`. |

You do **not** need to create a new AWS account or a “CloudFront account.” Everything is in your current account.

---

## Summary: code touch points (only with your approval)

| Phase | What we would change | Principle |
|-------|----------------------|-----------|
| **0** | Nothing | Env vars prepared for later; CloudFront created in AWS. |
| **1** | One place that builds the **play** response: optionally return CloudFront URL when `CLOUDFRONT_DOMAIN` is set. | Additive; default remains current behaviour. |
| **2** | New DB field for HLS URL; new transcode job; play response can expose `hlsPlaybackUrl`. | Additive; existing upload and `videoUrl` untouched. |
| **3** | Same place as Phase 1/2: return **signed** CloudFront URL when key pair is configured. | Additive; no change to upload or schema for existing fields. |

We will **not** change your existing upload flow, existing controller contracts, or remove `videoUrl` / `videoS3Key` until you explicitly ask to do so.

---

## Order of implementation (recommended)

1. **Phase 0** — Create CloudFront distribution and (if needed) bucket policy; add env vars when ready.
2. **Phase 1** — Add optional CloudFront playback URL in the play response (single, guarded change).
3. **Phase 2** — Add HLS pipeline and optional `hlsPlaybackUrl` (new field + job + response).
4. **Phase 3** — Add signed URL generation when you want to lock down sharing.
5. **Phase 4** — Tune cost (CloudFront price class, S3 lifecycle) in AWS.

If you want to stop at Phase 1 (CloudFront only, no HLS, no signing), that is valid and already improves delivery and cost compared to direct S3.

---

## Next step

When you are ready to proceed:

1. Confirm you have (or will) complete **Phase 0** (CloudFront + optional env vars).
2. Confirm you want to implement **Phase 1** (optional CloudFront URL in play response), and we will propose the exact code change (file + snippet) for your approval before touching the repo.
3. Optionally confirm whether you want Phase 2 (HLS) and Phase 3 (signed URLs) in the roadmap so we can keep the design consistent.

No code will be changed until you explicitly approve each phase.
