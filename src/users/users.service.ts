import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** YouTube videoId → Video.id(UUID) 변환 헬퍼 */
  private async findVideoIdByYoutubeId(youtubeVideoId: string): Promise<string | null> {
    const video = await this.prisma.video.findUnique({
      where: { videoId: youtubeVideoId },
      select: { id: true },
    });
    return video?.id ?? null;
  }

  async saveVideo(userId: string, youtubeVideoId: string): Promise<{ saved: boolean }> {
    const videoId = await this.findVideoIdByYoutubeId(youtubeVideoId);
    if (!videoId) {
      throw new NotFoundException(`Video not found: ${youtubeVideoId}`);
    }
    await this.prisma.savedVideo.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId },
      update: {},
    });
    return { saved: true };
  }

  async unsaveVideo(userId: string, youtubeVideoId: string): Promise<{ saved: boolean }> {
    const videoId = await this.findVideoIdByYoutubeId(youtubeVideoId);
    if (!videoId) return { saved: false };

    try {
      await this.prisma.savedVideo.delete({
        where: { userId_videoId: { userId, videoId } },
      });
    } catch {
      // 이미 삭제됐거나 없는 경우 — 무시
    }
    return { saved: false };
  }

  async isSaved(userId: string, youtubeVideoId: string): Promise<boolean> {
    const videoId = await this.findVideoIdByYoutubeId(youtubeVideoId);
    if (!videoId) return false;

    const saved = await this.prisma.savedVideo.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    return saved !== null;
  }

  async getSavedVideos(userId: string) {
    const rows = await this.prisma.savedVideo.findMany({
      where: { userId },
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

    return rows.map((row) => ({
      id: row.video.id,
      videoId: row.video.videoId,
      title: row.video.title,
      destCountry: row.video.destCountry,
      destCity: row.video.destCity,
      channelName: row.video.channel.channelName,
      channelThumbnailUrl: row.video.channel.thumbnailUrl,
      placeCount: row.video._count.places,
      analyzedAt: row.video.analyzedAt.toISOString(),
    }));
  }
}
