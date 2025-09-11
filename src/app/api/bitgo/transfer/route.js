export const runtime = "nodejs";

import { NextResponse } from 'next/server';

// BitGo configuration
const BITGO_API_KEY = process.env.BITGO_API_KEY;
const BITGO_WALLET_ID = process.env.BITGO_WALLET_ID;
const BITGO_PASSPHRASE = process.env.BITGO_PASSPHRASE;
const BITGO_API_URL = 'https://www.bitgo.com/api/v2';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      toAddress, 
      amount, 
      passphrase, 
      feeRate = 10000 // satoshis per KB
    } = body;

    // Validate input
    if (!toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: toAddress, amount' },
        { status: 400 }
      );
    }

    if (!BITGO_API_KEY || !BITGO_WALLET_ID) {
      return NextResponse.json(
        { error: 'BitGo API key or wallet ID not configured' },
        { status: 500 }
      );
    }

    // Use provided passphrase or fallback to environment variable
    const walletPassphrase = passphrase || BITGO_PASSPHRASE;
    if (!walletPassphrase) {
      return NextResponse.json(
        { error: 'Wallet passphrase is required' },
        { status: 400 }
      );
    }

    // Step 1: Unlock the wallet
    const unlockResponse = await fetch(`${BITGO_API_URL}/wallet/${BITGO_WALLET_ID}/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BITGO_API_KEY}`
      },
      body: JSON.stringify({
        duration: 60 // Unlock for 60 seconds
      })
    });

    if (!unlockResponse.ok) {
      const unlockError = await unlockResponse.json();
      console.error('BitGo wallet unlock failed:', unlockError);
      return NextResponse.json(
        { error: `Failed to unlock wallet: ${unlockError.error || unlockResponse.statusText}` },
        { status: unlockResponse.status }
      );
    }

    // Step 2: Create the transaction
    const transactionData = {
      address: toAddress,
      amount: Math.floor(amount * 100000000), // Convert BTC to satoshis
      walletPassphrase: walletPassphrase,
      feeRate: feeRate
    };

    const transferResponse = await fetch(`${BITGO_API_URL}/wallet/${BITGO_WALLET_ID}/sendcoins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BITGO_API_KEY}`
      },
      body: JSON.stringify(transactionData)
    });

    if (!transferResponse.ok) {
      const transferError = await transferResponse.json();
      console.error('BitGo transfer failed:', transferError);
      return NextResponse.json(
        { error: `Transfer failed: ${transferError.error || transferResponse.statusText}` },
        { status: transferResponse.status }
      );
    }

    const transferResult = await transferResponse.json();

    return NextResponse.json({
      success: true,
      txHash: transferResult.hash,
      txid: transferResult.txid,
      fee: transferResult.fee,
      amount: amount,
      toAddress: toAddress,
      method: 'bitgo',
      status: 'confirmed',
      blockHeight: transferResult.blockHeight,
      confirmations: transferResult.confirmations || 0
    });

  } catch (error) {
    console.error('BitGo transfer API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET method to get wallet information
export async function GET(request) {
  try {
    if (!BITGO_API_KEY || !BITGO_WALLET_ID) {
      return NextResponse.json(
        { error: 'BitGo API key or wallet ID not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${BITGO_API_URL}/wallet/${BITGO_WALLET_ID}`, {
      headers: {
        'Authorization': `Bearer ${BITGO_API_KEY}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: `Failed to get wallet info: ${error.error || response.statusText}` },
        { status: response.status }
      );
    }

    const walletInfo = await response.json();

    return NextResponse.json({
      walletId: walletInfo.id,
      label: walletInfo.label,
      balance: walletInfo.balance / 100000000, // Convert from satoshis to BTC
      confirmedBalance: walletInfo.confirmedBalance / 100000000,
      spendableBalance: walletInfo.spendableBalance / 100000000,
      coin: walletInfo.coin,
      type: walletInfo.type
    });

  } catch (error) {
    console.error('BitGo wallet info error:', error);
    return NextResponse.json(
      { error: `Failed to get wallet info: ${error.message}` },
      { status: 500 }
    );
  }
}
