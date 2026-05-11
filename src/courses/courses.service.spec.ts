import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';

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

  describe('addPlace', () => {
    it('장소를 코스에 추가한다', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-uuid-1',
        userId: 'user-1',
        _count: { places: 2 },
      });
      mockPrisma.place.findUnique.mockResolvedValue({ id: 'place-uuid-1' });
      mockPrisma.coursePlace.create.mockResolvedValue({
        id: 'cp-uuid-1',
        orderIndex: 2,
      });

      const result = await service.addPlace('user-1', 'course-uuid-1', 'ChIJ_abc');

      expect(mockPrisma.coursePlace.create).toHaveBeenCalledWith({
        data: { courseId: 'course-uuid-1', placeId: 'place-uuid-1', orderIndex: 2 },
        select: { id: true, orderIndex: true },
      });
      expect(result).toEqual({ id: 'cp-uuid-1', orderIndex: 2 });
    });

    it('다른 유저의 코스에 추가하면 ForbiddenException', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-uuid-1',
        userId: 'other-user',
        _count: { places: 0 },
      });
      mockPrisma.place.findUnique.mockResolvedValue({ id: 'place-uuid-1' });

      await expect(
        service.addPlace('user-1', 'course-uuid-1', 'ChIJ_abc'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('이미 추가된 장소면 ConflictException', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-uuid-1',
        userId: 'user-1',
        _count: { places: 1 },
      });
      mockPrisma.place.findUnique.mockResolvedValue({ id: 'place-uuid-1' });
      const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockPrisma.coursePlace.create.mockRejectedValue(p2002);

      await expect(
        service.addPlace('user-1', 'course-uuid-1', 'ChIJ_abc'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removePlace', () => {
    it('장소를 코스에서 제거한다', async () => {
      mockPrisma.coursePlace.findUnique.mockResolvedValue({
        id: 'cp-uuid-1',
        courseId: 'course-uuid-1',
        course: { userId: 'user-1' },
      });
      mockPrisma.coursePlace.delete.mockResolvedValue({});

      await service.removePlace('user-1', 'course-uuid-1', 'cp-uuid-1');

      expect(mockPrisma.coursePlace.delete).toHaveBeenCalledWith({
        where: { id: 'cp-uuid-1' },
      });
    });

    it('다른 유저의 코스 장소 제거 시 ForbiddenException', async () => {
      mockPrisma.coursePlace.findUnique.mockResolvedValue({
        id: 'cp-uuid-1',
        courseId: 'course-uuid-1',
        course: { userId: 'other-user' },
      });

      await expect(
        service.removePlace('user-1', 'course-uuid-1', 'cp-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.coursePlace.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorderPlaces', () => {
    it('장소 순서를 변경한다', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-uuid-1',
        userId: 'user-1',
        places: [{ id: 'cp-1' }, { id: 'cp-2' }, { id: 'cp-3' }],
      });
      mockPrisma.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => {
        await Promise.all(ops);
      });
      mockPrisma.coursePlace.update.mockResolvedValue({});
      mockPrisma.coursePlace.findMany.mockResolvedValue([
        { id: 'cp-3', orderIndex: 0, place: { id: 'p-3', googlePlaceId: 'g3', name: 'C', lat: 0, lng: 0, category: null, address: null } },
        { id: 'cp-1', orderIndex: 1, place: { id: 'p-1', googlePlaceId: 'g1', name: 'A', lat: 0, lng: 0, category: null, address: null } },
        { id: 'cp-2', orderIndex: 2, place: { id: 'p-2', googlePlaceId: 'g2', name: 'B', lat: 0, lng: 0, category: null, address: null } },
      ]);

      const result = await service.reorderPlaces('user-1', 'course-uuid-1', ['cp-3', 'cp-1', 'cp-2']);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result[0].id).toBe('cp-3');
      expect(result[1].id).toBe('cp-1');
    });

    it('배열 길이가 코스 장소 수와 다르면 BadRequestException', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        id: 'course-uuid-1',
        userId: 'user-1',
        places: [{ id: 'cp-1' }, { id: 'cp-2' }],
      });

      await expect(
        service.reorderPlaces('user-1', 'course-uuid-1', ['cp-1']),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
