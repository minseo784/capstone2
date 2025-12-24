import { Controller, Get, Param, Req, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DevUserGuard } from '../auth/dev-user.guard';
import { IslandsService } from './islands.service';

@Controller('islands')
export class IslandsController {
  constructor(private readonly islandsService: IslandsService) {}

  @Get()
  getAllIslands() {
    return this.islandsService.getAllIslands();
  }

  @UseGuards(DevUserGuard)
  @Get(':id/problems')
  async getIslandProblems(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    return this.islandsService.getProblems(id, userId);
  }
}
