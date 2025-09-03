import { Module } from '@nestjs/common'
import { UptimeController } from './uptime.controller'
import { UptimeTrackingService } from './uptime-tracking.service'
import { KurrentDBService } from '../services/kurrentdb.service'

@Module({
  controllers: [UptimeController],
  providers: [UptimeTrackingService, KurrentDBService],
  exports: [UptimeTrackingService, KurrentDBService],
})
export class UptimeModule {}
