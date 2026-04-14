import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { AuthService } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET, // 필요 시 설정
      callbackURL: process.env.KAKAO_CALLBACK_URL,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { id, _json } = profile;
    const kakaoAccount = _json.kakao_account;
    
    // 카카오에서 제공하는 사용자 정보 추출
    const email = kakaoAccount?.email;
    const name = profile.displayName || kakaoAccount?.profile?.nickname;
    
    const user = await this.authService.validateSocialUser('kakao', id.toString(), email, name);
    done(null, user);
  }
}
