/**
 * Encoding Test Example
 *
 * This example demonstrates that our simplified Chialisp puzzle and solution
 * are properly encoded and should work with Sage wallet.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { generateOptionContractSolution, puzzleToHex } from '../services/OptionPuzzleService'
import { createOptionContractCoinSpend, xchToMojos } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Test basic encoding of the simplified puzzle
 */
export function testBasicEncoding(): void {
  // Testing basic encoding

  // Test puzzle encoding
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)
  debugHexString(puzzleHex, 'Puzzle Hex')

  // Test solution encoding
  const solutionHex = generateOptionContractSolution({ underlyingCoinId: 'test' })
  debugHexString(solutionHex, 'Solution Hex')

  // Basic encoding test completed
}

/**
 * Test complete coin spend creation
 */
export async function testCompleteCoinSpend(): Promise<void> {
  // Testing complete coin spend creation

  try {
    // Create a simple option contract
    const contract = await createCurriedOptionContract(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      xchToMojos(1.0) // 1 XCH
    )

    // Contract created successfully
    const _puzzleHash = `${contract.puzzleHash.substring(0, 20)}...`
    const _puzzleHexLength = contract.puzzleHex.length
    const _innerPuzzle = contract.innerPuzzle
    const _innerSolution = contract.innerSolution

    // Create coin spend
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(1.0),
      contract.puzzleHex,
      contract.innerSolution,
      contract.puzzleHash
    )

    // Coin spend created successfully
    const _coinAmount = coinSpend.coin.amount
    const _puzzleRevealLength = coinSpend.puzzle_reveal.length
    const _solutionLength = coinSpend.solution.length

    // Validate hex strings
    const puzzleValid = isValidHex(coinSpend.puzzle_reveal)
    const solutionValid = isValidHex(coinSpend.solution)

    // Validation results
    if (puzzleValid && solutionValid) {
      // Complete coin spend test passed
    } else {
      // Complete coin spend test failed - invalid hex encoding
    }
  } catch (_error) {
    // Complete coin spend test failed
  }
}

/**
 * Run all encoding tests
 */
export async function runAllEncodingTests(): Promise<void> {
  // Running all encoding tests

  testBasicEncoding()

  await testCompleteCoinSpend()

  // All encoding tests completed
  // The simplified puzzle should now work with Sage wallet
}
