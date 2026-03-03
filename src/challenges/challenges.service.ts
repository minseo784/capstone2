// src/challenges/challenges.service.ts
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async getChallengeList(userId: string) {
    if (!userId) throw new BadRequestException("유저 ID가 필요합니다.");

    // 1. 모든 문제를 가져오며, 해당 유저의 SolvedHistory가 있는지 체크
    const problems = await this.prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        solved: {
          where: { userId },
          select: { userId: true },
        },
      },
      orderBy: { id: "asc" },
    });

    // 2. 프론트엔드 형식에 맞게 데이터 가공 (solved를 boolean으로)
    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category, // 'WEB' | 'AI'
      solved: p.solved.length > 0, // 기록이 있으면 true, 없으면 false
    }));
  }
}