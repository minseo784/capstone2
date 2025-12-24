import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  signToken(payload: { userId: string; provider: string }) {
    return this.jwt.sign(payload);
  }

  async upsertSocialUser(params: {
    provider: 'KAKAO' | 'GOOGLE' | 'NAVER';
    providerId: string;
    nickname: string;
  }) {
    return this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: params.provider,
          providerId: params.providerId,
        },
      },
      update: {
        // lastLoginAt: new Date(),
      },
      create: {
        provider: params.provider,
        providerId: params.providerId,
        nickname: params.nickname,
        // lastLoginAt: new Date(),
      },
    });
  }

  // Mypage
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        isAdmin: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        level: { select: { num: true, shipImage: true } },
      },
    });

    const solved = await this.prisma.solvedHistory.findMany({
      where: { userId },
      select: {
        solvedAt: true,
        problem: { select: { id: true, islandId: true, title: true } },
      },
      orderBy: { solvedAt: 'desc' },
    });

    return { user, solved };
  }

}
