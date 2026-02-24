// src/common/guards/ban-check.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// ban-check.guard.ts
// ban-check.guard.ts
@Injectable()
export class BanCheckGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. 🔥 이 줄이 핵심입니다. 로그인 안 한 놈(소셜 로그인 중인 놈)은 그냥 보내주세요
    let user = request.user;
    if (!user || !user.id) {
        return true; // 신분증 확인 안 된 놈은 여기서 막지 말고 그냥 보냄
    }

    // 2. 이미 로그인 된 놈들만 여기서 DB 조회해서 잡는 겁니다.
    user = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { isBanned: true }
    });

    if (user?.isBanned) {
        throw new ForbiddenException('넌 나가라.');
    }

    return true;
    }
}