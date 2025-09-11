import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    // Test if the connection is still alive
    try {
      await cachedClient.db('admin').admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.log('Cached connection lost, reconnecting...');
      cachedClient = null;
      cachedDb = null;
    }
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI environment variable is not set!');
    console.error('💡 Please set MONGO_URI in your environment variables');
    console.error('💡 For local development, create a .env.local file');
    console.error('💡 For production, set it in Netlify environment variables');
    console.error('💡 Using fallback: mongodb://localhost:27017/walletbase');
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('URI:', uri || 'mongodb://localhost:27017/walletbase');
    
    const client = new MongoClient(uri || 'mongodb://localhost:27017/walletbase');
    await client.connect();
    
    // Test the connection
    await client.db('admin').admin().ping();
    
    const db = client.db('walletbase');
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ Successfully connected to MongoDB');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Tip: Check if your MongoDB URI is correct and the server is accessible');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: MongoDB server is not running or not accessible on the specified port');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Tip: Check your MongoDB username and password');
    }
    
    throw error;
  }
}

export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
