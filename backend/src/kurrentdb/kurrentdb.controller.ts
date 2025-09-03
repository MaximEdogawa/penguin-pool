import { Controller, Get, Post } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { KurrentDBService } from '../services/kurrentdb.service'

@ApiTags('kurrentdb')
@Controller('kurrentdb')
export class KurrentdbController {
  constructor(private readonly kurrentDBService: KurrentDBService) {}

  @Get('*')
  @ApiOperation({ summary: 'Proxy GET requests to KurrentDB' })
  @ApiParam({ name: 'path', description: 'KurrentDB API path', example: 'streams' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  @ApiResponse({ status: 500, description: 'Proxy error' })
  async proxyGet() {
    // This would be handled by the proxy middleware
    // For now, return a placeholder response
    return {
      message: 'KurrentDB proxy endpoint',
      timestamp: new Date().toISOString(),
    }
  }

  @Post('*')
  @ApiOperation({ summary: 'Proxy POST requests to KurrentDB' })
  @ApiParam({ name: 'path', description: 'KurrentDB API path', example: 'streams' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  @ApiResponse({ status: 500, description: 'Proxy error' })
  async proxyPost() {
    // This would be handled by the proxy middleware
    // For now, return a placeholder response
    return {
      message: 'KurrentDB proxy endpoint',
      timestamp: new Date().toISOString(),
    }
  }
}
