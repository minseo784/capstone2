import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

    // ✅ 항상 존재하는 개발용 유저를 하나 보장 (로그인 없이 테스트용)
    const user = await this.prisma.user.upsert({
      where: {
        provider_providerId: { provider: 'KAKAO', providerId: 'dev-user' },
      },
      update: {},
      create: {
        provider: 'KAKAO',
        providerId: 'dev-user',
        nickname: 'dev',
        levelNum: 1,
        isAdmin: true,
        isBanned: false,
      },
    });

    req.user = user; // ✅ 여기서 req.user.id 생김
    return true;
  }
}