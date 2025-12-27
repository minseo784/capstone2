// src/auth/auth.service.ts
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
    const user = await this.prisma.user.upsert({
      where: {
        provider_providerId: {
          provider: params.provider,
          providerId: params.providerId,
        },
      },
      update: {}, 
      create: {
        provider: params.provider,
        providerId: params.providerId,
        nickname: params.nickname,
      },
    });

    // ✅ [추가] 차단 여부 확인 로직
    // upsert 결과로 나온 user 객체의 isBanned가 true라면 에러를 던집니다.
    if (user.isBanned) {
      throw new ForbiddenException('차단된 계정입니다. 관리자에게 문의하세요.');
    }

    return user;
  }

  // Mypage
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        levelNum: true,
        provider: true,   // ✅ 추가: KAKAO 인지 등 구분
        providerId: true, // ✅ 추가: 사용자가 ID라고 생각하는 고유 번호
        isAdmin: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
        level: { select: { levelNum: true, shipImage: true } },
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

  // 닉네임 수정
  async updateNickname(userId: string, newNickname: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname: newNickname },
    });
  }

  // 회원 탈퇴
  async deleteUserAccount(userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        
        // 1. 제출 로그(SubmitFlag) 삭제 - 🚨 이번 에러의 범인
        await tx.submitFlag.deleteMany({
          where: { userId: userId },
        });

        // 2. 풀이 완료 기록(SolvedHistory) 삭제
        await tx.solvedHistory.deleteMany({
          where: { userId: userId },
        });

        // 3. (혹시 있다면) 다른 유저 관련 테이블들도 여기에 추가 가능

        // 4. 마지막으로 유저 본인 삭제
        return await tx.user.delete({
          where: { id: userId },
        });
      });
    } catch (error) {
      console.error("DB 유저 삭제 중 에러 발생:", error);
      throw error;
    }
  }

  // 관리자용: 모든 유저 목록 조회 (검색 포함)
  async findAllUsers(keyword?: string) {
    return this.prisma.user.findMany({
      where: keyword
        ? {
            OR: [
              { nickname: { contains: keyword } },
              { id: { contains: keyword } },
            ],
          }
        : {},
      select: {
        id: true,
        nickname: true,
        isAdmin: true,
        isBanned: true, // DB 필드명이 isBanned인지 확인 필요 (프론트는 banned로 쓰고 있음)
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 관리자용: 유저 차단 상태 변경
  async updateBanStatus(userId: string, isBanned: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isBanned },
    });
  }

  async batchUpdateUsers(users: any[]) {
    // Prisma 트랜잭션을 사용하여 모든 유저 상태를 업데이트
    return this.prisma.$transaction(
      users.map((u) =>
        this.prisma.user.update({
          where: { id: u.id },
          data: {
            isAdmin: u.role === 'ADMIN', // 프론트의 'ADMIN' 문자열을 DB의 boolean으로
            isBanned: u.banned,          // 프론트의 banned를 DB의 isBanned로
          },
        }),
      ),
    );
  }
}
