import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from '../auth/auth.types';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('saved-videos')
  saveVideo(
    @Req() req: AuthenticatedRequest,
    @Body() body: { videoId: string },
  ) {
    if (!body?.videoId || typeof body.videoId !== 'string') {
      throw new BadRequestException('videoId is required');
    }
    return this.usersService.saveVideo(req.user.id, body.videoId);
  }

  @Delete('saved-videos/:videoId')
  unsaveVideo(
    @Req() req: AuthenticatedRequest,
    @Param('videoId') youtubeVideoId: string,
  ) {
    return this.usersService.unsaveVideo(req.user.id, youtubeVideoId);
  }

  @Get('saved-videos')
  getSavedVideos(@Req() req: AuthenticatedRequest) {
    return this.usersService.getSavedVideos(req.user.id);
  }

  @Get('saved-videos/:videoId')
  async checkSaved(
    @Req() req: AuthenticatedRequest,
    @Param('videoId') youtubeVideoId: string,
  ) {
    const saved = await this.usersService.isSaved(req.user.id, youtubeVideoId);
    return { saved };
  }
}
