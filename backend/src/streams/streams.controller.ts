import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger'
import { StreamManagementService } from './stream-management.service'
import {
  StreamBrowseOptionsDto,
  StreamSearchQueryDto,
  StreamReadOptionsDto,
  StreamAppendEventDto,
} from '../dto/stream.dto'
import {
  FORWARDS,
  BACKWARDS,
  START,
  NO_STREAM,
  STREAM_EXISTS,
  ANY,
} from '@kurrent/kurrentdb-client'

@ApiTags('streams')
@Controller('api/streams')
export class StreamsController {
  constructor(private readonly streamManagementService: StreamManagementService) {}

  @Get('browse')
  @ApiOperation({ summary: 'Browse all streams with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Streams retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async browseStreams(@Query() query: StreamBrowseOptionsDto) {
    try {
      const options = {
        limit: query.limit || 50,
        offset: query.offset || 0,
        filter: {
          ...(query.namePattern && { namePattern: query.namePattern }),
          ...(query.eventType && { eventType: query.eventType }),
          ...(query.dateFrom &&
            query.dateTo && {
              dateRange: {
                from: query.dateFrom,
                to: query.dateTo,
              },
            }),
        },
      }

      const result = await this.streamManagementService.browseStreams(options)

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to browse streams',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get(':streamName/details')
  @ApiOperation({ summary: 'Get detailed information about a specific stream' })
  @ApiParam({ name: 'streamName', description: 'Stream name', example: 'user-events' })
  @ApiResponse({ status: 200, description: 'Stream details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStreamDetails(@Param('streamName') streamName: string) {
    try {
      const details = await this.streamManagementService.getStreamDetails(streamName)

      return {
        success: true,
        data: details,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to get stream details',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Search for events across all streams' })
  @ApiBody({ type: StreamSearchQueryDto, description: 'Search query parameters' })
  @ApiResponse({ status: 200, description: 'Search completed successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async searchEvents(@Body() query: StreamSearchQueryDto) {
    try {
      const searchQuery = {
        ...(query.text && { text: query.text }),
        ...(query.eventType && { eventType: query.eventType }),
        ...(query.streamName && { streamName: query.streamName }),
        ...(query.dateFrom &&
          query.dateTo && {
            dateRange: {
              from: query.dateFrom,
              to: query.dateTo,
            },
          }),
        limit: query.limit || 100,
      }

      const result = await this.streamManagementService.searchEvents(searchQuery)

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to search events',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get stream statistics and health information' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStreamStatistics() {
    try {
      const statistics = await this.streamManagementService.getStreamStatistics()

      return {
        success: true,
        data: statistics,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to get stream statistics',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new stream with initial event' })
  @ApiBody({
    description: 'Stream creation data',
    schema: {
      type: 'object',
      required: ['streamName', 'eventType', 'eventData'],
      properties: {
        streamName: { type: 'string', example: 'user-events' },
        eventType: { type: 'string', example: 'UserCreated' },
        eventData: { type: 'object', example: { userId: '123', name: 'John Doe' } },
        metadata: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stream created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createStream(
    @Body()
    body: {
      streamName: string
      eventType: string
      eventData: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
  ) {
    try {
      const { streamName, eventType, eventData, metadata } = body

      if (!streamName || !eventType || !eventData) {
        throw new HttpException(
          {
            success: false,
            error: 'Missing required fields',
            message: 'streamName, eventType, and eventData are required',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST
        )
      }

      const result = await this.streamManagementService.createStreamWithEvent(
        streamName,
        eventType,
        eventData,
        metadata
      )

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        {
          success: false,
          error: 'Failed to create stream',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get(':streamName/events')
  @ApiOperation({ summary: 'Read events from a specific stream' })
  @ApiParam({ name: 'streamName', description: 'Stream name', example: 'user-events' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of events',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of events to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    description: 'Read direction',
    enum: ['forwards', 'backwards'],
  })
  @ApiQuery({ name: 'fromRevision', required: false, description: 'Starting revision', example: 0 })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async readStreamEvents(
    @Param('streamName') streamName: string,
    @Query() query: StreamReadOptionsDto
  ) {
    try {
      const kurrentDBService = this.streamManagementService.getKurrentDBService()

      const events = await kurrentDBService.readStream(streamName, {
        maxCount: query.limit || 100,
        direction: query.direction === 'backwards' ? BACKWARDS : FORWARDS,
        fromRevision: query.fromRevision ? query.fromRevision : START,
      })

      // Apply offset (client-side pagination)
      const paginatedEvents = events.slice(
        query.offset || 0,
        (query.offset || 0) + (query.limit || 100)
      )

      return {
        success: true,
        data: {
          events: paginatedEvents,
          total: events.length,
          hasMore: (query.offset || 0) + (query.limit || 100) < events.length,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to read stream events',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post(':streamName/events')
  @ApiOperation({ summary: 'Append event to a stream' })
  @ApiParam({ name: 'streamName', description: 'Stream name', example: 'user-events' })
  @ApiBody({ type: StreamAppendEventDto, description: 'Event data to append' })
  @ApiResponse({ status: 201, description: 'Event appended successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing required fields' })
  @ApiResponse({ status: 404, description: 'Stream not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async appendEvent(@Param('streamName') streamName: string, @Body() body: StreamAppendEventDto) {
    try {
      const { eventType, eventData, metadata, eventId, streamState } = body

      if (!eventType || !eventData) {
        throw new HttpException(
          {
            success: false,
            error: 'Missing required fields',
            message: 'eventType and eventData are required',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST
        )
      }

      const kurrentDBService = this.streamManagementService.getKurrentDBService()

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
                    : BigInt(streamState),
          }),
        }
      )

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        {
          success: false,
          error: 'Failed to append event',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('all/events')
  @ApiOperation({ summary: 'Read from $all stream' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of events',
    example: 100,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of events to skip',
    example: 0,
  })
  @ApiQuery({
    name: 'direction',
    required: false,
    description: 'Read direction',
    enum: ['forwards', 'backwards'],
  })
  @ApiQuery({ name: 'fromPosition', required: false, description: 'Starting position', example: 0 })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async readAllEvents(@Query() query: StreamReadOptionsDto) {
    try {
      const kurrentDBService = this.streamManagementService.getKurrentDBService()

      const events = await kurrentDBService.readAll({
        maxCount: query.limit || 100,
        direction: query.direction === 'backwards' ? BACKWARDS : FORWARDS,
        fromPosition: query.fromRevision ? query.fromRevision : START,
      })

      // Apply offset (client-side pagination)
      const paginatedEvents = events.slice(
        query.offset || 0,
        (query.offset || 0) + (query.limit || 100)
      )

      return {
        success: true,
        data: {
          events: paginatedEvents,
          total: events.length,
          hasMore: (query.offset || 0) + (query.limit || 100) < events.length,
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to read from $all stream',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Get stream health and connection status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStreamHealth() {
    try {
      const kurrentDBService = this.streamManagementService.getKurrentDBService()
      const health = await kurrentDBService.checkHealth()
      const connection = await kurrentDBService.getConnection()

      return {
        success: true,
        data: {
          health,
          connection,
          isReady: kurrentDBService.isReady(),
          connectionStatus: kurrentDBService.getConnectionStatus(),
        },
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to get stream health',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
