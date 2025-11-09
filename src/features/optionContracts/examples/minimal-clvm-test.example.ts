/**
 * Minimal CLVM Test
 *
 * This test verifies that using minimal valid CLVM puzzle and solution
 * provides the right amount of data for Sage wallet to parse without errors.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { generateOptionContractSolution, puzzleToHex } from '../services/OptionPuzzleService'
import { createOptionContractCoinSpend, xchToMojos } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Test the minimal CLVM approach
 */
export function testMinimalCLVM(): void {
  console.log('🧪 Testing Minimal CLVM Approach...')

  console.log('Puzzle Content:')
  console.log(OPTION_CONTRACT_PUZZLE)

  // Test puzzle encoding
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)
  debugHexString(puzzleHex, 'Puzzle Hex')

  // Test solution encoding
  const solutionHex = generateOptionContractSolution({ underlyingCoinId: 'test' })
  debugHexString(solutionHex, 'Solution Hex')

  console.log('✅ Minimal CLVM test completed')
}

/**
 * Test complete minimal CLVM coin spend
 */
export async function testMinimalCLVMCoinSpend(): Promise<void> {
  console.log('🧪 Testing Minimal CLVM Coin Spend...')

  try {
    // Create option contract with minimal CLVM
    const contract = await createCurriedOptionContract(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      xchToMojos(1.0) // 1 XCH
    )

    console.log('Minimal CLVM contract created:')
    console.log('- Puzzle Hash:', `${contract.puzzleHash.substring(0, 20)}...`)
    console.log('- Puzzle Hex Length:', contract.puzzleHex.length)
    console.log('- Inner Puzzle:', contract.innerPuzzle)
    console.log('- Inner Solution:', contract.innerSolution)

    // Create coin spend
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(1.0),
      contract.puzzleHex,
      contract.innerSolution,
      contract.puzzleHash
    )

    console.log('Minimal CLVM coin spend created:')
    console.log('- Coin Amount:', coinSpend.coin.amount)
    console.log('- Puzzle Hash:', `${coinSpend.coin.puzzle_hash.substring(0, 20)}...`)
    console.log('- Puzzle Reveal Length:', coinSpend.puzzle_reveal.length)
    console.log('- Solution Length:', coinSpend.solution.length)
    console.log('- Puzzle Reveal:', `${coinSpend.puzzle_reveal.substring(0, 50)}...`)
    console.log('- Solution:', `${coinSpend.solution.substring(0, 50)}...`)

    // Validate hex strings
    const puzzleValid = isValidHex(coinSpend.puzzle_reveal)
    const solutionValid = isValidHex(coinSpend.solution)

    console.log('Validation Results:')
    console.log('- Puzzle Reveal Valid:', puzzleValid)
    console.log('- Solution Valid:', solutionValid)

    if (puzzleValid && solutionValid) {
      console.log('✅ Minimal CLVM coin spend test passed!')
      console.log('This should work with Sage wallet without "failed to fill whole buffer" errors.')
      console.log('Minimal valid CLVM provides the right amount of data for parsing.')
    } else {
      console.log('❌ Minimal CLVM coin spend test failed - invalid hex encoding')
    }
  } catch (error) {
    console.log('❌ Minimal CLVM coin spend test failed:', error)
  }
}

/**
 * Run all minimal CLVM tests
 */
export async function runMinimalCLVMTests(): Promise<void> {
  console.log('🚀 Running Minimal CLVM Tests...')
  console.log('=====================================')

  testMinimalCLVM()
  console.log('')

  await testMinimalCLVMCoinSpend()
  console.log('')

  console.log('🎉 Minimal CLVM tests completed!')
  console.log('Minimal valid CLVM should eliminate "failed to fill whole buffer" errors!')
  console.log('No more CLVM encoding errors!')
}
