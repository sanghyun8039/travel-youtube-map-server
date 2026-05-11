import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  course: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  coursePlace: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  place: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('getCourses', () => {
    it('내 코스 목록만 반환한다', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'course-uuid-1',
          name: '나의 서울 코스',
          userId: 'user-1',
          createdAt: new Date('2026-01-01'),
          places: [
            {
              orderIndex: 0,
              place: { category: 'restaurant' },
            },
          ],
          _count: { places: 3 },
        },
      ]);

      const result = await service.getCourses('user-1');

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
      expect(result).toEqual([
        {
          id: 'course-uuid-1',
          name: '나의 서울 코스',
          placeCount: 3,
          topCategory: 'restaurant',
          createdAt: new Date('2026-01-01'),
        },
      ]);
    });

    it('containsGooglePlaceId 제공 시 containsPlace 플래그를 포함한다', async () => {
      mockPrisma.course.findMany.mockResolvedValue([
        {
          id: 'course-uuid-1',
          name: '나의 서울 코스',
          createdAt: new Date('2026-01-01'),
          places: [],
          _count: { places: 0 },
        },
      ]);
      mockPrisma.place.findUnique.mockResolvedValue({ id: 'place-uuid-1' });
      mockPrisma.coursePlace.findMany.mockResolvedValue([{ courseId: 'course-uuid-1' }]);

      const result = await service.getCourses('user-1', 'ChIJ_abc123');

      expect(result[0]).toMatchObject({ id: 'course-uuid-1', containsPlace: true });
    });
  });

  describe('createCourse', () => {
    it('코스를 생성한다', async () => {
      const now = new Date();
      mockPrisma.course.create.mockResolvedValue({
        id: 'course-uuid-1',
        name: '나의 서울 코스',
        createdAt: now,
      });

      const result = await service.createCourse('user-1', '나의 서울 코스');

      expect(mockPrisma.course.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', name: '나의 서울 코스' },
        select: { id: true, name: true, createdAt: true },
      });
      expect(result).toEqual({
        id: 'course-uuid-1',
        name: '나의 서울 코스',
        createdAt: now,
      });
    });
  });
});
