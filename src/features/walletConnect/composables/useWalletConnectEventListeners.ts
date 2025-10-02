import { logger } from '@/shared/services/logger'
import SignClient from '@walletconnect/sign-client'
import { walletConnectPersistenceService } from '../services/WalletConnectPersistenceService'

const listenerRegistry = new Map<string, Set<string>>()

type EventHandlers = {
  session_delete: (args: unknown) => void
  session_expire: (args: unknown) => void
  session_request: (args: unknown) => void
  session_proposal: (args: unknown) => void
  session_update: (args: unknown) => void
  session_ping: (args: unknown) => void
}

export function useWalletConnectEventListeners() {
  const addEventListeners = (signClient: SignClient) => {
    const clientId = signClient.core.crypto.keychain.keychain.get('clientId') || 'unknown'
    const registeredEvents = listenerRegistry.get(clientId) || new Set()

    if (registeredEvents.size > 0) {
      logger.info(`♻️ Event listeners already registered for client ${clientId}, skipping...`)
      return
    }

    const eventHandlers: EventHandlers = {
      session_delete: () => {
        logger.info('🗑️ WalletConnect session deleted')
        walletConnectPersistenceService.clearSession()
      },
      session_expire: () => {
        logger.info('⏰ WalletConnect session expired')
        walletConnectPersistenceService.clearSession()
      },
      session_request: (args: unknown) => {
        try {
          const event = args as { topic: string; id: number }
          signClient.respond({
            topic: event.topic,
            response: {
              id: event.id,
              jsonrpc: '2.0',
              result: { acknowledged: true },
            },
          })
        } catch (error) {
          logger.warn(
            '⚠️ Failed to respond to session request:',
            error instanceof Error ? error : undefined
          )
        }
      },
      session_proposal: (args: unknown) => {
        logger.info('📋 WalletConnect session proposal received:', args)
      },
      session_update: (args: unknown) => {
        logger.info('🔄 WalletConnect session updated:', args)
      },
      session_ping: (args: unknown) => {
        logger.info('🏓 WalletConnect session ping:', args)
      },
    }

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      signClient.on(eventName as keyof EventHandlers, handler)
      registeredEvents.add(eventName)
    })

    listenerRegistry.set(clientId, registeredEvents)

    logger.info(`✅ WalletConnect event listeners registered successfully for client ${clientId}`)
  }

  const removeEventListeners = (signClient: SignClient) => {
    const clientId = signClient.core.crypto.keychain.keychain.get('clientId') || 'unknown'
    const registeredEvents = listenerRegistry.get(clientId)

    if (!registeredEvents || registeredEvents.size === 0) {
      logger.info(`ℹ️ No event listeners to remove for client ${clientId}`)
      return
    }

    try {
      logger.info(`🧹 Removing WalletConnect event listeners for client ${clientId}...`)

      registeredEvents.forEach(eventName => {
        signClient.removeAllListeners(eventName as keyof EventHandlers)
      })

      listenerRegistry.delete(clientId)
      logger.info(`✅ WalletConnect event listeners removed for client ${clientId}`)
    } catch (error) {
      logger.warn('⚠️ Error removing event listeners:', error instanceof Error ? error : undefined)
    }
  }

  const removeAllEventListeners = () => {
    try {
      logger.info('🧹 Removing all WalletConnect event listeners...')
      listenerRegistry.clear()
      logger.info('✅ All WalletConnect event listeners removed')
    } catch (error) {
      logger.warn(
        '⚠️ Error removing all event listeners:',
        error instanceof Error ? error : undefined
      )
    }
  }

  const handlePendingSessionRequests = async (signClient: SignClient) => {
    if (!signClient) {
      logger.info('ℹ️ No SignClient instance available for handling pending requests')
      return
    }

    try {
      const sessions = signClient.session.getAll()
      logger.info(`🔍 Found ${sessions.length} active sessions`)

      for (const session of sessions) {
        try {
          await signClient.ping({ topic: session.topic })
          logger.info(`✅ Session ${session.topic} is active`)
        } catch {
          logger.info(`❌ Session ${session.topic} is not responding, cleaning up...`)
        }
      }
    } catch (error) {
      logger.warn(
        '⚠️ Error handling pending session requests:',
        error instanceof Error ? error : undefined
      )
    }
  }

  const getRegisteredEventsCount = () => {
    let total = 0
    listenerRegistry.forEach(events => {
      total += events.size
    })
    return total
  }

  return {
    addEventListeners,
    removeEventListeners,
    removeAllEventListeners,
    handlePendingSessionRequests,
    getRegisteredEventsCount,
    areListenersAdded: (signClient: SignClient) => {
      const clientId = signClient.core.crypto.keychain.keychain.get('clientId') || 'unknown'
      const registeredEvents = listenerRegistry.get(clientId)
      return registeredEvents ? registeredEvents.size > 0 : false
    },
  }
}
