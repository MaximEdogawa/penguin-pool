// Test utility for WalletConnect connection issues

export const testConnectionIssues = {
  // Test session structure
  testSessionStructure: (session: unknown) => {
    console.log('🧪 Testing session structure...')

    if (!session) {
      console.error('❌ Session is null/undefined')
      return false
    }

    if (typeof session !== 'object') {
      console.error('❌ Session is not an object')
      return false
    }

    console.log('✅ Session is valid object')

    // Check for namespaces
    if (!('namespaces' in session)) {
      console.error('❌ Session missing namespaces property')
      return false
    }

    console.log('✅ Session has namespaces property')

    // Extract accounts
    const accounts: string[] = []
    const sessionObj = session as { namespaces: Record<string, { accounts?: string[] }> }
    Object.values(sessionObj.namespaces).forEach(namespace => {
      if (namespace.accounts) {
        accounts.push(...namespace.accounts)
      }
    })

    if (accounts.length === 0) {
      console.error('❌ No accounts found in namespaces')
      console.log('Available namespaces:', Object.keys(sessionObj.namespaces))
      return false
    }

    console.log('✅ Found accounts:', accounts)
    return true
  },

  // Test QR code generation
  testQRCodeGeneration: async (data: string) => {
    console.log('🧪 Testing QR code generation...')

    try {
      const QRCode = await import('qrcode')
      const qrCodeUrl = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      console.log('✅ QR code generated successfully')
      return qrCodeUrl
    } catch (error) {
      console.error('❌ QR code generation failed:', error)
      return null
    }
  },

  // Test WalletConnect initialization
  testInitialization: async () => {
    console.log('🧪 Testing WalletConnect initialization...')

    try {
      const { chiaWalletConnectService } = await import('../services/ChiaWalletConnectService')

      if (!chiaWalletConnectService.isInitialized()) {
        console.log('Initializing WalletConnect...')
        await chiaWalletConnectService.initialize()
      }

      console.log('✅ WalletConnect initialized successfully')
      return true
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      return false
    }
  },
}

// Export for browser console access
if (typeof window !== 'undefined') {
  ;(window as Record<string, unknown>).testConnectionIssues = testConnectionIssues
}
