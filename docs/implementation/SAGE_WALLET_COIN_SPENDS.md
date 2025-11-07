# How to Send Coin Spends to Sage Wallet

## Overview

This document explains how to properly format and send coin spends to Sage wallet using the `CHIP0002_SIGN_COIN_SPENDS` method.

## Sage Wallet API Format

### Request Structure

Sage wallet expects requests in this format:

```typescript
const walletRequest = {
  topic: session.topic.value,
  chainId: session.chainId.value,
  request: {
    method: 'chip0002_signCoinSpends',
    params: {
      fingerprint: session.fingerprint.value,
      walletId: 1,
      coinSpends: [coinSpend],
    },
  },
}
```

### Coin Spend Format

Each coin spend must follow this exact structure:

```typescript
interface CoinSpend {
  coin: {
    parent_coin_info: string // 32-byte hex string
    puzzle_hash: string // 32-byte hex string
    amount: number // Amount in mojos
  }
  puzzle_reveal: string // Hex-encoded Chialisp bytecode
  solution: string // Hex-encoded solution parameters
}
```

## Option Contract Implementation

### Step 1: Create the Coin Spend

```typescript
const coinSpend: CoinSpend = {
  coin: {
    parent_coin_info: '0x0000000000000000000000000000000000000000000000000000000000000000',
    puzzle_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    amount: data.quantity * 1000000, // Convert to mojos
  },
  puzzle_reveal: generateOptionContractPuzzle(data),
  solution: generateOptionContractSolution(data),
}
```

### Step 2: Generate Chialisp Puzzle

```typescript
function generateOptionContractPuzzle(data: CreateOptionContractRequest): string {
  const puzzle = `
    ; Option Contract Puzzle
    (mod (strike_price expiration_block underlying_asset contract_type)
      ; Check if contract has expired
      (if (> (current_block_height) expiration_block)
        ; Contract expired - return to creator
        (list (list CREATE_COIN (puzzle_hash_of_creator) (amount)))
        ; Contract active - check exercise conditions
        (if (= contract_type "call")
          ; Call option logic
          (if (>= (current_price underlying_asset) strike_price)
            ; Option can be exercised
            (list (list CREATE_COIN (puzzle_hash_of_exerciser) (amount)))
            ; Option cannot be exercised yet
            (list (list CREATE_COIN (puzzle_hash_of_creator) (amount)))
          )
          ; Put option logic
          (if (<= (current_price underlying_asset) strike_price)
            ; Option can be exercised
            (list (list CREATE_COIN (puzzle_hash_of_exerciser) (amount)))
            ; Option cannot be exercised yet
            (list (list CREATE_COIN (puzzle_hash_of_creator) (amount)))
          )
        )
      )
    )
  `

  // Convert to hex-encoded bytecode
  return Buffer.from(puzzle).toString('hex')
}
```

### Step 3: Generate Solution

```typescript
function generateOptionContractSolution(data: CreateOptionContractRequest): string {
  const solution = [
    data.strikePrice.toString(),
    Math.floor(new Date(data.expirationDate).getTime() / 1000).toString(),
    data.underlyingAsset, // XCH, CAT asset ID, or NFT
    data.contractType,
  ]

  // Convert to hex-encoded solution
  return Buffer.from(solution.join(' ')).toString('hex')
}
```

### Available Underlying Assets

The underlying asset can be one of:

- **XCH** - Chia native currency
- **CAT Asset ID** - Any available CAT token from the wallet
- **NFT** - NFT collections (for NFT-based options)

### Step 4: Send to Sage Wallet

```typescript
const result = await signCoinSpends(
  {
    walletId: 1,
    coinSpends: [coinSpend],
  },
  signClient,
  session
)

if (!result.success) {
  throw new Error(result.error || 'Failed to sign coin spend')
}

// result.data contains the signed coin spends
const signedCoinSpends = result.data
```

## Important Considerations

### 1. Puzzle Hash Generation

The puzzle hash must be a valid 32-byte hex string. You can generate it using:

```typescript
import { createHash } from 'crypto'

function generatePuzzleHash(puzzle: string): string {
  const hash = createHash('sha256')
  hash.update(Buffer.from(puzzle, 'hex'))
  return '0x' + hash.digest('hex')
}
```

### 2. Amount Conversion

Always convert amounts to mojos (smallest unit):

- 1 XCH = 1,000,000,000,000 mojos
- 1 CAT = varies by token (usually 1000 smallest units)

### 3. Error Handling

Sage wallet may return various errors:

```typescript
if (!result.success) {
  switch (result.error) {
    case 'Invalid puzzle hash':
      // Handle invalid puzzle
      break
    case 'Insufficient funds':
      // Handle insufficient balance
      break
    case 'Invalid solution':
      // Handle invalid solution parameters
      break
    default:
      // Handle other errors
      break
  }
}
```

### 4. Session Management

Ensure the Sage wallet session is active:

```typescript
const activeSessions = signClient.value.session.getAll()
const sessionExists = activeSessions.some(s => s.topic === session.topic.value)

if (!sessionExists) {
  throw new Error('Sage wallet session not found')
}
```

## Complete Example

```typescript
async function createOptionContract(data: CreateOptionContractRequest) {
  // 1. Generate puzzle hash
  const puzzleHash = generatePuzzleHash(generateOptionContractPuzzle(data))

  // 2. Create coin spend
  const coinSpend: CoinSpend = {
    coin: {
      parent_coin_info: '0x0000000000000000000000000000000000000000000000000000000000000000',
      puzzle_hash: puzzleHash,
      amount: data.quantity * 1000000,
    },
    puzzle_reveal: generateOptionContractPuzzle(data),
    solution: generateOptionContractSolution(data),
  }

  // 3. Send to Sage wallet
  const result = await signCoinSpends({ walletId: 1, coinSpends: [coinSpend] }, signClient, session)

  // 4. Handle response
  if (!result.success) {
    throw new Error(`Sage wallet error: ${result.error}`)
  }

  return result.data
}
```

## Testing

Before deploying to mainnet:

1. **Test on Chia Testnet** - Use testnet XCH for testing
2. **Validate Puzzle Logic** - Ensure Chialisp logic is correct
3. **Test Edge Cases** - Test expiration, exercise conditions
4. **Monitor Transactions** - Check transaction status on blockchain

## Resources

- [Sage Wallet Repository](https://github.com/xch-dev/sage)
- [Chialisp Documentation](https://chialisp.com/)
- [CHIP-0002 Specification](https://github.com/Chia-Network/chips/blob/main/CHIPs/chip-0002.md)
- [Chia Developer Guides](https://xch.dev/)
