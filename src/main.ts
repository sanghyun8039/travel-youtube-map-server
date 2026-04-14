import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable cookie parser
  app.use(cookieParser())

  // Update CORS for authentication (credentials: true required for cookies)
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  const port = process.env.PORT ?? 3001
  await app.listen(port, '0.0.0.0')
  console.log(`Travel YouTube Map Server running on port ${port}`)
}

bootstrap()
