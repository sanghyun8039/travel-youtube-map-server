import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
  PublicUserDto,
} from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- Kakao ---
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.handleLoginSuccess(req.user, res);
  }

  // --- Naver ---
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.handleLoginSuccess(req.user, res);
  }

  // --- Google ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.handleLoginSuccess(req.user, res);
  }

  // 공통 로그인 성공 처리 (JWT 쿠키 설정 및 리다이렉트)
  private async handleLoginSuccess(user: AuthenticatedUser, res: Response) {
    const { access_token } = await this.authService.login(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax', // 크로스 도메인 쿠키 전송을 위해 production에서 none 사용
      path: '/',
      maxAge: 3600000, // 1시간
    });

    return res.redirect(frontendUrl);
  }

  /**
   * POST로 변경된 이유 (CSRF 방어):
   *  - GET + <img src="..."> 공격 경로 차단
   *  - 프론트엔드는 커스텀 헤더(X-Requested-With)를 붙여서 호출 →
   *    브라우저가 preflight OPTIONS 강제 → CORS origin 화이트리스트가
   *    공격자 origin을 차단
   *  - 204 반환, 네비게이션은 클라이언트가 처리 (POST+redirect 안티패턴 회피)
   */
  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt', { path: '/' });
    return res.status(204).send();
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: AuthenticatedRequest): PublicUserDto {
    // req.user contains the user info returned from JwtStrategy.validate
    const { id, email, name, signupSource } = req.user;
    return { id, email, name, signupSource };
  }
}
