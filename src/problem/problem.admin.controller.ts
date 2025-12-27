import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 경로 확인 필요
import { AdminGuard } from '../auth/guards/admin.guard';   // 아까 만든 가드

@UseGuards(JwtAuthGuard, AdminGuard) // ✅ 진짜 보안 적용
@Controller('admin')
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Post('problems')
  create(@Body() body: { islandId: number; title: string; description: string; hint: string; correctFlag: string }) {
    return this.problemService.createProblem(body);
  }

  @Get('problems')
  list() {
    return this.problemService.listProblems();
  }
}