import { NextResponse } from 'next/server';
import prismaPromise from "@/lib/prisma";

// PATCH - Admin approves or rejects withdraw request
export async function PATCH(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { requestId, status } = body;
    
    // Validate required fields
    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: requestId, status' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }
    
    // Find the withdraw request
    const withdrawRequest = await prisma.withdrawRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        user: true
      }
    });
    
    if (!withdrawRequest) {
      return NextResponse.json(
        { success: false, error: 'Withdraw request not found' },
        { status: 404 }
      );
    }
    
    // Check if request is already processed
    if (withdrawRequest.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Withdraw request is already processed' },
        { status: 400 }
      );
    }
    
    // Update withdraw request status
    const updatedWithdrawRequest = await prisma.withdrawRequest.update({
      where: { id: parseInt(requestId) },
      data: {
        status: status,
        resolvedAt: new Date()
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
    
    // If approved, deduct amount from user balance
    if (status === 'APPROVED') {
      await prisma.user.update({
        where: { id: withdrawRequest.userId },
        data: {
          balance: withdrawRequest.user.balance - withdrawRequest.amount
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      withdrawRequest: updatedWithdrawRequest,
      message: `Withdraw request ${status.toLowerCase()} successfully`
    });
    
  } catch (error) {
    console.error('Error managing withdraw request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to manage withdraw request' },
      { status: 500 }
    );
  }
}
