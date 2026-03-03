// src/events/events.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { UserEventType } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BanCheckGuard } from 'src/common/guard/ban-check.guard';


@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('test')
  async createTestEvent(
    @Body() body: { userId: string; problemId: number; type: UserEventType },
  ) {
    return this.eventsService.trackUserEvent(body.userId, body.problemId, body.type);
  }

  @UseGuards(JwtAuthGuard, BanCheckGuard)
  @Get(':userId')
  async getEvents(@Param('userId') userId: string) {
    return this.eventsService.getUserEvents(userId);
  }
}