/**
 * Easy Browser Example: Custom Coin Spend Creation
 *
 * This file provides a simple example that can be run in the browser
 * to demonstrate custom coin spend creation.
 */

import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Simple example: Create a basic coin spend
 */
export function createSimpleCoinSpendExample(): CoinSpend {
  // Creating simple coin spend

  const coinSpend = createOptionContractCoinSpend(
    xchToMojos(1.0), // 1 XCH worth
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // puzzle hex
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // solution hex
    '0x1111111111111111111111111111111111111111111111111111111111111111' // puzzle hash
  )

  return coinSpend
}

/**
 * Advanced example: Create a curried option contract coin spend
 */
export async function createAdvancedCoinSpendExample(): Promise<CoinSpend> {
  // Creating advanced curried option contract

  // Define parameters
  const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  const amount = xchToMojos(2.5) // 2.5 XCH worth

  // Parameters: underlyingCoinId, recipientPuzzleHash, amount

  // Create the curried option contract
  const curriedContract = await createCurriedOptionContract(
    underlyingCoinId,
    recipientPuzzleHash,
    amount
  )

  // Curried contract created

  // Create the coin spend
  const coinSpend = createOptionContractCoinSpend(
    amount,
    curriedContract.puzzleHex,
    curriedContract.innerSolution,
    curriedContract.puzzleHash
  )

  return coinSpend
}

/**
 * Validation example: Test hex validation
 */
export function validateHexExample(): void {
  // Hex validation example

  const testStrings = [
    '0x1234567890abcdef', // Valid hex
    '0x1234567890abcde', // Invalid hex (odd digits)
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Valid long hex
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde', // Invalid long hex
  ]

  testStrings.forEach((hex, index) => {
    // Test hex validation
    const _isValid = isValidHex(hex)
    const _length = hex.length - 2 // Remove 0x prefix
    debugHexString(hex, `Test ${index + 1}`)
  })
}

/**
 * Multiple coin spends example
 */
export async function createMultipleCoinSpendsExample(): Promise<CoinSpend[]> {
  // Creating multiple coin spends

  const amounts = [0.1, 0.5, 1.0, 2.0]

  const coinSpends = await Promise.all(
    amounts.map(async (amount, i) => {
      const underlyingCoinId = `0x${i.toString().repeat(64)}`
      const recipientPuzzleHash = `0x${(i + 1).toString().repeat(64)}`

      // Creating coin spend for amount XCH

      const curriedContract = await createCurriedOptionContract(
        underlyingCoinId,
        recipientPuzzleHash,
        xchToMojos(amount)
      )

      const coinSpend = createOptionContractCoinSpend(
        xchToMojos(amount),
        curriedContract.puzzleHex,
        curriedContract.innerSolution,
        curriedContract.puzzleHash
      )

      return coinSpend
    })
  )

  return coinSpends
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  // Starting custom coin spend examples

  try {
    // Simple example
    createSimpleCoinSpendExample()

    // Validation example
    validateHexExample()

    // Advanced example
    await createAdvancedCoinSpendExample()

    // Multiple coin spends
    await createMultipleCoinSpendsExample()

    // All examples completed successfully
  } catch (_error) {
    // Error running examples
  }
}

/**
 * Quick test function for the browser console
 */
export function quickTest(): void {
  // Quick test: Custom coin spend creation

  const coinSpend = createSimpleCoinSpendExample()

  // Test passed! Coin spend created
  const _testResult = {
    coinAmount: coinSpend.coin.amount,
    puzzleHash: `${coinSpend.coin.puzzle_hash.substring(0, 20)}...`,
    hasPuzzleReveal: !!coinSpend.puzzle_reveal,
    hasSolution: !!coinSpend.solution,
  }
}
