import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret_change_me',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, NaverStrategy, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
