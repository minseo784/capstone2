-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('KAKAO', 'GOOGLE', 'NAVER');

-- CreateEnum
CREATE TYPE "ProblemCategory" AS ENUM ('WEB', 'AI');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "levelNum" INTEGER NOT NULL DEFAULT 1,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "levelNum" INTEGER NOT NULL,
    "shipImage" TEXT NOT NULL,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("levelNum")
);

-- CreateTable
CREATE TABLE "Island" (
    "id" SERIAL NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "Island_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "islandId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "correctFlag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverLink" TEXT,
    "category" "ProblemCategory" NOT NULL DEFAULT 'WEB',

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmitFlag" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "submittedFlag" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "SubmitFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolvedHistory" (
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolvedHistory_pkey" PRIMARY KEY ("userId","problemId")
);

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanRule" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,

    CONSTRAINT "BanRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanHistory" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT,
    "ruleId" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "BanHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanReport" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,

    CONSTRAINT "BanReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_levelNum_fkey" FOREIGN KEY ("levelNum") REFERENCES "Level"("levelNum") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_islandId_fkey" FOREIGN KEY ("islandId") REFERENCES "Island"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitFlag" ADD CONSTRAINT "SubmitFlag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmitFlag" ADD CONSTRAINT "SubmitFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedHistory" ADD CONSTRAINT "SolvedHistory_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolvedHistory" ADD CONSTRAINT "SolvedHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanHistory" ADD CONSTRAINT "BanHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "BanRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanHistory" ADD CONSTRAINT "BanHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
