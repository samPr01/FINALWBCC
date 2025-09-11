// Enhanced User Management System with USD Conversion
// Integrates with price converter for real-time USD values

import { 
  createUser as createUserBase, 
  getUserByAddress as getUserByAddressBase,
  getUserById as getUserByIdBase,
  updateUserActivity as updateUserActivityBase,
  getAllUsers as getAllUsersBase,
  createDeposit as createDepositBase,
  approveDeposit as approveDepositBase,
  rejectDeposit as rejectDepositBase,
  createWithdrawal as createWithdrawalBase,
  approveWithdrawal as approveWithdrawalBase,
  rejectWithdrawal as rejectWithdrawalBase,
  createTransaction as createTransactionBase
} from './api-user-management';

import { 
  convertToUSD, 
  getBalancesInUSD, 
  getFormattedUSD,
  getCurrentPrices,
  refreshPrices
} from './price-converter';

// Enhanced user creation with USD tracking
export const createUser = async (walletAddress, userId) => {
  try {
    const user = await createUserBase(walletAddress, userId);
    
    // Initialize USD balances
    const usdBalances = {
      totalDepositsUSD: 0,
      totalWithdrawalsUSD: 0,
      currentBalanceUSD: 0,
      lastPriceUpdate: new Date().toISOString()
    };
    
    // Update user with USD fields
    await updateUserUSDBalances(userId, usdBalances);
    
    return user;
  } catch (error) {
    console.error('Failed to create enhanced user:', error);
    throw error;
  }
};

// Get user by address with USD balances
export const getUserByAddress = async (walletAddress) => {
  try {
    const user = await getUserByAddressBase(walletAddress);
    if (user) {
      // Update USD balances before returning
      await updateUserUSDBalances(user.userId);
      return await getUserByAddressBase(walletAddress); // Get updated data
    }
    return null;
  } catch (error) {
    console.error('Failed to get enhanced user by address:', error);
    return null;
  }
};

// Get user by ID with USD balances
export const getUserById = async (userId) => {
  try {
    const user = await getUserByIdBase(userId);
    if (user) {
      // Update USD balances before returning
      await updateUserUSDBalances(userId);
      return await getUserByIdBase(userId); // Get updated data
    }
    return null;
  } catch (error) {
    console.error('Failed to get enhanced user by ID:', error);
    return null;
  }
};

// Update user activity and refresh USD balances
export const updateUserActivity = async (walletAddress) => {
  try {
    await updateUserActivityBase(walletAddress);
    
    // Get user and update USD balances
    const user = await getUserByAddressBase(walletAddress);
    if (user) {
      await updateUserUSDBalances(user.userId);
    }
  } catch (error) {
    console.error('Failed to update enhanced user activity:', error);
  }
};

// Get all users with updated USD balances
export const getAllUsers = async () => {
  try {
    const users = await getAllUsersBase();
    
    // Only update USD balances for users that don't have them or haven't been updated recently
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const user of users) {
      try {
        // Skip if user already has recent USD balance data
        if (user.lastPriceUpdate && new Date(user.lastPriceUpdate) > oneHourAgo && user.currentBalanceUSD !== undefined) {
          continue;
        }
        
        // Update USD balances only when necessary
        await updateUserUSDBalances(user.userId);
      } catch (updateError) {
        console.warn(`Failed to update USD balances for user ${user.userId}:`, updateError);
        // Continue with other users instead of failing completely
      }
    }
    
    // Return updated users
    return await getAllUsersBase();
  } catch (error) {
    console.error('Failed to get all enhanced users:', error);
    return [];
  }
};

// Enhanced deposit creation with USD conversion
export const createDeposit = async (userId, walletAddress, token, amount, transactionHash, screenshot = null) => {
  try {
    // Convert amount to USD
    const usdAmount = await convertToUSD(amount, token);
    
    // Create deposit with USD value
    const deposit = await createDepositBase(userId, walletAddress, token, amount, transactionHash, screenshot);
    
    // Update user's USD balances
    await updateUserUSDBalances(userId);
    
    return {
      ...deposit,
      usdAmount: usdAmount,
      usdFormatted: await getFormattedUSD(amount, token)
    };
  } catch (error) {
    console.error('Failed to create enhanced deposit:', error);
    throw error;
  }
};

// Enhanced deposit approval with USD updates
export const approveDeposit = async (depositId, adminNotes = '') => {
  try {
    const deposit = await approveDepositBase(depositId, adminNotes);
    
    // Update user's USD balances after approval
    if (deposit && deposit.userId) {
      await updateUserUSDBalances(deposit.userId);
    }
    
    return deposit;
  } catch (error) {
    console.error('Failed to approve enhanced deposit:', error);
    throw error;
  }
};

// Enhanced deposit rejection
export const rejectDeposit = async (depositId, adminNotes = '') => {
  try {
    const deposit = await rejectDepositBase(depositId, adminNotes);
    
    // Update user's USD balances after rejection
    if (deposit && deposit.userId) {
      await updateUserUSDBalances(deposit.userId);
    }
    
    return deposit;
  } catch (error) {
    console.error('Failed to reject enhanced deposit:', error);
    throw error;
  }
};

// Enhanced withdrawal creation with USD conversion
export const createWithdrawal = async (userId, walletAddress, token, amount, destinationAddress, transferMethod = 'server-side') => {
  try {
    // Convert amount to USD
    const usdAmount = await convertToUSD(amount, token);
    
    // Create withdrawal with USD value
    const withdrawal = await createWithdrawalBase(userId, walletAddress, token, amount, destinationAddress, transferMethod);
    
    // Update user's USD balances
    await updateUserUSDBalances(userId);
    
    return {
      ...withdrawal,
      usdAmount: usdAmount,
      usdFormatted: await getFormattedUSD(amount, token)
    };
  } catch (error) {
    console.error('Failed to create enhanced withdrawal:', error);
    throw error;
  }
};

// Enhanced withdrawal approval with USD updates
export const approveWithdrawal = async (withdrawalId, transactionHash = null, adminNotes = '') => {
  try {
    const withdrawal = await approveWithdrawalBase(withdrawalId, transactionHash, adminNotes);
    
    // Update user's USD balances after approval
    if (withdrawal && withdrawal.userId) {
      await updateUserUSDBalances(withdrawal.userId);
    }
    
    return withdrawal;
  } catch (error) {
    console.error('Failed to approve enhanced withdrawal:', error);
    throw error;
  }
};

// Enhanced withdrawal rejection
export const rejectWithdrawal = async (withdrawalId, adminNotes = '') => {
  try {
    const withdrawal = await rejectWithdrawalBase(withdrawalId, adminNotes);
    
    // Update user's USD balances after rejection
    if (withdrawal && withdrawal.userId) {
      await updateUserUSDBalances(withdrawal.userId);
    }
    
    return withdrawal;
  } catch (error) {
    console.error('Failed to reject enhanced withdrawal:', error);
    throw error;
  }
};

// Enhanced transaction creation with USD conversion
export const createTransaction = async (userId, walletAddress, token, type, amount, transactionHash, status = 'completed') => {
  try {
    // Convert amount to USD
    const usdAmount = await convertToUSD(amount, token);
    
    // Create transaction with USD value
    const transaction = await createTransactionBase(userId, walletAddress, token, type, amount, transactionHash, status);
    
    // Update user's USD balances
    await updateUserUSDBalances(userId);
    
    return {
      ...transaction,
      usdAmount: usdAmount,
      usdFormatted: await getFormattedUSD(amount, token)
    };
  } catch (error) {
    console.error('Failed to create enhanced transaction:', error);
    throw error;
  }
};

// Update user's USD balances based on current prices
export const updateUserUSDBalances = async (userId) => {
  try {
    // Get current user data
    const user = await getUserByIdBase(userId);
    if (!user) {
      console.warn(`User not found for USD balance update: ${userId}`);
      return;
    }
    
    // Get current token balances from user data or default to 0
    const tokenBalances = {
      BTC: user.btcBalance || user.totalDeposits || 0,
      ETH: user.ethBalance || 0,
      USDT: user.usdtBalance || 0,
      USDC: user.usdcBalance || 0
    };
    
    // Calculate USD balances
    const usdBalances = await getBalancesInUSD(tokenBalances);
    
    // Update user with new USD values
    await updateUserInDatabase(userId, {
      currentBalanceUSD: usdBalances.total,
      lastPriceUpdate: new Date().toISOString()
    });
    
    return usdBalances;
  } catch (error) {
    console.error('Failed to update user USD balances:', error);
    // Don't throw error to prevent admin panel from crashing
  }
};

// Update user in database (you'll need to implement this based on your API structure)
const updateUserInDatabase = async (userId, updateData) => {
  try {
    const response = await fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...updateData
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to update user in database:', error);
    // Don't throw error to prevent admin panel from crashing
    return null;
  }
};

// Get admin dashboard data with USD values
export const getEnhancedAdminDashboardData = async () => {
  try {
    // Refresh prices first
    await refreshPrices();
    
    // Get all users with updated USD balances
    const users = await getAllUsers();
    
    // Calculate USD statistics
    const totalUsers = users.length;
    const totalDepositsUSD = users.reduce((sum, user) => sum + (user.totalDepositsUSD || 0), 0);
    const totalWithdrawalsUSD = users.reduce((sum, user) => sum + (user.totalWithdrawalsUSD || 0), 0);
    const totalCurrentBalanceUSD = users.reduce((sum, user) => sum + (user.currentBalanceUSD || 0), 0);
    
    // Get deposits and withdrawals
    const deposits = await getAllDeposits();
    const withdrawals = await getAllWithdrawals();
    
    const pendingDeposits = deposits.filter(deposit => deposit.status === 'pending').length;
    const pendingWithdrawals = withdrawals.filter(withdrawal => withdrawal.status === 'pending').length;
    
    return {
      users,
      deposits,
      withdrawals,
      statistics: {
        totalUsers,
        totalDepositsUSD,
        totalWithdrawalsUSD,
        totalCurrentBalanceUSD,
        pendingDeposits,
        pendingWithdrawals
      },
      prices: await getCurrentPrices()
    };
  } catch (error) {
    console.error('Failed to get enhanced admin dashboard data:', error);
    return {
      users: [],
      deposits: [],
      withdrawals: [],
      statistics: {
        totalUsers: 0,
        totalDepositsUSD: 0,
        totalWithdrawalsUSD: 0,
        totalCurrentBalanceUSD: 0,
        pendingDeposits: 0,
        pendingWithdrawals: 0
      },
      prices: {}
    };
  }
};

// Get user's current USD balance
export const getUserUSDBalance = async (userId) => {
  try {
    const user = await getUserById(userId);
    return user?.currentBalanceUSD || 0;
  } catch (error) {
    console.error('Failed to get user USD balance:', error);
    return 0;
  }
};

// Get formatted USD balance for display
export const getFormattedUSDBalance = async (userId) => {
  try {
    const usdBalance = await getUserUSDBalance(userId);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(usdBalance);
  } catch (error) {
    console.error('Failed to get formatted USD balance:', error);
    return '$0.00';
  }
};

// Export data for backup purposes
export const exportData = async () => {
  try {
    const data = await getEnhancedAdminDashboardData();
    return {
      ...data,
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

// Get all deposits (needed for admin panel)
export const getAllDeposits = async () => {
  try {
    const response = await fetch('/api/admin/deposits');
    if (!response.ok) {
      throw new Error('Failed to fetch deposits');
    }
    const data = await response.json();
    return data.deposits || [];
  } catch (error) {
    console.error('Failed to get all deposits:', error);
    return [];
  }
};

// Get all withdrawals (needed for admin panel)
export const getAllWithdrawals = async () => {
  try {
    const response = await fetch('/api/admin/withdrawals');
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawals');
    }
    const data = await response.json();
    return data.withdrawals || [];
  } catch (error) {
    console.error('Failed to get all withdrawals:', error);
    return [];
  }
};

// Note: Functions are directly exported above
// approveDeposit, rejectDeposit, approveWithdrawal, rejectWithdrawal
