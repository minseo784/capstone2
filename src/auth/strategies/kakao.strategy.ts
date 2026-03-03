// src/auth/strategies/kakao.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('KAKAO_CLIENT_ID');
    const callbackURL = config.get<string>('KAKAO_CALLBACK_URL');

    if (!clientID) throw new Error('KAKAO_CLIENT_ID is not set');
    if (!callbackURL) throw new Error('KAKAO_CALLBACK_URL is not set');

    super({
      clientID,
      callbackURL,
    });
    console.log('[kakao]', { clientID, callbackURL });
  }
  

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    const user = {
      provider: 'kakao',
      kakaoId: profile?.id,
      profile,
      accessToken,
    };
    done(null, user);
  }
}
