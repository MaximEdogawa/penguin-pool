import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { logger } from './shared/services/logger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableShutdownHooks()

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })

  app.useWebSocketAdapter(new IoAdapter(app))

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  const config = new DocumentBuilder()
    .setTitle('KurrentDB Backend API')
    .setDescription('Backend service for KurrentDB integration with Penguin Pool')
    .setVersion('1.0')
    .addTag('health', 'Health check endpoints')
    .addTag('streams', 'Stream management endpoints')
    .addTag('uptime', 'Service uptime monitoring endpoints')
    .addTag('kurrentdb', 'KurrentDB proxy endpoints')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'KurrentDB API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: ['https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css'],
  })

  const port = parseInt(process.env.HTTP_PORT || '3001', 10)
  await app.listen(port)

  logger.info(`Application is running on port ${port}`)

  const gracefulShutdown = async (_signal: string) => {
    try {
      await app.close()
      process.exit(0)
    } catch {
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'))

  process.on('uncaughtException', _error => {
    gracefulShutdown('uncaughtException')
  })

  process.on('unhandledRejection', (_reason, _promise) => {
    gracefulShutdown('unhandledRejection')
  })
}

bootstrap().catch(_error => {
  process.exit(1)
})
