import { NextResponse } from 'next/server';

// GET - Fetch current cryptocurrency prices
export async function GET() {
  try {
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
        usd: data.bitcoin?.usd || 0,
        usd_24h_change: data.bitcoin?.usd_24h_change || 0
      },
      ETH: {
        usd: data.ethereum?.usd || 0,
        usd_24h_change: data.ethereum?.usd_24h_change || 0
      },
      USDT: {
        usd: data.tether?.usd || 0,
        usd_24h_change: data.tether?.usd_24h_change || 0
      },
      USDC: {
        usd: data['usd-coin']?.usd || 0,
        usd_24h_change: data['usd-coin']?.usd_24h_change || 0
      }
    };
    
    return NextResponse.json({
      success: true,
      prices: prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Return fallback prices if API fails
    const fallbackPrices = {
      BTC: { usd: 50000, usd_24h_change: 0 },
      ETH: { usd: 3000, usd_24h_change: 0 },
      USDT: { usd: 1, usd_24h_change: 0 },
      USDC: { usd: 1, usd_24h_change: 0 }
    };
    
    return NextResponse.json({
      success: false,
      prices: fallbackPrices,
      timestamp: new Date().toISOString(),
      error: 'Using fallback prices due to API failure'
    });
  }
}
