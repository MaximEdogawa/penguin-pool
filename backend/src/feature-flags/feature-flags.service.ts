import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export interface FeatureFlag {
  enabled: boolean
  description: string
  category: 'backend' | 'database' | 'api' | 'security' | 'experimental'
  environments: {
    dev: boolean
    test: boolean
    staging: boolean
    production: boolean
  }
}

export interface BackendFeatureFlags {
  backend: {
    websocketEnabled: FeatureFlag
    healthChecks: FeatureFlag
    rateLimiting: FeatureFlag
    cors: FeatureFlag
    compression: FeatureFlag
    helmet: FeatureFlag
    swagger: FeatureFlag
    logging: FeatureFlag
  }
  database: {
    kurrentdbEnabled: FeatureFlag
    migrations: FeatureFlag
    backup: FeatureFlag
    monitoring: FeatureFlag
  }
  api: {
    versioning: FeatureFlag
    documentation: FeatureFlag
    validation: FeatureFlag
    errorHandling: FeatureFlag
  }
  security: {
    authentication: FeatureFlag
    authorization: FeatureFlag
    encryption: FeatureFlag
    sessionManagement: FeatureFlag
  }
  experimental: {
    advancedLogging: FeatureFlag
    performanceMonitoring: FeatureFlag
    metrics: FeatureFlag
    tracing: FeatureFlag
  }
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name)
  private readonly flags: BackendFeatureFlags

  constructor(private readonly configService: ConfigService) {
    this.flags = this.initializeFeatureFlags()
  }

  private initializeFeatureFlags(): BackendFeatureFlags {
    return {
      backend: {
        websocketEnabled: {
          enabled: this.getEnvBoolean('FEATURE_WEBSOCKET_ENABLED', true),
          description: 'Enable/disable WebSocket connections',
          category: 'backend',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        healthChecks: {
          enabled: this.getEnvBoolean('FEATURE_HEALTH_CHECKS', true),
          description: 'Enable/disable health check endpoints',
          category: 'backend',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        rateLimiting: {
          enabled: this.getEnvBoolean('FEATURE_RATE_LIMITING', true),
          description: 'Enable/disable rate limiting',
          category: 'backend',
          environments: {
            dev: true,
            test: false,
            staging: true,
            production: true,
          },
        },
        cors: {
          enabled: this.getEnvBoolean('FEATURE_CORS', true),
          description: 'Enable/disable CORS',
          category: 'backend',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        compression: {
          enabled: this.getEnvBoolean('FEATURE_COMPRESSION', true),
          description: 'Enable/disable response compression',
          category: 'backend',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
        helmet: {
          enabled: this.getEnvBoolean('FEATURE_HELMET', true),
          description: 'Enable/disable Helmet security headers',
          category: 'backend',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
        swagger: {
          enabled: this.getEnvBoolean('FEATURE_SWAGGER', true),
          description: 'Enable/disable Swagger documentation',
          category: 'backend',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: false,
          },
        },
        logging: {
          enabled: this.getEnvBoolean('FEATURE_LOGGING', true),
          description: 'Enable/disable application logging',
          category: 'backend',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
      },
      database: {
        kurrentdbEnabled: {
          enabled: this.getEnvBoolean('FEATURE_KURRENTDB_ENABLED', true),
          description: 'Enable/disable KurrentDB integration',
          category: 'database',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        migrations: {
          enabled: this.getEnvBoolean('FEATURE_DATABASE_MIGRATIONS', true),
          description: 'Enable/disable database migrations',
          category: 'database',
          environments: {
            dev: true,
            test: false,
            staging: true,
            production: true,
          },
        },
        backup: {
          enabled: this.getEnvBoolean('FEATURE_DATABASE_BACKUP', true),
          description: 'Enable/disable database backups',
          category: 'database',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
        monitoring: {
          enabled: this.getEnvBoolean('FEATURE_DATABASE_MONITORING', true),
          description: 'Enable/disable database monitoring',
          category: 'database',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
      },
      api: {
        versioning: {
          enabled: this.getEnvBoolean('FEATURE_API_VERSIONING', true),
          description: 'Enable/disable API versioning',
          category: 'api',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        documentation: {
          enabled: this.getEnvBoolean('FEATURE_API_DOCUMENTATION', true),
          description: 'Enable/disable API documentation',
          category: 'api',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: false,
          },
        },
        validation: {
          enabled: this.getEnvBoolean('FEATURE_API_VALIDATION', true),
          description: 'Enable/disable API validation',
          category: 'api',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        errorHandling: {
          enabled: this.getEnvBoolean('FEATURE_API_ERROR_HANDLING', true),
          description: 'Enable/disable API error handling',
          category: 'api',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
      },
      security: {
        authentication: {
          enabled: this.getEnvBoolean('FEATURE_AUTHENTICATION', true),
          description: 'Enable/disable authentication',
          category: 'security',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
        authorization: {
          enabled: this.getEnvBoolean('FEATURE_AUTHORIZATION', true),
          description: 'Enable/disable authorization',
          category: 'security',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
        encryption: {
          enabled: this.getEnvBoolean('FEATURE_ENCRYPTION', true),
          description: 'Enable/disable data encryption',
          category: 'security',
          environments: {
            dev: false,
            test: false,
            staging: true,
            production: true,
          },
        },
        sessionManagement: {
          enabled: this.getEnvBoolean('FEATURE_SESSION_MANAGEMENT', true),
          description: 'Enable/disable session management',
          category: 'security',
          environments: {
            dev: true,
            test: true,
            staging: true,
            production: true,
          },
        },
      },
      experimental: {
        advancedLogging: {
          enabled: this.getEnvBoolean('FEATURE_ADVANCED_LOGGING', false),
          description: 'Enable/disable advanced logging features',
          category: 'experimental',
          environments: {
            dev: true,
            test: false,
            staging: false,
            production: false,
          },
        },
        performanceMonitoring: {
          enabled: this.getEnvBoolean('FEATURE_PERFORMANCE_MONITORING', false),
          description: 'Enable/disable performance monitoring',
          category: 'experimental',
          environments: {
            dev: true,
            test: false,
            staging: true,
            production: true,
          },
        },
        metrics: {
          enabled: this.getEnvBoolean('FEATURE_METRICS', false),
          description: 'Enable/disable metrics collection',
          category: 'experimental',
          environments: {
            dev: true,
            test: false,
            staging: true,
            production: true,
          },
        },
        tracing: {
          enabled: this.getEnvBoolean('FEATURE_TRACING', false),
          description: 'Enable/disable distributed tracing',
          category: 'experimental',
          environments: {
            dev: true,
            test: false,
            staging: false,
            production: false,
          },
        },
      },
    }
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key)
    if (value === undefined) return defaultValue
    return value.toLowerCase() === 'true'
  }

  private getCurrentEnvironment(): 'dev' | 'test' | 'staging' | 'production' {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development')
    const appEnv = this.configService.get<string>('VITE_APP_ENV', 'dev')

    if (appEnv === 'test' || nodeEnv === 'test') return 'test'
    if (appEnv === 'staging' || nodeEnv === 'staging') return 'staging'
    if (appEnv === 'production' || nodeEnv === 'production') return 'production'
    return 'dev'
  }

  isFeatureEnabled(
    category: keyof BackendFeatureFlags,
    feature: string,
    environment?: 'dev' | 'test' | 'staging' | 'production'
  ): boolean {
    const currentEnv = environment || this.getCurrentEnvironment()
    const featureFlag = this.getFeatureFlag(category, feature)

    if (!featureFlag) {
      this.logger.warn(`Feature flag not found: ${category}.${feature}`)
      return false
    }

    // Check environment-specific override first
    const envOverride = this.configService.get<string>(`FEATURE_${feature.toUpperCase()}`)
    if (envOverride !== undefined) {
      return envOverride.toLowerCase() === 'true'
    }

    // Check if feature is globally disabled
    if (!featureFlag.enabled) return false

    // Check environment-specific setting
    return featureFlag.environments[currentEnv]
  }

  getFeatureFlag(category: keyof BackendFeatureFlags, feature: string): FeatureFlag | null {
    const categoryFlags = this.flags[category]
    if (categoryFlags && feature in categoryFlags) {
      return (categoryFlags as Record<string, FeatureFlag>)[feature]
    }
    return null
  }

  getAllFeatureFlags(): BackendFeatureFlags {
    return this.flags
  }

  getEnabledFeatures(): string[] {
    const enabledFeatures: string[] = []
    const currentEnv = this.getCurrentEnvironment()

    Object.entries(this.flags).forEach(([categoryKey, category]) => {
      Object.entries(category).forEach(([featureKey]) => {
        if (
          this.isFeatureEnabled(categoryKey as keyof BackendFeatureFlags, featureKey, currentEnv)
        ) {
          enabledFeatures.push(`${categoryKey}.${featureKey}`)
        }
      })
    })

    return enabledFeatures
  }

  getEnabledFeaturesByCategory(category: keyof BackendFeatureFlags): string[] {
    const enabledFeatures: string[] = []
    const currentEnv = this.getCurrentEnvironment()
    const categoryFlags = this.flags[category]

    Object.entries(categoryFlags).forEach(([featureKey]) => {
      if (this.isFeatureEnabled(category, featureKey, currentEnv)) {
        enabledFeatures.push(featureKey)
      }
    })

    return enabledFeatures
  }

  validateFeatureFlags(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []

    // Check for conflicting feature combinations
    if (
      this.isFeatureEnabled('database', 'kurrentdbEnabled') &&
      !this.isFeatureEnabled('backend', 'logging')
    ) {
      warnings.push('KurrentDB is enabled but logging is disabled - this may cause issues')
    }

    if (
      this.isFeatureEnabled('security', 'authentication') &&
      !this.isFeatureEnabled('security', 'sessionManagement')
    ) {
      warnings.push('Authentication is enabled but session management is disabled')
    }

    if (
      this.isFeatureEnabled('api', 'documentation') &&
      !this.isFeatureEnabled('backend', 'swagger')
    ) {
      warnings.push('API documentation is enabled but Swagger is disabled')
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
    }
  }

  // Convenience methods for common feature checks
  isWebSocketEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'websocketEnabled')
  }

  isHealthChecksEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'healthChecks')
  }

  isRateLimitingEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'rateLimiting')
  }

  isCorsEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'cors')
  }

  isCompressionEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'compression')
  }

  isHelmetEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'helmet')
  }

  isSwaggerEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'swagger')
  }

  isLoggingEnabled(): boolean {
    return this.isFeatureEnabled('backend', 'logging')
  }

  isKurrentDbEnabled(): boolean {
    return this.isFeatureEnabled('database', 'kurrentdbEnabled')
  }

  isAuthenticationEnabled(): boolean {
    return this.isFeatureEnabled('security', 'authentication')
  }

  isAuthorizationEnabled(): boolean {
    return this.isFeatureEnabled('security', 'authorization')
  }
}
