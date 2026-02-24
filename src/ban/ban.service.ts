// src/ban/ban.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BanService {
  constructor(private prisma: PrismaService) {}

  async executeBan(userId: string, ruleId: number, reason: string) {
    const releasedAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 뒤

    // 트랜잭션으로 히스토리 저장 + 유저 상태 변경 한방에
    await this.prisma.$transaction([
      this.prisma.banHistory.create({
        data: { 
          userId, 
          ruleId: BigInt(ruleId), 
          reason, 
          releasedAt 
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { isBanned: true },
      }),
    ]);
    
    console.log(`🚨 [BAN EXECUTE] 유저 ${userId} 즉시 차단 및 히스토리 생성 완료`);
  }

  async checkServerErrorSpam(userId: string) {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const errorCount = await this.prisma.userEvent.count({
      where: { 
        userId, 
        type: 'SERVER_ERROR', 
        createdAt: { gte: tenMinAgo } 
      }
    });

    console.log(`📊 [CHECK] 유저 ${userId} 에러 스택: ${errorCount}/15`);

    if (errorCount >= 15) {
      await this.executeBan(userId, 4, '10분 내 서버 에러 15회 유발');
    }
  }
}