import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

// 환경변수가 존재하는 OAuth 전략만 동적으로 등록
const oauthStrategies = [
  ...(process.env.KAKAO_CLIENT_ID ? [KakaoStrategy] : []),
  ...(process.env.NAVER_CLIENT_ID ? [NaverStrategy] : []),
  ...(process.env.GOOGLE_CLIENT_ID ? [GoogleStrategy] : []),
];

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ...oauthStrategies],
  exports: [AuthService],
})
export class AuthModule {}

