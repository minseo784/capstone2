import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();

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

    req.user = user;
    return true;
  }
}