import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsObject, IsArray, IsEnum, IsNotEmpty } from 'class-validator'

export class StreamCreateRequestDto {
  @ApiProperty({ description: 'Stream name' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: 'Stream description', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Stream data', type: 'object' })
  @IsObject()
  data: Record<string, unknown>

  @ApiProperty({ description: 'Stream tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiProperty({ description: 'Stream owner' })
  @IsString()
  @IsNotEmpty()
  owner: string

  @ApiProperty({ description: 'Stream permissions', required: false })
  @IsOptional()
  @IsObject()
  permissions?: {
    read?: string[]
    write?: string[]
    admin?: string[]
  }
}

export class StreamUpdateRequestDto {
  @ApiProperty({ description: 'Stream description', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Stream data', type: 'object', required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>

  @ApiProperty({ description: 'Stream tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiProperty({ description: 'Stream permissions', required: false })
  @IsOptional()
  @IsObject()
  permissions?: {
    read?: string[]
    write?: string[]
    admin?: string[]
  }
}

export class StreamAppendEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  eventType: string

  @ApiProperty({ description: 'Event data', type: 'object' })
  @IsObject()
  eventData: Record<string, unknown>

  @ApiProperty({ description: 'Event metadata', type: 'object', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>

  @ApiProperty({ description: 'Event ID', required: false })
  @IsOptional()
  @IsString()
  eventId?: string

  @ApiProperty({ description: 'Stream state', required: false })
  @IsOptional()
  @IsString()
  streamState?: string
}

export class StreamReadOptionsDto {
  @ApiProperty({ description: 'Maximum number of events to read', required: false, default: 100 })
  @IsOptional()
  limit?: number

  @ApiProperty({ description: 'Number of events to skip', required: false, default: 0 })
  @IsOptional()
  offset?: number

  @ApiProperty({
    description: 'Read direction',
    enum: ['forwards', 'backwards'],
    required: false,
    default: 'forwards',
  })
  @IsOptional()
  @IsEnum(['forwards', 'backwards'])
  direction?: 'forwards' | 'backwards'

  @ApiProperty({ description: 'Starting revision', required: false })
  @IsOptional()
  fromRevision?: number
}

export class StreamBrowseOptionsDto {
  @ApiProperty({ description: 'Maximum number of streams to return', required: false, default: 50 })
  @IsOptional()
  limit?: number

  @ApiProperty({ description: 'Number of streams to skip', required: false, default: 0 })
  @IsOptional()
  offset?: number

  @ApiProperty({ description: 'Name pattern filter', required: false })
  @IsOptional()
  @IsString()
  namePattern?: string

  @ApiProperty({ description: 'Event type filter', required: false })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiProperty({ description: 'Date from filter', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string

  @ApiProperty({ description: 'Date to filter', required: false })
  @IsOptional()
  @IsString()
  dateTo?: string
}

export class StreamSearchQueryDto {
  @ApiProperty({ description: 'Search text', required: false })
  @IsOptional()
  @IsString()
  text?: string

  @ApiProperty({ description: 'Event type filter', required: false })
  @IsOptional()
  @IsString()
  eventType?: string

  @ApiProperty({ description: 'Stream name filter', required: false })
  @IsOptional()
  @IsString()
  streamName?: string

  @ApiProperty({ description: 'Date from filter', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string

  @ApiProperty({ description: 'Date to filter', required: false })
  @IsOptional()
  @IsString()
  dateTo?: string

  @ApiProperty({ description: 'Maximum number of results', required: false, default: 100 })
  @IsOptional()
  limit?: number
}
