# Changelog

All notable changes to travel-youtube-map-server will be documented in this file.

## [0.1.0] - 2026-04-22

### Added
- **브이로그 저장 API** — `POST /users/saved-videos`, `DELETE /users/saved-videos/:videoId`, `GET /users/saved-videos`, `GET /users/saved-videos/:videoId` 엔드포인트 추가. JWT 인증 필수.
- `UsersService` — `saveVideo` / `unsaveVideo` / `isSaved` / `getSavedVideos` 메서드 구현. YouTube videoId → 내부 UUID 변환 헬퍼(`findVideoIdByYoutubeId`) 포함.
- `GoogleCallbackGuard` — Google OAuth 취소(access_denied) 시 401 JSON 대신 `FRONTEND_URL`로 리다이렉트하는 전용 가드. Passport 실행 전 `?error` 쿼리 파라미터를 선제 처리.

### Fixed
- **Google OAuth 취소 → 401 JSON 버그** — 사용자가 Google 로그인 화면에서 취소하면 `{"message":"Unauthorized","statusCode":401}` 대신 프론트엔드 홈으로 리다이렉트합니다.
- `getSavedVideos` — Channel 관계 JOIN 누락으로 `channelName` / `channelThumbnailUrl`이 항상 빈 값이던 문제 수정.
- `unsaveVideo` — `catch {}` 범위를 Prisma P2025(레코드 없음)로 좁혀 DB 장애 등 실제 오류가 묻히지 않도록 수정.
- `saveVideo` — NotFoundException 메시지에서 사용자 입력 echo 제거(정보 유출 방지).
- `UsersController` — 모든 엔드포인트(POST body + DELETE/GET 경로 파라미터)에 `videoId` 길이 제한(64자) 일관 적용.
- `GoogleCallbackGuard` — `super.canActivate()` 반환값을 `Observable|boolean|Promise`에서 `Promise.resolve()`로 안전하게 래핑.
