import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { TerminusModule } from '@nestjs/terminus'
import { HealthModule } from './health/health.module'
import { StreamsModule } from './streams/streams.module'
import { UptimeModule } from './uptime/uptime.module'
import { KurrentdbModule } from './kurrentdb/kurrentdb.module'
import { WebSocketModule } from './websocket/websocket.module'
import { StatusModule } from './status/status.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TerminusModule,
    HealthModule,
    StreamsModule,
    UptimeModule,
    KurrentdbModule,
    WebSocketModule,
    StatusModule,
  ],
})
export class AppModule {}
