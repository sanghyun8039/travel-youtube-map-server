import { Module } from '@nestjs/common'
import { VideosModule } from './videos/videos.module'
import { PlacesModule } from './places/places.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [VideosModule, PlacesModule, AuthModule, UsersModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
