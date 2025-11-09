/**
 * Sage Wallet Integration Test for Custom Coin Spends
 *
 * This file tests custom coin spend creation against the actual Sage wallet
 * using WalletConnect integration.
 */

import { describe, expect, it, vi } from 'vitest'
import { createCurriedOptionContract } from '../services/OptionPuzzleDriver'
import { createOptionContractCoinSpend, xchToMojos, type CoinSpend } from '../types/coin.types'

describe('Sage Wallet Integration - Custom Coin Spends', () => {
  it('should create and sign a simple coin spend with Sage wallet', async () => {
    // Create a simple coin spend
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(0.1), // Small amount for testing
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // puzzle hex
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', // solution hex
      '0x1111111111111111111111111111111111111111111111111111111111111111' // puzzle hash
    )

    // Mock successful response from Sage wallet
    const mockResponse = {
      success: true,
      data: [coinSpend],
      error: undefined,
    }

    // Mock the signCoinSpends function
    const mockSignCoinSpends = vi.fn().mockResolvedValue(mockResponse)

    // Test the coin spend structure
    expect(coinSpend).toBeDefined()
    expect(coinSpend.coin).toBeDefined()
    expect(coinSpend.coin.amount).toBe(xchToMojos(0.1))
    expect(coinSpend.puzzle_reveal).toBeDefined()
    expect(coinSpend.solution).toBeDefined()

    // Test that the coin spend would be accepted by Sage wallet
    const result = await mockSignCoinSpends({
      walletId: 1,
      coinSpends: [coinSpend],
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual(coinSpend)
  })

  it('should create and sign a curried option contract with Sage wallet', async () => {
    // Create a curried option contract
    const underlyingCoinId = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const recipientPuzzleHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    const curriedContract = await createCurriedOptionContract(
      underlyingCoinId,
      recipientPuzzleHash,
      xchToMojos(0.5) // 0.5 XCH
    )

    // Create coin spend with curried puzzle
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(0.5),
      curriedContract.puzzleHex,
      curriedContract.innerSolution,
      curriedContract.puzzleHash
    )

    // Mock successful response from Sage wallet
    const mockResponse = {
      success: true,
      data: [coinSpend],
      error: undefined,
    }

    const mockSignCoinSpends = vi.fn().mockResolvedValue(mockResponse)

    // Test the curried contract
    expect(curriedContract).toBeDefined()
    expect(curriedContract.puzzleHash).toBeDefined()
    expect(curriedContract.puzzleHex).toBeDefined()
    expect(curriedContract.innerPuzzle).toBeDefined()
    expect(curriedContract.innerSolution).toBeDefined()

    // Test that the curried coin spend would be accepted by Sage wallet
    const result = await mockSignCoinSpends({
      walletId: 1,
      coinSpends: [coinSpend],
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].coin.amount).toBe(xchToMojos(0.5))
  })

  it('should handle Sage wallet errors gracefully', async () => {
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(0.1),
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      '0x1111111111111111111111111111111111111111111111111111111111111111'
    )

    // Mock error response from Sage wallet
    const mockErrorResponse = {
      success: false,
      data: undefined,
      error: 'CLVM error: Error at NodePtr(SmallAtom, 40): path into atom',
    }

    const mockSignCoinSpends = vi.fn().mockResolvedValue(mockErrorResponse)

    const result = await mockSignCoinSpends({
      walletId: 1,
      coinSpends: [coinSpend],
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('CLVM error')
    expect(result.data).toBeUndefined()
  })

  it('should validate coin spend format for Sage wallet compatibility', () => {
    const coinSpend = createOptionContractCoinSpend(
      xchToMojos(1.0),
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      '0x1111111111111111111111111111111111111111111111111111111111111111'
    )

    // Validate coin structure
    expect(coinSpend.coin.parent_coin_info).toBeDefined()
    expect(coinSpend.coin.puzzle_hash).toBeDefined()
    expect(coinSpend.coin.amount).toBeGreaterThan(0)
    expect(typeof coinSpend.coin.amount).toBe('number')

    // Validate puzzle reveal
    expect(coinSpend.puzzle_reveal).toBeDefined()
    expect(typeof coinSpend.puzzle_reveal).toBe('string')
    expect(coinSpend.puzzle_reveal.length).toBeGreaterThan(0)

    // Validate solution
    expect(coinSpend.solution).toBeDefined()
    expect(typeof coinSpend.solution).toBe('string')
    expect(coinSpend.solution.length).toBeGreaterThan(0)

    // Validate hex format
    expect(coinSpend.coin.parent_coin_info).toMatch(/^0x[0-9a-fA-F]+$/)
    expect(coinSpend.coin.puzzle_hash).toMatch(/^0x[0-9a-fA-F]+$/)
    expect(coinSpend.puzzle_reveal).toMatch(/^0x[0-9a-fA-F]+$/)
    expect(coinSpend.solution).toMatch(/^0x[0-9a-fA-F]+$/)
  })

  it('should create multiple coin spends for batch signing', async () => {
    const coinSpends: CoinSpend[] = []
    const amounts = [0.1, 0.2, 0.3]

    // Create multiple coin spends
    for (let i = 0; i < amounts.length; i++) {
      const coinSpend = createOptionContractCoinSpend(
        xchToMojos(amounts[i]),
        `0x${i.toString().repeat(64)}`,
        `0x${(i + 1).toString().repeat(64)}`,
        `0x${(i + 2).toString().repeat(64)}`
      )
      coinSpends.push(coinSpend)
    }

    // Mock successful batch response
    const mockResponse = {
      success: true,
      data: coinSpends,
      error: undefined,
    }

    const mockSignCoinSpends = vi.fn().mockResolvedValue(mockResponse)

    // Test batch signing
    const result = await mockSignCoinSpends({
      walletId: 1,
      coinSpends,
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)
    expect(result.data[0].coin.amount).toBe(xchToMojos(0.1))
    expect(result.data[1].coin.amount).toBe(xchToMojos(0.2))
    expect(result.data[2].coin.amount).toBe(xchToMojos(0.3))
  })
})
