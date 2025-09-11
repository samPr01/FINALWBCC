# WalletConnect Setup Guide

## Getting Your Own Project ID

The current implementation uses a demo project ID. For production use, you should get your own free project ID:

1. **Visit WalletConnect Cloud**: Go to https://cloud.walletconnect.com/
2. **Sign Up/Login**: Create an account or log in
3. **Create Project**: Click "Create New Project"
4. **Get Project ID**: Copy your project ID
5. **Update Configuration**: Replace the project ID in `src/lib/walletconnect-config.js`

## Current Configuration

The demo configuration in `src/lib/walletconnect-config.js`:

```javascript
export const WALLETCONNECT_CONFIG = {
  projectId: 'c4f79cc821944d9680842e34466bfbd9', // Replace with your own
  metadata: {
    name: 'WalletBase',
    description: 'Decentralized Trading Platform',
    url: 'https://wewallet.vercel.app',
    icons: ['https://wewallet.vercel.app/favicon.ico']
  },
  chains: [1], // Ethereum Mainnet
  rpcMap: {
    1: 'https://ethereum.publicnode.com'
  }
};
```

## Features

✅ **QR Code Connection**: Mobile wallets can connect via QR code
✅ **Multiple Wallet Support**: Works with any WalletConnect-compatible wallet
✅ **Event Handling**: Proper disconnect and account change handling
✅ **Error Handling**: User-friendly error messages

## Supported Wallets

- **Mobile Wallets**: MetaMask Mobile, Trust Wallet, Rainbow, etc.
- **Hardware Wallets**: Ledger, Trezor (via mobile apps)
- **Any WalletConnect v2 compatible wallet**

## Usage

1. Click "Connect Wallet" on the home page
2. Select "WalletConnect" from the wallet options
3. Scan the QR code with your mobile wallet
4. Approve the connection in your wallet

## Troubleshooting

- **QR Code Not Showing**: Check browser console for errors
- **Connection Fails**: Ensure your mobile wallet supports WalletConnect v2
- **Project ID Issues**: Verify your project ID is correct and active
