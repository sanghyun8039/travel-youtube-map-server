import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoogleCallbackGuard } from './google-callback.guard';

/**
 * 핵심 테스트: Google이 ?error=access_denied 를 붙여 콜백을 호출했을 때
 * 401 JSON 대신 프론트엔드로 리다이렉트해야 한다.
 */
describe('GoogleCallbackGuard', () => {
  let guard: GoogleCallbackGuard;

  const makeContext = (query: Record<string, string>): ExecutionContext => {
    const mockResponse = {
      redirect: jest.fn(),
      headersSent: false,
    };
    const mockRequest = { query };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [GoogleCallbackGuard],
    }).compile();
    guard = module.get(GoogleCallbackGuard);
  });

  describe('OAuth error 처리', () => {
    it('error=access_denied 시 FRONTEND_URL로 리다이렉트하고 false 반환', async () => {
      process.env.FRONTEND_URL = 'https://tubeway.app';
      const ctx = makeContext({ error: 'access_denied' });
      const response = ctx.switchToHttp().getResponse();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(response.redirect).toHaveBeenCalledTimes(1);
      expect(response.redirect).toHaveBeenCalledWith('https://tubeway.app');
    });

    it('FRONTEND_URL 미설정 시 localhost:3000으로 폴백', async () => {
      delete process.env.FRONTEND_URL;
      const ctx = makeContext({ error: 'access_denied' });
      const response = ctx.switchToHttp().getResponse();

      await guard.canActivate(ctx);

      expect(response.redirect).toHaveBeenCalledWith('http://localhost:3000');
    });

    it('error=server_error 등 다른 OAuth 에러도 동일하게 리다이렉트', async () => {
      process.env.FRONTEND_URL = 'https://tubeway.app';
      const ctx = makeContext({ error: 'server_error' });
      const response = ctx.switchToHttp().getResponse();

      const result = await guard.canActivate(ctx);

      expect(result).toBe(false);
      expect(response.redirect).toHaveBeenCalled();
    });
  });

  describe('정상 OAuth 흐름', () => {
    it('error 쿼리 파라미터 없으면 super.canActivate 위임 (Passport 실행)', async () => {
      // error가 없으면 super.canActivate가 호출되어야 한다.
      // super.canActivate는 Passport 전략을 실행하므로 여기서는 호출 여부만 검증.
      const superSpy = jest
        .spyOn(Object.getPrototypeOf(GoogleCallbackGuard.prototype), 'canActivate')
        .mockResolvedValue(true);

      const ctx = makeContext({ code: 'auth-code-from-google' });

      const result = await guard.canActivate(ctx);

      expect(superSpy).toHaveBeenCalledWith(ctx);
      expect(result).toBe(true);

      superSpy.mockRestore();
    });

    it('쿼리 파라미터가 아예 없어도 super.canActivate 위임', async () => {
      const superSpy = jest
        .spyOn(Object.getPrototypeOf(GoogleCallbackGuard.prototype), 'canActivate')
        .mockResolvedValue(true);

      const ctx = makeContext({});

      await guard.canActivate(ctx);

      expect(superSpy).toHaveBeenCalled();

      superSpy.mockRestore();
    });
  });
});
