import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'
import { KurrentDBService } from '../services/kurrentdb.service'

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
  namespace: '/ws/health',
})
export class HealthWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(HealthWebSocketGateway.name)
  private healthBroadcastInterval: NodeJS.Timeout

  constructor(private readonly kurrentDBService: KurrentDBService) {
    this.startHealthBroadcast()
  }

  handleConnection(client: Socket) {
    this.logger.log(`WebSocket client connected: ${client.id}`)

    // Send initial connection message
    client.emit('connection', {
      type: 'connection',
      message: 'Connected to health and uptime monitoring service',
      timestamp: new Date().toISOString(),
    })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebSocket client disconnected: ${client.id}`)
  }

  private startHealthBroadcast() {
    // Broadcast health status every 30 seconds
    this.healthBroadcastInterval = setInterval(async () => {
      await this.broadcastHealthStatus()
    }, 30000)
  }

  private async broadcastHealthStatus() {
    try {
      const healthData = {
        type: 'health_status',
        timestamp: new Date().toISOString(),
        services: {
          proxy: 'healthy',
          kurrentdb: 'unknown',
        },
      }

      // Check KurrentDB health
      try {
        const startTime = Date.now()
        const health = await this.kurrentDBService.checkHealth()
        const endTime = Date.now()
        const responseTime = endTime - startTime

        const EXCELLENT_THRESHOLD = 50
        const GOOD_THRESHOLD = 100
        const ACCEPTABLE_THRESHOLD = 500

        if (health.status === 'healthy') {
          if (responseTime <= EXCELLENT_THRESHOLD) {
            healthData.services.kurrentdb = 'healthy'
          } else if (responseTime <= GOOD_THRESHOLD) {
            healthData.services.kurrentdb = 'healthy'
          } else if (responseTime <= ACCEPTABLE_THRESHOLD) {
            healthData.services.kurrentdb = 'healthy'
          } else {
            if (responseTime > 1000) {
              healthData.services.kurrentdb = 'degraded'
            } else {
              healthData.services.kurrentdb = 'healthy'
            }
          }
        } else if (health.status === 'degraded') {
          healthData.services.kurrentdb = 'degraded'
        } else {
          healthData.services.kurrentdb = 'unhealthy'
        }
      } catch {
        healthData.services.kurrentdb = 'unhealthy'
      }

      // Broadcast to all connected clients
      this.server.emit('health_status', healthData)
    } catch (error) {
      this.logger.error('Error broadcasting health status:', error)
    }
  }

  broadcastServiceStatusChange(
    serviceName: string,
    status: string,
    metadata: Record<string, unknown>
  ) {
    const statusData = {
      type: 'service_status_change',
      timestamp: new Date().toISOString(),
      serviceName,
      status,
      metadata,
    }

    this.server.emit('service_status_change', statusData)
  }

  onModuleDestroy() {
    if (this.healthBroadcastInterval) {
      clearInterval(this.healthBroadcastInterval)
    }
  }
}
