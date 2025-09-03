import { Module } from '@nestjs/common'
import { KurrentdbController } from './kurrentdb.controller'
import { KurrentDBService } from '../services/kurrentdb.service'

@Module({
  controllers: [KurrentdbController],
  providers: [KurrentDBService],
  exports: [KurrentDBService],
})
export class KurrentdbModule {}
