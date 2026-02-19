import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // 매일 정오(12:00)에 자동으로 실행됩니다.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // 테스트를 위해 주기를 바꾸려면 아래 설명 참고!
  async sendDailyBanReport() {
    // 1. 최근 24시간 동안 발생한 차단 내역 조회
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const banList = await this.prisma.banHistory.findMany({
      where: {
        bannedAt: { gte: oneDayAgo },
      },
      include: {
        user: true, // 유저 정보를 함께 가져옵니다.
      },
    });

    // 차단된 내역이 없으면 리포트를 보내지 않습니다.
    if (banList.length === 0) {
      console.log('✅ [REPORT] 최근 24시간 동안 차단된 사용자가 없습니다.');
      return;
    }

    // 2. 리포트 본문 생성
    const reportSummary = banList
      .map(
        (b) =>
          `[유저ID: ${b.userId}] ${b.user?.nickname || 'Unknown'} 
           - 사유: ${b.reason} 
           - 차단일시: ${b.bannedAt.toLocaleString()}`
      )
      .join('\n\n');

    // 3. DB의 BanReport 테이블에 기록 저장 (주신 스키마 활용)
    await this.prisma.banReport.create({
      data: {
        summary: reportSummary,
      },
    });

    // 4. 이메일 발송 (관리자 이메일 주소를 입력하세요)
    await this.emailService.sendSecurityAlert('System Admin', reportSummary);
    
    console.log('✅ [REPORT] 정오 보안 리포트 발송 및 DB 저장을 완료했습니다.');
  }
}