import { Router } from 'express'
import { StreamManagementService } from '../services/StreamManagementService'
import {
  FORWARDS,
  BACKWARDS,
  START,
  NO_STREAM,
  STREAM_EXISTS,
  ANY,
} from '@kurrent/kurrentdb-client'

export const streamManagementRoutes = () => {
  const router = Router()
  const streamManagementService = new StreamManagementService()

  // Browse all streams with pagination and filtering
  router.get('/browse', async (req, res) => {
    try {
      const { limit = 50, offset = 0, namePattern, eventType, dateFrom, dateTo } = req.query

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        filter: {
          ...(namePattern && { namePattern: namePattern as string }),
          ...(eventType && { eventType: eventType as string }),
          ...(dateFrom &&
            dateTo && {
              dateRange: {
                from: dateFrom as string,
                to: dateTo as string,
              },
            }),
        },
      }

      const result = await streamManagementService.browseStreams(options)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to browse streams:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to browse streams',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Get detailed information about a specific stream
  router.get('/:streamName/details', async (req, res) => {
    try {
      const { streamName } = req.params

      const details = await streamManagementService.getStreamDetails(streamName)

      res.json({
        success: true,
        data: details,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Failed to get stream details for ${req.params.streamName}:`, error)
      res.status(500).json({
        success: false,
        error: 'Failed to get stream details',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Search for events across all streams
  router.post('/search', async (req, res) => {
    try {
      const { text, eventType, streamName, dateFrom, dateTo, limit = 100 } = req.body

      const query = {
        ...(text && { text }),
        ...(eventType && { eventType }),
        ...(streamName && { streamName }),
        ...(dateFrom &&
          dateTo && {
            dateRange: {
              from: dateFrom,
              to: dateTo,
            },
          }),
        limit: parseInt(limit),
      }

      const result = await streamManagementService.searchEvents(query)

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to search events:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to search events',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Get stream statistics and health information
  router.get('/statistics', async (_req, res) => {
    try {
      const statistics = await streamManagementService.getStreamStatistics()

      res.json({
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to get stream statistics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get stream statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Create a new stream with initial event
  router.post('/create', async (req, res) => {
    try {
      const { streamName, eventType, eventData, metadata } = req.body

      if (!streamName || !eventType || !eventData) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'streamName, eventType, and eventData are required',
          timestamp: new Date().toISOString(),
        })
      }

      const result = await streamManagementService.createStreamWithEvent(
        streamName,
        eventType,
        eventData,
        metadata
      )

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to create stream:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create stream',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Read events from a specific stream
  router.get('/:streamName/events', async (req, res) => {
    try {
      const { streamName } = req.params
      const { limit = 100, offset = 0, direction = 'forwards', fromRevision } = req.query

      const kurrentDBService = streamManagementService.getKurrentDBService()

      const events = await kurrentDBService.readStream(streamName, {
        maxCount: parseInt(limit as string),
        direction: direction === 'backwards' ? BACKWARDS : FORWARDS,
        fromRevision: fromRevision ? parseInt(fromRevision as string) : START,
      })

      // Apply offset (client-side pagination)
      const paginatedEvents = events.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      )

      res.json({
        success: true,
        data: {
          events: paginatedEvents,
          total: events.length,
          hasMore: parseInt(offset as string) + parseInt(limit as string) < events.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Failed to read events from stream ${req.params.streamName}:`, error)
      res.status(500).json({
        success: false,
        error: 'Failed to read stream events',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Append event to a stream
  router.post('/:streamName/events', async (req, res) => {
    try {
      const { streamName } = req.params
      const { eventType, eventData, metadata, eventId, streamState } = req.body

      if (!eventType || !eventData) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'eventType and eventData are required',
          timestamp: new Date().toISOString(),
        })
      }

      const kurrentDBService = streamManagementService.getKurrentDBService()

      const result = await kurrentDBService.appendToStream(
        streamName,
        {
          id: eventId,
          type: eventType,
          data: eventData,
          metadata,
        },
        {
          ...(streamState && {
            streamState:
              streamState === 'no-stream'
                ? NO_STREAM
                : streamState === 'stream-exists'
                  ? STREAM_EXISTS
                  : streamState === 'any'
                    ? ANY
                    : BigInt(streamState as string),
          }),
        }
      )

      return res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Failed to append event to stream ${req.params.streamName}:`, error)
      return res.status(500).json({
        success: false,
        error: 'Failed to append event',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Read from $all stream
  router.get('/all/events', async (req, res) => {
    try {
      const { limit = 100, offset = 0, direction = 'forwards', fromPosition } = req.query

      const kurrentDBService = streamManagementService.getKurrentDBService()

      const events = await kurrentDBService.readAll({
        maxCount: parseInt(limit as string),
        direction: direction === 'backwards' ? BACKWARDS : FORWARDS,
        fromPosition: fromPosition ? parseInt(fromPosition as string) : START,
      })

      // Apply offset (client-side pagination)
      const paginatedEvents = events.slice(
        parseInt(offset as string),
        parseInt(offset as string) + parseInt(limit as string)
      )

      res.json({
        success: true,
        data: {
          events: paginatedEvents,
          total: events.length,
          hasMore: parseInt(offset as string) + parseInt(limit as string) < events.length,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to read from $all stream:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to read from $all stream',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  // Get stream health and connection status
  router.get('/health', async (_req, res) => {
    try {
      const kurrentDBService = streamManagementService.getKurrentDBService()
      const health = await kurrentDBService.checkHealth()
      const connection = await kurrentDBService.getConnection()

      res.json({
        success: true,
        data: {
          health,
          connection,
          isReady: kurrentDBService.isReady(),
          connectionStatus: kurrentDBService.getConnectionStatus(),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to get stream health:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get stream health',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }
  })

  return router
}
