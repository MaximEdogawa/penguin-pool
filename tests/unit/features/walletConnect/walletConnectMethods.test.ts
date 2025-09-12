import { SageMethods } from '@/features/walletConnect/constants/sage-methods'
import { commandHandler } from '@/features/walletConnect/services/CommandHandler'
import type { HandlerContext } from '@/features/walletConnect/types/command.types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the wallet queries
vi.mock('@/features/walletConnect/queries/walletQueries', () => ({
  signCoinSpends: vi.fn(),
  signMessage: vi.fn(),
  sendTransaction: vi.fn(),
  createOffer: vi.fn(),
  takeOffer: vi.fn(),
  cancelOffer: vi.fn(),
}))

describe('WalletConnect Methods', () => {
  const mockContext: HandlerContext = {
    fingerprint: 123456789,
    session: {
      topic: 'test-topic',
      chainId: 'chia:testnet',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CHIP0002_SIGN_COIN_SPENDS', () => {
    it('should handle sign coin spends request', async () => {
      const mockParams = {
        walletId: 1,
        coinSpends: [
          {
            coin: {
              parent_coin_info: '0x123',
              puzzle_hash: '0x456',
              amount: 1000000,
            },
            puzzle_reveal: '0x789',
            solution: '0xabc',
          },
        ],
      }

      const mockResponse = [
        {
          coin: {
            parent_coin_info: '0x123',
            puzzle_hash: '0x456',
            amount: 1000000,
          },
          puzzle_reveal: '0x789',
          solution: '0xabc',
        },
      ]

      const { signCoinSpends } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(signCoinSpends).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIP0002_SIGN_COIN_SPENDS,
        mockParams,
        mockContext
      )

      expect(signCoinSpends).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        signedCoinSpends: mockResponse,
      })
    })

    it('should handle sign coin spends error', async () => {
      const mockParams = {
        walletId: 1,
        coinSpends: [],
      }

      const { signCoinSpends } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(signCoinSpends).mockResolvedValue({
        success: false,
        error: 'Failed to sign coin spends',
      })

      await expect(
        commandHandler.handleCommand(SageMethods.CHIP0002_SIGN_COIN_SPENDS, mockParams, mockContext)
      ).rejects.toThrow('Failed to sign coin spends')
    })
  })

  describe('CHIP0002_SIGN_MESSAGE', () => {
    it('should handle sign message request', async () => {
      const mockParams = {
        message: 'Hello, Chia!',
        address: 'xch1test123',
        walletId: 1,
      }

      const mockResponse = {
        signature: '0xsigned123',
        message: 'Hello, Chia!',
        address: 'xch1test123',
      }

      const { signMessage } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(signMessage).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIP0002_SIGN_MESSAGE,
        mockParams,
        mockContext
      )

      expect(signMessage).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        signature: '0xsigned123',
        message: 'Hello, Chia!',
        address: 'xch1test123',
      })
    })
  })

  describe('CHIP0002_SEND_TRANSACTION', () => {
    it('should handle send transaction request', async () => {
      const mockParams = {
        walletId: 1,
        amount: 1000000,
        fee: 1000,
        address: 'xch1recipient123',
        memos: ['Test transaction'],
      }

      const mockResponse = {
        transactionId: '0xtx123',
        transaction: { id: '0xtx123' },
      }

      const { sendTransaction } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(sendTransaction).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIP0002_SEND_TRANSACTION,
        mockParams,
        mockContext
      )

      expect(sendTransaction).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        transactionId: '0xtx123',
        transaction: { id: '0xtx123' },
      })
    })
  })

  describe('CHIA_CREATE_OFFER', () => {
    it('should handle create offer request', async () => {
      const mockParams = {
        walletId: 1,
        offer: 'offer_string_here',
        fee: 1000,
      }

      const mockResponse = {
        offer: 'offer_string_here',
        tradeId: 'trade123',
      }

      const { createOffer } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(createOffer).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIA_CREATE_OFFER,
        mockParams,
        mockContext
      )

      expect(createOffer).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        offer: 'offer_string_here',
        tradeId: 'trade123',
      })
    })
  })

  describe('CHIA_TAKE_OFFER', () => {
    it('should handle take offer request', async () => {
      const mockParams = {
        offer: 'offer_string_here',
        fee: 1000,
      }

      const mockResponse = {
        tradeId: 'trade123',
        success: true,
      }

      const { takeOffer } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(takeOffer).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIA_TAKE_OFFER,
        mockParams,
        mockContext
      )

      expect(takeOffer).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        tradeId: 'trade123',
        success: true,
      })
    })
  })

  describe('CHIA_CANCEL_OFFER', () => {
    it('should handle cancel offer request', async () => {
      const mockParams = {
        tradeId: 'trade123',
        fee: 1000,
      }

      const mockResponse = {
        success: true,
      }

      const { cancelOffer } = await import('@/features/walletConnect/queries/walletQueries')
      vi.mocked(cancelOffer).mockResolvedValue({
        success: true,
        data: mockResponse,
      })

      const result = await commandHandler.handleCommand(
        SageMethods.CHIA_CANCEL_OFFER,
        mockParams,
        mockContext
      )

      expect(cancelOffer).toHaveBeenCalledWith(mockParams)
      expect(result).toEqual({
        success: true,
      })
    })
  })
})
