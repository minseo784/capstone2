import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

// 일반 사용자용 컨트롤러
@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  // 사용자의 문제 목록 조회 (풀이 여부 포함)
  @UseGuards(JwtAuthGuard)
  @Get('user-list')
  async getProblemsForUser(@Req() req: any) {
    return this.problemService.getProblemsForUser(req.user.id);
  }

  // 플래그 제출
  @UseGuards(JwtAuthGuard)
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

  // 개별 문제 상세 조회
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProblem(@Param('id', ParseIntPipe) id: number) {
    return this.problemService.getProblem(id);
  }
}

// 관리자용 문제 목록 조회 컨트롤러
@Controller('admin/problems')
export class AdminProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @Get()
  list() {
    return this.problemService.listProblems();
  }
}

// 관리자용 문제 생성 컨트롤러
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class ProblemAdminController {
  constructor(private readonly problemService: ProblemService) {}

  @Post('problems')
  create(
    @Body()
    body: {
      islandId: number;
      title: string;
      description: string;
      hint: string;
      correctFlag: string;
      serverLink?: string;
    },
  ) {
    return this.problemService.createProblem(body);
  }
}
