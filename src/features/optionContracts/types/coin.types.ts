/**
 * Chia Coin Types and Utilities
 *
 * This file defines TypeScript interfaces and utilities for working with Chia coins,
 * including creating coins with custom puzzles like option contracts.
 */

/**
 * Represents a Chia coin
 */
export interface ChiaCoin {
  parent_coin_info: string
  puzzle_hash: string
  amount: number
}

/**
 * Represents a coin spend (coin + puzzle reveal + solution)
 */
export interface CoinSpend {
  coin: ChiaCoin
  puzzle_reveal: string
  solution: string
}

/**
 * Coin creation parameters for option contracts
 */
export interface OptionCoinParams {
  parentCoinInfo?: string
  amount: number
  puzzleHash?: string
  puzzleHex?: string
  solutionHex?: string
}

/**
 * Create a coin with the option contract puzzle
 */
export function createOptionContractCoin(params: OptionCoinParams): CoinSpend {
  const {
    parentCoinInfo = '0x0000000000000000000000000000000000000000000000000000000000000000',
    amount,
    puzzleHash = '0x0000000000000000000000000000000000000000000000000000000000000000',
    puzzleHex = '',
    solutionHex = '',
  } = params

  const coin: ChiaCoin = {
    parent_coin_info: parentCoinInfo,
    puzzle_hash: puzzleHash,
    amount: amount,
  }

  const coinSpend: CoinSpend = {
    coin,
    puzzle_reveal: puzzleHex,
    solution: solutionHex,
  }

  return coinSpend
}

/**
 * Create a coin spend for option contract creation
 * Uses a more standard approach compatible with Sage wallet RPC
 */
export function createOptionContractCoinSpend(
  amount: number,
  puzzleHex: string,
  solutionHex: string,
  puzzleHash?: string
): CoinSpend {
  // Generate a proper parent coin info (in real implementation, this would come from blockchain)
  const parentCoinInfo = generateRandomCoinId()

  // Use the provided puzzle hash or generate one
  const finalPuzzleHash = puzzleHash || generateRandomCoinId()

  const coin: ChiaCoin = {
    parent_coin_info: parentCoinInfo,
    puzzle_hash: finalPuzzleHash,
    amount: amount,
  }

  const coinSpend: CoinSpend = {
    coin,
    puzzle_reveal: puzzleHex,
    solution: solutionHex,
  }

  return coinSpend
}

/**
 * Generate a random coin ID (parent_coin_info)
 * In a real implementation, this would come from the blockchain
 */
export function generateRandomCoinId(): string {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  return `0x${Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Convert mojos to XCH (1 XCH = 1,000,000,000,000 mojos)
 */
export function mojosToXCH(mojos: number): number {
  return mojos / 1_000_000_000_000
}

/**
 * Convert XCH to mojos
 */
export function xchToMojos(xch: number): number {
  return Math.floor(xch * 1_000_000_000_000)
}
