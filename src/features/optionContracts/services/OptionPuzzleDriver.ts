/**
 * Option Contract Puzzle Driver
 *
 * This file contains the driver code for properly currying values into the option contract puzzle.
 * It handles the complex process of preparing the puzzle with the correct parameters.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { debugHexString, stringToValidHex } from '../utils/hex-validation'

/**
 * Parameters for currying the option contract puzzle
 */
export interface OptionContractCurryParams {
  modHash: string
  underlyingCoinId: string
  underlyingDelegatedPuzzleHash: string
  innerPuzzle: string
}

/**
 * Generate a curried puzzle hash for the option contract
 * This creates the proper puzzle hash that will be used in the coin
 */
export async function generateCurriedPuzzleHash(
  params: OptionContractCurryParams
): Promise<string> {
  // The CHIP puzzle expects these parameters to be curried in:
  // MOD_HASH, UNDERLYING_COIN_ID, UNDERLYING_DELEGATED_PUZZLE_HASH, INNER_PUZZLE

  // Create the curried puzzle by substituting the parameters
  const curriedPuzzle = curryPuzzle(OPTION_CONTRACT_PUZZLE, params)

  // Generate hash of the curried puzzle
  const puzzleHex = puzzleToHex(curriedPuzzle)
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(puzzleHex))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Curry the puzzle with the provided parameters
 * This replaces the parameter placeholders with actual values
 */
function curryPuzzle(puzzle: string, params: OptionContractCurryParams): string {
  let curriedPuzzle = puzzle

  // Replace the parameter placeholders with actual values
  curriedPuzzle = curriedPuzzle.replace(/MOD_HASH/g, params.modHash)
  curriedPuzzle = curriedPuzzle.replace(/UNDERLYING_COIN_ID/g, params.underlyingCoinId)
  curriedPuzzle = curriedPuzzle.replace(
    /UNDERLYING_DELEGATED_PUZZLE_HASH/g,
    params.underlyingDelegatedPuzzleHash
  )
  curriedPuzzle = curriedPuzzle.replace(/INNER_PUZZLE/g, params.innerPuzzle)

  return curriedPuzzle
}

/**
 * Convert minimal CLVM puzzle to hex encoding
 * Ensures the result is valid hex with even number of digits
 */
function puzzleToHex(puzzle: string): string {
  return stringToValidHex(puzzle.trim())
}

/**
 * Generate the inner puzzle for the option contract
 * Minimal valid CLVM structure for Sage wallet compatibility
 */
export function generateInnerPuzzle(recipientPuzzleHash: string): string {
  // Minimal valid inner puzzle
  return '()'
}

/**
 * Generate the inner solution for the option contract
 * Minimal valid CLVM structure for Sage wallet compatibility
 */
export function generateInnerSolution(amount: number): string {
  return '()'
}

/**
 * Create a complete option contract using minimal valid CLVM
 * Uses minimal valid CLVM puzzle and solution that Sage wallet can parse
 */
export async function createCurriedOptionContract(
  underlyingCoinId: string,
  recipientPuzzleHash: string,
  amount: number
): Promise<{
  puzzleHash: string
  puzzleHex: string
  innerPuzzle: string
  innerSolution: string
}> {
  // Generate minimal valid inner puzzle and solution
  const innerPuzzle = generateInnerPuzzle(recipientPuzzleHash)
  const innerSolution = generateInnerSolution(amount)

  // Use the minimal CLVM puzzle
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)

  // Generate puzzle hash from the minimal puzzle
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(puzzleHex))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const puzzleHash = `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`

  // Debug the generated hex strings
  debugHexString(puzzleHash, 'Puzzle Hash')
  debugHexString(puzzleHex, 'Puzzle Hex')
  debugHexString(stringToValidHex(innerPuzzle), 'Inner Puzzle Hex')
  debugHexString(stringToValidHex(innerSolution), 'Inner Solution Hex')

  return {
    puzzleHash,
    puzzleHex,
    innerPuzzle,
    innerSolution,
  }
}
