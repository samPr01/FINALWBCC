// User Management System
// This handles storing and retrieving user data, transactions, deposits, and withdrawals

// Data structure for users
const USER_DATA_KEY = 'coincents_users';
const DEPOSITS_DATA_KEY = 'coincents_deposits';
const WITHDRAWALS_DATA_KEY = 'coincents_withdrawals';
const TRANSACTIONS_DATA_KEY = 'coincents_transactions';

// Initialize data storage
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  
  // Initialize users if not exists
  if (!localStorage.getItem(USER_DATA_KEY)) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify([]));
  }
  
  // Initialize deposits if not exists
  if (!localStorage.getItem(DEPOSITS_DATA_KEY)) {
    localStorage.setItem(DEPOSITS_DATA_KEY, JSON.stringify([]));
  }
  
  // Initialize withdrawals if not exists
  if (!localStorage.getItem(WITHDRAWALS_DATA_KEY)) {
    localStorage.setItem(WITHDRAWALS_DATA_KEY, JSON.stringify([]));
  }
  
  // Initialize transactions if not exists
  if (!localStorage.getItem(TRANSACTIONS_DATA_KEY)) {
    localStorage.setItem(TRANSACTIONS_DATA_KEY, JSON.stringify([]));
  }
};

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// User Management Functions
export const createUser = (walletAddress, userId) => {
  initializeStorage();
  
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  
  // Check if user already exists
  const existingUser = users.find(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  if (existingUser) {
    return existingUser;
  }
  
  const newUser = {
    id: generateId(),
    userId: userId,
    walletAddress: walletAddress,
    joinDate: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    totalDeposits: 0,
    totalWithdrawals: 0,
    status: 'active'
  };
  
  users.push(newUser);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
  
  console.log('User created:', newUser);
  return newUser;
};

export const getUserByAddress = (walletAddress) => {
  initializeStorage();
  
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  return users.find(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
};

export const getUserById = (userId) => {
  initializeStorage();
  
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  return users.find(user => user.userId === userId);
};

export const updateUserActivity = (walletAddress) => {
  initializeStorage();
  
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  const userIndex = users.findIndex(user => user.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  
  if (userIndex !== -1) {
    users[userIndex].lastActivity = new Date().toISOString();
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
  }
};

export const getAllUsers = () => {
  initializeStorage();
  
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  return users.sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate));
};

// Deposit Management Functions
export const createDeposit = (userId, walletAddress, token, amount, transactionHash, screenshot = null) => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  
  const newDeposit = {
    id: generateId(),
    userId: userId,
    walletAddress: walletAddress,
    token: token,
    amount: parseFloat(amount),
    transactionHash: transactionHash,
    screenshot: screenshot,
    status: 'pending',
    submissionDate: new Date().toISOString(),
    processedDate: null,
    adminNotes: ''
  };
  
  deposits.push(newDeposit);
  localStorage.setItem(DEPOSITS_DATA_KEY, JSON.stringify(deposits));
  
  // Update user's total deposits
  updateUserDeposits(userId, amount);
  
  console.log('Deposit created:', newDeposit);
  return newDeposit;
};

export const approveDeposit = (depositId, adminNotes = '') => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  const depositIndex = deposits.findIndex(deposit => deposit.id === depositId);
  
  if (depositIndex !== -1) {
    deposits[depositIndex].status = 'approved';
    deposits[depositIndex].processedDate = new Date().toISOString();
    deposits[depositIndex].adminNotes = adminNotes;
    
    localStorage.setItem(DEPOSITS_DATA_KEY, JSON.stringify(deposits));
    return deposits[depositIndex];
  }
  
  return null;
};

export const rejectDeposit = (depositId, adminNotes = '') => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  const depositIndex = deposits.findIndex(deposit => deposit.id === depositId);
  
  if (depositIndex !== -1) {
    deposits[depositIndex].status = 'rejected';
    deposits[depositIndex].processedDate = new Date().toISOString();
    deposits[depositIndex].adminNotes = adminNotes;
    
    localStorage.setItem(DEPOSITS_DATA_KEY, JSON.stringify(deposits));
    return deposits[depositIndex];
  }
  
  return null;
};

export const getDepositsByUser = (userId) => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  return deposits.filter(deposit => deposit.userId === userId);
};

export const getAllDeposits = () => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  return deposits.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
};

export const getPendingDeposits = () => {
  initializeStorage();
  
  const deposits = JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]');
  return deposits.filter(deposit => deposit.status === 'pending');
};

// Withdrawal Management Functions
export const createWithdrawal = (userId, walletAddress, token, amount, destinationAddress, transferMethod = 'server-side') => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  
  const newWithdrawal = {
    id: generateId(),
    userId: userId,
    walletAddress: walletAddress,
    token: token,
    amount: parseFloat(amount),
    destinationAddress: destinationAddress,
    transferMethod: transferMethod,
    status: 'pending',
    requestDate: new Date().toISOString(),
    processedDate: null,
    transactionHash: null,
    adminNotes: ''
  };
  
  withdrawals.push(newWithdrawal);
  localStorage.setItem(WITHDRAWALS_DATA_KEY, JSON.stringify(withdrawals));
  
  // Update user's total withdrawals
  updateUserWithdrawals(userId, amount);
  
  console.log('Withdrawal created:', newWithdrawal);
  return newWithdrawal;
};

export const approveWithdrawal = (withdrawalId, transactionHash = null, adminNotes = '') => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  const withdrawalIndex = withdrawals.findIndex(withdrawal => withdrawal.id === withdrawalId);
  
  if (withdrawalIndex !== -1) {
    withdrawals[withdrawalIndex].status = 'approved';
    withdrawals[withdrawalIndex].processedDate = new Date().toISOString();
    withdrawals[withdrawalIndex].transactionHash = transactionHash;
    withdrawals[withdrawalIndex].adminNotes = adminNotes;
    
    localStorage.setItem(WITHDRAWALS_DATA_KEY, JSON.stringify(withdrawals));
    return withdrawals[withdrawalIndex];
  }
  
  return null;
};

export const rejectWithdrawal = (withdrawalId, adminNotes = '') => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  const withdrawalIndex = withdrawals.findIndex(withdrawal => withdrawal.id === withdrawalId);
  
  if (withdrawalIndex !== -1) {
    withdrawals[withdrawalIndex].status = 'rejected';
    withdrawals[withdrawalIndex].processedDate = new Date().toISOString();
    withdrawals[withdrawalIndex].adminNotes = adminNotes;
    
    localStorage.setItem(WITHDRAWALS_DATA_KEY, JSON.stringify(withdrawals));
    return withdrawals[withdrawalIndex];
  }
  
  return null;
};

export const getWithdrawalsByUser = (userId) => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  return withdrawals.filter(withdrawal => withdrawal.userId === userId);
};

export const getAllWithdrawals = () => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  return withdrawals.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
};

export const getPendingWithdrawals = () => {
  initializeStorage();
  
  const withdrawals = JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]');
  return withdrawals.filter(withdrawal => withdrawal.status === 'pending');
};

// Transaction Management Functions
export const createTransaction = (userId, walletAddress, token, type, amount, transactionHash, status = 'completed') => {
  initializeStorage();
  
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_DATA_KEY) || '[]');
  
  const newTransaction = {
    id: generateId(),
    userId: userId,
    walletAddress: walletAddress,
    token: token,
    type: type, // 'deposit', 'withdrawal', 'transfer'
    amount: parseFloat(amount),
    transactionHash: transactionHash,
    status: status,
    timestamp: new Date().toISOString()
  };
  
  transactions.push(newTransaction);
  localStorage.setItem(TRANSACTIONS_DATA_KEY, JSON.stringify(transactions));
  
  console.log('Transaction created:', newTransaction);
  return newTransaction;
};

export const getTransactionsByUser = (userId) => {
  initializeStorage();
  
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_DATA_KEY) || '[]');
  return transactions.filter(transaction => transaction.userId === userId);
};

export const getAllTransactions = () => {
  initializeStorage();
  
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_DATA_KEY) || '[]');
  return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// Helper Functions
const updateUserDeposits = (userId, amount) => {
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  const userIndex = users.findIndex(user => user.userId === userId);
  
  if (userIndex !== -1) {
    users[userIndex].totalDeposits += parseFloat(amount);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
  }
};

const updateUserWithdrawals = (userId, amount) => {
  const users = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]');
  const userIndex = users.findIndex(user => user.userId === userId);
  
  if (userIndex !== -1) {
    users[userIndex].totalWithdrawals += parseFloat(amount);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(users));
  }
};

// Admin Dashboard Data Functions
export const getAdminDashboardData = () => {
  initializeStorage();
  
  const users = getAllUsers();
  const deposits = getAllDeposits();
  const withdrawals = getAllWithdrawals();
  const transactions = getAllTransactions();
  
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
};

// Data Export/Import Functions
export const exportData = () => {
  initializeStorage();
  
  return {
    users: JSON.parse(localStorage.getItem(USER_DATA_KEY) || '[]'),
    deposits: JSON.parse(localStorage.getItem(DEPOSITS_DATA_KEY) || '[]'),
    withdrawals: JSON.parse(localStorage.getItem(WITHDRAWALS_DATA_KEY) || '[]'),
    transactions: JSON.parse(localStorage.getItem(TRANSACTIONS_DATA_KEY) || '[]'),
    exportDate: new Date().toISOString()
  };
};

export const importData = (data) => {
  if (data.users) localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.users));
  if (data.deposits) localStorage.setItem(DEPOSITS_DATA_KEY, JSON.stringify(data.deposits));
  if (data.withdrawals) localStorage.setItem(WITHDRAWALS_DATA_KEY, JSON.stringify(data.withdrawals));
  if (data.transactions) localStorage.setItem(TRANSACTIONS_DATA_KEY, JSON.stringify(data.transactions));
};

// Clear all data (for testing/reset)
export const clearAllData = () => {
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(DEPOSITS_DATA_KEY);
  localStorage.removeItem(WITHDRAWALS_DATA_KEY);
  localStorage.removeItem(TRANSACTIONS_DATA_KEY);
  initializeStorage();
};

// Initialize storage when module is loaded
if (typeof window !== 'undefined') {
  initializeStorage();
}
