import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { PlacesService } from './places.service'

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get()
  async getAllPlaces() {
    return this.placesService.getAllPlaces()
  }

  @Get('country/:countryCode')
  async getPlacesByCountry(@Param('countryCode') countryCode: string) {
    return this.placesService.getPlacesByCountry(countryCode)
  }

  @Get(':googlePlaceId/videos')
  async getVideosByPlace(
    @Param('googlePlaceId') googlePlaceId: string,
    @Query('exclude') exclude?: string,
  ) {
    return this.placesService.getVideosByPlace(googlePlaceId, exclude)
  }

  @Get(':googlePlaceId')
  async getPlaceById(@Param('googlePlaceId') googlePlaceId: string) {
    const place = await this.placesService.getPlaceById(googlePlaceId)
    if (!place) {
      throw new NotFoundException('Place not found')
    }
    return place
  }
}
