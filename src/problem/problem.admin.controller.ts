import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
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