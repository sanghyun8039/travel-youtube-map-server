import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // --- Kakao ---
  @Get('kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLogin() {}

  @Get('kakao/callback')
  @UseGuards(AuthGuard('kakao'))
  async kakaoLoginCallback(@Req() req: any, @Res() res: Response) {
    return this.handleLoginSuccess(req.user, res);
  }

  // --- Naver ---
  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  async naverLogin() {}

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  async naverLoginCallback(@Req() req: any, @Res() res: Response) {
    return this.handleLoginSuccess(req.user, res);
  }

  // --- Google ---
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: any, @Res() res: Response) {
    return this.handleLoginSuccess(req.user, res);
  }

  // 공통 로그인 성공 처리 (JWT 쿠키 설정 및 리다이렉트)
  private async handleLoginSuccess(user: any, res: Response) {
    const { access_token } = await this.authService.login(user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.cookie('jwt', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600000, // 1시간
    });

    return res.redirect(frontendUrl);
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('jwt');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(frontendUrl);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req: any) {
    // req.user contains the user info returned from JwtStrategy.validate
    const { id, email, name, signupSource } = req.user;
    return { id, email, name, signupSource };
  }
}
