/**
 * Tests for Custom Coin Spend Creation
 *
 * This file contains tests to verify that custom coin spends can be created
 * properly in the browser environment.
 */

import { describe, expect, it } from 'vitest'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'
import { isValidHex, stringToValidHex } from '../utils/hex-validation'

describe('Custom Coin Spend Creation', () => {
  it('should create a valid coin spend with proper structure', () => {
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(1.0), // 1 XCH
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // puzzle hex
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // solution hex
      '0x1111111111111111111111111111111111111111111111111111111111111111' // puzzle hash
    )

    expect(coinSpend).toBeDefined()
    expect(coinSpend.coin).toBeDefined()
    expect(coinSpend.coin.parent_coin_info).toBeDefined()
    expect(coinSpend.coin.puzzle_hash).toBeDefined()
    expect(coinSpend.coin.amount).toBe(xchToMojos(1.0))
    expect(coinSpend.puzzle_reveal).toBeDefined()
    expect(coinSpend.solution).toBeDefined()
  })

  it('should validate hex strings correctly', () => {
    const validHex = '0x1234567890abcdef'
    const invalidHex = '0x1234567890abcde' // odd number of digits

    expect(isValidHex(validHex)).toBe(true)
    expect(isValidHex(invalidHex)).toBe(false)
  })

  it('should fix hex strings with odd number of digits', () => {
    const oddHex = '0x1234567890abcde'
    const fixedHex = stringToValidHex('test string')

    expect(fixedHex.length % 2).toBe(0)
    expect(isValidHex(fixedHex)).toBe(true)
  })

  it('should create curried option contract with valid hex', async () => {
    const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    const curriedContract = await createCurriedOptionContract(
      underlyingCoinId,
      recipientPuzzleHash,
      xchToMojos(1.0)
    )

    expect(curriedContract).toBeDefined()
    expect(curriedContract.puzzleHash).toBeDefined()
    expect(curriedContract.puzzleHex).toBeDefined()
    expect(curriedContract.innerPuzzle).toBeDefined()
    expect(curriedContract.innerSolution).toBeDefined()

    // Validate all hex strings
    expect(isValidHex(curriedContract.puzzleHash)).toBe(true)
    expect(isValidHex(curriedContract.puzzleHex)).toBe(true)
    expect(isValidHex(stringToValidHex(curriedContract.innerPuzzle))).toBe(true)
    expect(isValidHex(stringToValidHex(curriedContract.innerSolution))).toBe(true)
  })

  it('should convert XCH to mojos correctly', () => {
    expect(xchToMojos(1.0)).toBe(1_000_000_000_000)
    expect(xchToMojos(0.5)).toBe(500_000_000_000)
    expect(xchToMojos(0.001)).toBe(1_000_000_000)
  })

  it('should create multiple coin spends with different parameters', () => {
    const amounts = [0.5, 1.0, 1.5]
    const coinSpends: CoinSpend[] = []

    amounts.forEach((amount, index) => {
      const coinSpend = createOptionContractCoinSpend(
        xchToMojos(amount),
        `0x${index.toString().repeat(64)}`, // Different puzzle hex for each
        `0x${(index + 1).toString().repeat(64)}`, // Different solution hex for each
        `0x${(index + 2).toString().repeat(64)}` // Different puzzle hash for each
      )
      coinSpends.push(coinSpend)
    })

    expect(coinSpends).toHaveLength(3)
    coinSpends.forEach((coinSpend, index) => {
      expect(coinSpend.coin.amount).toBe(xchToMojos(amounts[index]))
    })
  })
})
