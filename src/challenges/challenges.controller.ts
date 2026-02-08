import { Controller, Get, Query, Req, BadRequestException } from "@nestjs/common";
import type { Request } from "express";              // ✅ type-only import
import { ChallengesService } from "./challenges.service";
import type { ChallengeTab } from "./challenges.service"; // ✅ type-only import

@Controller("challenges")
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  async getChallenges(@Req() req: Request, @Query("tab") tab?: ChallengeTab) {
    const safeTab = (tab ?? "all") as ChallengeTab;

    if (!["all", "solved", "unsolved"].includes(safeTab)) {
      throw new BadRequestException("tab must be one of: all | solved | unsolved");
    }

    const user = (req as any).user;
    const userId: string | undefined = user?.id ?? user?.userId;
    if (!userId) throw new BadRequestException("Unauthorized: userId missing");

    const data = await this.challengesService.getChallengeList(userId, safeTab);
    return { success: true, data };
  }
}
