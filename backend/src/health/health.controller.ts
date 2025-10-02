import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HealthCheck, HealthCheckService } from '@nestjs/terminus'
import { KurrentDBService } from '../services/kurrentdb.service'
import {
  HealthResponseDto,
  DatabaseHealthResponseDto,
  ComprehensiveHealthResponseDto,
} from '../dto/health.dto'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly kurrentDBService: KurrentDBService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthResponseDto })
  @HealthCheck()
  async check(): Promise<HealthResponseDto> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'kurrentdb-proxy',
      kurrentdb_url: process.env['KURRENTDB_URL'] || 'http://localhost:2113',
      version: process.env['npm_package_version'] || '1.0.0',
    }
  }

  @Get('kurrentdb')
  @ApiOperation({ summary: 'KurrentDB health check' })
  @ApiResponse({
    status: 200,
    description: 'Database health status',
    type: DatabaseHealthResponseDto,
  })
  async checkKurrentDB(): Promise<DatabaseHealthResponseDto> {
    try {
      const startTime = Date.now()
      const healthData = await this.kurrentDBService.checkHealth()
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Define response time thresholds
      const EXCELLENT_THRESHOLD = 50
      const GOOD_THRESHOLD = 100
      const ACCEPTABLE_THRESHOLD = 500

      let performanceGrade = 'excellent'
      if (responseTime <= EXCELLENT_THRESHOLD) {
        performanceGrade = 'excellent'
      } else if (responseTime <= GOOD_THRESHOLD) {
        performanceGrade = 'good'
      } else if (responseTime <= ACCEPTABLE_THRESHOLD) {
        performanceGrade = 'acceptable'
      } else {
        performanceGrade = 'slow'
      }

      return {
        status: healthData.status,
        connected: healthData.checks.connection,
        connectionStatus: healthData.checks.connection ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        performanceGrade: performanceGrade,
        thresholds: {
          excellent: EXCELLENT_THRESHOLD,
          good: GOOD_THRESHOLD,
          acceptable: ACCEPTABLE_THRESHOLD,
        },
        errors: healthData.errors,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        connectionStatus: 'disconnected',
        timestamp: new Date().toISOString(),
        responseTime: 0,
        performanceGrade: 'disconnected',
        thresholds: {
          excellent: 50,
          good: 100,
          acceptable: 500,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  @Get('comprehensive')
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive system health status',
    type: ComprehensiveHealthResponseDto,
  })
  async checkComprehensive(): Promise<ComprehensiveHealthResponseDto> {
    const startTime = Date.now()
    const healthChecks: ComprehensiveHealthResponseDto = {
      timestamp: new Date().toISOString(),
      overallStatus: 'healthy',
      services: {},
      responseTime: 0,
    }

    try {
      const HTTP_PORT = parseInt(process.env['HTTP_PORT'] || '3001', 10)
      const KURRENTDB_URL = process.env['KURRENTDB_URL'] || 'http://localhost:2113'

      // Check HTTP service
      healthChecks.services['http'] = {
        status: 'healthy',
        port: HTTP_PORT,
        memory: process.memoryUsage(),
        environment: process.env['NODE_ENV'] || 'development',
      }

      // Check WebSocket service
      healthChecks.services['websocket'] = {
        status: 'healthy', // Assume healthy if process is running
        port: parseInt(process.env['HTTP_PORT'] || '3001', 10),
        connections: 0, // This would need to be tracked by WebSocket service
      }

      // Check KurrentDB connection
      try {
        const kurrentdbStartTime = Date.now()
        const kurrentdbHealth = await this.kurrentDBService.checkHealth()
        const kurrentdbEndTime = Date.now()
        const kurrentdbResponseTime = kurrentdbEndTime - kurrentdbStartTime

        const EXCELLENT_THRESHOLD = 50
        const GOOD_THRESHOLD = 100
        const ACCEPTABLE_THRESHOLD = 500

        let performanceGrade = 'excellent'
        if (kurrentdbResponseTime <= EXCELLENT_THRESHOLD) {
          performanceGrade = 'excellent'
        } else if (kurrentdbResponseTime <= GOOD_THRESHOLD) {
          performanceGrade = 'good'
        } else if (kurrentdbResponseTime <= ACCEPTABLE_THRESHOLD) {
          performanceGrade = 'acceptable'
        } else {
          performanceGrade = 'slow'
        }

        healthChecks.services['kurrentdb'] = {
          status: kurrentdbHealth.status,
          connected: kurrentdbHealth.checks.connection,
          connectionStatus: kurrentdbHealth.checks.connection ? 'connected' : 'disconnected',
          url: KURRENTDB_URL,
          responseTime: kurrentdbResponseTime,
          performanceGrade: performanceGrade,
          thresholds: {
            excellent: EXCELLENT_THRESHOLD,
            good: GOOD_THRESHOLD,
            acceptable: ACCEPTABLE_THRESHOLD,
          },
          ...(kurrentdbHealth.errors.length > 0 && { error: kurrentdbHealth.errors.join(', ') }),
        }
      } catch (error) {
        healthChecks.services['kurrentdb'] = {
          status: 'unhealthy',
          connected: false,
          connectionStatus: 'disconnected',
          url: KURRENTDB_URL,
          error: error instanceof Error ? error.message : 'Unknown error',
          performanceGrade: 'disconnected',
        }
      }

      // Determine overall status
      const serviceStatuses = Object.values(healthChecks.services).map(s => s.status)
      if (serviceStatuses.some(s => s === 'unhealthy')) {
        healthChecks.overallStatus = 'unhealthy'
      } else if (serviceStatuses.some(s => s === 'degraded')) {
        healthChecks.overallStatus = 'degraded'
      }

      healthChecks.responseTime = Date.now() - startTime
      return healthChecks
    } catch (error) {
      healthChecks.overallStatus = 'unhealthy'
      healthChecks.responseTime = Date.now() - startTime
      healthChecks.error = error instanceof Error ? error.message : 'Unknown error'
      return healthChecks
    }
  }
}
