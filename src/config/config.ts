/**
 * JWT 서명 시크릿 반환.
 *
 * 기존에는 `process.env.JWT_SECRET || 'fallback_secret_change_me'` 패턴이었는데,
 * 이 경우 env가 누락되면 서버가 *알려진* 시크릿으로 동작하여 누구나 유효한
 * JWT를 위조할 수 있는 심각한 취약점이 된다.
 *
 * 이 함수는 프로덕션에서 env가 없으면 즉시 throw하여 서버가 뜨지 않게 한다.
 *
 * @param env 환경변수 객체 (테스트 주입용)
 */
export function getJwtSecret(
  env: Record<string, string | undefined> = process.env,
): string {
  const secret = env.JWT_SECRET;
  if (secret) return secret;

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is required in production. ' +
        'Set it as a GitHub Actions secret and redeploy the backend.',
    );
  }

  // dev/test 전용 — 절대 프로덕션에서 이 값이 사용되지 않도록 위에서 throw.
  return 'dev-only-secret-DO-NOT-use-in-production';
}
