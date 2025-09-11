// Debug utilities for wallet connection troubleshooting

import { DEBUG_CONFIG } from './config.js';

export const debugLog = (message, data = null) => {
  if (DEBUG_CONFIG.ENABLE_LOGS) {
    console.log(`[WeWallet Debug] ${message}`, data || '');
  }
};

export const debugError = (message, error = null) => {
  if (DEBUG_CONFIG.ENABLE_LOGS) {
    console.error(`[WeWallet Error] ${message}`, error || '');
  }
};

export const debugWalletState = () => {
  if (typeof window === 'undefined') {
    debugLog('Running on server side');
    return;
  }

  debugLog('Environment check:', {
    hasEthereum: !!window.ethereum,
    hasWeb3: !!window.web3,
    userAgent: navigator.userAgent,
    domain: window.location.origin,
    protocol: window.location.protocol
  });

  if (window.ethereum) {
    debugLog('Ethereum provider details:', {
      isMetaMask: window.ethereum.isMetaMask,
      isCoinbaseWallet: window.ethereum.isCoinbaseWallet,
      isBraveWallet: window.ethereum.isBraveWallet,
      isTrust: window.ethereum.isTrust,
      isPhantom: window.ethereum.isPhantom,
      isBinanceWallet: window.ethereum.isBinanceWallet,
      chainId: window.ethereum.chainId,
      selectedAddress: window.ethereum.selectedAddress
    });
  }
};

export const checkEnvironmentVariables = () => {
  const envVars = {
    PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
    BTC_ADDRESS: process.env.NEXT_PUBLIC_BTC_DEPOSIT_ADDRESS,
    USDT_ADDRESS: process.env.NEXT_PUBLIC_USDT_DEPOSIT_ADDRESS,
    ETH_ADDRESS: process.env.NEXT_PUBLIC_ETH_DEPOSIT_ADDRESS,
    NODE_ENV: process.env.NODE_ENV
  };

  debugLog('Environment variables check:', envVars);
  
  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => !value && key !== 'NODE_ENV')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    debugError('Missing environment variables:', missingVars);
  }

  return envVars;
};
