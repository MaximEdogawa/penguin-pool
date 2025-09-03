import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable graceful shutdown
  app.enableShutdownHooks()

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })

  // Configure WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app))

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Swagger configuration
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

  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`)

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

    try {
      await app.close()
      console.log('✅ Application closed successfully')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'))

  // Handle uncaught exceptions
  process.on('uncaughtException', error => {
    console.error('💥 Uncaught Exception:', error)
    gracefulShutdown('uncaughtException')
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
    gracefulShutdown('unhandledRejection')
  })
}

bootstrap().catch(error => {
  console.error('💥 Failed to start application:', error)
  process.exit(1)
})
