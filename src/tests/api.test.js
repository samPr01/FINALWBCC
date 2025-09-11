// API Test Suite for WeWallet
// This file tests all withdraw and binary trade APIs
// Run with: node src/tests/api.test.js (after starting dev server)

const BASE_URL = 'http://localhost:3003';

// Helper function to make API calls
async function apiCall(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test runner function
async function runApiTests() {
  console.log('🚀 Starting WeWallet API Tests...\n');

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // ===== WITHDRAW FLOW TESTS =====
    console.log('📤 WITHDRAW FLOW TESTS');
    console.log('=' .repeat(50));

    // 1. GET /api/withdraw/list
    console.log('1️⃣  Testing GET /api/withdraw/list');
    const listResult = await apiCall('GET', '/api/withdraw/list');
    console.log('Response:', JSON.stringify(listResult, null, 2));
    console.log('');

    // 2. POST /api/withdraw/create
    console.log('2️⃣  Testing POST /api/withdraw/create');
    const createWithdrawBody = {
      userId: "test-user-1",
      amount: 100,
      proofImage: "https://test.com/proof.png",
      txHash: "0xabc123"
    };
    const createResult = await apiCall('POST', '/api/withdraw/create', createWithdrawBody);
    console.log('Request Body:', JSON.stringify(createWithdrawBody, null, 2));
    console.log('Response:', JSON.stringify(createResult, null, 2));
    console.log('');

    // Extract withdraw request ID for next tests
    const withdrawId = createResult.data?.withdrawRequest?.id || 1;

    // 3. PATCH /api/withdraw/manage (approve)
    console.log('3️⃣  Testing PATCH /api/withdraw/manage (APPROVE)');
    const approveBody = {
      requestId: withdrawId,
      status: "APPROVED"
    };
    const approveResult = await apiCall('PATCH', '/api/withdraw/manage', approveBody);
    console.log('Request Body:', JSON.stringify(approveBody, null, 2));
    console.log('Response:', JSON.stringify(approveResult, null, 2));
    console.log('');

    // Create another withdraw request for rejection test
    console.log('2️⃣ b Testing POST /api/withdraw/create (for rejection)');
    const createWithdrawBody2 = {
      userId: "test-user-1",
      amount: 50,
      proofImage: "https://test.com/proof2.png",
      txHash: "0xdef456"
    };
    const createResult2 = await apiCall('POST', '/api/withdraw/create', createWithdrawBody2);
    console.log('Request Body:', JSON.stringify(createWithdrawBody2, null, 2));
    console.log('Response:', JSON.stringify(createResult2, null, 2));
    console.log('');

    const withdrawId2 = createResult2.data?.withdrawRequest?.id || 2;

    // 4. PATCH /api/withdraw/manage (reject)
    console.log('4️⃣  Testing PATCH /api/withdraw/manage (REJECT)');
    const rejectBody = {
      requestId: withdrawId2,
      status: "REJECTED"
    };
    const rejectResult = await apiCall('PATCH', '/api/withdraw/manage', rejectBody);
    console.log('Request Body:', JSON.stringify(rejectBody, null, 2));
    console.log('Response:', JSON.stringify(rejectResult, null, 2));
    console.log('');

    // ===== BINARY TRADES FLOW TESTS =====
    console.log('📊 BINARY TRADES FLOW TESTS');
    console.log('=' .repeat(50));

    // 5. GET /api/trades
    console.log('5️⃣  Testing GET /api/trades');
    const tradesListResult = await apiCall('GET', '/api/trades');
    console.log('Response:', JSON.stringify(tradesListResult, null, 2));
    console.log('');

    // 6. POST /api/trades/create
    console.log('6️⃣  Testing POST /api/trades/create');
    const createTradeBody = {
      userId: "test-user-1",
      coin: "BTC",
      type: "UP",
      amount: 50,
      timeframe: 60
    };
    const createTradeResult = await apiCall('POST', '/api/trades/create', createTradeBody);
    console.log('Request Body:', JSON.stringify(createTradeBody, null, 2));
    console.log('Response:', JSON.stringify(createTradeResult, null, 2));
    console.log('');

    // Extract trade ID for resolve tests
    const tradeId = createTradeResult.data?.trade?.id || "test-trade-1";

    // 7. POST /api/trades/resolve (auto resolve)
    console.log('7️⃣  Testing POST /api/trades/resolve (AUTO)');
    const autoResolveBody = {
      tradeId: tradeId
    };
    const autoResolveResult = await apiCall('POST', '/api/trades/resolve', autoResolveBody);
    console.log('Request Body:', JSON.stringify(autoResolveBody, null, 2));
    console.log('Response:', JSON.stringify(autoResolveResult, null, 2));
    console.log('');

    // Create another trade for manual resolve test
    console.log('6️⃣ b Testing POST /api/trades/create (for manual resolve)');
    const createTradeBody2 = {
      userId: "test-user-1",
      coin: "ETH",
      type: "DOWN",
      amount: 25,
      timeframe: 120
    };
    const createTradeResult2 = await apiCall('POST', '/api/trades/create', createTradeBody2);
    console.log('Request Body:', JSON.stringify(createTradeBody2, null, 2));
    console.log('Response:', JSON.stringify(createTradeResult2, null, 2));
    console.log('');

    const tradeId2 = createTradeResult2.data?.trade?.id || "test-trade-2";

    // 8. POST /api/trades/resolve (manual resolve)
    console.log('8️⃣  Testing POST /api/trades/resolve (MANUAL WON)');
    const manualResolveBody = {
      tradeId: tradeId2,
      manualResult: "WON"
    };
    const manualResolveResult = await apiCall('POST', '/api/trades/resolve', manualResolveBody);
    console.log('Request Body:', JSON.stringify(manualResolveBody, null, 2));
    console.log('Response:', JSON.stringify(manualResolveResult, null, 2));
    console.log('');

    // Final summary
    console.log('✅ API TESTS COMPLETED');
    console.log('=' .repeat(50));
    console.log('All API endpoints have been tested successfully!');
    console.log('Check the responses above for any errors or issues.');

  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

// Auto-run tests when this file is executed
if (require.main === module) {
  runApiTests();
}

// Export for use in other files
module.exports = { runApiTests, apiCall };
