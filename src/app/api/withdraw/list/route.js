import { NextResponse } from 'next/server';
import prismaPromise from "@/lib/prisma";

// GET - List all withdraw requests (latest first)
export async function GET(request) {
  const prisma = await prismaPromise;
  try {
    // Get all withdraw requests ordered by creation date (latest first)
    const withdrawRequests = await prisma.withdrawRequest.findMany({
      orderBy: {
        createdAt: 'desc'
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
      withdrawRequests,
      count: withdrawRequests.length
    });
    
  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdraw requests' },
      { status: 500 }
    );
  }
}
