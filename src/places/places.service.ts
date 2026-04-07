import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

@Injectable()
export class PlacesService {
  private pool = new Pool({ connectionString: process.env.DATABASE_URL })
  private adapter = new PrismaPg(this.pool)
  private prisma = new PrismaClient({ adapter: this.adapter })

  // 모든 장소 (지도 표시용)
  async getAllPlaces() {
    const places = await this.prisma.place.findMany({
      include: {
        appearances: {
          include: {
            video: {
              include: { channel: true },
            },
          },
        },
      },
    })

    return places.map((p) => ({
      id: p.id,
      googlePlaceId: p.googlePlaceId,
      name: p.name,
      address: p.address,
      city: p.city,
      country: p.country,
      countryCode: p.countryCode,
      lat: p.lat,
      lng: p.lng,
      videos: p.appearances.map((a) => ({
        videoId: a.video.videoId,
        title: a.video.title,
        timestamp: a.timestamp,
        description: a.description,
        channelName: a.video.channel.channelName,
      })),
    }))
  }

  // 특정 도시/나라의 장소
  async getPlacesByCountry(countryCode: string) {
    const places = await this.prisma.place.findMany({
      where: { countryCode: countryCode.toUpperCase() },
      include: {
        appearances: {
          include: {
            video: {
              include: { channel: true },
            },
          },
        },
      },
    })

    return places.map((p) => ({
      id: p.id,
      googlePlaceId: p.googlePlaceId,
      name: p.name,
      address: p.address,
      city: p.city,
      country: p.country,
      countryCode: p.countryCode,
      lat: p.lat,
      lng: p.lng,
      videos: p.appearances.map((a) => ({
        videoId: a.video.videoId,
        title: a.video.title,
        timestamp: a.timestamp,
        description: a.description,
        channelName: a.video.channel.channelName,
      })),
    }))
  }
}
