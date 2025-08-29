-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_user_id_idx" ON "DeviceToken"("user_id");

-- CreateIndex
CREATE INDEX "DeviceToken_school_id_idx" ON "DeviceToken"("school_id");

-- CreateIndex
CREATE INDEX "DeviceToken_token_idx" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_isActive_idx" ON "DeviceToken"("isActive");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
