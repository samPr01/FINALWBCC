// Environment variables are loaded automatically by Next.js
// No need to manually load dotenv

// Receiving Addresses for Deposits
export const RECEIVING_ADDRESSES = {
  BTC: process.env.NEXT_PUBLIC_BTC_ADDRESS,
  USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS,
  ETH: process.env.NEXT_PUBLIC_ETH_ADDRESS,
};

// WalletConnect Configuration
export const WALLETCONNECT_CONFIG = {
  PROJECT_ID: process.env.PROJECT_ID
};

// Token Contract Addresses
export const TOKEN_CONTRACTS = {
  USDT: process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  USDC: process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
  WETH: process.env.NEXT_PUBLIC_WETH_CONTRACT_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
};

// API Endpoints
export const API_ENDPOINTS = {
  COINGECKO: process.env.NEXT_PUBLIC_COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
  BLOCKCYPHER: process.env.NEXT_PUBLIC_BLOCKCYPHER_API_URL || 'https://api.blockcypher.com/v1'
};

// Network Configuration
export const NETWORK_CONFIG = {
  ETHEREUM_NETWORK: process.env.NEXT_PUBLIC_ETHEREUM_NETWORK || 'mainnet',
  BITCOIN_NETWORK: process.env.NEXT_PUBLIC_BITCOIN_NETWORK || 'mainnet'
};

// Debug configuration
export const DEBUG_CONFIG = {
  ENABLE_LOGS: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true'
};
