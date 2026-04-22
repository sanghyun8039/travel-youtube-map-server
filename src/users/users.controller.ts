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
    if (!body?.videoId || typeof body.videoId !== 'string' || body.videoId.length > 64) {
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

  // NOTE: 이 라우트는 반드시 @Get('saved-videos/:videoId') 보다 먼저 선언해야 합니다.
  // NestJS는 선언 순서대로 라우트를 매칭하므로 순서가 바뀌면 /saved-videos 요청이
  // :videoId 파라미터 라우트로 흡수됩니다.
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
