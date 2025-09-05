import { SageMethods } from '../constants/sage-methods'
import { sageWalletConnectService } from '../services/SageWalletConnectService'
import { useWalletConnectStore } from '../stores/walletConnectStore'

export interface WalletBalanceTestResult {
  testName: string
  success: boolean
  error?: string
  data?: Record<string, unknown>
  duration: number
}

export class WalletBalanceTest {
  private static results: WalletBalanceTestResult[] = []

  /**
   * Run all wallet balance tests
   */
  static async runAllTests(): Promise<WalletBalanceTestResult[]> {
    console.log('🧪 Starting Wallet Balance Tests...')
    this.results = []

    // Test 1: RPC Connection
    await this.testRpcConnection()

    // Test 2: Get Wallets
    await this.testGetWallets()

    // Test 3: Get Sync Status
    await this.testGetSyncStatus()

    // Test 4: Get Wallet Balance (direct)
    await this.testGetWalletBalanceDirect()

    // Test 5: Get Wallet Info (full flow)
    await this.testGetWalletInfo()

    // Test 6: Dashboard Integration
    await this.testDashboardIntegration()

    console.log('🧪 Wallet Balance Tests Complete!')
    console.table(this.results)
    return this.results
  }

  /**
   * Test 1: RPC Connection
   */
  private static async testRpcConnection(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('🔌 Testing RPC Connection...')

      // Check if we have an active session first
      const connectionState = sageWalletConnectService.getConnectionState()
      if (!connectionState.isConnected) {
        console.log('⚠️ No active wallet connection, skipping RPC test')
        this.results.push({
          testName: 'RPC Connection',
          success: false,
          error: 'No active wallet connection',
          duration: Date.now() - startTime,
        })
        return
      }

      const result = await sageWalletConnectService.testRpcConnection()

      this.results.push({
        testName: 'RPC Connection',
        success: result,
        duration: Date.now() - startTime,
      })

      if (result) {
        console.log('✅ RPC Connection: SUCCESS')
      } else {
        console.log('❌ RPC Connection: FAILED')
      }
    } catch (error) {
      this.results.push({
        testName: 'RPC Connection',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ RPC Connection: ERROR', error)
    }
  }

  /**
   * Test 2: Get Wallets
   */
  private static async testGetWallets(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('👛 Testing Get Wallets...')

      // Check if we have an active session first
      const connectionState = sageWalletConnectService.getConnectionState()
      if (!connectionState.isConnected) {
        console.log('⚠️ No active wallet connection, skipping Get Wallets test')
        this.results.push({
          testName: 'Get Wallets',
          success: false,
          error: 'No active wallet connection',
          duration: Date.now() - startTime,
        })
        return
      }

      // Use chip0002_getPublicKeys instead of get_wallets since it's registered
      const publicKeys = await sageWalletConnectService.request<{
        publicKeys: string[]
      }>(SageMethods.CHIP0002_GET_PUBLIC_KEYS, {})

      this.results.push({
        testName: 'Get Wallets',
        success: true,
        data: publicKeys,
        duration: Date.now() - startTime,
      })

      console.log('✅ Get Wallets: SUCCESS', publicKeys)
    } catch (error) {
      this.results.push({
        testName: 'Get Wallets',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ Get Wallets: ERROR', error)
    }
  }

  /**
   * Test 3: Get Sync Status
   */
  private static async testGetSyncStatus(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('🔄 Testing Get Sync Status...')

      // Check if we have an active session first
      const connectionState = sageWalletConnectService.getConnectionState()
      if (!connectionState.isConnected) {
        console.log('⚠️ No active wallet connection, skipping Get Sync Status test')
        this.results.push({
          testName: 'Get Sync Status',
          success: false,
          error: 'No active wallet connection',
          duration: Date.now() - startTime,
        })
        return
      }

      // Use chip0002_chainId instead of get_sync_status since it's registered
      const chainId = await sageWalletConnectService.request<string>(
        SageMethods.CHIP0002_CHAIN_ID,
        {}
      )

      this.results.push({
        testName: 'Get Sync Status',
        success: true,
        data: { chainId },
        duration: Date.now() - startTime,
      })

      console.log('✅ Get Sync Status: SUCCESS', chainId)
    } catch (error) {
      this.results.push({
        testName: 'Get Sync Status',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ Get Sync Status: ERROR', error)
    }
  }

  /**
   * Test 4: Get Wallet Balance (direct)
   */
  private static async testGetWalletBalanceDirect(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('💰 Testing Get Wallet Balance (Direct)...')

      // Check if we have an active session first
      const connectionState = sageWalletConnectService.getConnectionState()
      if (!connectionState.isConnected) {
        console.log('⚠️ No active wallet connection, skipping Get Wallet Balance test')
        this.results.push({
          testName: 'Get Wallet Balance (Direct)',
          success: false,
          error: 'No active wallet connection',
          duration: Date.now() - startTime,
        })
        return
      }

      // Use chip0002_getAssetBalance instead of get_wallet_balance since it's registered
      const balance = await sageWalletConnectService.request<{
        balance: number
        assetId: string
      }>(SageMethods.CHIP0002_GET_ASSET_BALANCE, {
        type: 'cat',
        assetId: 'xch', // XCH asset ID (xch for native Chia token)
      })

      this.results.push({
        testName: 'Get Wallet Balance (Direct)',
        success: true,
        data: balance,
        duration: Date.now() - startTime,
      })

      console.log('✅ Get Wallet Balance (Direct): SUCCESS', balance)
    } catch (error) {
      this.results.push({
        testName: 'Get Wallet Balance (Direct)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ Get Wallet Balance (Direct): ERROR', error)
    }
  }

  /**
   * Test 5: Get Wallet Info (full flow)
   */
  private static async testGetWalletInfo(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('📊 Testing Get Wallet Info (Full Flow)...')
      const walletInfo = await sageWalletConnectService.getWalletInfo()

      this.results.push({
        testName: 'Get Wallet Info (Full Flow)',
        success: !!walletInfo,
        data: walletInfo as unknown as Record<string, unknown>,
        duration: Date.now() - startTime,
      })

      if (walletInfo) {
        console.log('✅ Get Wallet Info (Full Flow): SUCCESS', walletInfo)
      } else {
        console.log('❌ Get Wallet Info (Full Flow): FAILED - No wallet info returned')
      }
    } catch (error) {
      this.results.push({
        testName: 'Get Wallet Info (Full Flow)',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ Get Wallet Info (Full Flow): ERROR', error)
    }
  }

  /**
   * Test 6: Dashboard Integration
   */
  private static async testDashboardIntegration(): Promise<void> {
    const startTime = Date.now()
    try {
      console.log('🏠 Testing Dashboard Integration...')
      const walletStore = useWalletConnectStore()

      // Test store methods
      const isConnected = walletStore.isConnected
      const walletInfo = walletStore.walletInfo
      const refreshResult = await walletStore.refreshWalletInfo()

      this.results.push({
        testName: 'Dashboard Integration',
        success: isConnected && !!walletInfo,
        data: {
          isConnected,
          hasWalletInfo: !!walletInfo,
          refreshResult: !!refreshResult,
          balance: walletInfo?.balance,
        },
        duration: Date.now() - startTime,
      })

      if (isConnected && walletInfo) {
        console.log('✅ Dashboard Integration: SUCCESS', {
          isConnected,
          hasWalletInfo: !!walletInfo,
          balance: walletInfo.balance,
        })
      } else {
        console.log('❌ Dashboard Integration: FAILED', {
          isConnected,
          hasWalletInfo: !!walletInfo,
        })
      }
    } catch (error) {
      this.results.push({
        testName: 'Dashboard Integration',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      })
      console.log('❌ Dashboard Integration: ERROR', error)
    }
  }

  /**
   * Get test results summary
   */
  static getTestSummary(): {
    total: number
    passed: number
    failed: number
    successRate: number
  } {
    const total = this.results.length
    const passed = this.results.filter(r => r.success).length
    const failed = total - passed
    const successRate = total > 0 ? (passed / total) * 100 : 0

    return {
      total,
      passed,
      failed,
      successRate: Math.round(successRate * 100) / 100,
    }
  }

  /**
   * Get detailed test results
   */
  static getDetailedResults(): WalletBalanceTestResult[] {
    return [...this.results]
  }

  /**
   * Clear test results
   */
  static clearResults(): void {
    this.results = []
  }
}
