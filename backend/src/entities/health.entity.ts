import { ApiProperty } from '@nestjs/swagger'

export class DatabaseHealth {
  @ApiProperty({ description: 'Health status', enum: ['healthy', 'degraded', 'unhealthy'] })
  status: 'healthy' | 'degraded' | 'unhealthy'

  @ApiProperty({ description: 'Health checks', type: 'object' })
  checks: {
    connection: boolean
    authentication: boolean
    read: boolean
    write: boolean
    sync: boolean
  }

  @ApiProperty({ description: 'Last check timestamp' })
  lastCheck: Date

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number

  @ApiProperty({ description: 'Error messages', type: [String] })
  errors: string[]
}

export class DatabaseConnection {
  @ApiProperty({ description: 'Connection status' })
  isConnected: boolean

  @ApiProperty({ description: 'Environment' })
  environment: string

  @ApiProperty({ description: 'Last sync timestamp', required: false })
  lastSync: Date | null

  @ApiProperty({ description: 'Connection ID' })
  connectionId: string

  @ApiProperty({
    description: 'Connection status',
    enum: ['connecting', 'connected', 'disconnected', 'error', 'reconnecting'],
  })
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
}

export class DatabaseMetrics {
  @ApiProperty({ description: 'Total number of streams' })
  totalStreams: number

  @ApiProperty({ description: 'Number of active streams' })
  activeStreams: number

  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number

  @ApiProperty({ description: 'Storage used in bytes' })
  storageUsed: number

  @ApiProperty({ description: 'Last backup timestamp', required: false })
  lastBackup: Date | null

  @ApiProperty({ description: 'Uptime in milliseconds' })
  uptime: number
}
