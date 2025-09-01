import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import { uptimeTrackingService } from './services/UptimeTrackingService'
import { streamManagementRoutes } from './routes/streamManagementRoutes'

// Load environment variables
dotenv.config()

// Create Express app and HTTP server
const app = express()
const server = createServer(app)
const HTTP_PORT = parseInt(process.env['HTTP_PORT'] || '3001', 10)
const WS_PORT = parseInt(process.env['WS_PORT'] || '3002', 10)
const KURRENTDB_URL = process.env['KURRENTDB_URL'] || 'http://localhost:2113'

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env['ALLOWED_ORIGINS']?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  })
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'kurrentdb-proxy',
    kurrentdb_url: KURRENTDB_URL,
    version: process.env['npm_package_version'] || '1.0.0',
  })
})

// Database health check endpoint
app.get('/health/kurrentdb', async (_req, res) => {
  try {
    const startTime = Date.now()

    // Use our KurrentDB service for health check
    const { KurrentDBService } = await import('./services/KurrentDBService')
    const kurrentDBService = new KurrentDBService()

    const healthData = await kurrentDBService.checkHealth()
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Define response time thresholds
    const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
    const GOOD_THRESHOLD = 100 // ms - good performance
    const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

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

    res.json({
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
    })
  } catch (error) {
    res.json({
      status: 'unhealthy',
      connected: false,
      connectionStatus: 'disconnected',
      timestamp: new Date().toISOString(),
      responseTime: null,
      performanceGrade: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Comprehensive health check endpoint
app.get('/health/comprehensive', async (_req, res) => {
  const startTime = Date.now()
  const healthChecks: {
    timestamp: string
    overallStatus: string
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
    responseTime: number
    error?: string
  } = {
    timestamp: new Date().toISOString(),
    overallStatus: 'healthy',
    services: {},
    responseTime: 0,
  }

  try {
    // Check HTTP service
    healthChecks.services['http'] = {
      status: 'healthy',
      port: HTTP_PORT,
      memory: process.memoryUsage(),
      environment: process.env['NODE_ENV'] || 'development',
    }

    // Check WebSocket service
    healthChecks.services['websocket'] = {
      status: 'healthy',
      port: WS_PORT,
      connections: wss.clients.size,
    }

    // Check KurrentDB connection using our service
    try {
      const kurrentdbStartTime = Date.now()
      const { KurrentDBService } = await import('./services/KurrentDBService')
      const kurrentDBService = new KurrentDBService()
      const kurrentdbHealth = await kurrentDBService.checkHealth()
      const kurrentdbEndTime = Date.now()
      const kurrentdbResponseTime = kurrentdbEndTime - kurrentdbStartTime

      // Define response time thresholds (same as in /health/kurrentdb)
      const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
      const GOOD_THRESHOLD = 100 // ms - good performance
      const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

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
    res.json(healthChecks)
  } catch (error) {
    healthChecks.overallStatus = 'unhealthy'
    healthChecks.responseTime = Date.now() - startTime
    healthChecks.error = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json(healthChecks)
  }
})

// Proxy middleware for KurrentDB
const kurrentdbProxy = createProxyMiddleware({
  target: KURRENTDB_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/kurrentdb': '', // Remove /kurrentdb prefix when forwarding
  },
})

// Apply proxy to /kurrentdb routes
app.use('/kurrentdb', kurrentdbProxy)

// Basic API endpoints
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    service: 'kurrentdb-proxy',
    kurrentdb_url: KURRENTDB_URL,
  })
})

// Service uptime timeline endpoints
app.get('/api/uptime/summary', (req, res) => {
  try {
    const hours = parseFloat(req.query['hours'] as string) || 24
    const summaries = uptimeTrackingService.getAllServiceUptimeSummaries(hours)

    // Format period display based on hours value
    let periodDisplay: string
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      periodDisplay = `${minutes} minutes`
    } else if (hours === 1) {
      periodDisplay = '1 hour'
    } else if (hours < 24) {
      periodDisplay = `${hours} hours`
    } else {
      const days = Math.round(hours / 24)
      periodDisplay = `${days} day${days > 1 ? 's' : ''}`
    }

    res.json({
      timestamp: new Date().toISOString(),
      period: periodDisplay,
      services: summaries,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get uptime summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/uptime/service/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params
    const hours = parseFloat(req.query['hours'] as string) || 24

    const summary = uptimeTrackingService.getServiceUptimeSummary(serviceName, hours)

    if (!summary) {
      return res.status(404).json({
        error: 'Service not found',
        message: `No uptime data found for service: ${serviceName}`,
      })
    }

    // Format period display based on hours value
    let periodDisplay: string
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      periodDisplay = `${minutes} minutes`
    } else if (hours === 1) {
      periodDisplay = '1 hour'
    } else if (hours < 24) {
      periodDisplay = `${hours} hours`
    } else {
      const days = Math.round(hours / 24)
      periodDisplay = `${days} day${days > 1 ? 's' : ''}`
    }

    return res.json({
      timestamp: new Date().toISOString(),
      period: periodDisplay,
      service: summary,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get service uptime',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/uptime/timeline/:serviceName', (req, res) => {
  try {
    const { serviceName } = req.params
    const hours = parseFloat(req.query['hours'] as string) || 24

    const timeline = uptimeTrackingService.getServiceUptimeTimeline(serviceName, hours)

    if (!timeline) {
      return res.status(404).json({
        error: 'Service not found',
        message: `No timeline data found for service: ${serviceName}`,
      })
    }

    // Format period display based on hours value
    let periodDisplay: string
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      periodDisplay = `${minutes} minutes`
    } else if (hours === 1) {
      periodDisplay = '1 hour'
    } else if (hours < 24) {
      periodDisplay = `${hours} hours`
    } else {
      const days = Math.round(hours / 24)
      periodDisplay = `${days} day${days > 1 ? 's' : ''}`
    }

    return res.json({
      timestamp: new Date().toISOString(),
      period: periodDisplay,
      timeline,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get service timeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/uptime/status', (_req, res) => {
  try {
    const currentStatuses = uptimeTrackingService.getCurrentServiceStatuses()

    res.json({
      timestamp: new Date().toISOString(),
      services: currentStatuses,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get current service statuses',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/uptime/stats', (_req, res) => {
  try {
    const memoryStats = uptimeTrackingService.getMemoryStats()

    res.json({
      timestamp: new Date().toISOString(),
      stats: memoryStats,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get uptime statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/api/uptime/check', async (_req, res) => {
  try {
    // Manually trigger a status check
    const timestamp = new Date()

    // Check all services
    const services = ['http', 'websocket', 'database']
    const results = []

    for (const serviceName of services) {
      let status: 'up' | 'down' | 'degraded' = 'down'
      const metadata: Record<string, unknown> = {}

      switch (serviceName) {
        case 'http':
          try {
            const startTime = Date.now()
            const response = await fetch('http://localhost:3001/health')
            const responseTime = Date.now() - startTime
            metadata['responseTime'] = responseTime
            status = response.ok ? 'up' : 'down'
          } catch {
            status = 'down'
          }
          break
        case 'websocket':
          status = 'up' // Assume WebSocket is up if the process is running
          break
        case 'database':
          try {
            const startTime = Date.now()
            const response = await fetch('http://localhost:2113/health')
            const responseTime = Date.now() - startTime
            metadata['responseTime'] = responseTime
            status = response.ok ? 'up' : 'down'
          } catch {
            status = 'down'
          }
          break
      }

      results.push({
        service: serviceName,
        status,
        timestamp: timestamp.toISOString(),
        metadata,
      })
    }

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Manual status check completed',
      results,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to perform manual status check',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.post('/api/uptime/create-streams', async (_req, res) => {
  try {
    const { KurrentDBService } = await import('./services/KurrentDBService')
    const kurrentDBService = new KurrentDBService()

    const services = ['http', 'websocket', 'database']
    const results = []

    for (const serviceName of services) {
      try {
        const streamName = `service-uptime-${serviceName}`
        const stream = await kurrentDBService.createStream({
          name: streamName,
          description: `Service uptime tracking for ${serviceName}`,
          data: {},
          tags: ['uptime', 'monitoring', serviceName],
          owner: 'system',
        })

        results.push({
          service: serviceName,
          streamName,
          success: true,
          streamId: stream.id,
        })
      } catch (error) {
        results.push({
          service: serviceName,
          streamName: `service-uptime-${serviceName}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      message: 'Stream creation completed',
      results,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create streams',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.get('/api/uptime/test-kurrentdb', async (_req, res) => {
  try {
    const kurrentdbUrl = process.env['KURRENTDB_URL'] || 'http://localhost:2113'

    // Test KurrentDB connection
    const healthResponse = await fetch(`${kurrentdbUrl}/info`)
    const healthData = healthResponse.ok ? await healthResponse.json() : null

    // Test stream listing
    const streamsResponse = await fetch(`${kurrentdbUrl}/streams`)
    const streamsData = streamsResponse.ok ? await streamsResponse.json() : null

    res.json({
      timestamp: new Date().toISOString(),
      kurrentdbUrl,
      health: {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthData,
      },
      streams: {
        status: streamsResponse.status,
        ok: streamsResponse.ok,
        data: streamsData,
      },
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to test KurrentDB connection',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Stream management routes
app.use('/api/streams', streamManagementRoutes())

// Test endpoint to create a test stream
app.post('/api/test/create-stream', async (_req, res) => {
  try {
    const { KurrentDBService } = await import('./services/KurrentDBService')
    const kurrentDBService = new KurrentDBService()

    const testStream = await kurrentDBService.createStream({
      name: 'test-stream',
      description: 'A test stream for KurrentDB integration',
      data: {
        testData: 'Hello KurrentDB!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      tags: ['test', 'integration', 'demo'],
      owner: 'test-user',
    })

    // Append a test event to the stream
    const eventResult = await kurrentDBService.appendToStream('test-stream', {
      type: 'TestEvent',
      data: {
        message: 'This is a test event',
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'test-endpoint',
          version: '1.0.0',
        },
      },
    })

    res.json({
      success: true,
      message: 'Test stream created and event appended successfully',
      stream: testStream,
      event: eventResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create test stream',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

// Test endpoint to read the test stream
app.get('/api/test/read-stream', async (_req, res) => {
  try {
    const { KurrentDBService } = await import('./services/KurrentDBService')
    const { FORWARDS, START } = await import('@kurrent/kurrentdb-client')
    const kurrentDBService = new KurrentDBService()

    const events = await kurrentDBService.readStream('test-stream', {
      direction: FORWARDS,
      fromRevision: START,
      maxCount: 10,
    })

    res.json({
      success: true,
      message: 'Test stream read successfully',
      streamName: 'test-stream',
      eventCount: events.length,
      events: events,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read test stream',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Something went wrong',
  })
})

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Route not found',
  })
})

// WebSocket server for both health and uptime monitoring
const wss = new WebSocketServer({ port: WS_PORT })

// Function to broadcast health status to all connected clients
const broadcastHealthStatus = async () => {
  try {
    const healthData = {
      type: 'health_status',
      timestamp: new Date().toISOString(),
      services: {
        proxy: 'healthy',
        kurrentdb: 'unknown',
      },
    }

    // Check KurrentDB health with response time measurement
    try {
      const startTime = Date.now()
      const response = await fetch(`${KURRENTDB_URL}/health`)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Use the same response time thresholds
      const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
      const GOOD_THRESHOLD = 100 // ms - good performance
      const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

      if (response.ok) {
        if (responseTime <= EXCELLENT_THRESHOLD) {
          healthData.services.kurrentdb = 'healthy'
        } else if (responseTime <= GOOD_THRESHOLD) {
          healthData.services.kurrentdb = 'healthy'
        } else if (responseTime <= ACCEPTABLE_THRESHOLD) {
          healthData.services.kurrentdb = 'healthy'
        } else {
          // Only mark as degraded if response time is very slow
          if (responseTime > 1000) {
            // 1 second
            healthData.services.kurrentdb = 'degraded'
          } else {
            healthData.services.kurrentdb = 'healthy'
          }
        }
      } else {
        healthData.services.kurrentdb = 'degraded'
      }
    } catch {
      healthData.services.kurrentdb = 'unhealthy'
    }

    // Broadcast to all connected health clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(JSON.stringify(healthData))
      }
    })
  } catch {
    console.error('Error broadcasting health status')
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/ws/health') {
    console.log('WebSocket client connected for health/uptime monitoring')

    // Send initial connection message
    ws.send(
      JSON.stringify({
        type: 'connection',
        message: 'Connected to health and uptime monitoring service',
        timestamp: new Date().toISOString(),
      })
    )

    // Handle incoming messages
    ws.on('message', data => {
      try {
        const message = JSON.parse(data.toString())
        console.log('Received health/uptime WebSocket message:', message)

        // Echo back the message with timestamp
        ws.send(
          JSON.stringify({
            type: 'echo',
            originalMessage: message,
            timestamp: new Date().toISOString(),
          })
        )
      } catch {
        console.error('Failed to parse health/uptime WebSocket message')
      }
    })

    // Handle client disconnect
    ws.on('close', () => {
      console.log('Health/uptime WebSocket client disconnected')
    })

    // Handle errors
    ws.on('error', () => {
      console.error('Health/uptime WebSocket error')
    })
  } else {
    console.log('WebSocket client connected to unknown path:', path)
    ws.close(1008, 'Unknown path')
  }
})

// Broadcast health status every 30 seconds
setInterval(broadcastHealthStatus, 30000)

// Function to broadcast service status changes to all connected clients
const broadcastServiceStatusChange = (
  serviceName: string,
  status: string,
  metadata: Record<string, unknown>
) => {
  const statusData = {
    type: 'service_status_change',
    timestamp: new Date().toISOString(),
    serviceName,
    status,
    metadata,
  }

  // Broadcast to all connected health clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(JSON.stringify(statusData))
    }
  })
}

// Subscribe to KurrentDB uptime streams for real-time updates
const setupUptimeSubscriptions = async () => {
  try {
    const { KurrentDBService } = await import('./services/KurrentDBService')
    const kurrentDBService = new KurrentDBService()

    const services = ['http', 'websocket', 'database']

    for (const serviceName of services) {
      const streamName = `service-uptime-${serviceName}`

      try {
        // Subscribe to the uptime stream
        await kurrentDBService.subscribeToStream(
          streamName,
          {},
          event => {
            // Only broadcast service_status_change events
            if (event.event?.type === 'service_status_change') {
              console.log(`Broadcasting status change for ${serviceName}:`, event.event.data)
              broadcastServiceStatusChange(
                serviceName,
                event.event.data['status'] as string,
                event.event.data['metadata']
              )
            }
          },
          error => {
            console.error(`Error in uptime subscription for ${serviceName}:`, error)
          }
        )

        console.log(`Subscribed to uptime stream: ${streamName}`)
      } catch (error) {
        console.error(`Failed to subscribe to uptime stream ${streamName}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to setup uptime subscriptions:', error)
  }
}

// Setup uptime subscriptions after a short delay to ensure KurrentDB is ready
setTimeout(setupUptimeSubscriptions, 5000)

// Start HTTP server
server.listen(HTTP_PORT, () => {
  console.log(`HTTP server running on port ${HTTP_PORT}`)
  console.log(`Environment: ${process.env['NODE_ENV'] || 'development'}`)
  console.log(`KurrentDB URL: ${KURRENTDB_URL}`)
  console.log(`Health check: http://localhost:${HTTP_PORT}/health`)
  console.log(`Database health: http://localhost:${HTTP_PORT}/health/kurrentdb`)
  console.log(`Proxy routes: http://localhost:${HTTP_PORT}/kurrentdb/*`)
})

// Start WebSocket server
wss.on('listening', () => {
  console.log(`WebSocket server running on port ${WS_PORT}`)
  console.log(`WebSocket health/uptime: ws://localhost:${WS_PORT}/ws/health`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app
