-- DropForeignKey
ALTER TABLE "BanHistory" DROP CONSTRAINT "BanHistory_userId_fkey";

-- AlterTable
ALTER TABLE "BanHistory" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BanHistory" ADD CONSTRAINT "BanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DELETE FROM BanHistory WHERE userId IS NULL;
