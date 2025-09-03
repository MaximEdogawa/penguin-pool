import { Module } from '@nestjs/common'
import { StreamsController } from './streams.controller'
import { StreamManagementService } from './stream-management.service'
import { KurrentDBService } from '../services/kurrentdb.service'

@Module({
  controllers: [StreamsController],
  providers: [StreamManagementService, KurrentDBService],
  exports: [StreamManagementService, KurrentDBService],
})
export class StreamsModule {}
