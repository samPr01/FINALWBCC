export const runtime = "nodejs";

import { NextResponse } from "next/server";
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Bitcoin network configuration
const NETWORK = bitcoin.networks.bitcoin; // Mainnet
const API_BASE_URL = 'https://api.blockcypher.com/v1/btc/main';

// Initialize ECPair
const ECPair = ECPairFactory(ecc);

// Environment variables for secure key management
const PLATFORM_PRIVATE_KEY = process.env.BITCOIN_PRIVATE_KEY;
const BLOCKCYPHER_TOKEN = process.env.BLOCKCYPHER_TOKEN;

export async function POST(req) {
  try {
    const { fromAddress, toAddress, amount, feePreference = 'medium', network = 'main' } = await req.json();

    // Validate input
    if (!fromAddress || !toAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: fromAddress, toAddress, amount' },
        { status: 400 }
      );
    }

    if (!PLATFORM_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Bitcoin private key not configured on server' },
        { status: 500 }
      );
    }

    // Validate Bitcoin addresses
    try {
      bitcoin.address.toOutputScript(fromAddress, NETWORK);
      bitcoin.address.toOutputScript(toAddress, NETWORK);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid Bitcoin address format' },
        { status: 400 }
      );
    }

    // Step 1: Get UTXOs for the source address
    const utxoResponse = await fetch(`${API_BASE_URL}/addrs/${fromAddress}?unspentOnly=true`);
    const utxoData = await utxoResponse.json();

    if (utxoData.error) {
      return NextResponse.json(
        { error: `Failed to fetch UTXOs: ${utxoData.error}` },
        { status: 400 }
      );
    }

    const utxos = utxoData.txrefs || [];
    if (utxos.length === 0) {
      return NextResponse.json(
        { error: 'No unspent outputs found for the source address' },
        { status: 400 }
      );
    }

    // Step 2: Calculate total available balance
    const totalBalance = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const amountSatoshis = Math.floor(amount * 100000000);

    if (amountSatoshis > totalBalance) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${totalBalance / 100000000} BTC` },
        { status: 400 }
      );
    }

    // Step 3: Create transaction
    const psbt = new bitcoin.Psbt({ network: NETWORK });

    // Add inputs
    let inputValue = 0;
    const selectedUtxos = [];

    for (const utxo of utxos) {
      if (inputValue >= amountSatoshis) break;

      psbt.addInput({
        hash: utxo.tx_hash,
        index: utxo.tx_output_n,
        value: utxo.value,
        witnessUtxo: {
          script: bitcoin.address.toOutputScript(fromAddress, NETWORK),
          value: utxo.value
        }
      });

      inputValue += utxo.value;
      selectedUtxos.push(utxo);
    }

    // Add output
    psbt.addOutput({
      address: toAddress,
      value: amountSatoshis
    });

    // Step 4: Calculate fee and add change output
    // ✅ FIX: Define fee rates (satoshis per byte)
    const feeRates = {
      low: 5,
      medium: 10,
      high: 20
    };

    // ✅ FIX: avoid redeclaration bug
    const selectedFeeRate = feeRates[feePreference] || feeRates.medium;

    // Estimate size of transaction
    const estimatedSize = selectedUtxos.length * 148 + 2 * 34 + 10; // 2 outputs (destination + change)
    const estimatedFee = estimatedSize * selectedFeeRate;

    const changeAmount = inputValue - amountSatoshis - estimatedFee;

    if (changeAmount > 546) { // Dust threshold
      psbt.addOutput({
        address: fromAddress,
        value: changeAmount
      });
    }

    // Step 5: Sign the transaction
    try {
      const keyPair = ECPair.fromWIF(PLATFORM_PRIVATE_KEY, NETWORK);
      psbt.signAllInputs(keyPair);
      psbt.finalizeAllInputs();
    } catch (error) {
      console.error('Transaction signing failed:', error);
      return NextResponse.json(
        { error: 'Failed to sign transaction' },
        { status: 500 }
      );
    }

    // Step 6: Extract and broadcast transaction
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();

    const broadcastResponse = await fetch(`${API_BASE_URL}/txs/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx: txHex
      })
    });

    const broadcastData = await broadcastResponse.json();

    if (broadcastData.error) {
      return NextResponse.json(
        { error: `Transaction broadcast failed: ${broadcastData.error}` },
        { status: 500 }
      );
    }

    // Step 7: Return success response
    return NextResponse.json({
      status: "success",
      txHash: broadcastData.tx.hash,
      feeRateUsed: selectedFeeRate,
      estimatedSize,
      estimatedFee,
      confirmations: 0,
      method: 'server-side',
      amount: amount,
      fromAddress: fromAddress,
      toAddress: toAddress
    });

  } catch (error) {
    console.error("Transfer API error:", error);
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    );
  }
}

// GET method to check transaction status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      );
    }

    // Get transaction status from BlockCypher
    const response = await fetch(`${API_BASE_URL}/txs/${txHash}`);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: `Transaction not found: ${data.error}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      txHash: data.hash,
      confirmations: data.confirmations,
      blockHeight: data.block_height,
      total: data.total / 100000000,
      fees: data.fees / 100000000,
      status: data.confirmations > 0 ? 'confirmed' : 'pending'
    });

  } catch (error) {
    console.error('Transaction status check error:', error);
    return NextResponse.json(
      { error: `Failed to check transaction status: ${error.message}` },
      { status: 500 }
    );
  }
}
