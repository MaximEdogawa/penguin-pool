import SignClient from '@walletconnect/sign-client'
import { walletConnectPersistenceService } from '../services/WalletConnectPersistenceService'
import { logger } from '@/shared/services/logger'

let globalEventListenersAdded = false
let globalSignClientInstance: SignClient | null = null

export function useWalletConnectEventListeners() {
  const addEventListeners = (signClient: SignClient) => {
    globalSignClientInstance = signClient

    if (globalEventListenersAdded) {
      logger.info('♻️ Event listeners already registered globally, skipping...')
      return
    }

    signClient.on('session_delete', () => {
      logger.info('🗑️ WalletConnect session deleted')
      walletConnectPersistenceService.clearSession()
    })

    signClient.on('session_expire', () => {
      logger.info('⏰ WalletConnect session expired')
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
        logger.warn('⚠️ Failed to respond to session request:', error)
      }
    })

    signClient.on('session_proposal', event => {
      logger.info('📋 WalletConnect session proposal received:', event)
    })

    signClient.on('session_update', event => {
      logger.info('🔄 WalletConnect session updated:', event)
    })

    signClient.on('session_ping', event => {
      logger.info('🏓 WalletConnect session ping:', event)
    })

    globalEventListenersAdded = true
    logger.info('✅ WalletConnect event listeners registered successfully')
  }

  const removeEventListeners = (signClient: SignClient) => {
    if (!globalEventListenersAdded) {
      logger.info('ℹ️ No event listeners to remove')
      return
    }

    try {
      logger.info('🧹 Removing WalletConnect event listeners...')
      signClient.removeAllListeners('session_delete')
      signClient.removeAllListeners('session_expire')
      signClient.removeAllListeners('session_request')
      signClient.removeAllListeners('session_proposal')
      signClient.removeAllListeners('session_update')
      signClient.removeAllListeners('session_ping')

      globalEventListenersAdded = false
      logger.info('✅ WalletConnect event listeners removed')
    } catch (error) {
      logger.warn('⚠️ Error removing event listeners:', error)
    }
  }

  const resetListenersFlag = () => {
    globalEventListenersAdded = false
    globalSignClientInstance = null
    logger.info('🔄 Event listeners flag reset')
  }

  const handlePendingSessionRequests = async () => {
    if (!globalSignClientInstance) {
      logger.info('ℹ️ No global SignClient instance available for handling pending requests')
      return
    }

    try {
      const sessions = globalSignClientInstance.session.getAll()
      logger.info(`🔍 Found ${sessions.length} active sessions`)

      for (const session of sessions) {
        try {
          await globalSignClientInstance.ping({ topic: session.topic })
          logger.info(`✅ Session ${session.topic} is active`)
        } catch {
          logger.info(`❌ Session ${session.topic} is not responding, cleaning up...`)
        }
      }
    } catch (error) {
      logger.warn('⚠️ Error handling pending session requests:', error)
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
