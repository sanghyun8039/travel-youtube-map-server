import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: process.env.NAVER_CALLBACK_URL,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { id, email, name } = profile;
    
    // AuthService의 공통 로직 호출 (동일 이메일 시 자동 통합)
    const user = await this.authService.validateSocialUser('naver', id, email, name);
    done(null, user);
  }
}
