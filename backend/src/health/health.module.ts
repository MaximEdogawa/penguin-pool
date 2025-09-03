import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { HealthController } from './health.controller'
import { KurrentDBService } from '../services/kurrentdb.service'

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [KurrentDBService],
  exports: [KurrentDBService],
})
export class HealthModule {}
