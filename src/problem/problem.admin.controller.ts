import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { DevUserGuard } from '../auth/dev-user.guard';
import { ProblemService } from './problem.service';

@UseGuards(DevUserGuard)
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