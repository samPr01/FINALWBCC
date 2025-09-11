export const runtime = "nodejs";

import { NextResponse } from 'next/server';

// Coinbase Commerce configuration
const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      amount, 
      currency = 'BTC', 
      destinationAddress, 
      description, 
      metadata = {} 
    } = body;

    // Validate input
    if (!amount || !destinationAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters: amount, destinationAddress' },
        { status: 400 }
      );
    }

    if (!COINBASE_API_KEY) {
      return NextResponse.json(
        { error: 'Coinbase Commerce API key not configured' },
        { status: 500 }
      );
    }

    // Create charge request
    const chargeData = {
      name: description || 'Bitcoin Transfer',
      description: description || `BTC Transfer to ${destinationAddress}`,
      local_price: {
        amount: amount.toString(),
        currency: currency
      },
      pricing_type: 'fixed_price',
      metadata: {
        ...metadata,
        destination_address: destinationAddress,
        transfer_type: 'withdrawal'
      },
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/transfer/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/transfer/cancel`
    };

    // Create charge via Coinbase Commerce API
    const response = await fetch(`${COINBASE_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22'
      },
      body: JSON.stringify(chargeData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Coinbase API error:', errorData);
      return NextResponse.json(
        { error: `Coinbase API error: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const charge = await response.json();

    return NextResponse.json({
      success: true,
      chargeId: charge.data.id,
      hostedUrl: charge.data.hosted_url,
      expiresAt: charge.data.expires_at,
      amount: charge.data.pricing.local.amount,
      currency: charge.data.pricing.local.currency,
      status: charge.data.timeline[0].status,
      method: 'coinbase-commerce'
    });

  } catch (error) {
    console.error('Coinbase charge creation error:', error);
    return NextResponse.json(
      { error: `Failed to create charge: ${error.message}` },
      { status: 500 }
    );
  }
}

// Webhook handler for payment confirmations
export async function PUT(request) {
  try {
    const body = await request.json();
    const { chargeId, status } = body;

    if (!chargeId) {
      return NextResponse.json(
        { error: 'Charge ID is required' },
        { status: 400 }
      );
    }

    // Verify webhook signature (in production)
    // const signature = request.headers.get('x-cc-webhook-signature');
    // if (!verifyWebhookSignature(body, signature)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // Update charge status in your database
    // await updateChargeStatus(chargeId, status);

    return NextResponse.json({
      success: true,
      chargeId,
      status,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: `Webhook processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Helper function to verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!COINBASE_WEBHOOK_SECRET) {
    return false;
  }

  // In production, implement proper signature verification
  // using crypto.createHmac('sha256', COINBASE_WEBHOOK_SECRET)
  return true; // Simplified for demo
}
