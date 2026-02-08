import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}


  async submitFlag(params: { problemId: number; userId: string; flag: string }) {
    const { problemId, userId, flag } = params;

    const trimmed = (flag ?? '').trim();
    if (!trimmed) throw new BadRequestException('flag is required');

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, correctFlag: true },
    });
    if (!problem) throw new NotFoundException('problem not found');

    const isCorrect = trimmed === problem.correctFlag;

    // ✅ 제출 로그에 정답 여부까지 저장
    const submit = await this.prisma.submitFlag.create({
      data: {
        userId,
        problemId,
        submittedFlag: trimmed,
        isCorrect, // ✅ 추가
      },
      select: { id: true, isCorrect: true, submittedAt: true },
    });

    if (!submit.isCorrect) {
      return { correct: false };
    }

    // ✅ 이미 풀었는지 확인 (중복 레벨업 방지)
    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
      select: { userId: true },
    });
    if (already) return { correct: true, alreadySolved: true };

    await this.prisma.solvedHistory.create({
      data: { userId, problemId },
    });

    const totalSolvedCount = await this.prisma.solvedHistory.count({
      where: { userId },
    });

    let newLevel = 1;
    while (totalSolvedCount >= Math.pow(2, newLevel) - 1) newLevel++;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { levelNum: newLevel },
      select: { levelNum: true },
    });

    return { correct: true, alreadySolved: false, newLevel: updated.levelNum };
  }

  async getProblem(problemId: number) {
    return this.prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        islandId: true,
        title: true,
        description: true,
        hint: true,
        serverLink: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createProblem(data: any) {
    return this.prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        correctFlag: data.correctFlag,
        serverLink: data.serverLink,
        hint: data.hint,
        island: {
          connect: { id: data.islandId || 1 }
        }
      },
    });
  }

  // 관리자 - 문제 목록 조회
  async listProblems() {
    return this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { island: true },
    });
  }

}