import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import {
  getAssetBalance,
  getWalletAddress,
  sendTransaction,
  signMessage,
} from '../repositories/walletQueries.repository'
import type { AssetType, TransactionRequest } from '../types/command.types'
import { useInstanceDataService } from './InstanceDataService'
import { useSessionDataService } from './SessionDataService'

const WALLET_CONNECT_KEY = 'walletConnect'
const BALLANCE_KEY = 'balance'
const ADDRESS_KEY = 'address'

export function useWalletDataService() {
  const { signClient } = useInstanceDataService()
  const session = useSessionDataService()
  const queryClient = useQueryClient()

  const balanceQuery = useQuery({
    queryKey: [WALLET_CONNECT_KEY, BALLANCE_KEY],
    queryFn: async () => {
      const result = await getAssetBalance(null, null, signClient, session)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => signClient.value != null && session.isConnected.value),
    staleTime: Infinity,
  })

  const addressQuery = useQuery({
    queryKey: [WALLET_CONNECT_KEY, ADDRESS_KEY],
    queryFn: async () => {
      const result = await getWalletAddress(signClient, session)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: computed(() => signClient.value != null && session.isConnected.value),
    retry: 3,
    staleTime: Infinity,
  })

  const signMessageMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const result = await signMessage(data, signClient, session)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const sendTransactionMutation = useMutation({
    mutationFn: async (data: TransactionRequest) => {
      const result = await sendTransaction(data, signClient, session)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const getBalanceMutation = useMutation({
    mutationFn: async (data?: { type?: string | null; assetId?: string | null }) => {
      const type = data?.type ?? null
      const assetId = data?.assetId ?? null
      const result = await getAssetBalance(type as AssetType | null, assetId, signClient, session)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })

  const refreshBalance = async () => {
    await queryClient.invalidateQueries({ queryKey: [WALLET_CONNECT_KEY, BALLANCE_KEY] })
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
