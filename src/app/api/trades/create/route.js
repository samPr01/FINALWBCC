import { NextResponse } from "next/server";
import prismaPromise from "@/lib/prisma";

// POST - Create new binary trade
export async function POST(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { userId, coin, type, amount, timeframe } = body;

    // Validate required fields
    if (!userId || !coin || !type || !amount || !timeframe) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: userId, coin, type, amount, timeframe",
        },
        { status: 400 }
      );
    }

    // Validate trade type
    if (!["UP", "DOWN"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid trade type. Must be UP or DOWN" },
        { status: 400 }
      );
    }

    // Validate amount and timeframe
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    if (timeframe < 30 || timeframe > 3600) {
      return NextResponse.json(
        {
          success: false,
          error: "Timeframe must be between 30 and 3600 seconds",
        },
        { status: 400 }
      );
    }

    // Check if user exists and has sufficient balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { success: false, error: "Insufficient balance for this trade" },
        { status: 400 }
      );
    }

    // Calculate return percentage based on timeframe
    // Shorter timeframes = higher risk = higher return
    let returnPct;
    if (timeframe <= 60) {
      returnPct = 85; // 85% return for 1 minute or less
    } else if (timeframe <= 300) {
      returnPct = 80; // 80% return for 5 minutes or less
    } else if (timeframe <= 900) {
      returnPct = 75; // 75% return for 15 minutes or less
    } else if (timeframe <= 1800) {
      returnPct = 70; // 70% return for 30 minutes or less
    } else {
      returnPct = 65; // 65% return for longer timeframes
    }

    // Deduct amount from user balance
    await prisma.user.update({
      where: { id: userId },
      data: { balance: user.balance - amount },
    });

    // Create new binary trade
    const newTrade = await prisma.trade.create({
      data: {
        userId,
        coin: coin.toUpperCase(),
        type,
        amount: parseFloat(amount),
        timeframe: parseInt(timeframe),
        returnPct,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            balance: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        trade: newTrade,
        message: "Binary trade created successfully",
        potentialReturn: amount * (returnPct / 100),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating binary trade:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create binary trade" },
      { status: 500 }
    );
  }
}
