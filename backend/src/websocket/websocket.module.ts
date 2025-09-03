import { Module } from '@nestjs/common'
import { HealthWebSocketGateway } from './websocket.gateway'
import { KurrentDBService } from '../services/kurrentdb.service'

@Module({
  providers: [HealthWebSocketGateway, KurrentDBService],
  exports: [HealthWebSocketGateway, KurrentDBService],
})
export class WebSocketModule {}
