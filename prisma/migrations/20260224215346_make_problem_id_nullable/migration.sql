-- DropForeignKey
ALTER TABLE "UserEvent" DROP CONSTRAINT "UserEvent_problemId_fkey";

-- AlterTable
ALTER TABLE "UserEvent" ALTER COLUMN "problemId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
