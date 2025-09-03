import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsNumber, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class UptimeQueryDto {
  @ApiProperty({
    description: 'Time period in hours (use -1 for all time)',
    required: false,
    default: 24,
    minimum: -1,
    maximum: 8760,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-1)
  @Max(8760)
  hours?: number = 24
}

export class UptimeStatsResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({
    description: 'Memory statistics',
    type: 'object',
    properties: {
      totalRecords: { type: 'number', example: 1000 },
      recordsPerService: {
        type: 'object',
        additionalProperties: { type: 'number' },
        example: { http: 500, websocket: 300, database: 200 },
      },
      memoryEstimate: { type: 'string', example: '2.5 MB' },
    },
  })
  stats: {
    totalRecords: number
    recordsPerService: Record<string, number>
    memoryEstimate: string
  }
}

export class UptimeSummaryResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({ description: 'Time period description', example: '24 hours' })
  period: string

  @ApiProperty({
    description: 'Service summaries',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'http' },
        uptime: { type: 'number', example: 99.9 },
        status: { type: 'string', example: 'up' },
      },
    },
  })
  services: Array<{
    service: string
    uptime: number
    status: 'up' | 'down' | 'degraded'
  }>
}

export class UptimeServiceResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({ description: 'Time period description', example: '24 hours' })
  period: string

  @ApiProperty({
    description: 'Service summary',
    type: 'object',
    properties: {
      service: { type: 'string', example: 'http' },
      uptime: { type: 'number', example: 99.9 },
      status: { type: 'string', example: 'up' },
      lastCheck: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
    },
  })
  service: {
    service: string
    uptime: number
    status: 'up' | 'down' | 'degraded'
    lastCheck: string
  }
}

export class UptimeTimelineResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({ description: 'Time period description', example: '24 hours' })
  period: string

  @ApiProperty({
    description: 'Service timeline',
    type: 'object',
    properties: {
      service: { type: 'string', example: 'http' },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            status: { type: 'string', example: 'up' },
            duration: { type: 'number', example: 300 },
          },
        },
      },
    },
  })
  timeline: {
    service: string
    events: Array<{
      timestamp: string
      status: 'up' | 'down' | 'degraded'
      duration: number
    }>
  }
}

export class UptimeStatusResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({
    description: 'Current service statuses',
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: ['up', 'down', 'degraded'],
    },
    example: {
      http: 'up',
      websocket: 'up',
      database: 'up',
    },
  })
  services: Record<string, 'up' | 'down' | 'degraded'>
}

export class UptimeCheckResponseDto {
  @ApiProperty({ description: 'Response timestamp', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string

  @ApiProperty({ description: 'Check message', example: 'Manual status check completed' })
  message: string

  @ApiProperty({
    description: 'Check results',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        service: { type: 'string', example: 'http' },
        status: { type: 'string', enum: ['up', 'down', 'degraded'], example: 'up' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        metadata: { type: 'object', example: { responseTime: 50 } },
      },
    },
  })
  results: Array<{
    service: string
    status: 'up' | 'down' | 'degraded'
    timestamp: string
    metadata: Record<string, unknown>
  }>
}
