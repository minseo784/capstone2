/*
  Warnings:

  - You are about to drop the column `payload` on the `UserEvent` table. All the data in the column will be lost.
  - You are about to drop the `BanReport` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `UserEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('VIEW_PROBLEM', 'VIEW_HINT', 'SERVER_ERROR');

-- AlterTable
ALTER TABLE "UserEvent" DROP COLUMN "payload",
DROP COLUMN "type",
ADD COLUMN     "type" "UserEventType" NOT NULL;

-- DropTable
DROP TABLE "BanReport";

-- CreateTable
CREATE TABLE "HintHistory" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "lastHintContent" TEXT,
    "hintCount" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HintHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HintHistory_userId_idx" ON "HintHistory"("userId");

-- CreateIndex
CREATE INDEX "HintHistory_problemId_idx" ON "HintHistory"("problemId");

-- AddForeignKey
ALTER TABLE "HintHistory" ADD CONSTRAINT "HintHistory_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintHistory" ADD CONSTRAINT "HintHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
