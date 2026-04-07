import { Controller, Get, Post, Delete, Param, Body, NotFoundException } from '@nestjs/common'
import { VideosService, SaveVideoDto } from './videos.service'

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  async saveVideo(@Body() dto: SaveVideoDto) {
    return this.videosService.saveVideo(dto)
  }

  @Get()
  async getVideos() {
    return this.videosService.getVideos()
  }

  @Get(':videoId')
  async getVideo(@Param('videoId') videoId: string) {
    const video = await this.videosService.getVideo(videoId)
    if (!video) throw new NotFoundException(`Video ${videoId} not found`)
    return video
  }

  @Delete(':videoId')
  async deleteVideo(@Param('videoId') videoId: string) {
    const result = await this.videosService.deleteVideo(videoId)
    if (!result) throw new NotFoundException(`Video ${videoId} not found`)
    return result
  }
}
