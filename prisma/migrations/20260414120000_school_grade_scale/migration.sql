-- CreateTable
CREATE TABLE "school_grade_scales" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "bands" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_grade_scales_school_id_key" ON "school_grade_scales"("school_id");

-- AddForeignKey
ALTER TABLE "school_grade_scales" ADD CONSTRAINT "school_grade_scales_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
