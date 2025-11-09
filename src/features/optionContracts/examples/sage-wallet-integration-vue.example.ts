/**
 * Sage Wallet Integration Functions (Vue-Compatible)
 *
 * This file provides functions that can be used within Vue components
 * to test custom coin spend creation with Sage wallet.
 */

import { signCoinSpends } from '@/features/walletConnect/repositories/walletQueries.repository'
import type { WalletConnectSession } from '@/features/walletConnect/types/command.types'
import type { ComputedRef } from 'vue'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'
import { isValidHex } from '../utils/hex-validation'

/**
 * Test simple coin spend with Sage wallet (Vue-compatible)
 */
export async function testSimpleCoinSpendWithSageVue(
  signClient: ComputedRef<SignClient | undefined>,
  session: WalletConnectSession
): Promise<{
  success: boolean
  result?: any
  error?: string
}> {
  console.log('=== Testing Simple Coin Spend with Sage Wallet ===')

  try {
    if (!signClient.value || !session.isConnected) {
      throw new Error('WalletConnect not connected. Please connect to Sage wallet first.')
    }

    // Create a simple coin spend
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(0.001), // Very small amount for testing
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // puzzle hex
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // solution hex
      '0x1111111111111111111111111111111111111111111111111111111111111111' // puzzle hash
    )

    console.log('Created coin spend:', {
      coinAmount: coinSpend.coin.amount,
      puzzleHash: `${coinSpend.coin.puzzle_hash.substring(0, 20)}...`,
      puzzleRevealLength: coinSpend.puzzle_reveal.length,
      solutionLength: coinSpend.solution.length,
    })

    // Validate hex strings
    if (!isValidHex(coinSpend.coin.puzzle_hash)) {
      throw new Error('Invalid puzzle hash hex format')
    }
    if (!isValidHex(coinSpend.puzzle_reveal)) {
      throw new Error('Invalid puzzle reveal hex format')
    }
    if (!isValidHex(coinSpend.solution)) {
      throw new Error('Invalid solution hex format')
    }

    console.log('✅ All hex strings are valid')

    // Send to Sage wallet
    console.log('Sending coin spend to Sage wallet...')
    const result = await signCoinSpends(
      {
        walletId: 1,
        coinSpends: [coinSpend],
      },
      signClient,
      session
    )

    if (result.success) {
      console.log('✅ Sage wallet accepted the coin spend!')
      console.log('Signed coin spends:', result.data?.length || 0)
      return { success: true, result }
    } else {
      console.error('❌ Sage wallet rejected the coin spend:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error testing simple coin spend:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Test curried option contract with Sage wallet (Vue-compatible)
 */
export async function testCurriedOptionContractWithSageVue(
  signClient: ComputedRef<SignClient | undefined>,
  session: WalletConnectSession
): Promise<{
  success: boolean
  result?: any
  error?: string
}> {
  console.log('=== Testing Curried Option Contract with Sage Wallet ===')

  try {
    if (!signClient.value || !session.isConnected) {
      throw new Error('WalletConnect not connected. Please connect to Sage wallet first.')
    }

    // Create a curried option contract
    const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    console.log('Creating curried option contract...')
    const curriedContract = await createCurriedOptionContract(
      underlyingCoinId,
      recipientPuzzleHash,
      xchToMojos(0.001) // Very small amount for testing
    )

    console.log('Curried contract created:', {
      puzzleHash: `${curriedContract.puzzleHash.substring(0, 20)}...`,
      puzzleHexLength: curriedContract.puzzleHex.length,
      innerPuzzle: `${curriedContract.innerPuzzle.substring(0, 50)}...`,
      innerSolution: curriedContract.innerSolution,
    })

    // Create coin spend with curried puzzle
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(0.001),
      curriedContract.puzzleHex,
      curriedContract.innerSolution,
      curriedContract.puzzleHash
    )

    // Validate all hex strings
    const validations = [
      { name: 'Puzzle Hash', value: coinSpend.coin.puzzle_hash },
      { name: 'Puzzle Reveal', value: coinSpend.puzzle_reveal },
      { name: 'Solution', value: coinSpend.solution },
    ]

    for (const validation of validations) {
      if (!isValidHex(validation.value)) {
        throw new Error(`Invalid ${validation.name} hex format`)
      }
    }

    console.log('✅ All hex strings are valid')

    // Send to Sage wallet
    console.log('Sending curried coin spend to Sage wallet...')
    const result = await signCoinSpends(
      {
        walletId: 1,
        coinSpends: [coinSpend],
      },
      signClient,
      session
    )

    if (result.success) {
      console.log('✅ Sage wallet accepted the curried coin spend!')
      console.log('Signed coin spends:', result.data?.length || 0)
      return { success: true, result }
    } else {
      console.error('❌ Sage wallet rejected the curried coin spend:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error testing curried option contract:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Test multiple coin spends with Sage wallet (Vue-compatible)
 */
export async function testMultipleCoinSpendsWithSageVue(
  signClient: ComputedRef<SignClient | undefined>,
  session: WalletConnectSession
): Promise<{
  success: boolean
  result?: any
  error?: string
}> {
  console.log('=== Testing Multiple Coin Spends with Sage Wallet ===')

  try {
    if (!signClient.value || !session.isConnected) {
      throw new Error('WalletConnect not connected. Please connect to Sage wallet first.')
    }

    // Create multiple coin spends
    const coinSpends: CoinSpend[] = []
    const amounts = [0.001, 0.002, 0.003] // Small amounts for testing

    console.log(`Creating ${amounts.length} coin spends...`)

    for (let i = 0; i < amounts.length; i++) {
      const coinSpend = createOptionContractCoinSpend(
        xchToMojos(amounts[i]),
        `0x${i.toString().repeat(64)}`,
        `0x${(i + 1).toString().repeat(64)}`,
        `0x${(i + 2).toString().repeat(64)}`
      )
      coinSpends.push(coinSpend)
      console.log(`Coin spend ${i + 1} created: ${coinSpend.coin.amount} mojos`)
    }

    // Validate all coin spends
    for (let i = 0; i < coinSpends.length; i++) {
      const coinSpend = coinSpends[i]
      if (
        !isValidHex(coinSpend.coin.puzzle_hash) ||
        !isValidHex(coinSpend.puzzle_reveal) ||
        !isValidHex(coinSpend.solution)
      ) {
        throw new Error(`Invalid hex format in coin spend ${i + 1}`)
      }
    }

    console.log('✅ All coin spends are valid')

    // Send to Sage wallet
    console.log('Sending multiple coin spends to Sage wallet...')
    const result = await signCoinSpends(
      {
        walletId: 1,
        coinSpends,
      },
      signClient,
      session
    )

    if (result.success) {
      console.log('✅ Sage wallet accepted all coin spends!')
      console.log('Signed coin spends:', result.data?.length || 0)
      return { success: true, result }
    } else {
      console.error('❌ Sage wallet rejected the coin spends:', result.error)
      return { success: false, error: result.error }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error testing multiple coin spends:', errorMsg)
    return { success: false, error: errorMsg }
  }
}

/**
 * Run all Sage wallet integration tests (Vue-compatible)
 */
export async function runAllSageWalletTestsVue(
  signClient: ComputedRef<SignClient | undefined>,
  session: WalletConnectSession
): Promise<void> {
  console.log('🚀 Starting Sage Wallet Integration Tests')
  console.log('⚠️  Make sure Sage wallet is connected via WalletConnect!')

  const results = []

  try {
    // Test simple coin spend
    console.log('\n1. Testing Simple Coin Spend...')
    const simpleResult = await testSimpleCoinSpendWithSageVue(signClient, session)
    results.push({ test: 'Simple Coin Spend', ...simpleResult })

    // Test curried option contract
    console.log('\n2. Testing Curried Option Contract...')
    const curriedResult = await testCurriedOptionContractWithSageVue(signClient, session)
    results.push({ test: 'Curried Option Contract', ...curriedResult })

    // Test multiple coin spends
    console.log('\n3. Testing Multiple Coin Spends...')
    const multipleResult = await testMultipleCoinSpendsWithSageVue(signClient, session)
    results.push({ test: 'Multiple Coin Spends', ...multipleResult })

    // Summary
    console.log('\n📊 Test Results Summary:')
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${result.test}`)
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`)
      }
    })

    const successCount = results.filter(r => r.success).length
    console.log(`\n🎯 ${successCount}/${results.length} tests passed`)
  } catch (error) {
    console.error('❌ Error running Sage wallet tests:', error)
  }
}
