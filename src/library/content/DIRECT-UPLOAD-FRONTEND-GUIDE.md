# Direct-to-S3 Video Upload — Frontend Integration Guide

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React / Next.js)                                         │
│                                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │ Upload Form  │───▶│ UploadManager│───▶│ Background Upload Queue│  │
│  │ (per topic)  │    │ (singleton)  │    │ (runs across pages)    │  │
│  └──────────────┘    └──────────────┘    └───────────────────────┘  │
│         │                    │                       │               │
│         │                    │               ┌───────▼──────────┐   │
│         │                    │               │ FloatingUploadBar │   │
│         │                    │               │ (always visible)  │   │
│         │                    │               └──────────────────┘   │
└─────────┼────────────────────┼───────────────────────┼──────────────┘
          │                    │                       │
          │            1. POST /request-video-upload   │
          │            ◀─── { uploadId, presignedUrl } │
          │                    │                       │
          │            2. PUT directly to S3 ──────────┼──────────▶ AWS S3
          │                    │                       │
          │            3. PATCH /upload-progress/:id   │
          │                    │                       │
          │            4. POST /confirm-video-upload   │
          │                    │                       │
          ▼                    ▼                       ▼
     User keeps navigating / doing other work while uploads run
```

### Key Concepts

1. **Uploads happen in the background** — the user can navigate, start more uploads, even close the tab (upload state is in the database).
2. **A floating upload bar** lives outside the page router — it shows all active uploads with progress and stays visible across all pages.
3. **Every upload session is persisted in the database** via the `DirectUpload` model — if the user logs out and back in, they see their upload status.
4. **Failed uploads can be resumed** — the backend generates fresh presigned URLs for the same S3 key.

---

## API Endpoints

### Library Owner Context

Base: `POST /api/v1/library/content/...`

| Endpoint | Method | Description |
|---|---|---|
| `/request-video-upload` | POST | Get presigned URL(s) + create persistent upload record |
| `/request-thumbnail-upload` | POST | Get presigned URL for thumbnail |
| `/upload-progress/:uploadId` | PATCH | Report upload progress to DB (call every 5-10%) |
| `/confirm-video-upload` | POST | Confirm upload after S3 PUT completes |
| `/my-uploads?topicId=xxx` | GET | Get all user's uploads (persistent across sessions) |
| `/resume-upload/:uploadId` | POST | Get fresh presigned URLs for a failed/expired upload |
| `/cancel-upload/:uploadId` | POST | Cancel and cleanup an upload |

### Teacher Context

Base: `/api/v1/teachers/topics/...`

Same endpoints with identical request/response shapes.

---

## S3 Bucket CORS Configuration

**CRITICAL**: Your S3 bucket MUST allow browser PUT requests. Apply this CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": ["ETag", "Content-Length", "x-amz-request-id"],
    "MaxAgeSeconds": 3600
  }
]
```

The `ETag` header MUST be exposed — it's required for multipart upload completion.

---

## Step-by-Step Implementation

### Step 1: Create the Upload Manager (Singleton)

This is the core engine. It lives outside React's component tree, persists across route changes, and manages all upload state.

```typescript
// src/lib/upload-manager.ts

export type UploadStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'confirming'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface UploadTask {
  id: string;              // DirectUpload record ID from backend
  file: File | null;       // null when restored from DB (e.g. after page refresh)
  title: string;
  topicId: string;
  subjectId: string;
  status: UploadStatus;
  progress: number;        // 0-100
  error?: string;
  videoId?: string;        // set after confirmation
  speed?: number;          // bytes/sec
  eta?: number;            // seconds remaining

  // Internal state
  s3Key: string;
  uploadType: 'single' | 'multipart';
  presignedUrl?: string;
  multipartUploadId?: string;
  parts?: { partNumber: number; presignedUrl: string }[];
  partSize?: number;       // server-provided, used to slice the File for multipart
  completedParts?: { partNumber: number; etag: string }[];
  abortController?: AbortController;
}

type Listener = (tasks: UploadTask[]) => void;

class UploadManager {
  private tasks: Map<string, UploadTask> = new Map();
  private listeners: Set<Listener> = new Set();
  private apiBase: string;
  private getAuthToken: () => string;

  constructor() {
    this.apiBase = '';
    this.getAuthToken = () => '';
  }

  /** Call once at app startup with your API base URL and auth token getter */
  init(apiBase: string, getAuthToken: () => string) {
    this.apiBase = apiBase;
    this.getAuthToken = getAuthToken;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getAll());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const all = this.getAll();
    this.listeners.forEach((fn) => fn(all));
  }

  getAll(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  getByTopic(topicId: string): UploadTask[] {
    return this.getAll().filter((t) => t.topicId === topicId);
  }

  // ─── Load from backend (call on app mount + page refresh) ───

  async loadFromBackend(topicId?: string) {
    const url = topicId
      ? `${this.apiBase}/my-uploads?topicId=${topicId}`
      : `${this.apiBase}/my-uploads`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.getAuthToken()}` },
    });
    const json = await res.json();
    if (!json.success) return;

    for (const upload of json.data) {
      // Don't overwrite tasks that have a live File reference
      if (this.tasks.has(upload.id) && this.tasks.get(upload.id)!.file) continue;

      this.tasks.set(upload.id, {
        id: upload.id,
        file: null,
        title: upload.title,
        topicId: upload.topicId,
        subjectId: upload.subjectId,
        status: upload.status,
        progress: upload.progress,
        error: upload.error,
        videoId: upload.videoId,
        s3Key: upload.s3Key,
        uploadType: upload.uploadType,
      });
    }
    this.notify();
  }

  // ─── Start a new upload ───

  async startUpload(params: {
    file: File;
    title: string;
    description?: string;
    topicId: string;
    subjectId: string;
  }): Promise<string> {
    // 1. Request presigned URL from backend (creates DirectUpload record)
    const res = await fetch(`${this.apiBase}/request-video-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        title: params.title,
        description: params.description,
        topicId: params.topicId,
        subjectId: params.subjectId,
        fileName: params.file.name,
        contentType: params.file.type || 'video/mp4',
        fileSize: params.file.size,
      }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to initiate upload');

    const data = json.data;
    const task: UploadTask = {
      id: data.uploadId,
      file: params.file,
      title: params.title,
      topicId: params.topicId,
      subjectId: params.subjectId,
      status: 'uploading',
      progress: 0,
      s3Key: data.s3Key,
      uploadType: data.uploadType,
      presignedUrl: data.presignedUrl,
      multipartUploadId: data.multipartUploadId,
      parts: data.parts,
      partSize: data.partSize,  // server tells us how to slice
      completedParts: [],
      abortController: new AbortController(),
    };

    this.tasks.set(task.id, task);
    this.notify();

    // 2. Start the S3 upload in the background (non-blocking)
    this.executeUpload(task).catch((err) => {
      task.status = 'failed';
      task.error = err.message;
      this.notify();
    });

    return task.id;
  }

  // ─── Execute the actual S3 upload ───

  private async executeUpload(task: UploadTask) {
    try {
      if (task.uploadType === 'single') {
        await this.uploadSingle(task);
      } else {
        await this.uploadMultipart(task);
      }

      // 3. Confirm with backend
      task.status = 'confirming';
      this.notify();
      await this.confirmUpload(task);

      task.status = 'processing';
      this.notify();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        task.status = 'cancelled';
      } else {
        task.status = 'failed';
        task.error = err.message;
      }
      this.notify();
      this.reportProgress(task.id, task.progress);
    }
  }

  // ─── Single PUT upload with progress tracking ───

  private uploadSingle(task: UploadTask): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          task.progress = Math.round((e.loaded / e.total) * 100);
          task.speed = e.loaded / ((Date.now() - startTime) / 1000);
          task.eta = task.speed > 0 ? (e.total - e.loaded) / task.speed : undefined;
          this.notify();
          this.throttledReportProgress(task.id, task.progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          task.progress = 100;
          task.status = 'uploaded';
          this.notify();
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
      xhr.addEventListener('abort', () => reject(Object.assign(new Error('Upload aborted'), { name: 'AbortError' })));

      const startTime = Date.now();
      xhr.open('PUT', task.presignedUrl!);
      xhr.setRequestHeader('Content-Type', task.file!.type || 'video/mp4');

      // Wire up abort
      task.abortController?.signal.addEventListener('abort', () => xhr.abort());

      xhr.send(task.file!);
    });
  }

  // ─── Multipart upload with parallel parts ───

  private async uploadMultipart(task: UploadTask) {
    const PARALLEL_LIMIT = 4;
    const parts = task.parts!;
    const file = task.file!;
    const partSize = task.partSize!; // server-provided (scales with file size)
    const totalParts = parts.length;
    let completedCount = 0;
    let totalBytesUploaded = 0;
    const startTime = Date.now();

    task.completedParts = [];

    const uploadPart = async (part: { partNumber: number; presignedUrl: string }) => {
      if (task.abortController?.signal.aborted) throw Object.assign(new Error('Aborted'), { name: 'AbortError' });

      const start = (part.partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const response = await fetch(part.presignedUrl, {
        method: 'PUT',
        body: blob,
        signal: task.abortController?.signal,
      });

      if (!response.ok) throw new Error(`Part ${part.partNumber} upload failed: ${response.status}`);

      const etag = response.headers.get('ETag')?.replace(/"/g, '');
      if (!etag) throw new Error(`No ETag returned for part ${part.partNumber}`);

      task.completedParts!.push({ partNumber: part.partNumber, etag });
      completedCount++;
      totalBytesUploaded += (end - start);

      task.progress = Math.round((completedCount / totalParts) * 100);
      const elapsed = (Date.now() - startTime) / 1000;
      task.speed = totalBytesUploaded / elapsed;
      task.eta = task.speed > 0 ? (file.size - totalBytesUploaded) / task.speed : undefined;

      this.notify();
      this.throttledReportProgress(task.id, task.progress);
    };

    // Upload parts with concurrency limit
    const queue = [...parts];
    const workers = Array.from({ length: PARALLEL_LIMIT }, async () => {
      while (queue.length > 0) {
        const part = queue.shift()!;
        await uploadPart(part);
      }
    });

    await Promise.all(workers);
    task.progress = 100;
    task.status = 'uploaded';
    this.notify();
  }

  // ─── Confirm upload with backend ───

  private async confirmUpload(task: UploadTask) {
    const body: any = {
      directUploadId: task.id,
      s3Key: task.s3Key,
      topicId: task.topicId,
      subjectId: task.subjectId,
      title: task.title,
    };

    if (task.uploadType === 'multipart') {
      body.uploadId = task.multipartUploadId;
      body.parts = task.completedParts;
    }

    const res = await fetch(`${this.apiBase}/confirm-video-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Confirm failed');

    task.videoId = json.data.id;
    task.status = 'completed';
    this.notify();
  }

  // ─── Progress reporting (throttled to avoid spamming backend) ───

  private progressTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastReportedProgress: Map<string, number> = new Map();

  private throttledReportProgress(uploadId: string, progress: number) {
    const last = this.lastReportedProgress.get(uploadId) ?? -1;
    // Only report every 5% change
    if (progress - last < 5 && progress < 100) return;

    if (this.progressTimers.has(uploadId)) return;

    this.progressTimers.set(
      uploadId,
      setTimeout(() => {
        this.progressTimers.delete(uploadId);
        this.reportProgress(uploadId, progress);
      }, 2000),
    );
  }

  private async reportProgress(uploadId: string, progress: number) {
    this.lastReportedProgress.set(uploadId, progress);
    try {
      await fetch(`${this.apiBase}/upload-progress/${uploadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ progress }),
      });
    } catch {
      // Silently fail — progress reporting is best-effort
    }
  }

  // ─── Resume a failed upload ───

  async resumeUpload(uploadId: string, file: File) {
    const res = await fetch(`${this.apiBase}/resume-upload/${uploadId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.getAuthToken()}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Resume failed');

    const data = json.data;
    const task: UploadTask = {
      id: data.uploadId,
      file,
      title: this.tasks.get(uploadId)?.title || 'Resumed Upload',
      topicId: this.tasks.get(uploadId)?.topicId || '',
      subjectId: this.tasks.get(uploadId)?.subjectId || '',
      status: 'uploading',
      progress: 0,
      s3Key: data.s3Key,
      uploadType: data.uploadType,
      presignedUrl: data.presignedUrl,
      multipartUploadId: data.multipartUploadId,
      parts: data.parts,
      partSize: data.partSize,
      completedParts: [],
      abortController: new AbortController(),
    };

    this.tasks.set(task.id, task);
    this.notify();

    this.executeUpload(task).catch((err) => {
      task.status = 'failed';
      task.error = err.message;
      this.notify();
    });
  }

  // ─── Cancel an upload ───

  async cancelUpload(uploadId: string) {
    const task = this.tasks.get(uploadId);
    if (task?.abortController) {
      task.abortController.abort();
    }

    try {
      await fetch(`${this.apiBase}/cancel-upload/${uploadId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.getAuthToken()}` },
      });
    } catch { /* best effort */ }

    if (task) {
      task.status = 'cancelled';
      this.notify();
    }
  }

  // ─── Remove a completed/cancelled task from the local list ───

  dismiss(uploadId: string) {
    this.tasks.delete(uploadId);
    this.notify();
  }
}

// SINGLETON — lives for the entire app lifetime
export const uploadManager = new UploadManager();
```

---

### Step 2: Initialize at App Root

```typescript
// src/app.tsx (or _app.tsx for Next.js)

import { uploadManager } from '@/lib/upload-manager';

function App() {
  useEffect(() => {
    // For library owner context:
    uploadManager.init(
      '/api/v1/library/content',
      () => localStorage.getItem('token') || '',
    );

    // For teacher context, use a separate instance or switch apiBase:
    // uploadManager.init('/api/v1/teachers/topics', () => ...);

    // Load existing uploads from DB (survives logout/login)
    uploadManager.loadFromBackend();
  }, []);

  return (
    <>
      <RouterOutlet />
      {/* This component floats above everything — always visible */}
      <FloatingUploadBar />
    </>
  );
}
```

---

### Step 3: The Floating Upload Bar (Always Visible)

This small, non-blocking UI sits at the bottom-right of the screen. It does NOT blur the page. Users can interact with the rest of the app while uploads run.

```tsx
// src/components/FloatingUploadBar.tsx

import { useState, useEffect } from 'react';
import { uploadManager, UploadTask, UploadStatus } from '@/lib/upload-manager';

export function FloatingUploadBar() {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return uploadManager.subscribe(setTasks);
  }, []);

  // Only show active uploads (not completed ones older than 10s)
  const activeTasks = tasks.filter(
    (t) => t.status !== 'cancelled' && t.status !== 'completed',
  );
  const recentlyCompleted = tasks.filter(
    (t) => t.status === 'completed',
  );

  const allTasks = [...activeTasks, ...recentlyCompleted.slice(0, 3)];

  if (allTasks.length === 0) return null;

  const uploadingCount = activeTasks.filter(
    (t) => t.status === 'uploading' || t.status === 'confirming',
  ).length;

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      right: 16,
      width: 360,
      maxHeight: collapsed ? 48 : 400,
      backgroundColor: '#1a1a2e',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 9999,
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header bar */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          backgroundColor: '#16213e',
          borderBottom: collapsed ? 'none' : '1px solid #0f3460',
        }}
      >
        <span style={{ color: '#e94560', fontWeight: 600, fontSize: 14 }}>
          {uploadingCount > 0
            ? `Uploading ${uploadingCount} video${uploadingCount > 1 ? 's' : ''}...`
            : 'Uploads'}
        </span>
        <span style={{ color: '#888', fontSize: 12 }}>
          {collapsed ? '▲' : '▼'}
        </span>
      </div>

      {/* Upload items */}
      {!collapsed && (
        <div style={{ maxHeight: 352, overflowY: 'auto', padding: '8px 0' }}>
          {allTasks.map((task) => (
            <UploadItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItem({ task }: { task: UploadTask }) {
  const statusConfig = getStatusConfig(task.status);

  return (
    <div style={{ padding: '8px 16px', borderBottom: '1px solid #0f3460' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 8, flexShrink: 0 }}>
          {task.status === 'failed' && task.file && (
            <button
              onClick={() => uploadManager.resumeUpload(task.id, task.file!)}
              style={{ background: 'none', border: 'none', color: '#4ecca3', cursor: 'pointer', fontSize: 12 }}
            >
              Retry
            </button>
          )}
          {task.status === 'expired' && (
            <button
              onClick={() => {/* prompt user to re-select the file, then call resumeUpload */}}
              style={{ background: 'none', border: 'none', color: '#f0a500', cursor: 'pointer', fontSize: 12 }}
            >
              Resume
            </button>
          )}
          {(task.status === 'uploading' || task.status === 'pending') && (
            <button
              onClick={() => uploadManager.cancelUpload(task.id)}
              style={{ background: 'none', border: 'none', color: '#e94560', cursor: 'pointer', fontSize: 12 }}
            >
              Cancel
            </button>
          )}
          {(task.status === 'completed' || task.status === 'cancelled') && (
            <button
              onClick={() => uploadManager.dismiss(task.id)}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(task.status === 'uploading' || task.status === 'confirming' || task.status === 'processing') && (
        <div style={{ backgroundColor: '#0f3460', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%',
            width: `${task.progress}%`,
            backgroundColor: task.status === 'processing' ? '#f0a500' : '#4ecca3',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Status line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: statusConfig.color, fontSize: 11 }}>
          {statusConfig.label}
          {task.status === 'uploading' && ` — ${task.progress}%`}
          {task.eta && task.eta > 0 && ` (${formatEta(task.eta)} remaining)`}
        </span>
        {task.speed && task.status === 'uploading' && (
          <span style={{ color: '#666', fontSize: 11 }}>
            {formatSpeed(task.speed)}
          </span>
        )}
      </div>

      {task.error && (
        <div style={{ color: '#e94560', fontSize: 11, marginTop: 2 }}>{task.error}</div>
      )}
    </div>
  );
}

function getStatusConfig(status: UploadStatus): { label: string; color: string } {
  switch (status) {
    case 'pending': return { label: 'Waiting...', color: '#888' };
    case 'uploading': return { label: 'Uploading', color: '#4ecca3' };
    case 'uploaded': return { label: 'Upload complete', color: '#4ecca3' };
    case 'confirming': return { label: 'Confirming...', color: '#f0a500' };
    case 'processing': return { label: 'Processing video (HLS)...', color: '#f0a500' };
    case 'completed': return { label: 'Done ✓', color: '#4ecca3' };
    case 'failed': return { label: 'Failed', color: '#e94560' };
    case 'expired': return { label: 'Expired — click Resume', color: '#f0a500' };
    case 'cancelled': return { label: 'Cancelled', color: '#888' };
    default: return { label: status, color: '#888' };
  }
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${Math.round(bytesPerSec)} B/s`;
}
```

---

### Step 4: Upload Trigger from Any Page

On the topic page where the user selects a video, just fire-and-forget:

```tsx
// src/pages/TopicPage.tsx

import { uploadManager } from '@/lib/upload-manager';

function TopicPage({ topicId, subjectId }: { topicId: string; subjectId: string }) {
  const [uploads, setUploads] = useState<UploadTask[]>([]);

  useEffect(() => {
    // Load existing uploads for this topic from DB
    uploadManager.loadFromBackend(topicId);
    return uploadManager.subscribe((all) => {
      setUploads(all.filter((t) => t.topicId === topicId));
    });
  }, [topicId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const title = prompt('Enter video title') || file.name;

    // This returns immediately — upload runs in background
    await uploadManager.startUpload({
      file,
      title,
      topicId,
      subjectId,
    });

    // User is free to navigate away now!
  };

  return (
    <div>
      <h1>Topic Videos</h1>

      {/* Upload button */}
      <label style={{ cursor: 'pointer', padding: '8px 16px', background: '#4ecca3', borderRadius: 8, color: '#fff' }}>
        Upload Video
        <input type="file" accept="video/*" hidden onChange={handleFileSelect} />
      </label>

      {/* Show in-progress uploads for this topic */}
      {uploads
        .filter((u) => u.status !== 'completed' && u.status !== 'cancelled')
        .map((u) => (
          <div key={u.id} style={{ padding: 12, margin: '8px 0', background: '#f5f5f5', borderRadius: 8 }}>
            <strong>{u.title}</strong>
            <span style={{ marginLeft: 8, color: '#888' }}>
              {u.status === 'uploading' && `${u.progress}% uploaded`}
              {u.status === 'processing' && 'Processing...'}
              {u.status === 'failed' && (
                <button onClick={() => u.file && uploadManager.resumeUpload(u.id, u.file)}>
                  Retry
                </button>
              )}
            </span>
          </div>
        ))}

      {/* Existing videos list here... */}
    </div>
  );
}
```

---

### Step 5: Handling Page Refresh & Login/Logout

When the user refreshes the page or logs back in:

1. `uploadManager.loadFromBackend()` runs and fetches all their `DirectUpload` records from the DB
2. Uploads show their last-known progress and status
3. **For uploads that were `uploading` when the page closed**: they will show as `uploading` with the last reported progress. Since the actual browser upload was interrupted, the user needs to re-select the file and click **Resume** to continue
4. **For `processing` uploads**: these are server-side (HLS transcoding) — they continue regardless of the browser. The status updates when polling next time
5. **For `completed` uploads**: shown with a checkmark, dismissed after 24h

```tsx
// In your auth/login success handler:
uploadManager.loadFromBackend();
```

> **Important**: When the user navigates back to a topic page, call
> `uploadManager.loadFromBackend(topicId)` to refresh statuses from the
> server. This catches uploads that completed while they were on a
> different page.

---

### Step 6: Handling "Expired" and "Failed" Uploads (Resume)

When an upload fails or its presigned URLs expire, the user sees a **Resume** button.

**If the user still has the browser tab open** and the `File` object is in memory, clicking Resume is automatic — it calls the backend for fresh presigned URLs and retries.

**If the user refreshed the page or logged out**, the `File` object is gone. In this case, prompt them to re-select the same file:

```tsx
function ResumeButton({ task }: { task: UploadTask }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResume = () => {
    if (task.file) {
      // File is still in memory — resume directly
      uploadManager.resumeUpload(task.id, task.file);
    } else {
      // File was lost (page refresh) — ask user to re-select
      fileInputRef.current?.click();
    }
  };

  const handleFileReselect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadManager.resumeUpload(task.id, file);
    }
  };

  return (
    <>
      <button onClick={handleResume}>
        {task.file ? 'Retry' : 'Resume (re-select file)'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={handleFileReselect}
      />
    </>
  );
}
```

---

## Complete Upload Lifecycle (What the User Experiences)

```
 User selects video file
   │
   ▼
 Small upload bar appears at bottom-right: "Uploading — 0%"
   │
   │  User navigates to another page ← ALLOWED, bar stays visible
   │  User starts a second upload    ← ALLOWED, both show in bar
   │
   ▼
 Progress: "Uploading — 45% (2.3 MB/s, ~1m remaining)"
   │
   │  Internet drops → status changes to "Failed"
   │  User clicks "Retry" → fresh presigned URL, upload resumes
   │
   ▼
 Progress: "Upload complete"
   │
   ▼
 "Confirming..." (backend verifies S3 object, creates video record)
   │
   ▼
 "Processing video (HLS)..." (server-side, continues even if tab closes)
   │
   │  User closes browser entirely
   │  Later, user logs back in
   │  Opens topic page → sees: "Processing video (HLS)..."
   │  Refreshes again a few minutes later → "Done ✓"
   │
   ▼
 Video appears in the topic's video list, ready to play
```

---

## Backend Endpoints — Request/Response Reference

### POST `/request-video-upload`

**Request:**
```json
{
  "title": "Lesson 1 - Introduction",
  "description": "Optional description",
  "topicId": "clxyz...",
  "subjectId": "clabc...",
  "fileName": "intro.mp4",
  "contentType": "video/mp4",
  "fileSize": 524288000
}
```

**Response (single upload, file ≤ 100MB):**
```json
{
  "success": true,
  "data": {
    "uploadId": "cm1abc...",
    "uploadType": "single",
    "s3Key": "library/videos/platforms/.../intro_1234567890.mp4",
    "presignedUrl": "https://bucket.s3.amazonaws.com/...?X-Amz-Signature=...",
    "fileUrl": "https://bucket.s3.amazonaws.com/.../intro_1234567890.mp4",
    "expiresAt": "2026-03-19T15:00:00.000Z"
  }
}
```

**Response (multipart upload, file > 100MB):**
```json
{
  "success": true,
  "data": {
    "uploadId": "cm1abc...",
    "uploadType": "multipart",
    "s3Key": "library/videos/platforms/.../video_1234567890.mp4",
    "multipartUploadId": "Abc123...",
    "parts": [
      { "partNumber": 1, "presignedUrl": "https://..." },
      { "partNumber": 2, "presignedUrl": "https://..." }
    ],
    "partSize": 26214400,
    "fileUrl": "https://bucket.s3.amazonaws.com/.../video_1234567890.mp4",
    "expiresAt": "2026-03-19T17:00:00.000Z"
  }
}
```

### PATCH `/upload-progress/:uploadId`

**Request:**
```json
{ "progress": 45 }
```

### POST `/confirm-video-upload`

**Request:**
```json
{
  "directUploadId": "cm1abc...",
  "s3Key": "library/videos/platforms/.../intro_1234567890.mp4",
  "topicId": "clxyz...",
  "subjectId": "clabc...",
  "title": "Lesson 1 - Introduction",
  "uploadId": "Abc123...",
  "parts": [
    { "partNumber": 1, "etag": "abc123" },
    { "partNumber": 2, "etag": "def456" }
  ]
}
```

**Multipart `parts`:** AWS requires part numbers in **ascending order**. Parallel uploads often finish out of order; the backend sorts them before calling S3, but you must still send **every** part’s `{ partNumber, etag }` with no gaps.

### GET `/my-uploads?topicId=clxyz...`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1abc...",
      "title": "Lesson 1",
      "fileName": "intro.mp4",
      "fileSize": 524288000,
      "status": "uploading",
      "progress": 45,
      "error": null,
      "videoId": null,
      "topicId": "clxyz...",
      "subjectId": "clabc...",
      "createdAt": "2026-03-19T14:00:00Z",
      "updatedAt": "2026-03-19T14:02:30Z",
      "expiresAt": "2026-03-19T15:00:00Z"
    },
    {
      "id": "cm1def...",
      "title": "Lesson 2",
      "status": "completed",
      "progress": 100,
      "videoId": "clvideo123...",
      "topicId": "clxyz..."
    }
  ]
}
```

### POST `/resume-upload/:uploadId`

**Response:** Same shape as `/request-video-upload` with fresh presigned URLs.

### POST `/cancel-upload/:uploadId`

**Response:**
```json
{ "success": true, "message": "Upload cancelled" }
```

---

## Teacher Context

All endpoints are identical, but under `/api/v1/teachers/topics/...`.

The only difference in field names:
- Library uses `topicId` and `subjectId`
- Teacher uses `topic_id` and `subject_id`

The `UploadManager` can be initialized with either base URL depending on the user's role.

---

## Large File Support (1GB – 5GB)

The system supports files up to **5GB**. The backend automatically scales for larger files:

| File Size | Part Size | Part Count | Presigned URL Expiry |
|---|---|---|---|
| ≤ 100MB | Single PUT (no parts) | 1 | 1 hour |
| 100MB – 500MB | 10MB | 10–50 | 1 hour |
| 500MB – 2GB | 25MB | 20–80 | 2 hours |
| 2GB – 5GB | 50MB | 40–100 | 4 hours |

**What the frontend must do:**

1. **Use `partSize` from the server response** to slice the file — do NOT hardcode part sizes.
2. The server returns `data.partSize` in both `/request-video-upload` and `/resume-upload` responses.
3. `PARALLEL_LIMIT = 4` works well for all sizes. Each parallel worker uploads one part at a time.
4. For very large files, the browser `File.slice()` is lazy (doesn't copy memory), so slicing a 5GB file into 50MB chunks is instant.

**Why this works without stressing the server:**

- The file goes **directly from the browser to S3** — the backend never touches the video bytes.
- Backend only handles small JSON requests (presigned URL generation, confirm).
- S3's multipart upload infrastructure is designed for multi-GB files.
- The `BigInt` database column prevents integer overflow for files > 2.1GB.

---

## Per-User Upload Limit

The backend enforces a **maximum of 5 active uploads per user**. An upload is "active" if its status is `pending`, `uploading`, `uploaded`, or `processing`. Once 5 are in progress, the next `POST /request-video-upload` call returns **400 Bad Request** with a message like:

```json
{
  "success": false,
  "message": "You already have 5 active upload(s). Please wait for at least one to finish before starting another (limit: 5)."
}
```

### What the frontend should do

Handle this in `startUpload` so the user sees a clear message instead of a generic error:

```typescript
// Inside UploadManager.startUpload(), after the fetch call:
const json = await res.json();
if (!json.success) {
  // Surface the backend message directly — it already explains the limit
  throw new Error(json.message || 'Failed to initiate upload');
}
```

The existing `startUpload` code already does this, so **no code change is required** — the error propagates to the `.catch()` handler and the floating upload bar shows the message. If you want a richer experience, you can check the active task count *before* calling the backend:

```typescript
// Optional: client-side pre-check to avoid a round-trip
const activeTasks = uploadManager.getAll().filter(
  (t) => ['pending', 'uploading', 'uploaded', 'confirming', 'processing'].includes(t.status),
);
if (activeTasks.length >= 5) {
  alert('You have 5 uploads in progress. Please wait for one to finish.');
  return;
}
```

This is a nice-to-have UX improvement but not required — the backend enforces the limit regardless.

---

## Summary of What Makes This Professional

| Feature | How it works |
|---|---|
| **Background uploads** | XHR/fetch runs outside React render cycle; UploadManager is a singleton |
| **Non-blocking UI** | Small floating bar, no full-screen blur |
| **Multiple concurrent uploads** | Each gets its own UploadTask in the manager |
| **Persist across page refresh** | `DirectUpload` DB model; `loadFromBackend()` restores state |
| **Persist across logout/login** | Same — DB records tied to userId |
| **Resume failed uploads** | Backend generates fresh presigned URLs for the same S3 key |
| **Cancel uploads** | AbortController stops the XHR; backend cleans up S3 |
| **Progress saved to server** | PATCH every 5% so progress survives browser crash |
| **HLS processing status** | Backend sets `processing` → `completed`; frontend polls via `my-uploads` |
| **Speed & ETA display** | Calculated from bytes transferred over time |
| **Files up to 5GB** | Dynamic part sizing, scaled presigned expiry, BigInt DB columns |
| **Per-user upload limit** | Max 5 active uploads; backend returns 400 if exceeded |
