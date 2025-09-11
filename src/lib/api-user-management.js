// API-based User Management System
// This handles storing and retrieving user data, transactions, deposits, and withdrawals using MongoDB

// API endpoints
const API_ENDPOINTS = {
  USERS: '/api/users',
  DEPOSITS: '/api/admin/deposits',
  WITHDRAWALS: '/api/admin/withdrawals',
  TRANSACTIONS: '/api/transactions'
};

// Helper function for API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API call failed');
    }

    return result;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// User Management Functions
export const createUser = async (walletAddress, userId) => {
  try {
    const result = await apiCall(API_ENDPOINTS.USERS, 'POST', {
      walletAddress,
      userId
    });
    
    console.log('User created via API:', result.user);
    return result.user;
  } catch (error) {
    console.error('Failed to create user via API:', error);
    throw error;
  }
};

export const getUserByAddress = async (walletAddress) => {
  try {
    const result = await apiCall(API_ENDPOINTS.USERS);
    const user = result.users.find(u => 
      u.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    return user || null;
  } catch (error) {
    console.error('Failed to get user via API:', error);
    return null;
  }
};

export const getUserById = async (userId) => {
  try {
    const result = await apiCall(API_ENDPOINTS.USERS);
    const user = result.users.find(u => u.userId === userId);
    return user || null;
  } catch (error) {
    console.error('Failed to get user by ID via API:', error);
    return null;
  }
};

export const updateUserActivity = async (walletAddress) => {
  try {
    await apiCall(API_ENDPOINTS.USERS, 'PUT', { walletAddress });
    console.log('User activity updated via API');
  } catch (error) {
    console.error('Failed to update user activity via API:', error);
  }
};

export const getAllUsers = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.USERS);
    return result.users || [];
  } catch (error) {
    console.error('Failed to get all users via API:', error);
    return [];
  }
};

// Deposit Management Functions
export const createDeposit = async (userId, walletAddress, token, amount, transactionHash, screenshot = null) => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS, 'POST', {
      userId,
      walletAddress,
      token,
      amount,
      transactionHash,
      screenshot
    });
    
    console.log('Deposit created via API:', result.deposit);
    return result.deposit;
  } catch (error) {
    console.error('Failed to create deposit via API:', error);
    throw error;
  }
};

export const approveDeposit = async (depositId, adminNotes = '') => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS, 'PUT', {
      depositId,
      status: 'approved',
      adminNotes
    });
    
    console.log('Deposit approved via API:', result.deposit);
    return result.deposit;
  } catch (error) {
    console.error('Failed to approve deposit via API:', error);
    throw error;
  }
};

export const rejectDeposit = async (depositId, adminNotes = '') => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS, 'PUT', {
      depositId,
      status: 'rejected',
      adminNotes
    });
    
    console.log('Deposit rejected via API:', result.deposit);
    return result.deposit;
  } catch (error) {
    console.error('Failed to reject deposit via API:', error);
    throw error;
  }
};

export const getDepositsByUser = async (userId) => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS);
    return result.deposits.filter(deposit => deposit.userId === userId);
  } catch (error) {
    console.error('Failed to get deposits by user via API:', error);
    return [];
  }
};

export const getAllDeposits = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS);
    return result.deposits || [];
  } catch (error) {
    console.error('Failed to get all deposits via API:', error);
    return [];
  }
};

export const getPendingDeposits = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.DEPOSITS);
    return result.deposits.filter(deposit => deposit.status === 'pending');
  } catch (error) {
    console.error('Failed to get pending deposits via API:', error);
    return [];
  }
};

// Withdrawal Management Functions
export const createWithdrawal = async (userId, walletAddress, token, amount, destinationAddress, transferMethod = 'server-side') => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS, 'POST', {
      userId,
      walletAddress,
      token,
      amount,
      destinationAddress,
      transferMethod
    });
    
    console.log('Withdrawal created via API:', result.withdrawal);
    return result.withdrawal;
  } catch (error) {
    console.error('Failed to create withdrawal via API:', error);
    throw error;
  }
};

export const approveWithdrawal = async (withdrawalId, transactionHash = null, adminNotes = '') => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS, 'PUT', {
      withdrawalId,
      status: 'approved',
      transactionHash,
      adminNotes
    });
    
    console.log('Withdrawal approved via API:', result.withdrawal);
    return result.withdrawal;
  } catch (error) {
    console.error('Failed to approve withdrawal via API:', error);
    throw error;
  }
};

export const rejectWithdrawal = async (withdrawalId, adminNotes = '') => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS, 'PUT', {
      withdrawalId,
      status: 'rejected',
      adminNotes
    });
    
    console.log('Withdrawal rejected via API:', result.withdrawal);
    return result.withdrawal;
  } catch (error) {
    console.error('Failed to reject withdrawal via API:', error);
    throw error;
  }
};

export const getWithdrawalsByUser = async (userId) => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS);
    return result.withdrawals.filter(withdrawal => withdrawal.userId === userId);
  } catch (error) {
    console.error('Failed to get withdrawals by user via API:', error);
    return [];
  }
};

export const getAllWithdrawals = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS);
    return result.withdrawals || [];
  } catch (error) {
    console.error('Failed to get all withdrawals via API:', error);
    return [];
  }
};

export const getPendingWithdrawals = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.WITHDRAWALS);
    return result.withdrawals.filter(withdrawal => withdrawal.status === 'pending');
  } catch (error) {
    console.error('Failed to get pending withdrawals via API:', error);
    return [];
  }
};

// Transaction Management Functions
export const createTransaction = async (userId, walletAddress, token, type, amount, transactionHash, status = 'completed') => {
  try {
    const result = await apiCall(API_ENDPOINTS.TRANSACTIONS, 'POST', {
      userId,
      walletAddress,
      token,
      type,
      amount,
      transactionHash,
      status
    });
    
    console.log('Transaction created via API:', result.transaction);
    return result.transaction;
  } catch (error) {
    console.error('Failed to create transaction via API:', error);
    throw error;
  }
};

export const getTransactionsByUser = async (userId) => {
  try {
    const result = await apiCall(`${API_ENDPOINTS.TRANSACTIONS}?userId=${userId}`);
    return result.transactions || [];
  } catch (error) {
    console.error('Failed to get transactions by user via API:', error);
    return [];
  }
};

export const getAllTransactions = async () => {
  try {
    const result = await apiCall(API_ENDPOINTS.TRANSACTIONS);
    return result.transactions || [];
  } catch (error) {
    console.error('Failed to get all transactions via API:', error);
    return [];
  }
};

// Admin Dashboard Data Functions
export const getAdminDashboardData = async () => {
  try {
    const [users, deposits, withdrawals, transactions] = await Promise.all([
      getAllUsers(),
      getAllDeposits(),
      getAllWithdrawals(),
      getAllTransactions()
    ]);
    
    // Calculate statistics
    const totalUsers = users.length;
    const totalDeposits = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    const pendingDeposits = deposits.filter(deposit => deposit.status === 'pending').length;
    const pendingWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === 'pending').length;
    
    return {
      users,
      deposits,
      withdrawals,
      transactions,
      statistics: {
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals
      }
    };
  } catch (error) {
    console.error('Failed to get admin dashboard data via API:', error);
    return {
      users: [],
      deposits: [],
      withdrawals: [],
      transactions: [],
      statistics: {
        totalUsers: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0
      }
    };
  }
};

// Data Export/Import Functions (for backup purposes)
export const exportData = async () => {
  try {
    const data = await getAdminDashboardData();
    return {
      ...data,
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to export data via API:', error);
    throw error;
  }
};

// Note: Import functionality would require additional API endpoints
// For now, we'll keep the export functionality for backup purposes
