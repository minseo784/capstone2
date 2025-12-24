/*
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ProblemService } from './problem.service';

@Controller()
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  // @UseGuards(JwtAuthGuard)
  @Post('problems/:id/submit')
  async submitFlag(
    @Param('id') id: string,
    @Body() body: { flag: string },
    @Req() req: any,
  ) {
    const userId = {req.user.id}; // JwtStrategy validate()가 user를 반환하니까 여기 id 있음
    return this.problemService.submitFlag({
      problemId: Number(id),
      userId,
      flag: body.flag ?? '',
    });
  }
}
  */
import { Body, Controller, Param, Post, Req, UseGuards, Get, ParseIntPipe } from '@nestjs/common';
import { DevUserGuard } from '../auth/dev-user.guard';
import { ProblemService } from './problem.service';

@Controller('problems')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @UseGuards(DevUserGuard)
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body('flag') flag: string,
    @Req() req: any,
  ) {
    return this.problemService.submitFlag({
      problemId: Number(id),
      userId: req.user.id,
      flag,
    });
  }

  @UseGuards(DevUserGuard)
  @Get(':id')
  async getProblem(@Param('id', ParseIntPipe) id: string) {
    return this.problemService.getProblem(Number(id));
  }
}

@Controller('admin/problems')
export class AdminProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  list() {
    return this.problemService.listProblems();
  }
}

@UseGuards(DevUserGuard)
@Controller('admin')
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Post('problems')
  create(@Body() body: { islandId: number; title: string; description: string; hint: string; correctFlag: string }) {
    return this.problemService.createProblem(body);
  }
}