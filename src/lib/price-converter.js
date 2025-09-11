// Price Converter Service for USD Conversion
// Integrates with CoinGecko API for real-time cryptocurrency prices

// Cache for prices to avoid excessive API calls
let priceCache = {
  data: {},
  timestamp: null,
  cacheDuration: 60000 // 1 minute cache
};

// Supported tokens and their CoinGecko IDs
const SUPPORTED_TOKENS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin'
};

// Fallback prices in case API fails
const FALLBACK_PRICES = {
  'BTC': 50000,
  'ETH': 3000,
  'USDT': 1,
  'USDC': 1
};

// Get current cryptocurrency prices from CoinGecko API
export const getCurrentPrices = async () => {
  try {
    // Check if we have valid cached prices
    if (priceCache.data && priceCache.timestamp && 
        (Date.now() - priceCache.timestamp) < priceCache.cacheDuration) {
      return priceCache.data;
    }

    // Fetch fresh prices from CoinGecko
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin&vs_currencies=usd&include_24hr_change=true'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform data to our format
    const prices = {
      BTC: {
        usd: data.bitcoin?.usd || FALLBACK_PRICES.BTC,
        usd_24h_change: data.bitcoin?.usd_24h_change || 0
      },
      ETH: {
        usd: data.ethereum?.usd || FALLBACK_PRICES.ETH,
        usd_24h_change: data.ethereum?.usd_24h_change || 0
      },
      USDT: {
        usd: data.tether?.usd || FALLBACK_PRICES.USDT,
        usd_24h_change: data.tether?.usd_24h_change || 0
      },
      USDC: {
        usd: data['usd-coin']?.usd || FALLBACK_PRICES.USDC,
        usd_24h_change: data['usd-coin']?.usd_24h_change || 0
      }
    };

    // Update cache
    priceCache.data = prices;
    priceCache.timestamp = Date.now();

    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Return cached prices or fallback prices
    if (priceCache.data && Object.keys(priceCache.data).length > 0) {
      return priceCache.data;
    }
    
    // Return fallback prices
    return {
      BTC: { usd: FALLBACK_PRICES.BTC, usd_24h_change: 0 },
      ETH: { usd: FALLBACK_PRICES.ETH, usd_24h_change: 0 },
      USDT: { usd: FALLBACK_PRICES.USDT, usd_24h_change: 0 },
      USDC: { usd: FALLBACK_PRICES.USDC, usd_24h_change: 0 }
    };
  }
};

// Convert a specific amount of a token to USD
export const convertToUSD = async (amount, token) => {
  try {
    const prices = await getCurrentPrices();
    const tokenPrice = prices[token]?.usd;
    
    if (!tokenPrice) {
      throw new Error(`Price not available for token: ${token}`);
    }
    
    return parseFloat(amount) * tokenPrice;
  } catch (error) {
    console.error('Error converting to USD:', error);
    
    // Use fallback price as last resort
    const fallbackPrice = FALLBACK_PRICES[token];
    if (fallbackPrice) {
      return parseFloat(amount) * fallbackPrice;
    }
    
    return 0;
  }
};

// Convert USD amount to a specific token
export const convertFromUSD = async (usdAmount, token) => {
  try {
    const prices = await getCurrentPrices();
    const tokenPrice = prices[token]?.usd;
    
    if (!tokenPrice) {
      throw new Error(`Price not available for token: ${token}`);
    }
    
    return parseFloat(usdAmount) / tokenPrice;
  } catch (error) {
    console.error('Error converting from USD:', error);
    
    // Use fallback price as last resort
    const fallbackPrice = FALLBACK_PRICES[token];
    if (fallbackPrice) {
      return parseFloat(usdAmount) / fallbackPrice;
    }
    
    return 0;
  }
};

// Get formatted USD string for display
export const getFormattedUSD = async (amount, token) => {
  try {
    const usdAmount = await convertToUSD(amount, token);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdAmount);
  } catch (error) {
    console.error('Error formatting USD:', error);
    return '$0.00';
  }
};

// Get USD balances for multiple tokens
export const getBalancesInUSD = async (tokenBalances) => {
  try {
    const prices = await getCurrentPrices();
    let total = 0;
    const usdBalances = {};
    
    for (const [token, amount] of Object.entries(tokenBalances)) {
      if (SUPPORTED_TOKENS.hasOwnProperty(token)) {
        const usdValue = parseFloat(amount) * (prices[token]?.usd || FALLBACK_PRICES[token]);
        usdBalances[token] = usdValue;
        total += usdValue;
      }
    }
    
    return {
      ...usdBalances,
      total: total
    };
  } catch (error) {
    console.error('Error calculating USD balances:', error);
    return {
      total: 0
    };
  }
};

// Get 24-hour price change for a token
export const getPriceChange = async (token) => {
  try {
    const prices = await getCurrentPrices();
    return prices[token]?.usd_24h_change || 0;
  } catch (error) {
    console.error('Error getting price change:', error);
    return 0;
  }
};

// Force refresh prices (clear cache and fetch new data)
export const refreshPrices = async () => {
  priceCache.data = {};
  priceCache.timestamp = null;
  return await getCurrentPrices();
};

// Get list of supported tokens
export const getSupportedTokens = () => {
  return Object.keys(SUPPORTED_TOKENS);
};

// Check if a token is supported
export const isTokenSupported = (token) => {
  return SUPPORTED_TOKENS.hasOwnProperty(token);
};
