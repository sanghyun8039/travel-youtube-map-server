import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCourse(userId: string, name: string) {
    return this.prisma.course.create({
      data: { userId, name },
      select: { id: true, name: true, createdAt: true },
    });
  }
}
