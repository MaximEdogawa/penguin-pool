# Wallet Connect Setup Guide

## 🎯 Current Status: DEMO MODE WORKING

The Wallet Connect integration is currently working in **demo mode**. You can see QR codes and test the connection flow, but it won't connect to real wallets until you set up a Project ID.

## 🚀 Quick Setup (5 minutes)

### Step 1: Get a Wallet Connect Project ID

1. Go to [Wallet Connect Cloud](https://cloud.walletconnect.com)
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Click "Create Project"
5. Fill in:
   - **Project Name**: Penguin Pool
   - **Project Description**: Decentralized lending platform
   - **Project URL**: http://localhost:3000 (for development)
6. Click "Create Project"
7. Copy your **Project ID** (looks like: `c4f79f8214d29d8f8abf4d40a5c0b9c7`)

### Step 2: Set Environment Variable

Create a `.env` file in your project root:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` and add your Project ID:

```bash
VITE_WALLET_CONNECT_PROJECT_ID=your_actual_project_id_here
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## 🧪 Testing

### Demo Mode (Current)

- Click "Wallet Connect" → Modal opens
- Click "Wallet Connect" in modal → QR code appears
- Wait 5 seconds → Demo connection completes
- You're logged in with demo wallet

### Real Mode (After Project ID)

- Click "Wallet Connect" → Modal opens
- Click "Wallet Connect" in modal → Real QR code appears
- Scan with wallet app → Real connection established
- You're logged in with real wallet

## 🔧 Troubleshooting

### "Demo Mode" message appears

- **Solution**: Set `VITE_WALLET_CONNECT_PROJECT_ID` in your `.env` file

### QR code doesn't appear

- **Solution**: Check browser console for errors
- **Solution**: Ensure you clicked "Wallet Connect" in the modal

### Connection fails

- **Solution**: Check your Project ID is correct
- **Solution**: Ensure you have internet connection
- **Solution**: Try with a different wallet app

## 📱 Supported Wallets

Once you have a Project ID, these wallets will work:

- MetaMask
- Trust Wallet
- Rainbow Wallet
- Coinbase Wallet
- Any Wallet Connect compatible wallet

## 🎉 Success!

Once set up, users can:

- ✅ Scan QR codes with mobile wallets
- ✅ Connect desktop wallets
- ✅ Have persistent sessions
- ✅ Get real wallet addresses
- ✅ Use all wallet features

---

**The Wallet Connect integration is ready to use! 🚀**
