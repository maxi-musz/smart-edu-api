-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role" "Roles" NOT NULL DEFAULT 'teacher';
