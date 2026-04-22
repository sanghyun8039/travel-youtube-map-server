import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

/**
 * Google OAuth 콜백 전용 가드.
 *
 * 기본 AuthGuard('google')는 인증 실패(사용자 취소 포함) 시
 * UnauthorizedException(401 JSON)을 반환합니다.
 * 사용자가 Google 로그인을 취소하면 Google이
 *   GET /auth/google/callback?error=access_denied
 * 로 리다이렉트하는데, 이 때 JSON 에러 대신 프론트엔드 홈으로
 * 돌려보내야 합니다.
 */
@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Google이 OAuth 오류를 ?error=... 쿼리 파라미터로 전달합니다.
    // (access_denied = 사용자 취소, 그 외 = OAuth 설정 오류 등)
    // Passport가 실행되기 전에 먼저 체크해 프론트엔드로 리다이렉트합니다.
    if (request.query['error']) {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      response.redirect(frontendUrl);
      // response가 이미 전송됐으므로 NestJS 예외 필터가 headersSent를 보고
      // 추가 응답 없이 종료합니다.
      return false;
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
