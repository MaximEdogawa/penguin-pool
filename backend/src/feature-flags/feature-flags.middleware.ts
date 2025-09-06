import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { FeatureFlagsService } from './feature-flags.service'

@Injectable()
export class FeatureFlagsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FeatureFlagsMiddleware.name)

  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Add feature flags to request object for easy access
    req.featureFlags = {
      isWebSocketEnabled: this.featureFlagsService.isWebSocketEnabled(),
      isHealthChecksEnabled: this.featureFlagsService.isHealthChecksEnabled(),
      isRateLimitingEnabled: this.featureFlagsService.isRateLimitingEnabled(),
      isCorsEnabled: this.featureFlagsService.isCorsEnabled(),
      isCompressionEnabled: this.featureFlagsService.isCompressionEnabled(),
      isHelmetEnabled: this.featureFlagsService.isHelmetEnabled(),
      isSwaggerEnabled: this.featureFlagsService.isSwaggerEnabled(),
      isLoggingEnabled: this.featureFlagsService.isLoggingEnabled(),
      isKurrentDbEnabled: this.featureFlagsService.isKurrentDbEnabled(),
      isAuthenticationEnabled: this.featureFlagsService.isAuthenticationEnabled(),
      isAuthorizationEnabled: this.featureFlagsService.isAuthorizationEnabled(),
    }

    // Add enabled features to response headers for debugging
    if (this.featureFlagsService.isLoggingEnabled()) {
      const enabledFeatures = this.featureFlagsService.getEnabledFeatures()
      res.setHeader('X-Enabled-Features', enabledFeatures.join(','))
    }

    next()
  }
}

// Extend Express Request interface to include feature flags
declare module 'express-serve-static-core' {
  interface Request {
    featureFlags: {
      isWebSocketEnabled: boolean
      isHealthChecksEnabled: boolean
      isRateLimitingEnabled: boolean
      isCorsEnabled: boolean
      isCompressionEnabled: boolean
      isHelmetEnabled: boolean
      isSwaggerEnabled: boolean
      isLoggingEnabled: boolean
      isKurrentDbEnabled: boolean
      isAuthenticationEnabled: boolean
      isAuthorizationEnabled: boolean
    }
  }
}
