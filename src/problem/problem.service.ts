import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  // 사용자의 문제 목록 조회 (풀이 여부 포함)
  async getProblemsForUser(userId: string) {
    const problems = await this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        title: true,
        // DB 스키마에 category 필드가 없다면 아래 줄은 주석 처리하세요.
        // category: true,
      },
    });

    const solvedHistories = await this.prisma.solvedHistory.findMany({
      where: { userId },
      select: { problemId: true },
    });

    const solvedProblemIds = solvedHistories.map((h) => h.problemId);

    return problems.map((p) => ({
      ...p,
      solved: solvedProblemIds.includes(p.id),
    }));
  }

  async submitFlag(params: {
    problemId: number;
    userId: string;
    flag: string;
  }) {
    const { problemId, userId, flag } = params;
    const trimmed = (flag ?? '').trim();
    if (!trimmed) throw new BadRequestException('flag is required');

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, correctFlag: true },
    });
    if (!problem) throw new NotFoundException('problem not found');

    const isCorrect = trimmed === problem.correctFlag;

    const submit = await this.prisma.submitFlag.create({
      data: { userId, problemId, submittedFlag: trimmed, isCorrect },
    });

    if (!submit.isCorrect) return { correct: false };

    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (already) return { correct: true, alreadySolved: true };

    await this.prisma.solvedHistory.create({ data: { userId, problemId } });

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
      },
    });
  }

  async listProblems() {
    return this.prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { island: true },
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
        island: { connect: { id: data.islandId || 1 } },
      },
    });
  }
}
