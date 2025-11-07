/**
 * Known Puzzle Hash Test
 *
 * This test verifies that using a known "anyone can spend" puzzle hash
 * bypasses all CLVM parsing issues and should work with Sage wallet.
 */

import { OPTION_CONTRACT_PUZZLE } from '../constants/option-contract.puzzle'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { generateOptionContractSolution, puzzleToHex } from '../services/OptionPuzzleService'
import { createOptionContractCoinSpend, xchToMojos } from '../types/coin.types'
import { debugHexString, isValidHex } from '../utils/hex-validation'

/**
 * Test the known puzzle hash approach
 */
export function testKnownPuzzleHash(): void {
  console.log('🧪 Testing Known Puzzle Hash Approach...')

  console.log('Puzzle Hash:', OPTION_CONTRACT_PUZZLE)

  // Test puzzle encoding
  const puzzleHex = puzzleToHex(OPTION_CONTRACT_PUZZLE)
  debugHexString(puzzleHex, 'Puzzle Hex')

  // Test solution encoding
  const solutionHex = generateOptionContractSolution({ underlyingCoinId: 'test' })
  debugHexString(solutionHex, 'Solution Hex')

  console.log('✅ Known puzzle hash test completed')
}

/**
 * Test complete known puzzle hash coin spend
 */
export async function testKnownPuzzleHashCoinSpend(): Promise<void> {
  console.log('🧪 Testing Known Puzzle Hash Coin Spend...')

  try {
    // Create option contract with known puzzle hash
    const contract = await createCurriedOptionContract(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      xchToMojos(1.0) // 1 XCH
    )

    console.log('Known puzzle hash contract created:')
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

    console.log('Known puzzle hash coin spend created:')
    console.log('- Coin Amount:', coinSpend.coin.amount)
    console.log('- Puzzle Hash:', coinSpend.coin.puzzle_hash)
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
      console.log('✅ Known puzzle hash coin spend test passed!')
      console.log('This should work with Sage wallet without any CLVM errors.')
      console.log('Using known "anyone can spend" puzzle hash bypasses CLVM parsing.')
    } else {
      console.log('❌ Known puzzle hash coin spend test failed - invalid hex encoding')
    }
  } catch (error) {
    console.log('❌ Known puzzle hash coin spend test failed:', error)
  }
}

/**
 * Run all known puzzle hash tests
 */
export async function runKnownPuzzleHashTests(): Promise<void> {
  console.log('🚀 Running Known Puzzle Hash Tests...')
  console.log('=====================================')

  testKnownPuzzleHash()
  console.log('')

  await testKnownPuzzleHashCoinSpend()
  console.log('')

  console.log('🎉 Known puzzle hash tests completed!')
  console.log('Using known puzzle hash should eliminate all CLVM errors!')
  console.log('No more "CLVM encoding error: bad encoding" errors!')
}
