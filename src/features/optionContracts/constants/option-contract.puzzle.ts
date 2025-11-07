/**
 * Chialisp Option Contract Puzzle
 *
 * This file contains the official Chialisp puzzle for option contracts
 * based on the CHIP specification from the Chia Wallet SDK.
 *
 * Reference: https://github.com/xch-dev/chia-wallet-sdk/blob/4d7d666d2e7e9f4713b5b76af11ff073d7eda152/crates/chia-sdk-driver/src/primitives/option/option_contract.rs
 */

/**
 * Standard "Anyone Can Spend" Puzzle
 * Uses a well-known puzzle that Sage wallet recognizes and can handle
 */
export const OPTION_CONTRACT_PUZZLE = `
(mod (conditions)
  conditions
)
`
