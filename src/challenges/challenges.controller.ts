// src/challenges/challenges.controller.ts
import { Controller, Get, Req, UseGuards, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { ChallengesService } from "./challenges.service";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// import { JwtAuthGuard } from "../auth/jwt-auth.guard"; // 본인의 가드 경로에 맞게 수정

@Controller("problem")
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @UseGuards(JwtAuthGuard) // 인증이 필요하다면 주석 해제
  @Get("user-list")
  async getChallenges(@Req() req: Request) {
    // 가드에서 넣어준 유저 정보 확인 (보통 req.user에 들어있음)
    const user = (req as any).user;
    const userId = user?.id || user?.userId;

    if (!userId) {
      throw new UnauthorizedException("로그인이 필요한 서비스입니다.");
    }

    // 서비스에서 가공된 깔끔한 배열을 그대로 반환
    return await this.challengesService.getChallengeList(userId);
  }
}