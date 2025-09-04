import { chiaWalletConnectService } from '../services/ChiaWalletConnectService'

/**
 * Test utility for Chia WalletConnect integration
 */
export class ChiaWalletTest {
  /**
   * Test basic WalletConnect initialization
   */
  static async testInitialization(): Promise<boolean> {
    try {
      await chiaWalletConnectService.initialize()
      console.log('✅ WalletConnect initialization successful')
      return true
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      return false
    }
  }

  /**
   * Test connection state
   */
  static testConnectionState(): boolean {
    try {
      const state = chiaWalletConnectService.getConnectionState()
      console.log('✅ Connection state:', state)
      return true
    } catch (error) {
      console.error('❌ Connection state test failed:', error)
      return false
    }
  }

  /**
   * Test pairings
   */
  static testPairings(): boolean {
    try {
      const pairings = chiaWalletConnectService.getPairings()
      console.log('✅ Available pairings:', pairings.length)
      return true
    } catch (error) {
      console.error('❌ Pairings test failed:', error)
      return false
    }
  }

  /**
   * Test Chia RPC request (requires connected wallet)
   */
  static async testChiaRpcRequest(): Promise<boolean> {
    try {
      if (!chiaWalletConnectService.isInitialized()) {
        console.warn('⚠️ WalletConnect not initialized, skipping RPC test')
        return true
      }

      // Test a simple RPC request
      const result = await chiaWalletConnectService.request('chia_getSyncStatus', {})
      console.log('✅ Chia RPC request successful:', result)
      return true
    } catch (error) {
      console.error('❌ Chia RPC request failed:', error)
      return false
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<boolean> {
    console.log('🧪 Running Chia WalletConnect tests...')

    const tests = [
      { name: 'Initialization', test: () => this.testInitialization() },
      { name: 'Connection State', test: () => this.testConnectionState() },
      { name: 'Pairings', test: () => this.testPairings() },
      { name: 'Chia RPC Request', test: () => this.testChiaRpcRequest() },
    ]

    let allPassed = true

    for (const { name, test } of tests) {
      console.log(`\n🔍 Testing ${name}...`)
      try {
        const result = await test()
        if (result) {
          console.log(`✅ ${name} test passed`)
        } else {
          console.log(`❌ ${name} test failed`)
          allPassed = false
        }
      } catch (error) {
        console.log(`❌ ${name} test error:`, error)
        allPassed = false
      }
    }

    console.log(`\n🎯 All tests ${allPassed ? 'passed' : 'failed'}!`)
    return allPassed
  }
}

// Export for easy access in browser console
if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).ChiaWalletTest = ChiaWalletTest
}
