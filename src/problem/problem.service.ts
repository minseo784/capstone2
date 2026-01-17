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

    await this.prisma.submitFlag.create({
      data: {
        userId,
        problemId,
        flag: trimmed,
      },
    });

    const correct = trimmed === problem.correctFlag;
    if (!correct) return { correct: false };

    // 중복 레벨업 방지
    const already = await this.prisma.solvedHistory.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    if (already) return { correct: true, alreadySolved: true };

    await this.prisma.solvedHistory.create({
      data: { userId, problemId },
    });

    const totalSolvedCount = await this.prisma.solvedHistory.count({
      where: { userId },
    });

    let newLevel = 1;
    while (totalSolvedCount >= Math.pow(2, newLevel) - 1) {
      newLevel++;
    }
    console.log("업데이트 시도 유저 ID:", userId);

    // 유저 레벨 업데이트
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { levelNum: newLevel },
      select: { levelNum: true },
    });

    console.log("DB 업데이트 결과:", updated);
    
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