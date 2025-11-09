import {
  getAssetCoins,
  signCoinSpends,
} from '@/features/walletConnect/repositories/walletQueries.repository'
import { useInstanceDataService } from '@/features/walletConnect/services/InstanceDataService'
import { useSessionDataService } from '@/features/walletConnect/services/SessionDataService'
import { logger } from '@/shared/services/logger'
import type { BaseAsset } from '@/types/asset.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'
import { createCurriedOptionContract } from './OptionPuzzleDriver'

export interface OptionContract {
  id: string
  name: string
  underlyingAsset: string
  strikePrice: number
  expirationDate: string
  contractType: 'call' | 'put'
  quantity: number
  premium: number
  assetId: string
  createdAt: Date
  status: 'active' | 'expired' | 'exercised'
}

export interface CreateOptionContractRequest {
  name: string
  underlyingAsset: string
  strikePrice: number
  expirationDate: string
  contractType: 'call' | 'put'
  quantity: number
  premium: number
}

const OPTION_CONTRACTS_KEY = 'optionContracts'
const OPTION_COINS_KEY = 'optionCoins'

export function useOptionService() {
  const { signClient } = useInstanceDataService()
  const session = useSessionDataService()
  const queryClient = useQueryClient()

  // Get all coins with "option" prefix
  const optionCoinsQuery = useQuery({
    queryKey: [OPTION_CONTRACTS_KEY, OPTION_COINS_KEY],
    queryFn: async () => {
      // Get all asset coins and filter for those with "option" prefix
      const result = await getAssetCoins(signClient, session, null, null)
      if (!result.success) throw new Error(result.error)

      // Filter coins that have "option" in their name or asset ID
      const optionCoins =
        result.data?.filter(coin => {
          const coinName = coin.coinName?.toLowerCase() || ''
          const assetId = coin.coin?.parent_coin_info?.toLowerCase() || ''
          return coinName.includes('option') || assetId.includes('option')
        }) || []

      return optionCoins
    },
    enabled: computed(() => signClient.value != null && session.isConnected.value),
    retry: 3,
    staleTime: 30000, // 30 seconds
  })

  // Create option contract mutation
  const createOptionContractMutation = useMutation({
    mutationFn: async (data: CreateOptionContractRequest) => {
      // Use CHIP0002_SIGN_COIN_SPENDS to create option contracts
      // This method allows us to create custom coin spends with Chialisp puzzles

      // Generate a properly curried option contract
      const timestamp = Date.now()
      const recipientPuzzleHash =
        '0x0000000000000000000000000000000000000000000000000000000000000000' // Placeholder

      const curriedContract = await createCurriedOptionContract(
        data.underlyingAsset,
        recipientPuzzleHash,
        xchToMojos(data.quantity)
      )

      logger.info('Generated curried option contract:', {
        puzzleHex: `${curriedContract.puzzleHex.substring(0, 20)}...`,
        puzzleHash: `${curriedContract.puzzleHash.substring(0, 20)}...`,
        innerPuzzle: `${curriedContract.innerPuzzle.substring(0, 20)}...`,
        innerSolution: `${curriedContract.innerSolution.substring(0, 20)}...`,
      })

      // Create the option contract coin spend using proper curried puzzle
      const coinSpend: CoinSpend = createOptionContractCoinSpend(
        xchToMojos(data.quantity), // Convert to mojos
        curriedContract.puzzleHex,
        curriedContract.innerSolution,
        curriedContract.puzzleHash
      )

      // Sign the coin spend using Sage wallet
      const result = await signCoinSpends(
        {
          walletId: 1,
          coinSpends: [coinSpend],
        },
        signClient,
        session
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to create option contract')
      }

      if (!result.data) {
        throw new Error('No signed coin spend data returned')
      }

      // Create option contract object from signed transaction
      const optionContract: OptionContract = {
        id: `option_contract_${timestamp}`,
        name: data.name,
        underlyingAsset: data.underlyingAsset,
        strikePrice: data.strikePrice,
        expirationDate: data.expirationDate,
        contractType: data.contractType,
        quantity: data.quantity,
        premium: data.premium,
        assetId: curriedContract.puzzleHash,
        createdAt: new Date(),
        status: 'active',
      }

      logger.info('Option contract created using Sage wallet connect:', {
        assetId: optionContract.assetId,
        contractType: optionContract.contractType,
        strikePrice: optionContract.strikePrice,
        expirationDate: optionContract.expirationDate,
        signedCoinSpends: result.data.length,
      })

      return optionContract
    },
  })

  // Get option contracts (stored locally for now)
  const optionContractsQuery = useQuery({
    queryKey: [OPTION_CONTRACTS_KEY, 'contracts'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the blockchain or a database
      // For now, return empty array
      return [] as OptionContract[]
    },
    retry: 3,
    staleTime: 60000, // 1 minute
  })

  // Convert option coins to BaseAsset format
  const optionAssets = computed(() => {
    if (!optionCoinsQuery.data.value) return []

    return optionCoinsQuery.data.value.map(coin => ({
      assetId: coin.coinName || coin.coin?.parent_coin_info || '',
      amount: coin.coin?.amount || 0,
      type: 'option' as const,
      symbol: coin.coinName || 'OPTION',
      name: coin.coinName || 'Option Contract',
    })) as BaseAsset[]
  })

  const refreshOptionCoins = async () => {
    await queryClient.invalidateQueries({ queryKey: [OPTION_CONTRACTS_KEY, OPTION_COINS_KEY] })
  }

  const refreshOptionContracts = async () => {
    await queryClient.invalidateQueries({ queryKey: [OPTION_CONTRACTS_KEY, 'contracts'] })
  }

  return {
    optionCoins: optionCoinsQuery,
    optionAssets,
    optionContracts: optionContractsQuery,
    createOptionContract: createOptionContractMutation.mutateAsync,
    refreshOptionCoins,
    refreshOptionContracts,
    isLoadingCoins: optionCoinsQuery.isLoading,
    isLoadingContracts: optionContractsQuery.isLoading,
    isCreatingContract: createOptionContractMutation.isPending,
  }
}
