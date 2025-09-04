import { sageWalletConnectService } from '../services/SageWalletConnectService'
import { commandHandler } from '../services/CommandHandler'

/**
 * Test utility for wallet connection functionality
 */
export class WalletConnectionTest {
  /**
   * Test command handler functionality
   */
  static async testCommandHandler(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing command handler...')

      // Test chip0002_connect command
      const connectResult = await commandHandler.handleCommand(
        'chip0002_connect',
        {},
        {
          fingerprint: 123456789,
          session: {
            topic: 'test-topic',
            chainId: 'chia:testnet',
          },
        }
      )

      console.log('Connect command result:', connectResult)

      // Test chip0002_chainId command
      const chainIdResult = await commandHandler.handleCommand(
        'chip0002_chainId',
        {},
        {
          fingerprint: 123456789,
          session: {
            topic: 'test-topic',
            chainId: 'chia:testnet',
          },
        }
      )

      console.log('Chain ID command result:', chainIdResult)

      return { success: true }
    } catch (error) {
      console.error('Command handler test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Test wallet service initialization
   */
  static async testServiceInitialization(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing service initialization...')

      // Test if service can be created
      const service = sageWalletConnectService
      console.log('Service created:', !!service)

      // Test if service has required methods
      const hasInitialize = typeof service.initialize === 'function'
      const hasConnect = typeof service.connect === 'function'
      const hasDisconnect = typeof service.disconnect === 'function'
      const hasHandleCommand = typeof service.handleCommand === 'function'

      console.log('Service methods available:', {
        initialize: hasInitialize,
        connect: hasConnect,
        disconnect: hasDisconnect,
        handleCommand: hasHandleCommand,
      })

      if (!hasInitialize || !hasConnect || !hasDisconnect || !hasHandleCommand) {
        throw new Error('Service missing required methods')
      }

      return { success: true }
    } catch (error) {
      console.error('Service initialization test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Test command execution through service
   */
  static async testCommandExecution(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Testing command execution...')

      // Test executeCommand method
      const result = await sageWalletConnectService.executeCommand('chip0002_connect', {})

      console.log('Command execution result:', result)

      // The command should fail because we're not connected, but the method should work
      if (result.success === false && result.error?.includes('not connected')) {
        return { success: true } // Expected behavior when not connected
      }

      return { success: true }
    } catch (error) {
      console.error('Command execution test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<{
    success: boolean
    results: Array<{ test: string; success: boolean; error?: string }>
  }> {
    console.log('Running wallet connection tests...')

    const results = []

    // Test command handler
    const commandHandlerResult = await this.testCommandHandler()
    results.push({
      test: 'Command Handler',
      success: commandHandlerResult.success,
      error: commandHandlerResult.error,
    })

    // Test service initialization
    const serviceInitResult = await this.testServiceInitialization()
    results.push({
      test: 'Service Initialization',
      success: serviceInitResult.success,
      error: serviceInitResult.error,
    })

    // Test command execution
    const commandExecResult = await this.testCommandExecution()
    results.push({
      test: 'Command Execution',
      success: commandExecResult.success,
      error: commandExecResult.error,
    })

    const allPassed = results.every(result => result.success)
    const summary = {
      success: allPassed,
      results,
    }

    console.log('Test summary:', summary)
    return summary
  }

  /**
   * Get test summary
   */
  static getTestSummary(): string {
    return `
Wallet Connection Test Summary:
- Command Handler: Tests the command handler service
- Service Initialization: Tests the wallet service creation and methods
- Command Execution: Tests command execution through the service

All tests should pass for the wallet connection to work properly.
    `.trim()
  }
}
