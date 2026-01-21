-- CreateTable
CREATE TABLE "SchoolVideoView" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolVideoView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolVideoWatchHistory" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT,
    "classId" TEXT,
    "userRole" TEXT,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchDurationSeconds" INTEGER,
    "videoDurationSeconds" INTEGER,
    "completionPercentage" DOUBLE PRECISION DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchPosition" INTEGER DEFAULT 0,
    "watchCount" INTEGER NOT NULL DEFAULT 1,
    "deviceType" TEXT,
    "platform" TEXT,
    "userAgent" TEXT,
    "referrerSource" TEXT,
    "referrerUrl" TEXT,
    "videoQuality" TEXT,
    "bufferingEvents" INTEGER DEFAULT 0,
    "playbackSpeed" DOUBLE PRECISION DEFAULT 1.0,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolVideoWatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolVideoView_videoId_idx" ON "SchoolVideoView"("videoId");

-- CreateIndex
CREATE INDEX "SchoolVideoView_userId_idx" ON "SchoolVideoView"("userId");

-- CreateIndex
CREATE INDEX "SchoolVideoView_viewedAt_idx" ON "SchoolVideoView"("viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolVideoView_videoId_userId_key" ON "SchoolVideoView"("videoId", "userId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_videoId_idx" ON "SchoolVideoWatchHistory"("videoId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_userId_idx" ON "SchoolVideoWatchHistory"("userId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_schoolId_idx" ON "SchoolVideoWatchHistory"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_classId_idx" ON "SchoolVideoWatchHistory"("classId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_watchedAt_idx" ON "SchoolVideoWatchHistory"("watchedAt");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_isCompleted_idx" ON "SchoolVideoWatchHistory"("isCompleted");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_completionPercentage_idx" ON "SchoolVideoWatchHistory"("completionPercentage");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_sessionId_idx" ON "SchoolVideoWatchHistory"("sessionId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_videoId_userId_idx" ON "SchoolVideoWatchHistory"("videoId", "userId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_videoId_schoolId_idx" ON "SchoolVideoWatchHistory"("videoId", "schoolId");

-- CreateIndex
CREATE INDEX "SchoolVideoWatchHistory_userId_watchedAt_idx" ON "SchoolVideoWatchHistory"("userId", "watchedAt");

-- AddForeignKey
ALTER TABLE "SchoolVideoView" ADD CONSTRAINT "SchoolVideoView_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "VideoContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolVideoView" ADD CONSTRAINT "SchoolVideoView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolVideoWatchHistory" ADD CONSTRAINT "SchoolVideoWatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "VideoContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolVideoWatchHistory" ADD CONSTRAINT "SchoolVideoWatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
