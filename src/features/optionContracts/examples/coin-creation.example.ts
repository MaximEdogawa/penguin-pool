/**
 * Example: Creating a Coin with Option Contract Puzzle
 *
 * This file demonstrates how to create a Chia coin with the option contract puzzle
 * using TypeScript interfaces and utilities.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import {
  generateOptionContractSolution,
  generatePuzzleHash,
  puzzleToHex,
  type OptionContractSolutionParams,
} from '../services/OptionPuzzleService'
import {
  createOptionContractCoinSpend,
  generateRandomCoinId,
  xchToMojos,
  type ChiaCoin,
  type CoinSpend,
} from '../types/coin.types'

/**
 * Example: Create an option contract coin
 */
export async function createExampleOptionCoin() {
  // 1. Get the puzzle hex
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)

  // 2. Generate puzzle hash
  const puzzleHash = await generatePuzzleHash()

  // 3. Create solution parameters
  const solutionParams: OptionContractSolutionParams = {
    underlyingCoinId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    modHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  }

  // 4. Generate solution
  const solutionHex = generateOptionContractSolution(solutionParams)

  // 5. Create the coin spend
  const coinSpend: CoinSpend = createOptionContractCoinSpend(
    xchToMojos(1.0), // 1 XCH worth of option contracts
    puzzleHex,
    solutionHex,
    puzzleHash
  )

  // Created option contract coin
  return coinSpend
}

/**
 * Example: Create a simple coin with custom puzzle
 */
export function createSimpleCoinWithPuzzle(
  amount: number,
  puzzleHex: string,
  solutionHex: string
): ChiaCoin {
  return {
    parent_coin_info: generateRandomCoinId(),
    puzzle_hash: '0x0000000000000000000000000000000000000000000000000000000000000000', // Will be calculated
    amount: xchToMojos(amount),
  }
}

/**
 * Example: Create multiple option contract coins
 */
export async function createMultipleOptionCoins(count: number) {
  const coins = await Promise.all(
    Array.from({ length: count }).map(async () => {
      const coin = await createExampleOptionCoin()
      return coin
    })
  )

  return coins
}
