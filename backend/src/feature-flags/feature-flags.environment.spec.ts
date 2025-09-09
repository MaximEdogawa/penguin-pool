import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { BackendFeatureFlags, FeatureFlagsService } from './feature-flags.service'

// Parse command line arguments
const args = process.argv.slice(2)
const envArg = args.find(arg => arg.startsWith('--env='))
const environment = envArg ? envArg.split('=')[1] : null

// Environment configurations
const environmentConfigs = {
  dev: {
    environment: 'dev',
    enabledFeatures: [
      'backend.websocketEnabled',
      'backend.swagger',
      'backend.healthChecks',
      'backend.logging',
      'database.kurrentdbEnabled',
      'api.versioning',
    ],
    disabledFeatures: [],
  },
  test: {
    environment: 'test',
    enabledFeatures: [
      'backend.websocketEnabled',
      'backend.healthChecks',
      'backend.logging',
      'database.kurrentdbEnabled',
      'api.versioning',
    ],
    disabledFeatures: ['backend.swagger'],
  },
  staging: {
    environment: 'staging',
    enabledFeatures: [
      'backend.healthChecks',
      'backend.logging',
      'database.kurrentdbEnabled',
      'api.versioning',
    ],
    disabledFeatures: ['backend.websocketEnabled', 'backend.swagger'],
  },
  production: {
    environment: 'production',
    enabledFeatures: [
      'backend.logging',
      'database.kurrentdbEnabled',
      'security.authentication',
      'api.versioning',
    ],
    disabledFeatures: ['backend.websocketEnabled', 'backend.swagger', 'backend.healthChecks'],
  },
}

// Helper function to create test for specific environment
function createEnvironmentTest(
  envName: string,
  expectedConfig: { environment: string; enabledFeatures: string[]; disabledFeatures: string[] }
) {
  describe(`${envName} Environment`, () => {
    let service: FeatureFlagsService
    let module: TestingModule

    beforeAll(async () => {
      // Clear module cache to ensure fresh module creation
      jest.clearAllMocks()

      // Set environment variables for the test
      process.env.NODE_ENV = expectedConfig.environment
      process.env.VITE_APP_ENV = expectedConfig.environment

      module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', `env.${process.env.NODE_ENV || 'dev'}`], // Load .env.local first, then env-specific file
            ignoreEnvFile: false,
          }),
        ],
        providers: [FeatureFlagsService],
      }).compile()

      service = module.get<FeatureFlagsService>(FeatureFlagsService)
    })

    afterAll(async () => {
      if (module) {
        await module.close()
      }
    })

    it(`should load ${envName} environment correctly`, () => {
      const environment = service['getCurrentEnvironment']()
      expect(environment).toBe(expectedConfig.environment)
    })

    it(`should have ${envName}-appropriate features enabled`, () => {
      // Test expected enabled features
      expectedConfig.enabledFeatures.forEach((feature: string) => {
        const [category, featureName] = feature.split('.')
        expect(service.isFeatureEnabled(category as keyof BackendFeatureFlags, featureName)).toBe(
          true
        )
      })
      expectedConfig.disabledFeatures.forEach((feature: string) => {
        const [category, featureName] = feature.split('.')
        expect(service.isFeatureEnabled(category as keyof BackendFeatureFlags, featureName)).toBe(
          false
        )
      })
    })

    it(`should have correct enabled features list for ${envName}`, () => {
      const enabledFeatures = service.getEnabledFeatures()

      // Should contain expected enabled features
      expectedConfig.enabledFeatures.forEach((feature: string) => {
        expect(enabledFeatures).toContain(feature)
      })

      // Should NOT contain expected disabled features
      expectedConfig.disabledFeatures.forEach((feature: string) => {
        expect(enabledFeatures).not.toContain(feature)
      })
    })

    it(`should validate ${envName} environment configuration`, () => {
      const validation = service.validateFeatureFlags()

      expect(validation.isValid).toBe(true)
      expect(validation.warnings).toBeDefined()
      expect(validation.errors).toBeDefined()
    })
  })
}

// If specific environment is requested, only test that one
if (environment && environmentConfigs[environment]) {
  const config = environmentConfigs[environment]
  createEnvironmentTest(environment, config)
} else {
  // Test all environments if no specific environment is requested
  Object.entries(environmentConfigs).forEach(([envName, config]) => {
    createEnvironmentTest(envName, config)
  })
}
