import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TerminusModule } from '@nestjs/terminus'
import { ThrottlerModule } from '@nestjs/throttler'
import { FeatureFlagsModule } from './feature-flags/feature-flags.module'
import { HealthModule } from './health/health.module'
import { KurrentdbModule } from './kurrentdb/kurrentdb.module'
import { StatusModule } from './status/status.module'
import { StreamsModule } from './streams/streams.module'
import { UptimeModule } from './uptime/uptime.module'
import { WebSocketModule } from './websocket/websocket.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', `env.${process.env.NODE_ENV || 'dev'}`], // Load .env.local first, then env-specific file
      ignoreEnvFile: false,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TerminusModule,
    FeatureFlagsModule,
    HealthModule,
    StreamsModule,
    UptimeModule,
    KurrentdbModule,
    WebSocketModule,
    StatusModule,
  ],
})
export class AppModule {}
