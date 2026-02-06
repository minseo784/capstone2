import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async getChallengeList(userId: string, status: string = 'ALL') {
    let whereCondition: any = {};

    // 요구사항에 따른 필터링 (ALL, SOLVED, UNSOLVED)
    if (status === 'SOLVED') {
      whereCondition = { solved: { some: { userId } } };
    } else if (status === 'UNSOLVED') {
      whereCondition = { solved: { none: { userId } } };
    }

    const problems = await this.prisma.problem.findMany({
      where: whereCondition,
      select: {
        id: true,
        title: true,
        solved: {
          where: { userId },
          select: { userId: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      isSolved: p.solved.length > 0,
    }));
  }
}