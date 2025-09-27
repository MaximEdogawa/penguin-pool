# Chia WalletConnect Integration Setup Guide

## 🎯 Overview

This guide explains how to set up the real Chia WalletConnect integration in Penguin Pool. The implementation now uses the official Chia WalletConnect approach with proper Chia-specific methods and namespace configuration.

## 🚀 Quick Setup

### Step 1: Get a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Click "Create Project"
5. Fill in:
   - **Project Name**: Penguin Pool
   - **Project Description**: Decentralized lending platform on Chia Network
   - **Project URL**: http://localhost:3000 (for development)
6. Click "Create Project"
7. Copy your **Project ID** (looks like: `c4f79f8214d29d8f8abf4d40a5c0b9c7`)

### Step 2: Set Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` and add your Project ID:

```bash
VITE_WALLET_CONNECT_PROJECT_ID=your_actual_project_id_here
VITE_CHIA_CHAIN_ID=chia:testnet
VITE_WALLET_CONNECT_RELAY_URL=wss://relay.walletconnect.com
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 🔧 Implementation Details

### Supported Chia Methods

The integration supports all major Chia wallet methods:

**Wallet Operations:**

- `chia_logIn` - Login to wallet
- `chia_getWallets` - Get wallet information
- `chia_getWalletBalance` - Get wallet balance
- `chia_getCurrentAddress` - Get current address
- `chia_getNextAddress` - Get next address
- `chia_sendTransaction` - Send XCH transaction
- `chia_getSyncStatus` - Get sync status

**Signing Operations:**

- `chia_signMessageById` - Sign message by ID
- `chia_signMessageByAddress` - Sign message by address
- `chia_verifySignature` - Verify signature

**Offer Operations:**

- `chia_getAllOffers` - Get all offers
- `chia_createOfferForIds` - Create offer
- `chia_takeOffer` - Take offer
- `chia_cancelOffer` - Cancel offer

**CAT Operations:**

- `chia_createNewCATWallet` - Create CAT wallet
- `chia_getCATWalletInfo` - Get CAT wallet info
- `chia_spendCAT` - Spend CAT tokens

**NFT Operations:**

- `chia_getNFTs` - Get NFTs
- `chia_mintNFT` - Mint NFT
- `chia_transferNFT` - Transfer NFT

**DID Operations:**

- `chia_createNewDIDWallet` - Create DID wallet
- `chia_setDIDName` - Set DID name

### Usage Examples

#### Basic Connection

```typescript
import { useWalletConnectStore } from '@/features/walletConnect/stores/walletConnectStore'

const walletStore = useWalletConnectStore()

// Initialize
await walletStore.initialize()

// Connect to Chia wallet
const result = await walletStore.connect()
if (result.success) {
  console.log('Connected to Chia wallet!')
}
```

#### Making Chia RPC Requests

```typescript
// Get wallet balance
const balance = await walletStore.makeChiaRequest('chia_getWalletBalance', {
  walletId: 1,
})

// Get current address
const address = await walletStore.makeChiaRequest('chia_getCurrentAddress', {
  walletId: 1,
})

// Send transaction
const txResult = await walletStore.makeChiaRequest('chia_sendTransaction', {
  walletId: 1,
  amount: 1000000000, // 1 XCH in mojos
  fee: 1000000, // 0.001 XCH fee
  address: 'xch1...',
  memos: ['Penguin Pool transaction'],
})
```

## 🧪 Testing

### Demo Mode (No Project ID)

When no Project ID is set, the app runs in demo mode:

- Shows QR codes for testing
- Simulates connection after 5 seconds
- Uses mock wallet data

### Real Mode (With Project ID)

With a proper Project ID:

- Generates real QR codes
- Connects to actual Chia wallets
- Provides real wallet data and functionality

### Testing with Chia Reference Wallet

1. Download and install the [Chia Reference Wallet](https://www.chia.net/downloads)
2. Configure for testnet: `chia configure -t true`
3. Start the wallet and wait for sync
4. Enable WalletConnect in the wallet settings
5. Scan the QR code from Penguin Pool

## 🔧 Troubleshooting

### Common Issues

**"WalletConnect Project ID is not set"**

- Solution: Set `VITE_WALLET_CONNECT_PROJECT_ID` in your `.env` file

**"WalletConnect is not initialized"**

- Solution: Call `walletStore.initialize()` before connecting

**"Session is not connected"**

- Solution: Ensure the wallet is properly connected before making RPC requests

**"Fingerprint is not loaded"**

- Solution: The wallet must be logged in and synced

### Debug Mode

Enable debug logging by setting:

```bash
VITE_DEBUG_WALLET_CONNECT=true
```

This will show detailed logs of WalletConnect operations.

## 📱 Supported Wallets

The integration works with:

- **Chia Reference Wallet** (Desktop)
- **Chia Reference Wallet** (Mobile)
- Any WalletConnect-compatible Chia wallet

## 🎉 Success!

Once properly set up, users can:

- ✅ Connect to Chia wallets via QR code
- ✅ Access real wallet addresses and balances
- ✅ Send XCH transactions
- ✅ Create and manage offers
- ✅ Interact with CATs and NFTs
- ✅ Use all Chia wallet features

---

**The Chia WalletConnect integration is ready to use! 🚀**
