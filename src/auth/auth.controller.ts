// src/auth/auth.controller.ts
import { Controller, Get, Req, UseGuards, Post, Body, Res, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DevUserGuard } from './dev-user.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(DevUserGuard)
  @Get('me/profile')
  async myProfile(@Req() req: any) {
    return this.auth.getMyProfile(req.user.id);
  }

  @Post('login')
  async login(@Body() body: { oauthProvider: 'kakao'|'google'|'naver'; oauthToken: string }) {
    const { oauthProvider, oauthToken } = body;

    // ✅ 지금은 "진짜 소셜 검증" 없이도 개발 가능하게
    // oauthToken을 providerId로 그대로 쓰거나, dev용 고정값을 써도 됨
    const providerId = oauthToken; // 개발용: 일단 이렇게

    const user = await this.auth.upsertSocialUser({
      provider: oauthProvider.toUpperCase() as 'KAKAO'|'GOOGLE'|'NAVER',
      providerId,
      nickname: `${oauthProvider}-user`,
    });

    const token = this.auth.signToken({ userId: user.id, provider: oauthProvider });

    return {
      success: true,
      data: {
        token,
        user: {
          userId: user.id,                 // ✅ 프론트는 userId
          nickname: user.nickname,
          level: user.levelNum,            // ✅ 프론트는 level
          oauthProvider,                   // ✅ "kakao" | "google" | "naver"
          isAdmin: user.isAdmin,
          isBanned: user.isBanned,
        },
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return req.user;
  }

  // 닉네임 수정 API
  @Post('update-nickname')
  @UseGuards(JwtAuthGuard)
  async updateNickname(@Req() req: any, @Body() body: { nickname: string }) {
    // req.user.userId는 JwtStrategy 설정에 따라 다를 수 있으니 
    // 만약 에러나면 req.user.id로 확인해보세요.
    const userId = req.user.userId || req.user.id; 
    return this.auth.updateNickname(userId, body.nickname);
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@Req() req: any) {
    const userId = req.user.userId || req.user.id;
    await this.auth.deleteUserAccount(userId);
    return { success: true, message: '탈퇴가 완료되었습니다.' };
  }
  
  // ---- KAKAO ----
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  kakaoLogin() {}

@UseGuards(AuthGuard('kakao'))
@Get('kakao/callback')
async kakaoCallback(@Req() req: any, @Res() res: any) {
  try {
    const kakao = req.user;
    const user = await this.auth.upsertSocialUser({
      provider: 'KAKAO',
      providerId: String(kakao.kakaoId),
      nickname: kakao.profile?.username ?? 'kakao-user',
    });

    const token = this.auth.signToken({ userId: user.id, provider: 'kakao' });
    return res.redirect(`http://localhost:3000/auth/kakao/callback?token=${token}`);

  } catch (error) {
    // ✅ 만약 ForbiddenException(밴 유저)이라면 에러 파라미터를 붙여서 리다이렉트
    if (error instanceof ForbiddenException) {
      return res.redirect(`http://localhost:3000/auth/kakao/callback?error=banned`);
    }
    // 다른 에러는 기본 처리
    return res.redirect(`http://localhost:3000/auth/kakao/callback?error=unknown`);
  }
}

// ---- GOOGLE ----
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {}

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const google = req.user;

      // 여기서 upsertSocialUser가 실행될 때 내부에서 isBanned를 체크하고 에러를 던집니다.
      const user = await this.auth.upsertSocialUser({
        provider: 'GOOGLE',
        providerId: String(google.googleId),
        nickname: google.nickname ?? 'google-user',
      });

      const token = this.auth.signToken({
        userId: user.id,
        provider: 'google',
      });

      return res.redirect(`http://localhost:3000/auth/google/callback?token=${token}`);
    } catch (error) {
      // 밴 당한 유저라면 프론트 콜백 페이지로 에러 정보를 보냄
      if (error instanceof ForbiddenException) {
        return res.redirect(`http://localhost:3000/auth/google/callback?error=banned`);
      }
      return res.redirect(`http://localhost:3000/auth/google/callback?error=unknown`);
    }
  }

  // ---- NAVER ----
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  naverLogin() {}

  @UseGuards(AuthGuard('naver'))
  @Get('naver/callback')
  async naverCallback(@Req() req: any, @Res() res: any) {
    try {
      const naver = req.user;

      const user = await this.auth.upsertSocialUser({
        provider: 'NAVER',
        providerId: String(naver.naverId),
        nickname: naver.nickname ?? 'naver-user',
      });

      const token = this.auth.signToken({
        userId: user.id,
        provider: 'naver',
      });

      return res.redirect(`http://localhost:3000/auth/naver/callback?token=${token}`);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return res.redirect(`http://localhost:3000/auth/naver/callback?error=banned`);
      }
      return res.redirect(`http://localhost:3000/auth/naver/callback?error=unknown`);
    }
  }
}