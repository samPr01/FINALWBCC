import { NextResponse } from "next/server";
import prismaPromise from "@/lib/prisma";

export async function POST(request) {
  const prisma = await prismaPromise;
  try {
    const body = await request.json();
    const { address } = body;

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing address" },
        { status: 400 }
      );
    }

    const normalized = address.toLowerCase();
    const placeholderEmail = `${normalized}@wallet.local`;
    const placeholderPassword = "wallet-auth";

    const user = await prisma.user.upsert({
      where: { ethereumAddress: normalized },
      update: { ethereumAddress: normalized },
      create: {
        ethereumAddress: normalized,
        email: placeholderEmail,
        password: placeholderPassword,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Wallet auth failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to authenticate wallet" },
      { status: 500 }
    );
  }
}
