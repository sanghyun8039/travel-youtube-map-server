import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: any) {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;
    
    // AuthService의 공통 로직 호출 (동일 이메일 시 자동 통합)
    const user = await this.authService.validateSocialUser('google', id, email, displayName);
    done(null, user);
  }
}
