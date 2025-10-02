export interface KurrentDBHTTPConfig {
  baseUrl: string
  credentials: {
    apiKey: string
    secretKey: string
  }
  timeout?: number
  retries?: number
}

export interface KurrentDBEvent {
  id: string
  type: string
  data: Record<string, unknown>
  metadata: {
    timestamp: string
    version: number
    streamName: string
  }
}

export interface KurrentDBStream {
  name: string
  events: KurrentDBEvent[]
  metadata: {
    createdAt: string
    updatedAt: string
    version: number
    tags: string[]
    owner: string
  }
}

export interface HTTPResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode: number
}

export class KurrentDBHTTPClient {
  private readonly config: KurrentDBHTTPConfig
  private readonly baseHeaders: Record<string, string>

  constructor(config: KurrentDBHTTPConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      ...config,
    }

    this.baseHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${config.credentials.apiKey}:${config.credentials.secretKey}`)}`,
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<HTTPResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`

    const requestOptions: RequestInit = {
      headers: { ...this.baseHeaders, ...options.headers },
      ...options,
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
        statusCode: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 0,
      }
    }
  }

  async checkHealth(): Promise<HTTPResponse<{ status: string }>> {
    return this.makeRequest('/health')
  }

  async getClusterInfo(): Promise<HTTPResponse<{ nodes: unknown[]; leader: string }>> {
    return this.makeRequest('/cluster/info')
  }

  async listStreams(): Promise<HTTPResponse<KurrentDBStream[]>> {
    return this.makeRequest('/streams')
  }

  async getStream(streamName: string): Promise<HTTPResponse<KurrentDBStream>> {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}`)
  }

  async createStream(
    streamName: string,
    metadata: {
      description?: string
      tags?: string[]
      owner: string
    }
  ): Promise<HTTPResponse<{ streamId: string }>> {
    return this.makeRequest('/streams', {
      method: 'POST',
      body: JSON.stringify({
        name: streamName,
        ...metadata,
      }),
    })
  }

  async appendToStream(
    streamName: string,
    event: {
      type: string
      data: Record<string, unknown>
      metadata?: Record<string, unknown>
    }
  ): Promise<HTTPResponse<{ eventId: string; position: number }>> {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    })
  }

  async readStream(
    streamName: string,
    options: {
      from?: number
      limit?: number
      direction?: 'forwards' | 'backwards'
    } = {}
  ): Promise<HTTPResponse<KurrentDBEvent[]>> {
    const params = new URLSearchParams()
    if (options.from !== undefined) params.append('from', options.from.toString())
    if (options.limit !== undefined) params.append('limit', options.limit.toString())
    if (options.direction) params.append('direction', options.direction)

    const queryString = params.toString()
    const endpoint = `/streams/${encodeURIComponent(streamName)}/events${queryString ? `?${queryString}` : ''}`

    return this.makeRequest(endpoint)
  }

  async deleteStream(streamName: string): Promise<HTTPResponse<void>> {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}`, {
      method: 'DELETE',
    })
  }

  async getStreamMetadata(streamName: string): Promise<
    HTTPResponse<{
      name: string
      createdAt: string
      updatedAt: string
      version: number
      tags: string[]
      owner: string
    }>
  > {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}/metadata`)
  }

  async updateStreamMetadata(
    streamName: string,
    metadata: {
      description?: string
      tags?: string[]
    }
  ): Promise<HTTPResponse<void>> {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}/metadata`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    })
  }

  async getStreamStats(streamName: string): Promise<
    HTTPResponse<{
      eventCount: number
      firstEventNumber: number
      lastEventNumber: number
      streamSize: number
    }>
  > {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}/stats`)
  }

  async getClusterStats(): Promise<
    HTTPResponse<{
      totalStreams: number
      totalEvents: number
      activeConnections: number
      uptime: string
    }>
  > {
    return this.makeRequest('/cluster/stats')
  }

  // Polling-based real-time updates (since HTTP doesn't support WebSocket)
  async subscribeToStreamUpdates(
    streamName: string,
    callback: (events: KurrentDBEvent[]) => void,
    interval: number = 1000
  ): Promise<() => void> {
    let lastEventNumber = 0
    let isSubscribed = true

    const poll = async () => {
      if (!isSubscribed) return

      try {
        const response = await this.readStream(streamName, {
          from: lastEventNumber + 1,
          direction: 'forwards',
        })

        if (response.success && response.data && response.data.length > 0) {
          callback(response.data)
          lastEventNumber = Math.max(...response.data.map(e => parseInt(e.id)))
        }
      } catch {
        // Error polling stream updates
      }

      if (isSubscribed) {
        setTimeout(poll, interval)
      }
    }

    // Start polling
    poll()

    // Return unsubscribe function
    return () => {
      isSubscribed = false
    }
  }

  // Batch operations
  async batchAppendToStream(
    streamName: string,
    events: Array<{
      type: string
      data: Record<string, unknown>
      metadata?: Record<string, unknown>
    }>
  ): Promise<HTTPResponse<Array<{ eventId: string; position: number }>>> {
    return this.makeRequest(`/streams/${encodeURIComponent(streamName)}/events/batch`, {
      method: 'POST',
      body: JSON.stringify({ events }),
    })
  }

  // Search operations
  async searchStreams(query: {
    tags?: string[]
    owner?: string
    fromDate?: string
    toDate?: string
  }): Promise<HTTPResponse<KurrentDBStream[]>> {
    const params = new URLSearchParams()
    if (query.tags) params.append('tags', query.tags.join(','))
    if (query.owner) params.append('owner', query.owner)
    if (query.fromDate) params.append('fromDate', query.fromDate)
    if (query.toDate) params.append('toDate', query.toDate)

    const queryString = params.toString()
    const endpoint = `/streams/search${queryString ? `?${queryString}` : ''}`

    return this.makeRequest(endpoint)
  }
}
