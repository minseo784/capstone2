import { Controller, Get, Query, UseGuards, Patch, Param, Body, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthService } from '../auth/auth.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Get('users')
  async listUsers(@Query('q') keyword: string) {
    const users = await this.authService.findAllUsers(keyword);
    
    return users.map(u => ({
      id: u.id,
      nickname: u.nickname,
      role: u.isAdmin ? 'ADMIN' : 'USER',
      banned: u.isBanned 
    }));
  }

    @Post('users/batch-update')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async batchUpdate(@Body('users') users: any[]) {
    return this.authService.batchUpdateUsers(users);
    }
}