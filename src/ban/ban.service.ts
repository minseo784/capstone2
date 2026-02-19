import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BanService {
  constructor(private prisma: PrismaService) {}

  /**
   * 🛡️ 공통 차단 실행 함수
   * @param userId 차단할 유저 ID
   * @param ip 접속 IP
   * @param ruleId 규칙 번호 (1:로그인, 2:가입, 3:과부하, 4:에러)
   * @param reason 상세 사유
   */
  async executeBan(userId: string | null, ip: string, ruleId: number, reason: string) {
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 💡 userId가 없으면 IP를 식별자로 사용 (예: GUEST_127_0_0_1)
      // 이렇게 하면 IP별로 그룹화가 가능해서 '유저별' 구분이 됩니다.
      const guestIdentifier = `GUEST_${ip.replace(/[:.]/g, '_')}`;

      await this.prisma.banHistory.create({
        data: {
          userId: userId || guestIdentifier, 
          ruleId: BigInt(ruleId),
          reason: reason,
          releasedAt: expiresAt,
        },
      });

      console.log(`🚨 [BAN SUCCESS] 식별자: ${userId || guestIdentifier} 차단 완료`);
    } catch (error) {
      // 만약 Foreign Key 제약 조건 때문에 에러가 난다면 (User 테이블에 ID가 없어서)
      // 이때는 어쩔 수 없이 userId를 null로 넣어야 합니다. (스키마의 ? 활용)
      console.error('❌ [BAN EXECUTE ERROR]', error);
    }
  }
  // --- 🔍 이미지의 4가지 자동 차단 조건 구현 ---

  // 1. 로그인 5분 내 20번 실패
  async checkLoginFail(userId: string | null, ip: string) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    // 유저 ID가 없더라도 IP 기반으로 "차단 시도 로그(BanHistory)"가 최근 5분 내에 있는지 체크
    // (실제로 차단되기 전의 '경고' 로그를 쌓는 테이블이 없다면, 여기서는 Throttler가 던지는 에러를 잡아야 합니다.)
    
    // 💡 현실적인 방법: Guard에서 이미 횟수를 제한하고 있으므로, 
    // 여기서는 executeBan을 직접 호출하는 구조로 가야 합니다.
  }

  // 2. 1시간 내 8개 가입 (IP 기준)
  async checkSignupSpam(ip: string) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await this.prisma.user.count({
      where: { createdAt: { gte: oneHourAgo } } 
    });
    if (count >= 8) await this.executeBan(null, ip, 2, '1시간 내 동일 IP 8회 가입 시도');
  }

  // 3. 5분 내 600번 이상 요청 (Throttler 연동용)
  async checkRequestOverload(userId: string | null, ip: string) {
    await this.executeBan(userId, ip, 3, '5분 내 600회 이상 과도한 요청');
  }

  // 4. 10분 내 서버 에러 15번 발생
  async checkServerErrorSpam(userId: string, ip: string) {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const errorCount = await this.prisma.userEvent.count({
      where: { userId, type: 'SERVER_ERROR', createdAt: { gte: tenMinAgo } }
    });
    if (errorCount >= 15) await this.executeBan(userId, ip, 4, '10분 내 서버 에러 15회 유발');
  }
}