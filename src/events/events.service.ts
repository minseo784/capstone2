// src/events/events.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // PrismaService 경로 확인
import { UserEventType } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async trackUserEvent(userId: string, problemId: number, type: UserEventType) {
    try {
      return await this.prisma.userEvent.create({
        data: { userId, problemId, type },
      });
    } catch (err) {
      console.warn(`[EventsService] userEvent 생성 실패 - userId: ${userId}, problemId: ${problemId}`, err.message);
      return null; // 서버 죽지 않게
    }
  }

  // 테스트를 위해 특정 유저의 이벤트를 조회하는 기능
  async getUserEvents(userId: string) {
    return this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}