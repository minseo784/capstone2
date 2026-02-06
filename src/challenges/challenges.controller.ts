import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ChallengesService } from './challenges.service';

@Controller('challenges') // URL이 /challenges 로 시작함
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get('list') // GET /challenges/list?status=SOLVED
  async getChallengeList(@Query('status') status: string, @Req() req: any) {
    const userId = req.user.id; // 인증 로직에 맞게 수정 필요
    return this.challengesService.getChallengeList(userId, status);
  }
}