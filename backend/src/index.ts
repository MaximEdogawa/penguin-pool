import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

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

    // Simple health check - try to connect to KurrentDB
    const response = await fetch(`${KURRENTDB_URL}/health`)
    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (response.ok) {
      // Define response time thresholds
      const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
      const GOOD_THRESHOLD = 100 // ms - good performance
      const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

      let status = 'healthy'
      let performanceGrade = 'excellent'

      if (responseTime <= EXCELLENT_THRESHOLD) {
        performanceGrade = 'excellent'
      } else if (responseTime <= GOOD_THRESHOLD) {
        performanceGrade = 'good'
      } else if (responseTime <= ACCEPTABLE_THRESHOLD) {
        performanceGrade = 'acceptable'
      } else {
        performanceGrade = 'slow'
        // Only mark as degraded if response time is very slow
        if (responseTime > 1000) {
          // 1 second
          status = 'degraded'
        }
      }

      res.json({
        status: status,
        connected: true,
        connectionStatus: 'connected',
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        performanceGrade: performanceGrade,
        thresholds: {
          excellent: EXCELLENT_THRESHOLD,
          good: GOOD_THRESHOLD,
          acceptable: ACCEPTABLE_THRESHOLD,
        },
      })
    } else {
      res.json({
        status: 'degraded',
        connected: false,
        connectionStatus: 'error',
        timestamp: new Date().toISOString(),
        responseTime: responseTime,
        performanceGrade: 'error',
        error: `HTTP ${response.status}: ${response.statusText}`,
      })
    }
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
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env['NODE_ENV'] || 'development',
    }

    // Check WebSocket service
    healthChecks.services['websocket'] = {
      status: 'healthy',
      port: WS_PORT,
      connections: wss.clients.size,
      uptime: process.uptime(),
    }

    // Check KurrentDB connection
    try {
      const kurrentdbStartTime = Date.now()
      const kurrentdbResponse = await fetch(`${KURRENTDB_URL}/health`)
      const kurrentdbEndTime = Date.now()
      const kurrentdbResponseTime = kurrentdbEndTime - kurrentdbStartTime

      // Define response time thresholds (same as in /health/kurrentdb)
      const EXCELLENT_THRESHOLD = 50 // ms - excellent performance
      const GOOD_THRESHOLD = 100 // ms - good performance
      const ACCEPTABLE_THRESHOLD = 500 // ms - acceptable performance

      let kurrentdbStatus = 'healthy'
      let performanceGrade = 'excellent'

      if (kurrentdbResponse.ok) {
        if (kurrentdbResponseTime <= EXCELLENT_THRESHOLD) {
          performanceGrade = 'excellent'
        } else if (kurrentdbResponseTime <= GOOD_THRESHOLD) {
          performanceGrade = 'good'
        } else if (kurrentdbResponseTime <= ACCEPTABLE_THRESHOLD) {
          performanceGrade = 'acceptable'
        } else {
          performanceGrade = 'slow'
          // Only mark as degraded if response time is very slow
          if (kurrentdbResponseTime > 1000) {
            // 1 second
            kurrentdbStatus = 'degraded'
          }
        }
      } else {
        kurrentdbStatus = 'degraded'
        performanceGrade = 'error'
      }

      healthChecks.services['kurrentdb'] = {
        status: kurrentdbStatus,
        connected: kurrentdbResponse.ok,
        connectionStatus: kurrentdbResponse.ok ? 'connected' : 'error',
        url: KURRENTDB_URL,
        responseTime: kurrentdbResponseTime,
        performanceGrade: performanceGrade,
        thresholds: {
          excellent: EXCELLENT_THRESHOLD,
          good: GOOD_THRESHOLD,
          acceptable: ACCEPTABLE_THRESHOLD,
        },
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

// WebSocket server for health monitoring (separate port)
const wss = new WebSocketServer({ port: WS_PORT, path: '/ws/health' })

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

    // Broadcast to all connected clients
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

wss.on('connection', ws => {
  console.log('WebSocket client connected for health monitoring')

  // Send initial connection message
  ws.send(
    JSON.stringify({
      type: 'connection',
      message: 'Connected to health monitoring service',
      timestamp: new Date().toISOString(),
    })
  )

  // Handle incoming messages
  ws.on('message', data => {
    try {
      const message = JSON.parse(data.toString())
      console.log('Received WebSocket message:', message)

      // Echo back the message with timestamp
      ws.send(
        JSON.stringify({
          type: 'echo',
          originalMessage: message,
          timestamp: new Date().toISOString(),
        })
      )
    } catch {
      console.error('Failed to parse WebSocket message')
    }
  })

  // Handle client disconnect
  ws.on('close', () => {
    console.log('WebSocket client disconnected')
  })

  // Handle errors
  ws.on('error', () => {
    console.error('WebSocket error')
  })
})

// Broadcast health status every 30 seconds
setInterval(broadcastHealthStatus, 30000)

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
  console.log(`WebSocket health: ws://localhost:${WS_PORT}/ws/health`)
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
