import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import type { AssetBalance, AppSignClient } from '../types/walletConnect.types'
import { useConnectionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'

export function useWalletDataService() {
  const connectionService = useConnectionDataService()
  const instanceService = useInstanceDataService()

  async function makeWalletRequest<T>(
    method: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const state = connectionService.state.value

      if (!state.isConnected || !state.session) {
        throw new Error('WalletConnect not connected')
      }

      const signClient = instanceService.getSignClient.value
      if (!signClient) throw new Error('SignClient not available')

      const result = (await (signClient as AppSignClient).request({
        topic: (state.session as Record<string, unknown>).topic as string,
        chainId: `chia:${state.chainId}`,
        request: {
          method,
          params: {
            fingerprint: parseInt(state.accounts[0] || '0'),
            ...data,
          },
        },
      })) as T | { error: Record<string, unknown> }

      if (result && typeof result === 'object' && 'error' in result) {
        return { success: false, error: 'Wallet returned an error' }
      }

      return { success: true, data: result as T }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  const balanceQuery = useQuery({
    queryKey: ['walletConnect', 'balance'],
    queryFn: async () => {
      const result = await makeWalletRequest<AssetBalance>(SageMethods.CHIP0002_GET_ASSET_BALANCE, {
        type: null,
        assetId: null,
      })
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 10000,
  })

  const addressQuery = useQuery({
    queryKey: ['walletConnect', 'address'],
    queryFn: async () => {
      const result = await makeWalletRequest<{ address: string }>(SageMethods.CHIA_GET_ADDRESS, {})
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 30000,
  })

  const syncStatusQuery = useQuery({
    queryKey: ['walletConnect', 'syncStatus'],
    queryFn: async () => {
      const result = await makeWalletRequest<Record<string, unknown>>(
        SageMethods.CHIA_GET_SYNC_STATUS,
        {}
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 5000,
  })

  const heightQuery = useQuery({
    queryKey: ['walletConnect', 'height'],
    queryFn: async () => {
      const result = await makeWalletRequest<{ height: number }>(SageMethods.CHIA_GET_HEIGHT, {})
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 5000,
  })

  const signMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const result = await makeWalletRequest<Record<string, unknown>>(
        SageMethods.CHIP0002_SIGN_MESSAGE,
        data
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: { transaction: Record<string, unknown> }) => {
      const result = await makeWalletRequest<Record<string, unknown>>(
        SageMethods.CHIP0002_SEND_TRANSACTION,
        data
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const getBalanceMutation = useMutation({
    mutationFn: async (data: { type?: string; assetId?: string }) => {
      const result = await makeWalletRequest<AssetBalance>(
        SageMethods.CHIP0002_GET_ASSET_BALANCE,
        data
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  return {
    balance: balanceQuery,
    address: addressQuery,
    syncStatus: syncStatusQuery,
    height: heightQuery,
    signMessage: signMessageMutation.mutateAsync,
    sendTransaction: sendTransactionMutation.mutateAsync,
    getBalance: getBalanceMutation.mutateAsync,
    isSigning: signMessageMutation.isPending,
    isSending: sendTransactionMutation.isPending,
    isGettingBalance: getBalanceMutation.isPending,
  }
}
