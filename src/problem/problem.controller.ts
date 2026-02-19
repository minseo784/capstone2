import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('problem')
export class ProblemController {
  constructor(private readonly problemService: ProblemService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-list')
  async getProblemsForUser(
    @Req() req: any,
    @Query('islandId') islandId?: string
  ) {
    return this.problemService.getProblemsForUser(
      req.user.id, 
      islandId ? Number(islandId) : undefined
    );
  }

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

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProblem(@Param('id', ParseIntPipe) id: number) {
    return this.problemService.getProblem(id);
  }
}