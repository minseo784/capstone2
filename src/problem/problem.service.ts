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

    // 1) 제출 기록은 항상 남김 (스키마에 맞게 flag만 저장)
    await this.prisma.submitFlag.create({
      data: {
        userId,
        problemId,
        flag: trimmed,
      },
    });

    const correct = trimmed === problem.correctFlag;
    if (!correct) return { correct: false };

    // 2) 이미 풀었는지 체크 (중복 레벨업 방지)
    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (already) return { correct: true, alreadySolved: true };

    // 3) solved 기록
    await this.prisma.solvedHistory.create({
      data: { userId, problemId },
    });

    // 4) 맞추면 레벨 +1 (정책)
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { levelNum: { increment: 1 } },
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
        createdAt: true,
        updatedAt: true,
        // correctFlag는 절대 내려주면 안됨
      },
    });
  }

  async createProblem(body: { islandId: number; title: string; description: string; hint: string; correctFlag: string }) {
    return this.prisma.problem.create({
      data: {
        islandId: Number(body.islandId),
        title: body.title,
        description: body.description,
        hint: body.hint,
        correctFlag: body.correctFlag,
      },
    });
  }

  // 관리자가 문제 목록 조회할 때 사용
  async listProblems() {
    return this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { island: true },
    });
  }

}