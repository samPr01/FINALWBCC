import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

// GET - Fetch all withdrawals
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('withdrawals');
    
    const withdrawals = await collection.find({}).sort({ requestDate: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      withdrawals: withdrawals,
      count: withdrawals.length
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

// POST - Create new withdrawal
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, walletAddress, token, amount, destinationAddress, transferMethod } = body;
    
    if (!userId || !walletAddress || !token || !amount || !destinationAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, walletAddress, token, amount, destinationAddress' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const withdrawalsCollection = db.collection('withdrawals');
    const usersCollection = db.collection('users');
    
    // Get current token price in USD
    let usdAmount = 0;
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${getTokenId(token)}&vs_currencies=usd`
      );
      if (response.ok) {
        const priceData = await response.json();
        const tokenPrice = priceData[getTokenId(token)]?.usd;
        if (tokenPrice) {
          usdAmount = parseFloat(amount) * tokenPrice;
        }
      }
    } catch (priceError) {
      console.warn('Failed to get token price, using fallback:', priceError);
      // Fallback prices
      const fallbackPrices = { BTC: 50000, ETH: 3000, USDT: 1, USDC: 1 };
      usdAmount = parseFloat(amount) * (fallbackPrices[token] || 0);
    }
    
    // Create new withdrawal with USD value
    const newWithdrawal = {
      userId: userId,
      walletAddress: walletAddress.toLowerCase(),
      token: token,
      amount: parseFloat(amount),
      usdAmount: usdAmount,
      destinationAddress: destinationAddress,
      transferMethod: transferMethod || 'server-side',
      status: 'pending',
      requestDate: new Date(),
      processedDate: null,
      transactionHash: null,
      adminNotes: ''
    };
    
    const result = await withdrawalsCollection.insertOne(newWithdrawal);
    newWithdrawal._id = result.insertedId;
    
    // Update user's total withdrawals (both token and USD)
    await usersCollection.updateOne(
      { userId: userId },
      { 
        $inc: { 
          totalWithdrawals: parseFloat(amount),
          totalWithdrawalsUSD: usdAmount
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      withdrawal: newWithdrawal,
      message: 'Withdrawal created successfully'
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create withdrawal' },
      { status: 500 }
    );
  }
}

// Helper function to get CoinGecko token ID
function getTokenId(token) {
  const tokenMap = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'USDC': 'usd-coin'
  };
  return tokenMap[token] || 'bitcoin';
}

// PUT - Update withdrawal status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { withdrawalId, status, adminNotes, transactionHash } = body;
    
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: withdrawalId, status' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('withdrawals');
    const usersCollection = db.collection('users');
    
    // Get the withdrawal first to access user info
    const withdrawal = await collection.findOne({ _id: withdrawalId });
    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    const updateData = {
      status: status,
      processedDate: new Date(),
      adminNotes: adminNotes || ''
    };
    
    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }
    
    const result = await collection.updateOne(
      { _id: withdrawalId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      );
    }
    
    // If withdrawal is approved, update user's current balance
    if (status === 'approved') {
      // Get current token price for accurate USD calculation
      let currentUsdAmount = withdrawal.usdAmount;
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${getTokenId(withdrawal.token)}&vs_currencies=usd`
        );
        if (response.ok) {
          const priceData = await response.json();
          const tokenPrice = priceData[getTokenId(withdrawal.token)]?.usd;
          if (tokenPrice) {
            currentUsdAmount = parseFloat(withdrawal.amount) * tokenPrice;
          }
        }
      } catch (priceError) {
        console.warn('Failed to get current token price, using stored USD amount:', priceError);
      }
      
      // Update user's current balance and USD balance
      await usersCollection.updateOne(
        { userId: withdrawal.userId },
        { 
          $inc: { 
            [`${withdrawal.token.toLowerCase()}Balance`]: -parseFloat(withdrawal.amount),
            currentBalanceUSD: -currentUsdAmount
          },
          $set: {
            lastPriceUpdate: new Date().toISOString()
          }
        }
      );
    }
    
    // Get updated withdrawal
    const updatedWithdrawal = await collection.findOne({ _id: withdrawalId });
    
    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      message: `Withdrawal ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
