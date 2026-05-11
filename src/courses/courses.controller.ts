import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { AuthenticatedRequest } from '../auth/auth.types';

@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // NOTE: GET '' must come before GET ':id' — NestJS matches in declaration order
  @Get()
  getCourses(
    @Req() req: AuthenticatedRequest,
    @Query('containsGooglePlaceId') containsGooglePlaceId?: string,
  ) {
    return this.coursesService.getCourses(req.user.id, containsGooglePlaceId);
  }

  @Post()
  createCourse(@Req() req: AuthenticatedRequest, @Body() body: { name?: string }) {
    if (!body?.name?.trim()) throw new BadRequestException('name is required');
    return this.coursesService.createCourse(req.user.id, body.name.trim());
  }

  @Get(':id')
  getCourse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coursesService.getCourse(req.user.id, id);
  }

  @Patch(':id')
  updateCourse(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: { name?: string },
  ) {
    if (!body?.name?.trim()) throw new BadRequestException('name is required');
    return this.coursesService.updateCourse(req.user.id, id, body.name.trim());
  }

  @Delete(':id')
  deleteCourse(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.coursesService.deleteCourse(req.user.id, id);
  }

  @Post(':id/places')
  addPlace(
    @Req() req: AuthenticatedRequest,
    @Param('id') courseId: string,
    @Body() body: { googlePlaceId?: string },
  ) {
    if (!body?.googlePlaceId?.trim()) throw new BadRequestException('googlePlaceId is required');
    return this.coursesService.addPlace(req.user.id, courseId, body.googlePlaceId.trim());
  }

  // NOTE: 'reorder' must come before ':coursePlaceId' — NestJS literal before param
  @Patch(':id/places/reorder')
  reorderPlaces(
    @Req() req: AuthenticatedRequest,
    @Param('id') courseId: string,
    @Body() body: { orderedCoursePlaceIds?: string[] },
  ) {
    if (!Array.isArray(body?.orderedCoursePlaceIds)) {
      throw new BadRequestException('orderedCoursePlaceIds must be an array');
    }
    return this.coursesService.reorderPlaces(req.user.id, courseId, body.orderedCoursePlaceIds);
  }

  @Delete(':id/places/:coursePlaceId')
  removePlace(
    @Req() req: AuthenticatedRequest,
    @Param('id') courseId: string,
    @Param('coursePlaceId') coursePlaceId: string,
  ) {
    return this.coursesService.removePlace(req.user.id, courseId, coursePlaceId);
  }
}
