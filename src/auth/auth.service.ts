import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // PrismaService 위치 확인 필요
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateSocialUser(provider: string, providerId: string, email?: string, name?: string) {
    // 1. 소셜 계정 정보로 기존 SocialAccount가 있는지 확인
    let socialAccount = await this.prisma.socialAccount.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
      include: { user: true },
    });

    // 2. 이미 연동된 계정이 있다면 해당 유저 반환
    if (socialAccount) {
      return socialAccount.user;
    }

    // 3. 연동된 계정이 없다면, 이메일로 기존 User가 있는지 확인 (계정 통합 정책)
    let user = null;
    if (email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    }

    // 4. 이메일로 기존 유저가 있다면, 해당 유저에 소셜 계정만 연동
    if (user) {
      await this.prisma.socialAccount.create({
        data: {
          provider,
          providerId,
          userId: user.id,
        },
      });
    } else {
      // 5. 기존 유저도 없다면 새 유저와 소셜 계정 동시 생성 (최초 가입)
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          signupSource: provider,
          socialAccounts: {
            create: {
              provider,
              providerId,
            },
          },
        },
      });
    }

    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
