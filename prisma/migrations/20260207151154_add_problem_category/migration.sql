-- CreateEnum
CREATE TYPE "ProblemCategory" AS ENUM ('WEB', 'AI');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "category" "ProblemCategory" NOT NULL DEFAULT 'WEB';
