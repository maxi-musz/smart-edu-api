## Video Delivery and Streaming Optimisation (NestJS + AWS S3)

This backend uses NestJS and AWS S3 for an LMS with video playback.  
The main optimisation goals are **delivery performance**, **cost control**, **scalability**, and **security**.

---

### 1. Avoid serving videos directly from S3 in production

S3 is primarily **object storage**, not a video delivery platform.

**Recommended pipeline**

- S3 → CloudFront → User

**Why CloudFront?**

- Global edge caching (lower latency)
- Cheaper bandwidth than S3 for public delivery
- Prevents S3 hotlinking and direct access
- Better behaviour for streaming at scale

**Rule of thumb**

- The frontend should normally see **CloudFront URLs**, not raw S3 URLs.
- For very low-traffic or internal tools, S3 direct can work, but for an LMS with many students, CloudFront is strongly recommended.

---

### 2. Use adaptive streaming (HLS) instead of raw MP4

Serving large `.mp4` files directly as a single stream is a bottleneck and gives a worse experience on unstable networks.

**Best practice**

- Convert uploaded videos to **HLS** (`.m3u8`) with multiple resolutions:
  - 240p
  - 360p
  - 480p
  - 720p
  - 1080p (optional, depends on your audience and cost limits)

**Benefits**

- Automatically adjusts quality to the user’s internet speed
- Faster start times
- Less buffering
- Mobile‑friendly and better for poor networks

**Tools**

- AWS MediaConvert (managed, easier but higher cost)
- FFmpeg (self‑managed, cheaper and more flexible)

**Example FFmpeg command**

```bash
ffmpeg -i input.mp4 \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=426:240[v1out]; \
   [v2]scale=640:360[v2out]; \
   [v3]scale=1280:720[v3out]" \
  -map "[v1out]" -map 0:a -f hls -hls_time 6 -hls_playlist_type vod 240p.m3u8 \
  -map "[v2out]" -map 0:a -f hls -hls_time 6 -hls_playlist_type vod 360p.m3u8 \
  -map "[v3out]" -map 0:a -f hls -hls_time 6 -hls_playlist_type vod 720p.m3u8
```

You would typically generate a **master playlist** that references these variant playlists for true adaptive streaming.

---

### 3. Secure videos for LMS use cases

You need to minimise link sharing and unauthorised access.

**Recommended security stack**

- Private S3 bucket
- CloudFront with:
  - Origin Access (OAC/OAI) to S3
  - **Signed URLs** or **Signed Cookies**
- Short URL expiry (e.g. 5–15 minutes)

**Typical NestJS flow**

1. User logs in.
2. User requests a video.
3. Backend checks:
   - Enrollment
   - Permissions / access rules
4. Backend generates a **signed CloudFront URL** (or signed cookie).
5. Frontend uses that URL in the video player.

**Note**

- Prefer **CloudFront signed URLs** over presigned S3 URLs for streaming at scale.  
  Presigned S3 URLs are acceptable for simple or low‑traffic setups, but CloudFront gives better control, caching, and security.

---

### 4. Use an HLS‑capable video player

Avoid relying on a plain `<video src="...mp4">` tag when using HLS.

**Recommended players**

- Video.js
- HLS.js
- Shaka Player

**Example (HLS.js)**

```javascript
if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource(videoUrl); // CloudFront HLS URL (.m3u8)
  hls.attachMedia(videoElement);
} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
  // Native HLS support (e.g. Safari)
  videoElement.src = videoUrl;
}
```

---

### 5. Enable seeking and byte‑range behaviour

Even with HLS, you want good behaviour for seeking and buffering.

Ensure that:

- CloudFront supports **range requests** (enabled by default).
- S3 objects are not manually gzip‑compressed in a way that breaks range requests.

This enables:

- Seeking within the video
- Resume playback
- Faster buffering on slow networks

---

### 6. Optimise cost

Video delivery can become expensive as your user base grows.

**Cost‑saving tactics**

- Rely on **CloudFront caching** to offload S3
- Use **short HLS segment duration** (4–6 seconds is a good range)
- Limit maximum resolution (e.g. cap at 720p if 1080p is not necessary)
- Enable **S3 lifecycle rules**:
  - Move old or rarely accessed videos to cheaper storage classes (e.g. Glacier)
- Restrict CloudFront to the regions where your users are (e.g. disable unused regions)

---

### 7. Backend responsibilities (NestJS‑specific)

The NestJS app should **not** be the media server.

**Do NOT**

- Proxy full video streams through NestJS
- Stream video bytes directly from controllers for normal playback

**DO**

- Let NestJS handle:
  - Authentication
  - Authorisation / enrolment checks
  - Generating signed CloudFront URLs or cookies
  - Logging and analytics (watch time, progress, completions)

**Example (pseudo‑code)**

```typescript
@Get('videos/:id/stream')
async getVideo(@Req() req, @Param('id') id: string) {
  // 1. Check access (course enrolment, permissions, etc.)
  // 2. Generate a signed CloudFront URL for the HLS manifest
  // 3. Return the URL (and any metadata) to the frontend
}
```

---

### 8. Track watch progress efficiently

Sending progress data too frequently increases load and cost without real benefit.

**Recommended approach**

- Send progress updates:
  - Every 10–30 seconds
  - On pause
  - On video end

**Example payload**

```json
{
  "videoId": "abc",
  "currentTime": 320,
  "duration": 1200
}
```

Persist this in your backend to support **resume playback** and analytics.

---

### 9. Optional advanced / enterprise features

For a higher‑security or enterprise LMS, you can add:

- DRM (Widevine / FairPlay / PlayReady) via a commercial solution
- Watermarking videos with user identifiers (e.g. email or user ID)
- Hardening against downloads in the player UI (cannot fully prevent, but raises the bar)
- Additional logic such as detecting tab switching and anti‑skip behaviour in the frontend

---

### 10. Minimum recommended production architecture

High‑level architecture:

- User  
  ↓  
- Frontend (HLS player, e.g. Video.js or HLS.js)  
  ↓  
- CloudFront (signed URLs or cookies)  
  ↓  
- S3 (private bucket, no public read)

In this setup, NestJS handles **business logic and permissions**, while **CloudFront + S3 handle media delivery**.

---

### 11. How this applies to your current code

Given your current endpoints (upload + universal `playVideo`):

- The upload flow should store the **source file** and then generate **HLS renditions** into a separate S3 prefix (e.g. `hls/{videoId}/...`).
- The playback flow (`playVideo`) should **return metadata + the CloudFront HLS URL**, not stream bytes directly.
- Progress tracking should be implemented using **periodic updates** instead of per‑second calls.

These changes can be implemented end‑to‑end in NestJS plus AWS (S3, CloudFront, and either FFmpeg or MediaConvert).