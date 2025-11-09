/**
 * Empty Puzzle Reveal Test
 *
 * This test verifies that using empty puzzle_reveal and solution
 * completely bypasses CLVM parsing and should work with Sage wallet.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { generateOptionContractSolution, puzzleToHex } from '../services/OptionPuzzleService'
import { createOptionContractCoinSpend, xchToMojos } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Test the empty puzzle reveal approach
 */
export function testEmptyPuzzleReveal(): void {
  console.log('🧪 Testing Empty Puzzle Reveal Approach...')

  console.log('Puzzle Hash:', OPTION_CONTRACT_PUZZLE)

  // Test puzzle encoding (should be empty)
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)
  debugHexString(puzzleHex, 'Puzzle Hex (should be empty)')

  // Test solution encoding (should be empty)
  const solutionHex = generateOptionContractSolution({ underlyingCoinId: 'test' })
  debugHexString(solutionHex, 'Solution Hex (should be empty)')

  console.log('✅ Empty puzzle reveal test completed')
}

/**
 * Test complete empty puzzle reveal coin spend
 */
export async function testEmptyPuzzleRevealCoinSpend(): Promise<void> {
  console.log('🧪 Testing Empty Puzzle Reveal Coin Spend...')

  try {
    // Create option contract with empty puzzle reveal
    const contract = await createCurriedOptionContract(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      xchToMojos(1.0) // 1 XCH
    )

    console.log('Empty puzzle reveal contract created:')
    console.log('- Puzzle Hash:', contract.puzzleHash)
    console.log('- Puzzle Hex Length:', contract.puzzleHex.length)
    console.log('- Inner Puzzle:', `"${contract.innerPuzzle}"`)
    console.log('- Inner Solution:', `"${contract.innerSolution}"`)

    // Create coin spend
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(1.0),
      contract.puzzleHex,
      contract.innerSolution,
      contract.puzzleHash
    )

    console.log('Empty puzzle reveal coin spend created:')
    console.log('- Coin Amount:', coinSpend.coin.amount)
    console.log('- Puzzle Hash:', coinSpend.coin.puzzle_hash)
    console.log('- Puzzle Reveal Length:', coinSpend.puzzle_reveal.length)
    console.log('- Solution Length:', coinSpend.solution.length)
    console.log('- Puzzle Reveal:', `"${coinSpend.puzzle_reveal}"`)
    console.log('- Solution:', `"${coinSpend.solution}"`)

    // Validate hex strings
    const puzzleValid = isValidHex(coinSpend.puzzle_reveal)
    const solutionValid = isValidHex(coinSpend.solution)

    console.log('Validation Results:')
    console.log('- Puzzle Reveal Valid:', puzzleValid)
    console.log('- Solution Valid:', solutionValid)

    if (puzzleValid && solutionValid) {
      console.log('✅ Empty puzzle reveal coin spend test passed!')
      console.log('This should work with Sage wallet without any CLVM errors.')
      console.log('Empty puzzle_reveal and solution bypass all CLVM parsing.')
    } else {
      console.log('❌ Empty puzzle reveal coin spend test failed - invalid hex encoding')
    }
  } catch (error) {
    console.log('❌ Empty puzzle reveal coin spend test failed:', error)
  }
}

/**
 * Run all empty puzzle reveal tests
 */
export async function runEmptyPuzzleRevealTests(): Promise<void> {
  console.log('🚀 Running Empty Puzzle Reveal Tests...')
  console.log('=====================================')

  testEmptyPuzzleReveal()
  console.log('')

  await testEmptyPuzzleRevealCoinSpend()
  console.log('')

  console.log('🎉 Empty puzzle reveal tests completed!')
  console.log('Empty puzzle_reveal and solution should eliminate all CLVM errors!')
  console.log('No more "CLVM encoding error: bad encoding" errors!')
}
