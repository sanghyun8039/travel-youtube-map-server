import type { Request } from 'express';
import type { User } from '@prisma/client';

/**
 * Passport 전략(`JwtStrategy.validate`, OAuth 전략 등)이 반환해서
 * `req.user`에 주입하는 객체의 타입.
 *
 * 현재 JwtStrategy와 AuthService.validateSocialUser는 Prisma `User`를
 * 그대로 반환하므로 Prisma 타입을 사용.
 */
export type AuthenticatedUser = User;

/**
 * `@UseGuards(AuthGuard(...))`가 붙은 핸들러에서 `req.user`가
 * 반드시 존재함을 타입 시스템에 알리기 위한 Request 서브타입.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * `/auth/me`가 반환하는 공개 DTO.
 * 내부 필드(passwordHash 등)는 포함되지 않음.
 */
export interface PublicUserDto {
  id: AuthenticatedUser['id'];
  email: AuthenticatedUser['email'];
  name: AuthenticatedUser['name'];
  signupSource: AuthenticatedUser['signupSource'];
}
