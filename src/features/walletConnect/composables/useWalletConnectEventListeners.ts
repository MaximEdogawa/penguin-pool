import SignClient from '@walletconnect/sign-client'
import { walletConnectPersistenceService } from '../services/WalletConnectPersistenceService'

let globalEventListenersAdded = false
let globalSignClientInstance: SignClient | null = null

export function useWalletConnectEventListeners() {
  const addEventListeners = (signClient: SignClient) => {
    globalSignClientInstance = signClient

    if (globalEventListenersAdded) {
      console.log('♻️ Event listeners already registered globally, skipping...')
      return
    }

    signClient.on('session_delete', () => {
      console.log('🗑️ WalletConnect session deleted')
      walletConnectPersistenceService.clearSession()
    })

    signClient.on('session_expire', () => {
      console.log('⏰ WalletConnect session expired')
      walletConnectPersistenceService.clearSession()
    })

    signClient.on('session_request', event => {
      try {
        signClient.respond({
          topic: event.topic,
          response: {
            id: event.id,
            jsonrpc: '2.0',
            result: { acknowledged: true },
          },
        })
      } catch (error) {
        console.warn('⚠️ Failed to respond to session request:', error)
      }
    })

    signClient.on('session_proposal', event => {
      console.log('📋 WalletConnect session proposal received:', event)
    })

    signClient.on('session_update', event => {
      console.log('🔄 WalletConnect session updated:', event)
    })

    signClient.on('session_ping', event => {
      console.log('🏓 WalletConnect session ping:', event)
    })

    globalEventListenersAdded = true
    console.log('✅ WalletConnect event listeners registered successfully')
  }

  const removeEventListeners = (signClient: SignClient) => {
    if (!globalEventListenersAdded) {
      console.log('ℹ️ No event listeners to remove')
      return
    }

    try {
      console.log('🧹 Removing WalletConnect event listeners...')
      signClient.removeAllListeners('session_delete')
      signClient.removeAllListeners('session_expire')
      signClient.removeAllListeners('session_request')
      signClient.removeAllListeners('session_proposal')
      signClient.removeAllListeners('session_update')
      signClient.removeAllListeners('session_ping')

      globalEventListenersAdded = false
      console.log('✅ WalletConnect event listeners removed')
    } catch (error) {
      console.warn('⚠️ Error removing event listeners:', error)
    }
  }

  const resetListenersFlag = () => {
    globalEventListenersAdded = false
    globalSignClientInstance = null
    console.log('🔄 Event listeners flag reset')
  }

  const handlePendingSessionRequests = async () => {
    if (!globalSignClientInstance) {
      console.log('ℹ️ No global SignClient instance available for handling pending requests')
      return
    }

    try {
      const sessions = globalSignClientInstance.session.getAll()
      console.log(`🔍 Found ${sessions.length} active sessions`)

      for (const session of sessions) {
        try {
          await globalSignClientInstance.ping({ topic: session.topic })
          console.log(`✅ Session ${session.topic} is active`)
        } catch {
          console.log(`❌ Session ${session.topic} is not responding, cleaning up...`)
        }
      }
    } catch (error) {
      console.warn('⚠️ Error handling pending session requests:', error)
    }
  }

  return {
    addEventListeners,
    removeEventListeners,
    resetListenersFlag,
    handlePendingSessionRequests,
    areListenersAdded: () => globalEventListenersAdded,
  }
}
