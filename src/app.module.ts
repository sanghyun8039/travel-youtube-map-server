import { Module } from '@nestjs/common'
import { VideosModule } from './videos/videos.module'
import { PlacesModule } from './places/places.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [VideosModule, PlacesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
