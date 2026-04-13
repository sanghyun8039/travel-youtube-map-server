# 라즈베리파이 배포 가이드 (GitHub Actions)

이 문서는 라즈베리파이에 `self-hosted runner`를 설치하고, GitHub Actions를 통해 자동 배포를 구성하는 방법을 안내합니다.

## 1. GitHub Secrets 설정

GitHub 저장소의 `Settings` -> `Secrets and variables` -> `Actions`에 아래의 시크릿들을 등록해야 합니다.

| 이름 | 설명 | 예시 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma 및 서버에서 사용할 DB 접속 URL | `postgresql://postgres:pi@localhost:5432/travel_youtube_map?schema=public` |
| `POSTGRES_USER` | DB 사용자 이름 (기본값: postgres) | `postgres` |
| `POSTGRES_PASSWORD` | DB 비밀번호 | `pi` (또는 설정한 비밀번호) |
| `POSTGRES_DB` | 사용할 DB 이름 | `travel_youtube_map` |

---

## 2. 라즈베리파이 Self-Hosted Runner 설정

### 2.1 도커 및 컴포즈 설치 (설치되지 않은 경우)
라즈베리파이에서 아래 명령어를 실행하여 설치합니다.

```bash
# 도커 설치
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 도커 컴포즈 V2 설치 (권장)
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### 2.2 러너 다운로드 및 설치
1. GitHub 저장소의 `Settings` -> `Actions` -> `Runners` -> `New self-hosted runner` 클릭
2. `Linux` -> `ARM64` 선택 후 나오는 가이드 명령어를 터미널에서 순서대로 실행

### 2.2 러너를 시스템 서비스로 등록 (백그라운드 상시 실행)
터미널이 꺼져도 러너가 계속 작동하도록 서비스를 등록합니다.

```bash
# 러너 설치 디렉토리에서 실행
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 3. 배포 확인

`main` 브랜치에 코드가 `push`되면 GitHub Actions가 자동으로 실행됩니다. 라즈베리파이에서 아래 명령어로 컨테이너 상태를 확인할 수 있습니다.

```bash
docker-compose ps
docker-compose logs -f server
```
