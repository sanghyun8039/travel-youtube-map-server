import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  course: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  coursePlace: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  place: {
    findUnique: jest.fn(),
  },
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
