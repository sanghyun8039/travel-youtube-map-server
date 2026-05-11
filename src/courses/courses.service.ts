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

  async addPlace(userId: string, courseId: string, googlePlaceId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { places: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.userId !== userId) throw new ForbiddenException();

    const place = await this.prisma.place.findUnique({
      where: { googlePlaceId },
      select: { id: true },
    });
    if (!place) throw new NotFoundException('Place not found');

    try {
      return await this.prisma.coursePlace.create({
        data: { courseId, placeId: place.id, orderIndex: course._count.places },
        select: { id: true, orderIndex: true },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        throw new ConflictException('Place already in course');
      }
      throw e;
    }
  }

  async removePlace(userId: string, courseId: string, coursePlaceId: string) {
    const cp = await this.prisma.coursePlace.findUnique({
      where: { id: coursePlaceId },
      include: { course: { select: { userId: true } } },
    });
    if (!cp || cp.courseId !== courseId) throw new NotFoundException('CoursePlace not found');
    if (cp.course.userId !== userId) throw new ForbiddenException();

    await this.prisma.coursePlace.delete({ where: { id: coursePlaceId } });
  }
}
