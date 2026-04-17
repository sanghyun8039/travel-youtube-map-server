import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest
              .fn()
              .mockResolvedValue({ access_token: 'fake-jwt-token' }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('returns only id, email, name, signupSource — never leaks other user fields', () => {
      const req = {
        user: {
          id: 'user-123',
          email: 'a@b.com',
          name: 'Alice',
          signupSource: 'google',
          // 이런 내부 필드는 유출되면 안 됨
          createdAt: new Date('2024-01-01'),
          passwordHash: 'should-never-leak',
          internalNote: 'admin-only',
        },
      };

      const result = controller.getMe(req as unknown as Parameters<typeof controller.getMe>[0]);

      expect(result).toEqual({
        id: 'user-123',
        email: 'a@b.com',
        name: 'Alice',
        signupSource: 'google',
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('internalNote');
    });

    it('handles nullable email/name/signupSource', () => {
      const req = {
        user: {
          id: 'user-456',
          email: null,
          name: null,
          signupSource: null,
        },
      };

      const result = controller.getMe(req as unknown as Parameters<typeof controller.getMe>[0]);

      expect(result).toEqual({
        id: 'user-456',
        email: null,
        name: null,
        signupSource: null,
      });
    });
  });

  describe('logout', () => {
    it('clears jwt cookie and returns 204 No Content (not a redirect, so safe for POST)', () => {
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      controller.logout(res as unknown as Parameters<typeof controller.logout>[0]);

      expect(res.clearCookie).toHaveBeenCalledWith('jwt', expect.objectContaining({ path: '/' }));
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
