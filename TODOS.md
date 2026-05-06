# TODOS

## Users API

### P2 — getSavedVideos pagination
**Priority:** P2
**Description:** `GET /users/saved-videos`는 현재 사용자의 모든 저장 영상을 한 번에 반환합니다. 저장 수가 많아지면 메모리·응답 크기 문제가 발생할 수 있습니다. `take` + `cursor` 기반 페이지네이션 추가 필요.

### P3 — savedVideo CRUD transaction 보강
**Priority:** P3
**Description:** `saveVideo` / `unsaveVideo`가 `findVideoIdByYoutubeId` SELECT → DML 두 번의 DB 쿼리를 별도로 실행합니다. 매우 낮은 확률이지만 TOCTOU race가 있습니다. Prisma `$transaction`으로 묶거나 P2003 오류를 명시적으로 처리하면 더 견고해집니다.

## Completed
