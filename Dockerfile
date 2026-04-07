# 라즈베리파이(ARM64) + 일반 amd64 모두 지원
FROM node:20-alpine

WORKDIR /app

# 패키지 설치
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# 소스 복사
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate

# TypeScript 빌드
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/src/main"]
