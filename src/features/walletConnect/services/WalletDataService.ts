import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import {
  getAssetBalance,
  getWalletAddress,
  sendTransaction,
  signMessage,
} from '../repositories/walletQueries.repository'
import type { AssetType, TransactionRequest } from '../types/command.types'
import { useWalletStateService } from './WalletStateDataService'

export function useWalletDataService() {
  const { walletState } = useWalletStateService()
  const queryClient = useQueryClient()
  const isReady = computed(() => walletState.value.isConnected)

  const balanceQuery = useQuery({
    queryKey: ['walletConnect', 'balance'],
    queryFn: async () => {
      const result = await getAssetBalance(walletState, null, null)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: isReady,
    retry: 3,
    retryDelay: 15000,
    staleTime: Infinity,
  })

  const addressQuery = useQuery({
    queryKey: ['walletConnect', 'address'],
    queryFn: async () => {
      const result = await getWalletAddress(walletState)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: isReady,
    retry: 3,
    retryDelay: 15000,
    staleTime: Infinity,
  })

  const signMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const result = await signMessage(walletState, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      const result = await sendTransaction(walletState, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const getBalanceMutation = useMutation({
    mutationFn: async (data?: { type?: string | null; assetId?: string | null }) => {
      const type = data?.type ?? null
      const assetId = data?.assetId ?? null
      const result = await getAssetBalance(walletState, type as AssetType | null, assetId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const refreshBalance = async () => {
    await queryClient.invalidateQueries({ queryKey: ['walletConnect', 'balance'] })
  }

  return {
    balance: balanceQuery,
    address: addressQuery,
    signMessage: signMessageMutation.mutateAsync,
    sendTransaction: sendTransactionMutation.mutateAsync,
    getBalance: getBalanceMutation.mutateAsync,
    refreshBalance,
    isSigning: signMessageMutation.isPending,
    isSending: sendTransactionMutation.isPending,
    isGettingBalance: getBalanceMutation.isPending,
  }
}
