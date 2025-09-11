import { NextResponse } from 'next/server';
import prismaPromise from "@/lib/prisma";

// GET - Fetch all withdraw requests for admin
export async function GET() {
  const prisma = await prismaPromise;
  try {
    const withdrawRequests = await prisma.withdrawRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            balance: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      withdrawRequests
    });

  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch withdraw requests' },
      { status: 500 }
    );
  }
}
