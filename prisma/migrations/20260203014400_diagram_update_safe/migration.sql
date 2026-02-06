/*
  SAFE migration for existing data:
  - Keep existing SubmitFlag.flag, SubmitFlag.createdAt by renaming (no data loss)
  - Add isCorrect safely with backfill, then set NOT NULL
*/

-- 1) SubmitFlag: flag -> submittedFlag (rename, no drop)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='SubmitFlag' AND column_name='flag'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='SubmitFlag' AND column_name='submittedFlag'
  ) THEN
    ALTER TABLE "SubmitFlag" RENAME COLUMN "flag" TO "submittedFlag";
  END IF;
END $$;

-- 2) SubmitFlag: createdAt -> submittedAt (rename, no drop)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='SubmitFlag' AND column_name='createdAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='SubmitFlag' AND column_name='submittedAt'
  ) THEN
    ALTER TABLE "SubmitFlag" RENAME COLUMN "createdAt" TO "submittedAt";
  END IF;
END $$;

-- 3) SubmitFlag: add isCorrect as NULLABLE first
ALTER TABLE "SubmitFlag"
ADD COLUMN IF NOT EXISTS "isCorrect" BOOLEAN;

-- 4) Backfill isCorrect from Problem.correctFlag vs submittedFlag
UPDATE "SubmitFlag" s
SET "isCorrect" = (s."submittedFlag" = p."correctFlag")
FROM "Problem" p
WHERE s."problemId" = p."id"
  AND s."isCorrect" IS NULL;

-- 5) Any remaining NULL -> false
UPDATE "SubmitFlag"
SET "isCorrect" = FALSE
WHERE "isCorrect" IS NULL;

-- 6) Make isCorrect NOT NULL
ALTER TABLE "SubmitFlag"
ALTER COLUMN "isCorrect" SET NOT NULL;

-- 7) Ensure submittedAt is NOT NULL (in case old rows had null)
UPDATE "SubmitFlag"
SET "submittedAt" = CURRENT_TIMESTAMP
WHERE "submittedAt" IS NULL;

ALTER TABLE "SubmitFlag"
ALTER COLUMN "submittedAt" SET NOT NULL;

-- 8) User.email (nullable)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "email" TEXT;

-- 9) Create new tables (same as original, safe)
CREATE TABLE IF NOT EXISTS "UserEvent" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BanRule" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "BanRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BanHistory" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    CONSTRAINT "BanHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BanReport" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,
    CONSTRAINT "BanReport_pkey" PRIMARY KEY ("id")
);

-- 10) Add FKs only if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserEvent_userId_fkey') THEN
    ALTER TABLE "UserEvent"
      ADD CONSTRAINT "UserEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserEvent_problemId_fkey') THEN
    ALTER TABLE "UserEvent"
      ADD CONSTRAINT "UserEvent_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "Problem"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BanHistory_userId_fkey') THEN
    ALTER TABLE "BanHistory"
      ADD CONSTRAINT "BanHistory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BanHistory_ruleId_fkey') THEN
    ALTER TABLE "BanHistory"
      ADD CONSTRAINT "BanHistory_ruleId_fkey"
      FOREIGN KEY ("ruleId") REFERENCES "BanRule"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
