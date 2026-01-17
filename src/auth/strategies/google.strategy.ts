import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    console.log('googlestrategy constructor called');
    console.log('[GOOGLE ENV CHECK]', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.slice(0, 20),
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING',
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    });

    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    console.log({
    clientID: clientID?.slice(0, 12),
    clientSecret: clientSecret ? 'SET' : 'MISSING',
    callbackURL,
    });


    if (!clientID) throw new Error('GOOGLE_CLIENT_ID is not set');
    if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is not set');
    if (!callbackURL) throw new Error('GOOGLE_CALLBACK_URL is not set');

    super({
        clientID: clientID!,
        clientSecret: clientSecret!,
        callbackURL: callbackURL!,
        scope: ['profile', 'email'],

        authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenURL: 'https://oauth2.googleapis.com/token',
    });

  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    const nickname =
      profile.displayName ||
      profile.name?.givenName ||
      email?.split('@')[0] ||
      'google-user';

    const user = {
      googleId: profile.id,
      email,
      nickname,
    };
    done(null, user);
  }
}
