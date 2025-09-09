import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { FeatureFlagsService } from './feature-flags.service'

@ApiTags('Feature Flags')
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully' })
  getAllFeatureFlags() {
    return {
      flags: this.featureFlagsService.getAllFeatureFlags(),
      enabledFeatures: this.featureFlagsService.getEnabledFeatures(),
      validation: this.featureFlagsService.validateFeatureFlags(),
    }
  }

  @Get('enabled')
  @ApiOperation({ summary: 'Get all enabled feature flags' })
  @ApiResponse({ status: 200, description: 'Enabled feature flags retrieved successfully' })
  getEnabledFeatures() {
    return {
      enabledFeatures: this.featureFlagsService.getEnabledFeatures(),
    }
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get feature flags by category' })
  @ApiResponse({ status: 200, description: 'Feature flags for category retrieved successfully' })
  getFeaturesByCategory(@Param('category') category: string) {
    const enabledFeatures = this.featureFlagsService.getEnabledFeaturesByCategory(
      category as 'backend' | 'database' | 'api' | 'security' | 'experimental'
    )
    return {
      category,
      enabledFeatures,
    }
  }

  @Get('check/:category/:feature')
  @ApiOperation({ summary: 'Check if a specific feature is enabled' })
  @ApiResponse({ status: 200, description: 'Feature status retrieved successfully' })
  checkFeature(@Param('category') category: string, @Param('feature') feature: string) {
    const isEnabled = this.featureFlagsService.isFeatureEnabled(
      category as 'backend' | 'database' | 'api' | 'security' | 'experimental',
      feature
    )
    const featureFlag = this.featureFlagsService.getFeatureFlag(
      category as 'backend' | 'database' | 'api' | 'security' | 'experimental',
      feature
    )

    return {
      category,
      feature,
      isEnabled,
      featureFlag,
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate feature flag configuration' })
  @ApiResponse({ status: 200, description: 'Feature flags validated successfully' })
  validateFeatureFlags() {
    return this.featureFlagsService.validateFeatureFlags()
  }

  @Get('health')
  @ApiOperation({ summary: 'Get feature flag health status' })
  @ApiResponse({ status: 200, description: 'Feature flag health status retrieved successfully' })
  getHealthStatus() {
    const validation = this.featureFlagsService.validateFeatureFlags()
    const enabledFeatures = this.featureFlagsService.getEnabledFeatures()

    return {
      status: validation.isValid ? 'healthy' : 'unhealthy',
      enabledFeaturesCount: enabledFeatures.length,
      validation,
      timestamp: new Date().toISOString(),
    }
  }
}
