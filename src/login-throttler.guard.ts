import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerStorage, ThrottlerRequest } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { BanService } from './ban/ban.service';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS') options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly banService: BanService
  ) {
    super(options, storageService, reflector);
  }

  /*
  // 🚨 최신 버전의 handleRequest는 인자를 하나(ThrottlerRequest)만 받습니다.
  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, throttler, getTracker, generateKey } = requestProps;
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // 🔥 [핵심] 인증 관련 경로는 한도를 20으로 강제 하향
    let currentLimit = limit;
    if (path.includes('/auth/')) {
      currentLimit = 20; 
    }

    // 부모 클래스에 수정된 limit을 넘겨서 처리
    return super.handleRequest({
      ...requestProps,
      limit: currentLimit,
    });
  }
  */

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit } = requestProps;
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    let currentLimit = limit;
    
    // 🚨 테스트를 위해 /auth/가 들어간 모든 경로(auth/me 포함)를 5번으로 확 줄여봅시다.
    if (path.includes('/auth/')) {
      currentLimit =100; // 20번도 많아요, 일단 5번으로 테스트!
    }

    return super.handleRequest({ ...requestProps, limit: currentLimit });
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const userId = request.body?.userId || null;
    const ip = request.ip || '::1'; // IP가 없으면 localhost로 간주
    const path = request.url;

    // 🛡️ 관리자/로컬 예외
    if (userId === 'admin' || ip === '::1') {
      console.warn(`⚠️ [THROTTLE EXEMPTION] User: ${userId}, IP: ${ip} - Exempted from throttling.`);
      return; // 예외 처리 후에도 차단이 발생할 수 있으므로, 여기서는 그냥 로그만 남기고 넘어갑니다.
    }

    let ruleId = 3;
    let reason = '5분 내 600회 이상 과도한 요청';

    if (path.includes('/auth/')) {
      ruleId = 1;
      reason = '5분 내 20회 이상 인증 시도 (계정 보호)';
    }

    // DB 기록 실행
    await this.banService.executeBan(userId, ip, ruleId, reason);

    throw new Error(`보안 정책 위반(${reason})으로 인해 24시간 동안 정지되었습니다.`);
  }
}