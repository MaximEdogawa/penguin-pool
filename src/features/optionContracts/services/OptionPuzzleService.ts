/**
 * Option Contract Puzzle Utilities Service
 *
 * This service provides utility functions for working with Chialisp option contract puzzles.
 * It handles puzzle encoding, solution generation, and other puzzle-related operations.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'

/**
 * Generate solution parameters for option contract
 */
export interface OptionContractSolutionParams {
  modHash?: string
  underlyingCoinId: string
  underlyingDelegatedPuzzleHash?: string
  innerPuzzle?: string
  innerSolution?: string
}

/**
 * Convert minimal CLVM puzzle to hex encoding
 * Ensures the result is valid hex with even number of digits
 */
export function puzzleToHex(puzzle: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(puzzle.trim())
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Ensure even number of digits
  return hex.length % 2 === 0 ? hex : `${hex}0`
}

/**
 * Generate solution for "anyone can spend" puzzle
 * Provides a solution that matches the puzzle structure with conditions
 */
export function generateOptionContractSolution(_params: OptionContractSolutionParams): string {
  // For "anyone can spend" puzzle, we need to provide conditions
  // Empty conditions list means no operations
  const solution = '()'

  const encoder = new TextEncoder()
  const bytes = encoder.encode(solution)
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Ensure even number of digits
  return hex.length % 2 === 0 ? hex : `${hex}0`
}

/**
 * Get the hex-encoded option contract puzzle
 */
export function getOptionContractPuzzleHex(): string {
  return puzzleToHex(OPTION_CONTRACT_PUZZLE)
}

/**
 * Generate puzzle hash for minimal CLVM puzzle
 * Creates a SHA-256 hash of the minimal puzzle for use in coin spends
 */
export async function generatePuzzleHash(): Promise<string> {
  const puzzleHex = getOptionContractPuzzleHex()
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(puzzleHex))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`
}
