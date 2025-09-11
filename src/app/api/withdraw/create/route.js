import { NextResponse } from 'next/server';
import prismaPromise from "@/lib/prisma";

// POST - Create new withdraw request
export async function POST(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { userId, amount, proofImage, txHash } = body;
    
    // Validate required fields
    if (!userId || !amount || !proofImage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: userId, amount, proofImage' 
        },
        { status: 400 }
      );
    }
    
    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has sufficient balance
    if (user.balance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance for this withdrawal request' },
        { status: 400 }
      );
    }
    
    // Create new withdraw request
    const newWithdrawRequest = await prisma.withdrawRequest.create({
      data: {
        userId,
        amount: parseFloat(amount),
        proofImage,
        txHash: txHash || null,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            balance: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      withdrawRequest: newWithdrawRequest,
      message: 'Withdraw request submitted successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating withdraw request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create withdraw request' },
      { status: 500 }
    );
  }
}
