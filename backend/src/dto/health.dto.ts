import { ApiProperty } from '@nestjs/swagger'

export class HealthResponseDto {
  @ApiProperty({ description: 'Health status' })
  status: string

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string

  @ApiProperty({ description: 'Service name' })
  service: string

  @ApiProperty({ description: 'KurrentDB URL' })
  kurrentdb_url: string

  @ApiProperty({ description: 'Service version' })
  version: string
}

export class DatabaseHealthResponseDto {
  @ApiProperty({ description: 'Health status' })
  status: string

  @ApiProperty({ description: 'Connection status' })
  connected: boolean

  @ApiProperty({ description: 'Connection status description' })
  connectionStatus: string

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number

  @ApiProperty({ description: 'Performance grade' })
  performanceGrade: string

  @ApiProperty({ description: 'Performance thresholds', type: 'object' })
  thresholds: {
    excellent: number
    good: number
    acceptable: number
  }

  @ApiProperty({ description: 'Error messages', type: [String] })
  errors: string[]
}

export class ComprehensiveHealthResponseDto {
  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string

  @ApiProperty({ description: 'Overall system status' })
  overallStatus: string

  @ApiProperty({ description: 'Service health details', type: 'object' })
  services: Record<
    string,
    {
      status: string
      port?: number
      uptime?: number
      memory?: NodeJS.MemoryUsage
      environment?: string
      connections?: number
      connected?: boolean
      connectionStatus?: string
      url?: string
      error?: string
      responseTime?: number
      performanceGrade?: string
      thresholds?: {
        excellent: number
        good: number
        acceptable: number
      }
    }
  >

  @ApiProperty({ description: 'Total response time' })
  responseTime: number

  @ApiProperty({ description: 'Error message', required: false })
  error?: string
}
