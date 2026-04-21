import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  video: {
    findUnique: jest.fn(),
  },
  savedVideo: {
    upsert: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('saveVideo', () => {
    it('비디오를 저장한다', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({ id: 'video-uuid-1' });
      mockPrisma.savedVideo.upsert.mockResolvedValue({
        id: 'saved-uuid-1',
        userId: 'user-1',
        videoId: 'video-uuid-1',
        createdAt: new Date(),
      });

      const result = await service.saveVideo('user-1', 'yt-abc123');

      expect(mockPrisma.video.findUnique).toHaveBeenCalledWith({
        where: { videoId: 'yt-abc123' },
        select: { id: true },
      });
      expect(mockPrisma.savedVideo.upsert).toHaveBeenCalledWith({
        where: { userId_videoId: { userId: 'user-1', videoId: 'video-uuid-1' } },
        create: { userId: 'user-1', videoId: 'video-uuid-1' },
        update: {},
      });
      expect(result).toEqual({ saved: true });
    });

    it('존재하지 않는 비디오면 NotFoundException', async () => {
      mockPrisma.video.findUnique.mockResolvedValue(null);

      await expect(service.saveVideo('user-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unsaveVideo', () => {
    it('저장을 취소한다', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({ id: 'video-uuid-1' });
      mockPrisma.savedVideo.delete.mockResolvedValue({
        id: 'saved-uuid-1',
        userId: 'user-1',
        videoId: 'video-uuid-1',
        createdAt: new Date(),
      });

      const result = await service.unsaveVideo('user-1', 'yt-abc123');

      expect(mockPrisma.savedVideo.delete).toHaveBeenCalledWith({
        where: { userId_videoId: { userId: 'user-1', videoId: 'video-uuid-1' } },
      });
      expect(result).toEqual({ saved: false });
    });

    it('저장되지 않은 비디오 취소 시도는 에러 무시하고 { saved: false } 반환', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({ id: 'video-uuid-1' });
      mockPrisma.savedVideo.delete.mockRejectedValue(
        new Error('Record to delete does not exist'),
      );

      const result = await service.unsaveVideo('user-1', 'yt-abc123');
      expect(result).toEqual({ saved: false });
    });
  });

  describe('isSaved', () => {
    it('저장된 경우 true 반환', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({ id: 'video-uuid-1' });
      mockPrisma.savedVideo.findUnique.mockResolvedValue({ id: 'saved-uuid-1' });

      expect(await service.isSaved('user-1', 'yt-abc123')).toBe(true);
    });

    it('저장 안 된 경우 false 반환', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({ id: 'video-uuid-1' });
      mockPrisma.savedVideo.findUnique.mockResolvedValue(null);

      expect(await service.isSaved('user-1', 'yt-abc123')).toBe(false);
    });

    it('비디오가 없으면 false 반환', async () => {
      mockPrisma.video.findUnique.mockResolvedValue(null);

      expect(await service.isSaved('user-1', 'nonexistent')).toBe(false);
    });
  });

  describe('getSavedVideos', () => {
    it('저장된 비디오 목록을 VideoSummary 형태로 반환한다', async () => {
      // 실제 Prisma 스키마: Video에 channelName/channelThumbnailUrl/destDistrict 없음
      // channelName, thumbnailUrl은 Channel 관계를 통해 접근
      mockPrisma.savedVideo.findMany.mockResolvedValue([
        {
          video: {
            id: 'video-uuid-1',
            videoId: 'yt-abc123',
            title: '오사카 여행',
            destCountry: 'JP',
            destCity: '오사카',
            channel: {
              channelName: '여행채널',
              thumbnailUrl: 'https://example.com/thumb.jpg',
            },
            analyzedAt: new Date('2026-01-01'),
            _count: { places: 8 },
          },
        },
      ]);

      const result = await service.getSavedVideos('user-1');

      expect(mockPrisma.savedVideo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: {
          video: {
            select: {
              id: true,
              videoId: true,
              title: true,
              destCountry: true,
              destCity: true,
              analyzedAt: true,
              channel: {
                select: {
                  channelName: true,
                  thumbnailUrl: true,
                },
              },
              _count: { select: { places: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual([
        {
          id: 'video-uuid-1',
          videoId: 'yt-abc123',
          title: '오사카 여행',
          destCountry: 'JP',
          destCity: '오사카',
          channelName: '여행채널',
          channelThumbnailUrl: 'https://example.com/thumb.jpg',
          placeCount: 8,
          analyzedAt: new Date('2026-01-01').toISOString(),
        },
      ]);
    });
  });
});
