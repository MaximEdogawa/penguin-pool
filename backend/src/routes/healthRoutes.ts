import { Router } from 'express'
import { KurrentDBService } from '../services/KurrentDBService'

export const healthRoutes = (kurrentDBService: KurrentDBService) => {
  const router = Router()

  // Get KurrentDB health status
  router.get('/kurrentdb', async (_req, res) => {
    try {
      const connectionStatus = kurrentDBService.getConnectionStatus()
      const isConnected = connectionStatus === 'connected'
      res.json({
        status: isConnected ? 'healthy' : 'unhealthy',
        connected: isConnected,
        connectionStatus,
        timestamp: new Date().toISOString(),
      })
    } catch {
      res.status(500).json({
        status: 'error',
        error: 'Failed to check KurrentDB health',
        timestamp: new Date().toISOString(),
      })
    }
  })

  return router
}
