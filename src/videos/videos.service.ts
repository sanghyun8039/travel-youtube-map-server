import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

export interface SaveVideoDto {
  videoId: string
  title: string
  channel?: {
    channelId: string
    channelName: string
    channelUrl: string
    thumbnailUrl?: string
  }
  destCity?: string
  destCountry?: string
  places: {
    timestamp: number
    localName: string
    description?: string
    orderIndex: number
    googlePlaceId?: string
    address?: string
    city?: string
    country?: string
    countryCode?: string
    lat?: number
    lng?: number
  }[]
}

@Injectable()
export class VideosService {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL })
  private adapter = new PrismaPg(this.pool)
  private prisma = new PrismaClient({ adapter: this.adapter })

  async saveVideo(dto: SaveVideoDto) {
    let channelInfo = dto.channel

    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${dto.videoId}&format=json`)
      if (response.ok) {
        const data = await response.json()
        const authorUrl: string = data.author_url || ''
        const extractedId = authorUrl.split('/').pop() || data.author_name

        dto.title = data.title || dto.title

        channelInfo = {
          channelId: channelInfo?.channelId || extractedId,
          channelName: data.author_name || channelInfo?.channelName || 'Unknown',
          channelUrl: data.author_url || channelInfo?.channelUrl || '',
          thumbnailUrl: data.thumbnail_url || channelInfo?.thumbnailUrl,
        }
      }
    } catch (e) {
      console.error('oEmbed fetch error:', e)
    }

    if (!channelInfo) {
      throw new Error('Channel information is required')
    }

    // upsert channel
    const channel = await this.prisma.channel.upsert({
      where: { channelId: channelInfo.channelId },
      update: {
        channelName: channelInfo.channelName,
        channelUrl: channelInfo.channelUrl,
        ...(channelInfo.thumbnailUrl && { thumbnailUrl: channelInfo.thumbnailUrl }),
      },
      create: {
        channelId: channelInfo.channelId,
        channelName: channelInfo.channelName,
        channelUrl: channelInfo.channelUrl,
        thumbnailUrl: channelInfo.thumbnailUrl,
      },
    })

    // upsert video
    const video = await this.prisma.video.upsert({
      where: { videoId: dto.videoId },
      update: {
        title: dto.title,
        destCity: dto.destCity,
        destCountry: dto.destCountry,
        analyzedAt: new Date(),
      },
      create: {
        videoId: dto.videoId,
        title: dto.title,
        channelId: channel.id,
        destCity: dto.destCity,
        destCountry: dto.destCountry,
      },
    })

    // delete existing places for re-analysis
    await this.prisma.videoPlace.deleteMany({ where: { videoId: video.id } })

    // upsert places and create videoPlace links
    for (const p of dto.places) {
      let placeId: string | null = null

      if (p.googlePlaceId && p.lat != null && p.lng != null) {
        const place = await this.prisma.place.upsert({
          where: { googlePlaceId: p.googlePlaceId },
          update: {
            name: p.localName,
            address: p.address,
            city: p.city,
            country: p.country,
            countryCode: p.countryCode,
            lat: p.lat,
            lng: p.lng,
          },
          create: {
            googlePlaceId: p.googlePlaceId,
            name: p.localName,
            address: p.address,
            city: p.city,
            country: p.country,
            countryCode: p.countryCode,
            lat: p.lat,
            lng: p.lng,
          },
        })
        placeId = place.id
      }

      await this.prisma.videoPlace.create({
        data: {
          videoId: video.id,
          placeId,
          timestamp: p.timestamp,
          localName: p.localName,
          description: p.description,
          orderIndex: p.orderIndex,
        },
      })
    }

    return { id: video.id, videoId: video.videoId }
  }

  async getVideos() {
    return this.prisma.video.findMany({
      include: {
        channel: true,
        places: {
          include: { place: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { analyzedAt: 'desc' },
    })
  }

  async getVideo(videoId: string) {
    return this.prisma.video.findUnique({
      where: { videoId },
      include: {
        channel: true,
        places: {
          include: { place: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  }

  async deleteVideo(videoId: string) {
    const video = await this.prisma.video.findUnique({ where: { videoId } })
    if (!video) return null
    await this.prisma.videoPlace.deleteMany({ where: { videoId: video.id } })
    await this.prisma.video.delete({ where: { videoId } })
    return { deleted: videoId }
  }
}
