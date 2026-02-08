import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type ChallengeTab = "all" | "solved" | "unsolved";

export interface ChallengeAllItem {
  problemId: number;
  title: string;
  category: string;
  isSolved: boolean;
}

export interface ChallengeSimpleItem {
  problemId: number;
  title: string;
  category: string;
}

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async getChallengeList(userId: string, tab: ChallengeTab) {
    if (!userId) throw new BadRequestException("userId is required");

    switch (tab) {
      case "all": {
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

        const items: ChallengeAllItem[] = problems.map((p) => ({
          problemId: p.id,
          title: p.title,
          category: String(p.category),
          isSolved: p.solved.length > 0,
        }));

        return items;
      }

      case "solved": {
        const problems = await this.prisma.problem.findMany({
          where: {
            solved: { some: { userId } },
          },
          select: {
            id: true,
            title: true,
            category: true,
          },
          orderBy: { id: "asc" },
        });

        const items: ChallengeSimpleItem[] = problems.map((p) => ({
          problemId: p.id,
          title: p.title,
          category: String(p.category),
        }));

        return items;
      }

      case "unsolved": {
        const problems = await this.prisma.problem.findMany({
          where: {
            solved: { none: { userId } },
          },
          select: {
            id: true,
            title: true,
            category: true,
          },
          orderBy: { id: "asc" },
        });

        const items: ChallengeSimpleItem[] = problems.map((p) => ({
          problemId: p.id,
          title: p.title,
          category: String(p.category),
        }));

        return items;
      }

      default:
        throw new BadRequestException("tab must be one of: all | solved | unsolved");
    }
  }
}
