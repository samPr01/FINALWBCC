// Bitcoin API utilities using BlockCypher
const BLOCKCYPHER_API_BASE = 'https://api.blockcypher.com/v1/btc/main';

/**
 * Fetch Bitcoin balance for a given address
 * @param {string} address - Bitcoin address
 * @returns {Promise<number>} - Balance in BTC
 */
export async function fetchBTCBalance(address) {
  try {
    const response = await fetch(`${BLOCKCYPHER_API_BASE}/addrs/${address}/balance`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
    const balanceSatoshis = data.balance || 0;
    const balanceBTC = balanceSatoshis / 100000000;
    
    return balanceBTC;
  } catch (error) {
    console.error('Error fetching BTC balance:', error);
    throw new Error(`Failed to fetch BTC balance: ${error.message}`);
  }
}

/**
 * Get Bitcoin address information including balance and transactions
 * @param {string} address - Bitcoin address
 * @returns {Promise<Object>} - Address information
 */
export async function getBTCAddressInfo(address) {
  try {
    const response = await fetch(`${BLOCKCYPHER_API_BASE}/addrs/${address}?includeScript=true`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      address: data.address,
      balance: (data.balance / 100000000).toFixed(8),
      totalReceived: (data.total_received / 100000000).toFixed(8),
      totalSent: (data.total_sent / 100000000).toFixed(8),
      txCount: data.n_tx,
      transactions: data.txrefs || []
    };
  } catch (error) {
    console.error('Error fetching BTC address info:', error);
    throw new Error(`Failed to fetch BTC address info: ${error.message}`);
  }
}

/**
 * Create a new Bitcoin address
 * @returns {Promise<Object>} - New address information
 */
export async function createBTCAddress() {
  try {
    const response = await fetch(`${BLOCKCYPHER_API_BASE}/addrs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      address: data.address,
      private: data.private,
      public: data.public,
      wif: data.wif
    };
  } catch (error) {
    console.error('Error creating BTC address:', error);
    throw new Error(`Failed to create BTC address: ${error.message}`);
  }
}

/**
 * Get current Bitcoin price in USD
 * @returns {Promise<number>} - BTC price in USD
 */
export async function getBTCPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    throw new Error(`Failed to fetch BTC price: ${error.message}`);
  }
}

/**
 * Validate Bitcoin address format
 * @param {string} address - Bitcoin address to validate
 * @returns {boolean} - True if valid format
 */
export function isValidBTCAddress(address) {
  // Basic Bitcoin address validation (starts with 1, 3, or bc1)
  const btcAddressRegex = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
  return btcAddressRegex.test(address);
}

/**
 * Convert BTC to satoshis
 * @param {number} btcAmount - Amount in BTC
 * @returns {number} - Amount in satoshis
 */
export function btcToSatoshis(btcAmount) {
  return Math.floor(btcAmount * 100000000);
}

/**
 * Convert satoshis to BTC
 * @param {number} satoshis - Amount in satoshis
 * @returns {number} - Amount in BTC
 */
export function satoshisToBTC(satoshis) {
  return satoshis / 100000000;
}
