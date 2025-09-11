import { NextResponse } from "next/server";
import prismaPromise from "@/lib/prisma";

// GET transactions (all or by userId)
export async function GET(request) {
  const prisma = await prismaPromise;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const where = userId ? { userId } : {};
    const data = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ transactions: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST transaction (add new record)
export async function POST(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const {
      userId,
      walletAddress,
      token,
      type,
      amount,
      transactionHash,
      status,
    } = body;
    if (!userId || !walletAddress || !token || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const tx = await prisma.transaction.create({
      data: {
        userId,
        walletAddress,
        token,
        type,
        amount: parseFloat(amount),
        transactionHash: transactionHash || null,
        status: status || "completed",
      },
    });
    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
