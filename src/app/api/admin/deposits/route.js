import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

// GET - Fetch all deposits
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('deposits');
    
    const deposits = await collection.find({}).sort({ submissionDate: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      deposits: deposits,
      count: deposits.length
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}

// POST - Create new deposit
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, walletAddress, token, amount, transactionHash, screenshot } = body;
    
    if (!userId || !walletAddress || !token || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, walletAddress, token, amount' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const depositsCollection = db.collection('deposits');
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
    
    // Create new deposit with USD value
    const newDeposit = {
      userId: userId,
      walletAddress: walletAddress.toLowerCase(),
      token: token,
      amount: parseFloat(amount),
      usdAmount: usdAmount,
      transactionHash: transactionHash || '',
      screenshot: screenshot || null,
      status: 'pending',
      submissionDate: new Date(),
      processedDate: null,
      adminNotes: ''
    };
    
    const result = await depositsCollection.insertOne(newDeposit);
    newDeposit._id = result.insertedId;
    
    // Update user's total deposits (both token and USD)
    await usersCollection.updateOne(
      { userId: userId },
      { 
        $inc: { 
          totalDeposits: parseFloat(amount),
          totalDepositsUSD: usdAmount
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      deposit: newDeposit,
      message: 'Deposit created successfully'
    });
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deposit' },
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

// PUT - Update deposit status
export async function PUT(request) {
  try {
    const body = await request.json();
    const { depositId, status, adminNotes, transactionHash } = body;
    
    if (!depositId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: depositId, status' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    const collection = db.collection('deposits');
    const usersCollection = db.collection('users');
    
    // Get the deposit first to access user info
    const deposit = await collection.findOne({ _id: depositId });
    if (!deposit) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
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
      { _id: depositId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Deposit not found' },
        { status: 404 }
      );
    }
    
    // If deposit is approved, update user's current balance
    if (status === 'approved') {
      // Get current token price for accurate USD calculation
      let currentUsdAmount = deposit.usdAmount;
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${getTokenId(deposit.token)}&vs_currencies=usd`
        );
        if (response.ok) {
          const priceData = await response.json();
          const tokenPrice = priceData[getTokenId(deposit.token)]?.usd;
          if (tokenPrice) {
            currentUsdAmount = parseFloat(deposit.amount) * tokenPrice;
          }
        }
      } catch (priceError) {
        console.warn('Failed to get current token price, using stored USD amount:', priceError);
      }
      
      // Update user's current balance and USD balance
      await usersCollection.updateOne(
        { userId: deposit.userId },
        { 
          $inc: { 
            [`${deposit.token.toLowerCase()}Balance`]: parseFloat(deposit.amount),
            currentBalanceUSD: currentUsdAmount
          },
          $set: {
            lastPriceUpdate: new Date().toISOString()
          }
        }
      );
    }
    
    // Get updated deposit
    const updatedDeposit = await collection.findOne({ _id: depositId });
    
    return NextResponse.json({
      success: true,
      deposit: updatedDeposit,
      message: `Deposit ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating deposit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit' },
      { status: 500 }
    );
  }
}
