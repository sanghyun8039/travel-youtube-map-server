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

  async getCourses(userId: string, containsGooglePlaceId?: string) {
    const courses = await this.prisma.course.findMany({
      where: { userId },
      include: {
        places: {
          orderBy: { orderIndex: 'asc' },
          take: 1,
          include: { place: { select: { category: true } } },
        },
        _count: { select: { places: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let containedCourseIds: Set<string> | null = null;
    if (containsGooglePlaceId) {
      const place = await this.prisma.place.findUnique({
        where: { googlePlaceId: containsGooglePlaceId },
        select: { id: true },
      });
      if (place) {
        const cps = await this.prisma.coursePlace.findMany({
          where: { placeId: place.id, course: { userId } },
          select: { courseId: true },
        });
        containedCourseIds = new Set(cps.map((cp) => cp.courseId));
      } else {
        containedCourseIds = new Set();
      }
    }

    return courses.map((course) => ({
      id: course.id,
      name: course.name,
      placeCount: course._count.places,
      topCategory: course.places[0]?.place?.category ?? null,
      createdAt: course.createdAt,
      ...(containedCourseIds !== null && {
        containsPlace: containedCourseIds.has(course.id),
      }),
    }));
  }

  async createCourse(userId: string, name: string) {
    return this.prisma.course.create({
      data: { userId, name },
      select: { id: true, name: true, createdAt: true },
    });
  }
}
