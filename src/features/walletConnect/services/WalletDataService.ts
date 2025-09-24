import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import {
  getAssetBalance,
  getWalletAddress,
  sendTransaction,
  signMessage,
} from '../repositories/walletQueries.repository'
import type { AssetType, TransactionRequest } from '../types/command.types'
import { useConnectionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'

export function useWalletDataService() {
  const connectionService = useConnectionDataService()
  const instanceService = useInstanceDataService()
  const queryClient = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: ['walletConnect', 'balance'],
    queryFn: async () => {
      const result = await getAssetBalance(connectionService, instanceService, null, null)
      console.log('balanceQuery result', result)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 10000,
  })

  const addressQuery = useQuery({
    queryKey: ['walletConnect', 'address'],
    queryFn: async () => {
      const result = await getWalletAddress(connectionService, instanceService)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 30000,
  })

  const signMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const result = await signMessage(connectionService, instanceService, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      const result = await sendTransaction(connectionService, instanceService, data)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const getBalanceMutation = useMutation({
    mutationFn: async (data: { type?: string; assetId?: string }) => {
      const result = await getAssetBalance(
        connectionService,
        instanceService,
        data.type as AssetType | null,
        data.assetId
      )
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const refreshBalance = async () => {
    // Invalidate and refetch the balance query
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
