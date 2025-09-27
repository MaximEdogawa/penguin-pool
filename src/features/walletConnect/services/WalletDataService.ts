import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import {
  getAssetBalance,
  getWalletAddress,
  sendTransaction,
  signMessage,
} from '../repositories/walletQueries.repository'
import type { AssetType, TransactionRequest } from '../types/command.types'
import { useSessionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'

export function useWalletDataService() {
  const { signClient } = useInstanceDataService()
  const { session } = useSessionDataService()
  const queryClient = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: ['walletConnect', 'balance'],
    queryFn: async () => {
      const result = await getAssetBalance(null, null, signClient.value, session.value)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => signClient.value != null && session.value != null),
    retry: 3,
    retryDelay: 15000,
    staleTime: 15 * 1000, // 15 seconds
  })

  const addressQuery = useQuery({
    queryKey: ['walletConnect', 'address'],
    queryFn: async () => {
      const result = await getWalletAddress(signClient.value, session.value)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => signClient.value != null && session.value != null),
    retry: 3,
    retryDelay: 15000,
    staleTime: 15 * 1000, // 15 seconds
  })

  const signMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const result = await signMessage(data, signClient.value, session.value)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      const result = await sendTransaction(data, signClient.value, session.value)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const getBalanceMutation = useMutation({
    mutationFn: async (data?: { type?: string | null; assetId?: string | null }) => {
      const type = data?.type ?? null
      const assetId = data?.assetId ?? null
      const result = await getAssetBalance(
        type as AssetType | null,
        assetId,
        signClient.value,
        session.value
      )
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
