import { Injectable, Logger } from '@nestjs/common';
import { UploadProgressDto } from './dto';
import * as colors from 'colors';

interface UploadSession {
  sessionId: string;
  userId: string;
  schoolId: string;
  totalBytes: number;
  bytesUploaded: number;
  stage: 'validating' | 'uploading' | 'processing' | 'saving' | 'completed' | 'error';
  startTime: Date;
  materialId?: string;
  error?: string;
}

@Injectable()
export class UploadProgressService {
  private readonly logger = new Logger(UploadProgressService.name);
  private uploadSessions = new Map<string, UploadSession>();
  private progressSubscribers = new Map<string, Set<(progress: UploadProgressDto) => void>>();

  /**
   * Create a new upload session
   */
  createUploadSession(userId: string, schoolId: string, totalBytes: number): string {
    const sessionId = `upload_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UploadSession = {
      sessionId,
      userId,
      schoolId,
      totalBytes,
      bytesUploaded: 0,
      stage: 'validating',
      startTime: new Date(),
    };

    this.uploadSessions.set(sessionId, session);
    this.progressSubscribers.set(sessionId, new Set());
    
    this.logger.log(colors.cyan(`📊 Created upload session: ${sessionId}`));
    return sessionId;
  }

  /**
   * Update upload progress
   */
  updateProgress(
    sessionId: string, 
    stage: UploadSession['stage'], 
    bytesUploaded?: number, 
    message?: string,
    error?: string,
    materialId?: string
  ): void {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      this.logger.error(colors.red(`❌ Upload session not found: ${sessionId}`));
      return;
    }

    // Update session data
    session.stage = stage;
    if (bytesUploaded !== undefined) {
      session.bytesUploaded = bytesUploaded;
    }
    if (error) {
      session.error = error;
    }
    if (materialId) {
      session.materialId = materialId;
    }

    // Calculate progress percentage
    const progress = Math.min(100, Math.round((session.bytesUploaded / session.totalBytes) * 100));
    
    // Calculate estimated time remaining
    const elapsedTime = Date.now() - session.startTime.getTime();
    const bytesPerSecond = session.bytesUploaded / (elapsedTime / 1000);
    const remainingBytes = session.totalBytes - session.bytesUploaded;
    const estimatedTimeRemaining = bytesPerSecond > 0 ? Math.round(remainingBytes / bytesPerSecond) : undefined;

    // Create progress DTO
    const progressDto: UploadProgressDto = {
      sessionId,
      progress,
      stage,
      message: message || this.getStageMessage(stage),
      bytesUploaded: session.bytesUploaded,
      totalBytes: session.totalBytes,
      estimatedTimeRemaining,
      error: session.error,
      materialId: session.materialId,
    };

    // Notify subscribers
    this.notifySubscribers(sessionId, progressDto);
    
    this.logger.log(colors.blue(`📈 Progress update: ${sessionId} - ${progress}% (${stage})`));
  }

  /**
   * Subscribe to progress updates
   */
  subscribeToProgress(sessionId: string, callback: (progress: UploadProgressDto) => void): () => void {
    if (!this.progressSubscribers.has(sessionId)) {
      this.progressSubscribers.set(sessionId, new Set());
    }
    
    this.progressSubscribers.get(sessionId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.progressSubscribers.get(sessionId);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.progressSubscribers.delete(sessionId);
        }
      }
    };
  }

  /**
   * Get current progress for a session
   */
  getCurrentProgress(sessionId: string): UploadProgressDto | null {
    const session = this.uploadSessions.get(sessionId);
    if (!session) {
      return null;
    }

    const progress = Math.min(100, Math.round((session.bytesUploaded / session.totalBytes) * 100));
    
    return {
      sessionId,
      progress,
      stage: session.stage,
      message: this.getStageMessage(session.stage),
      bytesUploaded: session.bytesUploaded,
      totalBytes: session.totalBytes,
      error: session.error,
      materialId: session.materialId,
    };
  }

  /**
   * Clean up completed sessions (call this periodically)
   */
  cleanupCompletedSessions(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, session] of this.uploadSessions.entries()) {
      if (session.stage === 'completed' || session.stage === 'error') {
        if (now - session.startTime.getTime() > maxAge) {
          this.uploadSessions.delete(sessionId);
          this.progressSubscribers.delete(sessionId);
          this.logger.log(colors.yellow(`🧹 Cleaned up old session: ${sessionId}`));
        }
      }
    }
  }

  /**
   * Notify all subscribers of a session
   */
  private notifySubscribers(sessionId: string, progress: UploadProgressDto): void {
    const subscribers = this.progressSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(progress);
        } catch (error) {
          this.logger.error(colors.red(`❌ Error notifying subscriber: ${error.message}`));
        }
      });
    }
  }

  /**
   * Get user-friendly message for each stage
   */
  private getStageMessage(stage: UploadSession['stage']): string {
    switch (stage) {
      case 'validating':
        return 'Validating file...';
      case 'uploading':
        return 'Uploading to cloud storage...';
      case 'processing':
        return 'Processing document for AI chat...';
      case 'saving':
        return 'Saving to database...';
      case 'completed':
        return 'Upload completed successfully!';
      case 'error':
        return 'Upload failed';
      default:
        return 'Processing...';
    }
  }
}
