import { getJwtSecret } from './config';

describe('getJwtSecret', () => {
  it('returns JWT_SECRET env value when set', () => {
    const env = { JWT_SECRET: 'real-secret', NODE_ENV: 'production' };
    expect(getJwtSecret(env)).toBe('real-secret');
  });

  it('returns dev fallback when unset in development', () => {
    const env = { NODE_ENV: 'development' };
    expect(getJwtSecret(env)).toMatch(/dev-only/);
  });

  it('returns dev fallback when unset in test', () => {
    const env = { NODE_ENV: 'test' };
    expect(getJwtSecret(env)).toMatch(/dev-only/);
  });

  it('throws in production when JWT_SECRET is unset — prevents known-secret forgery attacks', () => {
    const env = { NODE_ENV: 'production' };
    expect(() => getJwtSecret(env)).toThrow(/JWT_SECRET is required/);
  });

  it('throws in production when JWT_SECRET is empty string', () => {
    const env = { JWT_SECRET: '', NODE_ENV: 'production' };
    expect(() => getJwtSecret(env)).toThrow(/JWT_SECRET is required/);
  });
});
