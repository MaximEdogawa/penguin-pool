/**
 * Example: Proper Option Contract Currying
 *
 * This file demonstrates the correct way to curry values into the option contract puzzle
 * using the driver code.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'

/**
 * Example: Create a properly curried option contract
 */
export async function createProperlyCurriedOptionContract() {
  // 1. Define the underlying asset (the asset the option is based on)
  const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

  // 2. Define the recipient puzzle hash (who gets the option when exercised)
  const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

  // 3. Define the amount (how much of the underlying asset)
  const amount = xchToMojos(1.0) // 1 XCH worth

  // 4. Create the curried option contract
  const curriedContract = await createCurriedOptionContract(
    underlyingCoinId,
    recipientPuzzleHash,
    amount
  )

  // Curried option contract created

  // 5. Create the coin spend
  const coinSpend: CoinSpend = createOptionContractCoinSpend(
    amount,
    curriedContract.puzzleHex,
    curriedContract.innerSolution,
    curriedContract.puzzleHash
  )

  return coinSpend
}

/**
 * Example: Show the difference between curried and non-curried puzzles
 */
export async function demonstrateCurrying() {
  // Option contract currying demo

  // Original puzzle (with placeholders)
  const _originalPuzzle = `${OPTION_CONTRACT_PUZZLE.substring(0, 100)}...`

  // Curried puzzle (with actual values)
  const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

  const curriedContract = await createCurriedOptionContract(
    underlyingCoinId,
    recipientPuzzleHash,
    xchToMojos(1.0)
  )

  // Curried puzzle and inner puzzle/solution available
  const _curriedPuzzle = `${curriedContract.puzzleHex.substring(0, 100)}...`
  const _innerPuzzle = curriedContract.innerPuzzle
  const _innerSolution = curriedContract.innerSolution
}

/**
 * Example: Create multiple option contracts with different parameters
 */
export async function createMultipleCurriedContracts() {
  const contracts: CoinSpend[] = []

  // Create 3 different option contracts
  const underlyingAssets = [
    '0x1111111111111111111111111111111111111111111111111111111111111111',
    '0x2222222222222222222222222222222222222222222222222222222222222222',
    '0x3333333333333333333333333333333333333333333333333333333333333333',
  ]

  const recipientPuzzleHashes = [
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  ]

  const contracts = await Promise.all(
    Array.from({ length: 3 }).map(async (_, i) => {
      const curriedContract = await createCurriedOptionContract(
        underlyingAssets[i],
        recipientPuzzleHashes[i],
        xchToMojos(0.5 + i * 0.5) // 0.5, 1.0, 1.5 XCH
      )

      const coinSpend = createOptionContractCoinSpend(
        xchToMojos(0.5 + i * 0.5),
        curriedContract.puzzleHex,
        curriedContract.innerSolution,
        curriedContract.puzzleHash
      )

      return coinSpend
    })
  )

  return contracts
}
