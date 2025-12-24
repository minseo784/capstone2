import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return req.user;
  }

  // ---- KAKAO ----
  @UseGuards(AuthGuard('kakao'))
  @Get('kakao')
  kakaoLogin() {}

  @UseGuards(AuthGuard('kakao'))
  @Get('kakao/callback')
  async kakaoCallback(@Req() req: any) {
    const kakao = req.user;

    const user = await this.auth.upsertSocialUser({
      provider: 'KAKAO',
      providerId: String(kakao.kakaoId),
      nickname: kakao.profile?.username ?? 'kakao-user',
    });

    const token = this.auth.signToken({
      userId: user.id,
      provider: 'kakao',
    });

    return { token, user };
  }

  // ---- GOOGLE ----
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin() {}

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: any) {
    console.log('[GOOGLE CALLBACK QUERY]', req.query);
    const google = req.user; // { googleId, email, nickname }

    const user = await this.auth.upsertSocialUser({
      provider: 'GOOGLE',
      providerId: String(google.googleId),
      nickname: google.nickname ?? 'google-user',
    });

    const token = this.auth.signToken({
      userId: user.id,
      provider: 'google',
    });

    return { token, user };
  }

  // ---- NAVER ----
  @UseGuards(AuthGuard('naver'))
  @Get('naver')
  naverLogin() {}

  @UseGuards(AuthGuard('naver'))
  @Get('naver/callback')
  async naverCallback(@Req() req: any) {
    const naver = req.user; // { naverId, nickname }

    const user = await this.auth.upsertSocialUser({
      provider: 'NAVER',
      providerId: String(naver.naverId),
      nickname: naver.nickname ?? 'naver-user',
    });

    const token = this.auth.signToken({
      userId: user.id,
      provider: 'naver',
    });

    return { token, user };
  }
}