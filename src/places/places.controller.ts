import { Controller, Get, Param } from '@nestjs/common'
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
}
