import { ApiProperty } from '@nestjs/swagger'

export class ServiceUptimeRecord {
  @ApiProperty({ description: 'Record unique identifier' })
  id: string

  @ApiProperty({ description: 'Service name' })
  serviceName: string

  @ApiProperty({ description: 'Service status', enum: ['up', 'down', 'degraded'] })
  status: 'up' | 'down' | 'degraded'

  @ApiProperty({ description: 'Status timestamp' })
  timestamp: Date

  @ApiProperty({ description: 'Duration in milliseconds', required: false })
  duration?: number

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: {
    responseTime?: number
    error?: string
    performanceGrade?: string
  }
}

export class ServiceUptimeTimeline {
  @ApiProperty({ description: 'Service name' })
  serviceName: string

  @ApiProperty({ description: 'Total uptime in milliseconds' })
  totalUptime: number

  @ApiProperty({ description: 'Total downtime in milliseconds' })
  totalDowntime: number

  @ApiProperty({ description: 'Uptime percentage' })
  uptimePercentage: number

  @ApiProperty({ description: 'Current status', enum: ['up', 'down', 'degraded'] })
  currentStatus: 'up' | 'down' | 'degraded'

  @ApiProperty({ description: 'Last status change timestamp' })
  lastStatusChange: Date

  @ApiProperty({ description: 'Timeline records', type: [ServiceUptimeRecord] })
  timeline: ServiceUptimeRecord[]

  @ApiProperty({ description: 'Timeline start time' })
  startTime: Date

  @ApiProperty({ description: 'Timeline end time' })
  endTime: Date
}

export class ServiceUptimeSummary {
  @ApiProperty({ description: 'Service name' })
  serviceName: string

  @ApiProperty({ description: 'Current status', enum: ['up', 'down', 'degraded'] })
  currentStatus: 'up' | 'down' | 'degraded'

  @ApiProperty({ description: 'Uptime percentage' })
  uptimePercentage: number

  @ApiProperty({ description: 'Total uptime formatted' })
  totalUptime: string

  @ApiProperty({ description: 'Total downtime formatted' })
  totalDowntime: string

  @ApiProperty({ description: 'Last status change timestamp' })
  lastStatusChange: Date

  @ApiProperty({ description: 'Is currently up' })
  isCurrentlyUp: boolean
}
