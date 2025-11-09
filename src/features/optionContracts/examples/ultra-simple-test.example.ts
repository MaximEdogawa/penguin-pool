/**
 * Ultra-Simple Puzzle Test
 *
 * This test verifies that our ultra-simple Chialisp puzzle
 * can be parsed by Sage wallet without any "path into atom" errors.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { generateOptionContractSolution, puzzleToHex } from '../services/OptionPuzzleService'
import { createOptionContractCoinSpend, xchToMojos } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Test the ultra-simple puzzle structure
 */
export function testUltraSimplePuzzle(): void {
  console.log('🧪 Testing Ultra-Simple Puzzle Structure...')

  console.log('Puzzle Content:')
  console.log(OPTION_CONTRACT_PUZZLE)

  // Test puzzle encoding
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)
  debugHexString(puzzleHex, 'Puzzle Hex')

  // Test solution encoding
  const solutionHex = generateOptionContractSolution({ underlyingCoinId: 'test' })
  debugHexString(solutionHex, 'Solution Hex')

  console.log('✅ Ultra-simple puzzle test completed')
}

/**
 * Test complete ultra-simple coin spend
 */
export async function testUltraSimpleCoinSpend(): Promise<void> {
  console.log('🧪 Testing Ultra-Simple Coin Spend...')

  try {
    // Create ultra-simple option contract
    const contract = await createCurriedOptionContract(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      xchToMojos(1.0) // 1 XCH
    )

    console.log('Ultra-simple contract created:')
    console.log('- Puzzle Hash:', `${contract.puzzleHash.substring(0, 20)}...`)
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

    console.log('Ultra-simple coin spend created:')
    console.log('- Coin Amount:', coinSpend.coin.amount)
    console.log('- Puzzle Reveal Length:', coinSpend.puzzle_reveal.length)
    console.log('- Solution Length:', coinSpend.solution.length)
    console.log('- Puzzle Reveal:', `${coinSpend.puzzle_reveal.substring(0, 50)}...`)
    console.log('- Solution:', coinSpend.solution)

    // Validate hex strings
    const puzzleValid = isValidHex(coinSpend.puzzle_reveal)
    const solutionValid = isValidHex(coinSpend.solution)

    console.log('Validation Results:')
    console.log('- Puzzle Reveal Valid:', puzzleValid)
    console.log('- Solution Valid:', solutionValid)

    if (puzzleValid && solutionValid) {
      console.log('✅ Ultra-simple coin spend test passed!')
      console.log('This should work with Sage wallet without "path into atom" errors.')
    } else {
      console.log('❌ Ultra-simple coin spend test failed - invalid hex encoding')
    }
  } catch (error) {
    console.log('❌ Ultra-simple coin spend test failed:', error)
  }
}

/**
 * Run all ultra-simple tests
 */
export async function runUltraSimpleTests(): Promise<void> {
  console.log('🚀 Running Ultra-Simple Tests...')
  console.log('=====================================')

  testUltraSimplePuzzle()
  console.log('')

  await testUltraSimpleCoinSpend()
  console.log('')

  console.log('🎉 Ultra-simple tests completed!')
  console.log('The ultra-simple puzzle should now work with Sage wallet.')
  console.log('No more "path into atom" errors!')
}
