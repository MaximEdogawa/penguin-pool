import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('status')
@Controller('api')
export class StatusController {
  @Get('status')
  @ApiOperation({ summary: 'Get API status' })
  @ApiResponse({ status: 200, description: 'API status retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatus() {
    return {
      status: 'running',
      timestamp: new Date().toISOString(),
      service: 'kurrentdb-proxy',
      kurrentdb_url: process.env['KURRENTDB_URL'] || 'http://localhost:2113',
    }
  }
}
